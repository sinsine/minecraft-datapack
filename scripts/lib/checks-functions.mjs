/**
 * .mcfunction analysis: tokenising, per-command checks, version gates and the
 * function call graph.
 *
 * The game reports one command error at a time and only when the function runs.
 * Parsing here means the author sees every broken line in every function at
 * once, with the exact fix.
 */

import { closestMatch, lineColAt } from "./diagnostics.mjs";
import { canonicalRegistry } from "./checks-core.mjs";
import { scanJsonText } from "./json-scan.mjs";

/** Keys that only existed as item NBT before 1.20.5 and became components after. */
const LEGACY_ITEM_KEYS = new Map([
	["display", "components: custom_name / lore / tooltip_display"],
	["Enchantments", "components: enchantments"],
	["StoredEnchantments", "components: stored_enchantments"],
	["CustomModelData", "components: custom_model_data (now an object)"],
	["AttributeModifiers", "components: attribute_modifiers (object form)"],
	["Unbreakable", "components: unbreakable (empty object)"],
	["Damage", "components: damage"],
	["SkullOwner", "components: profile"],
	["HideFlags", "components: tooltip_display"],
	["RepairCost", "components: repair_cost"],
	["CanDestroy", "components: can_break"],
	["CanPlaceOn", "components: can_place_on"],
	["CustomPotionColor", "components: potion_contents {custom_color}"],
	["ChargedProjectiles", "components: charged_projectiles"],
	["Potion", "components: potion_contents"],
	["Fireworks", "components: fireworks"],
	["Explosion", "components: fireworks {explosion}"],
	["BlockEntityTag", "components: block_entity_data"],
	["BlockStateTag", "components: block_state"],
	["EntityTag", "components: entity_data"],
	["EnchantmentGlintOverride", "components: enchantment_glint_override"]
]);

/** Commands whose argument is a raw item stack definition. */
const ITEM_STACK_COMMANDS = new Set(["give", "item"]);

/** Commands that may embed an item stack inside entity/block NBT. */
const NESTED_ITEM_COMMANDS = new Set(["summon", "setblock", "data", "execute"]);

/** Feature gates: a documented syntax change with the release it landed in. */
const GATES = [
	{ id: "execute-if-function", feature: "execute if function", min: "1.20.3" },
	{ id: "execute-if-loaded", feature: "execute if loaded", min: "1.19.4" },
	{ id: "return", feature: "the return command", min: "1.20" },
	{ id: "macro", feature: "function macros ($ lines)", min: "1.20.2" },
	{ id: "random", feature: "the random command", min: "1.20.2" },
	{ id: "tick", feature: "the tick command", min: "1.20.3" },
	{ id: "fillbiome", feature: "the fillbiome command", min: "1.19.3" },
	{ id: "place", feature: "the place command", min: "1.19.4" },
	{ id: "damage", feature: "the damage command", min: "1.19.4" },
	{ id: "transfer", feature: "the transfer command", min: "1.20.5" },
	{ id: "rotate", feature: "the rotate command", min: "1.21.2" },
	{ id: "dialog", feature: "the dialog command", min: "1.21.6" },
	{ id: "waypoint", feature: "the waypoint command", min: "1.21.6" },
	{ id: "version", feature: "the version command", min: "1.21.9" },
	{ id: "item-components", feature: "item components", min: "1.20.5" }
];

/** Verify the gates above against the same table the rest of the validator uses. */
export const GATE_VERSIONS = GATES.map((gate) => gate.min);

/** @param {string} line - one raw line. */
function isComment(line) {
	return line.trimStart().startsWith("#");
}

/**
 * Split one command line into top-level tokens, respecting quotes and braces.
 * @param {string} line - raw line without the trailing newline.
 * @returns {{tokens: string[], problems: Array<{code: string, message: string, hint: string, index: number}>}} token list and lexical problems.
 */
export function tokenize(line) {
	const tokens = [];
	const problems = [];
	let current = "";
	let depth = 0;
	let i = 0;
	let firstBracketIndex = -1;
	while (i < line.length) {
		const char = line[i];
		if (char === "\"") {
			let j = i + 1;
			current += char;
			let closed = false;
			while (j < line.length) {
				if (line[j] === "\\") {
					current += line[j] + (line[j + 1] ?? "");
					j += 2;
					continue;
				}
				current += line[j];
				if (line[j] === "\"") {
					closed = true;
					j += 1;
					break;
				}
				j += 1;
			}
			if (!closed) {
				problems.push({
					code: "MC-FUNC-003",
					message: "unterminated quoted string",
					hint: "Add the closing double quote. Inside JSON arguments, escape inner quotes as \\\".",
					index: i
				});
			}
			i = j;
			continue;
		}
		if (char === "{" || char === "[") {
			if (depth === 0 && firstBracketIndex === -1) firstBracketIndex = i;
			depth += 1;
			current += char;
			i += 1;
			continue;
		}
		if (char === "}" || char === "]") {
			depth -= 1;
			if (depth === 0) firstBracketIndex = -1;
			if (depth < 0) {
				problems.push({
					code: "MC-FUNC-003",
					message: `closing "${char}" without a matching opening bracket`,
					hint: "Count the braces/brackets in this argument.",
					index: i
				});
				depth = 0;
			}
			current += char;
			i += 1;
			continue;
		}
		if (/\s/.test(char) && depth === 0) {
			if (current !== "") {
				tokens.push(current);
				current = "";
			}
			i += 1;
			continue;
		}
		current += char;
		i += 1;
	}
	if (current !== "") tokens.push(current);
	if (depth > 0) {
		problems.push({
			code: "MC-FUNC-003",
			message: "unbalanced brackets: an opening { or [ is never closed",
			hint: "Count the braces/brackets in this argument.",
			index: firstBracketIndex === -1 ? 0 : firstBracketIndex
		});
	}
	return { tokens, problems };
}

/** Extract the raw text of the first balanced {...} or [...] group in a line. */
function firstGroupText(line) {
	const start = line.search(/[[{]/);
	if (start === -1) return undefined;
	let depth = 0;
	let inString = false;
	for (let i = start; i < line.length; i += 1) {
		const char = line[i];
		if (inString) {
			if (char === "\\") i += 1;
			else if (char === "\"") inString = false;
			continue;
		}
		if (char === "\"") {
			inString = true;
			continue;
		}
		if (char === "{" || char === "[") depth += 1;
		else if (char === "}" || char === "]") {
			depth -= 1;
			if (depth === 0) return line.slice(start, i + 1);
		}
	}
	return line.slice(start);
}

/** Collect which legacy item-NBT keys appear in a group of text. */
function legacyKeysIn(text) {
	const found = new Set();
	for (const key of LEGACY_ITEM_KEYS.keys()) {
		const pattern = new RegExp(`(^|[{,\\[])\\s*"?${key}"?\\s*:`);
		if (pattern.test(text)) found.add(key);
	}
	return found;
}

/**
 * Analyse every .mcfunction in the pack.
 * @param {object} pack - pack model.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} data - parsed `reference/data/commands.json`.
 * @param {object} gatesApi - version gate helpers: `isActive(minVersion)`, `describeVersion()`.
 * @returns {{refs: Array<object>, macros: Set<string>, declaredObjectives: Set<string>, usedObjectives: Array<object>, functions: string[]}} cross-file facts for the reference pass.
 */
export function analyzeFunctions(pack, bag, data, gatesApi) {
	const refs = [];
	const macros = new Set();
	const declaredObjectives = new Set();
	const usedObjectives = [];
	const functions = [];
	const commandNames = Object.keys(data.commands);
	const conditions = new Set(data.executeConditions);
	const operations = new Set(data.dataOperations);
	const targets = new Set(data.dataTargets);

	for (const [rel, entry] of pack.entries) {
		if (!rel.startsWith("data/") || !rel.endsWith(".mcfunction")) continue;
		const segments = rel.split("/");
		if (canonicalRegistry(segments[2], pack.registries, "top") !== "function") continue;
		const id = `${segments[1]}:${segments.slice(3).join("/").replace(/\.mcfunction$/, "")}`;
		functions.push(id);
		if (entry.text === undefined) continue;
		const rawLines = entry.text.split(/\r?\n/);
		if (rawLines.at(-1) === "") rawLines.pop();
		let fileHasMacro = false;

		// A trailing backslash joins the next line (1.20.2+). Fold those first so the
		// rest of the analysis sees one complete command per entry.
		const logicalLines = [];
		for (let i = 0; i < rawLines.length; i += 1) {
			const startLine = i + 1;
			let text = rawLines[i];
			while (text.trimEnd().endsWith("\\") && i + 1 < rawLines.length && !isComment(text)) {
				if (!gatesApi.isActive("1.20.2")) {
					bag.error("MC-VERSION-001", rel, `a trailing backslash joins lines, which needs Minecraft 1.20.2`, {
						line: startLine,
						hint: `This pack targets ${gatesApi.describeVersion()}. Write the whole command on one line.`,
						excerpt: text.trim().slice(0, 100)
					});
				}
				text = text.trimEnd().slice(0, -1) + rawLines[i + 1].trimStart();
				i += 1;
			}
			logicalLines.push({ text, line: startLine });
		}

		logicalLines.forEach(({ text: rawLine, line: lineNo }) => {
			const trimmed = rawLine.trim();
			if (trimmed === "" || isComment(rawLine)) return;

			if (trimmed.startsWith("/")) {
				bag.error("MC-FUNC-001", rel, "function line starts with a slash", {
					line: lineNo,
					hint: "Inside a .mcfunction, commands are written without the leading slash: `say hi`, not `/say hi`.",
					excerpt: trimmed.slice(0, 80)
				});
			}

			const isMacroLine = trimmed.startsWith("$");
			if (isMacroLine) {
				fileHasMacro = true;
				if (!gatesApi.isActive("1.20.2")) {
					bag.error("MC-VERSION-001", rel, `macro line used but the pack targets ${gatesApi.describeVersion()}`, {
						line: lineNo,
						hint: "Function macros need 1.20.2 or later. Raise the target version in pack.mcmeta, or build the value with scoreboard arithmetic instead.",
						excerpt: trimmed.slice(0, 80)
					});
				}
			} else if (trimmed.includes("$(")) {
				bag.error("MC-FUNC-042", rel, "macro argument used on a line that does not start with $", {
					line: lineNo,
					hint: "A line that uses $(...) must begin with $ at the very first character of the line.",
					excerpt: trimmed.slice(0, 80)
				});
			}

			const body = isMacroLine ? trimmed.slice(1) : trimmed;
			evaluateCommandLevel(rel, body, 0, lineNo, rawLine, trimmed);
		});

		if (fileHasMacro) macros.add(id);
	}

	/**
	 * Parse and check one command level.
	 *
	 * `execute ... run <command>` is re-entered with the sub-command, because that
	 * is where most real function calls, scoreboard uses and give arguments live:
	 * checking only the first token of a line would miss them.
	 * @param {string} rel - function file path, for diagnostics.
	 * @param {string} text - the command text at this level.
	 * @param {number} baseOffset - where this text starts inside the raw line, for column numbers.
	 * @param {number} lineNo - 1-based line number.
	 * @param {string} rawLine - the whole raw line, for column arithmetic.
	 * @param {string} display - text shown in the `>` excerpt of a diagnostic.
	 * @param {boolean} [guarded] - true when this command sits inside a conditional execute.
	 * @returns {void}
	 */
	function evaluateCommandLevel(rel, text, baseOffset, lineNo, rawLine, display, guarded = false) {
		const { tokens, problems } = tokenize(text);
		for (const problem of problems) {
			const { col } = lineColAt(rawLine, baseOffset + problem.index);
			bag.error(problem.code, rel, problem.message, {
				line: lineNo,
				col,
				hint: problem.hint,
				excerpt: display.slice(0, 100)
			});
		}
		if (tokens.length === 0) {
			bag.error("MC-FUNC-002", rel, "empty command", {
				line: lineNo,
				hint: "Remove the line or give it a command.",
				excerpt: display.slice(0, 100)
			});
			return;
		}

		checkCoordinateMixing(tokens, rel, lineNo, bag, rawLine, display);

		const name = tokens[0];
		const canonical = data.aliases[name] ?? name;
		const definition = data.commands[canonical];
		if (definition === undefined) {
			const suggestion = closestMatch(name, commandNames);
			bag.error("MC-FUNC-002", rel, `unknown command "${name}"`, {
				line: lineNo,
				hint: suggestion
					? `Did you mean "${suggestion}"?`
					: "This is not a vanilla Java command. Datapacks cannot add commands; use a function plus scoreboard state instead.",
				excerpt: display.slice(0, 100)
			});
			return;
		}
		if (definition.min !== undefined && !gatesApi.isActive(definition.min)) {
			bag.error("MC-VERSION-001", rel, `"${canonical}" requires Minecraft ${definition.min} but the pack targets ${gatesApi.describeVersion()}`, {
				line: lineNo,
				hint: "Either raise the target version or stop using this command.",
				excerpt: display.slice(0, 100)
			});
		}

		const context = {
			rel,
			lineNo,
			rawLine,
			trimmed: display,
			text,
			tokens,
			canonical,
			guarded,
			bag
		};
		switch (canonical) {
			case "execute": {
				checkExecute(context, data, conditions, refs, gatesApi, usedObjectives);
				const runIndex = tokens.indexOf("run");
				if (runIndex !== -1 && tokens[runIndex + 1] !== undefined) {
					const subText = tokens.slice(runIndex + 1).join(" ");
					const offset = rawLine.indexOf(subText);
					const conditional = guarded || tokens.slice(1, runIndex).some((token) => token === "if" || token === "unless");
					evaluateCommandLevel(rel, subText, offset === -1 ? baseOffset : offset, lineNo, rawLine, subText, conditional);
				}
				break;
			}
			case "data":
				checkData(context, operations, targets);
				break;
			case "scoreboard":
				checkScoreboard(context, data, declaredObjectives, usedObjectives);
				break;
			case "function":
				checkFunctionCall(context, refs);
				break;
			case "schedule":
				checkSchedule(context, refs);
				break;
			case "loot":
				checkLoot(context, refs);
				break;
			case "recipe":
				checkIdReference(context, refs, "recipe", 2);
				break;
			case "advancement":
				checkIdReference(context, refs, "advancement", 2);
				break;
			case "tellraw":
			case "title":
				checkTextComponent(context, bag);
				break;
			case "gamemode":
				checkEnumValue(context, data.gamemodeValues, 1);
				break;
			case "difficulty":
				checkEnumValue(context, data.difficultyValues, 1);
				break;
			case "tag":
				checkEnumValue(context, data.tagActions, 2);
				break;
			case "attribute":
				checkAttribute(context, gatesApi);
				break;
			case "give":
			case "item":
			case "summon":
			case "setblock":
				checkItemNbt(context, gatesApi);
				if (canonical === "summon") checkSummonPosition(context);
				break;
			default:
				break;
		}
	}

	return { refs, macros, declaredObjectives, usedObjectives, functions };
}

/**
 * Report `~` and `^` mixed inside one position triple.
 * @returns {void}
 */
function checkCoordinateMixing(tokens, rel, lineNo, bag, rawLine, trimmed) {
	const coordinate = /^([~^])?-?\d*\.?\d*$/;
	for (let i = 0; i + 2 < tokens.length; i += 1) {
		const triple = [tokens[i], tokens[i + 1], tokens[i + 2]];
		if (!triple.every((token) => /^[~^]/.test(token) && coordinate.test(token))) continue;
		const sigils = new Set(triple.map((token) => token[0]));
		if (sigils.size > 1 && sigils.has("^")) {
			bag.error("MC-FUNC-004", rel, "local (^) and world-relative (~) coordinates mixed in one position", {
				line: lineNo,
				hint: "Use either three ~ values or three ^ values. ^ is relative to the executor's rotation, ~ to its position.",
				excerpt: trimmed.slice(0, 80)
			});
			return;
		}
	}
}

/**
 * Check `execute` clause structure: condition names, clause order, and `run`.
 * @param {object} context - command context.
 * @param {object} data - parsed commands.json.
 * @param {Set<string>} conditions - valid condition names.
 * @param {Array<object>} refs - reference sink.
 * @param {object} gatesApi - version gate helpers.
 * @param {Array<object>} usedObjectives - scoreboard-use sink.
 * @returns {void}
 */
function checkExecute(context, data, conditions, refs, gatesApi, usedObjectives) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const transform = new Set(data.executeOrder);
	let sawCondition = false;
	let sawRun = false;
	let previousRank = -1;
	const seen = new Map();

	for (let i = 1; i < tokens.length; i += 1) {
		const token = tokens[i];
		if (token === "if" || token === "unless") {
			sawCondition = true;
			const condition = tokens[i + 1];
			if (condition === undefined) {
				bag.error("MC-FUNC-011", rel, `"${token}" with no condition`, {
					line: lineNo,
					hint: `Follow it with one of: ${[...conditions].join(", ")}.`,
					excerpt: trimmed.slice(0, 80)
				});
				continue;
			}
			if (!conditions.has(condition)) {
				const suggestion = closestMatch(condition, conditions);
				bag.error("MC-FUNC-011", rel, `unknown execute condition "${condition}"`, {
					line: lineNo,
					hint: suggestion ? `Did you mean "if ${suggestion}"?` : `Valid conditions: ${[...conditions].join(", ")}.`,
					excerpt: trimmed.slice(0, 80)
				});
				continue;
			}
			if (condition === "function") {
				const argument = tokens[i + 2];
				if (argument === undefined) {
					bag.error("MC-FUNC-011", rel, "if function with no function id", {
						line: lineNo,
						hint: "Write `if function <namespace:path>`.",
						excerpt: trimmed.slice(0, 80)
					});
				} else {
					refs.push({ kind: "function", id: argument, rel, line: lineNo, guarded: true });
				}
			}
			const conditionGate = data.conditionGates?.[condition];
			if (conditionGate !== undefined && !gatesApi.isActive(conditionGate)) {
				bag.error("MC-VERSION-001", rel, `"if ${condition}" requires Minecraft ${conditionGate} but the pack targets ${gatesApi.describeVersion()}`, {
					line: lineNo,
					hint: "Raise the pack's target version, or use an older form such as `if score` or `if predicate`.",
					excerpt: trimmed.slice(0, 80)
				});
			}
			if (condition === "predicate") {
				const argument = tokens[i + 2];
				if (argument !== undefined) refs.push({ kind: "predicate", id: argument, rel, line: lineNo, guarded: true });
			}
			if (condition === "score") {
				const objective = tokens[i + 3];
				if (objective !== undefined) usedObjectives.push({ objective, rel, line: lineNo, context: trimmed.slice(0, 80), viaCondition: true });
			}
			continue;
		}
		if (token === "run") {
			sawRun = true;
			if (tokens[i + 1] === undefined) {
				bag.error("MC-FUNC-013", rel, "\"run\" with no command after it", {
					line: lineNo,
					hint: "`execute ... run <command>` needs a command.",
					excerpt: trimmed.slice(0, 80)
				});
			}
			break;
		}
		if (!transform.has(token)) continue;

		if (sawCondition) {
			bag.error("MC-FUNC-010", rel, `"${token}" appears after an if/unless condition`, {
				line: lineNo,
				hint: "All executor/position clauses (as, at, positioned, rotated, facing, in, anchored, align, on, summon) must come before if/unless.",
				excerpt: trimmed.slice(0, 80)
			});
		}
		if (seen.has(token)) {
			bag.error("MC-FUNC-014", rel, `"${token}" is used twice in one execute`, {
				line: lineNo,
				hint: "Each executor clause may appear at most once; combine the targets into one selector.",
				excerpt: trimmed.slice(0, 80)
			});
		}
		seen.set(token, true);
		const clauseGate = data.clauseGates?.[token];
		if (clauseGate !== undefined && !gatesApi.isActive(clauseGate)) {
			bag.error("MC-VERSION-001", rel, `the "${token}" clause requires Minecraft ${clauseGate} but the pack targets ${gatesApi.describeVersion()}`, {
				line: lineNo,
				hint: "Raise the pack's target version, or restructure the command without this clause.",
				excerpt: trimmed.slice(0, 80)
			});
		}
		const rank = data.executeOrder.indexOf(token);
		if (rank !== -1) {
			if (previousRank > rank) {
				bag.warning("MC-FUNC-015", rel, `execute clauses are out of the documented order at "${token}"`, {
					line: lineNo,
					hint: `The order is: ${data.executeOrder.join(" ")} — before any if/unless, then run.`,
					excerpt: trimmed.slice(0, 80)
				});
			}
			previousRank = Math.max(previousRank, rank);
		}
	}

	if (!sawRun) {
		if (sawCondition) {
			// `execute if <condition>` with no `run` is legal: it reports success or
			// failure, which is what `execute store` and `return run function` read.
			bag.info("MC-FUNC-016", rel, "execute ends in a condition with no \"run\" clause", {
				line: lineNo,
				hint: "This only tests; nothing acts on the result unless it feeds `execute store` or `return run function`. Add `run <command>` if you meant to do something.",
				excerpt: trimmed.slice(0, 80)
			});
			return;
		}
		bag.error("MC-FUNC-012", rel, "execute has no \"run\" clause", {
			line: lineNo,
			hint: "A chain of only as/at/positioned/... clauses is not a complete command. End it with a condition (`if`/`unless`) or with `run <command>`.",
			excerpt: trimmed.slice(0, 80)
		});
	}
}

/** Check `data get|merge|modify|remove` target and operation names. */
function checkData(context, operations, targets) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const action = tokens[1];
	if (action === undefined) {
		bag.error("MC-FUNC-020", rel, "data with no action", {
			line: lineNo,
			hint: "Use `data get|merge|modify|remove`.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (!["get", "merge", "modify", "remove"].includes(action)) {
		const suggestion = closestMatch(action, ["get", "merge", "modify", "remove"]);
		bag.error("MC-FUNC-020", rel, `unknown data action "${action}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : "Valid actions: get, merge, modify, remove.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	const target = tokens[2];
	if (target === undefined) {
		bag.error("MC-FUNC-020", rel, `data ${action} with no target`, {
			line: lineNo,
			hint: "The target is block <pos>, entity <targets>, or storage <id>.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (!targets.has(target)) {
		const suggestion = closestMatch(target, targets);
		bag.error("MC-FUNC-020", rel, `unknown data target "${target}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : "Valid targets: block, entity, storage.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (action !== "modify") return;
	// The NBT path sits after the target's own arguments, so its index depends on
	// the target: `block <x> <y> <z> <path>` is two tokens longer than `storage <id> <path>`.
	const pathIndex = target === "block" ? 6 : 4;
	const operation = tokens[pathIndex + 1];
	if (operation === undefined) {
		bag.error("MC-FUNC-021", rel, "data modify with no operation", {
			line: lineNo,
			hint: `Follow the NBT path with one of: ${[...operations].join(", ")}.`,
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (!operations.has(operation)) {
		const suggestion = closestMatch(operation, operations);
		bag.error("MC-FUNC-021", rel, `unknown data modify operation "${operation}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : `Valid operations: ${[...operations].join(", ")}.`,
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (operation === "insert") {
		const index = tokens[pathIndex + 2];
		if (index === undefined || !/^-?\d+$/.test(index)) {
			bag.error("MC-FUNC-021", rel, "data modify insert needs a numeric index", {
				line: lineNo,
				hint: "The form is `data modify <target> <path> insert <index> from <source> ...`.",
				excerpt: trimmed.slice(0, 80)
			});
			return;
		}
		if (tokens[pathIndex + 3] !== "from") {
			bag.error("MC-FUNC-021", rel, "data modify insert must take its value from another source", {
				line: lineNo,
				hint: "`insert <index> from <block|entity|storage> ...` — insert has no `value` form.",
				excerpt: trimmed.slice(0, 80)
			});
		}
		return;
	}
	if (operation === "remove") return;
	const source = tokens[pathIndex + 2];
	if (source === undefined) {
		bag.error("MC-FUNC-021", rel, `data modify ${operation} with no source`, {
			line: lineNo,
			hint: "Provide `value <nbt>`, `from <block|entity|storage> ...`, or `string <block|entity|storage> ...`.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (!["value", "from", "string"].includes(source)) {
		const suggestion = closestMatch(source, ["value", "from", "string"]);
		bag.error("MC-FUNC-021", rel, `unknown data modify source "${source}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : "Sources are value, from and string.",
			excerpt: trimmed.slice(0, 80)
		});
	}
}

/** Collect scoreboard objective declarations and uses. */
function checkScoreboard(context, data, declaredObjectives, usedObjectives) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const group = tokens[1];
	if (group === undefined) {
		bag.error("MC-FUNC-022", rel, "scoreboard with no subcommand", {
			line: lineNo,
			hint: "Use `scoreboard objectives|players ...`.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (!["objectives", "players"].includes(group)) {
		const suggestion = closestMatch(group, ["objectives", "players"]);
		bag.error("MC-FUNC-022", rel, `unknown scoreboard target "${group}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : "Valid: objectives, players.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	const action = tokens[2];
	const allowed = group === "objectives" ? data.scoreboardObjectives : data.scoreboardPlayers;
	if (action === undefined || !allowed.includes(action)) {
		const suggestion = action === undefined ? undefined : closestMatch(action, allowed);
		bag.error("MC-FUNC-022", rel, `unknown scoreboard ${group} action "${action ?? "(none)"}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : `Valid actions: ${allowed.join(", ")}.`,
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (group === "objectives" && action === "add") {
		const objective = tokens[3];
		if (objective === undefined) {
			bag.error("MC-FUNC-022", rel, "scoreboard objectives add with no name", {
				line: lineNo,
				hint: "`scoreboard objectives add <name> <criteria>`.",
				excerpt: trimmed.slice(0, 80)
			});
			return;
		}
		declaredObjectives.add(objective);
		if (objective.includes(":")) {
			bag.error("MC-FUNC-022", rel, `objective name "${objective}" contains a colon`, {
				line: lineNo,
				hint: "Objective names cannot contain \":\" (since 1.13). Use a dot or underscore, e.g. mypack.points.",
				excerpt: trimmed.slice(0, 80)
			});
		}
		if (tokens[4] === undefined) {
			bag.error("MC-FUNC-022", rel, `objective "${objective}" is added with no criterion`, {
				line: lineNo,
				hint: "The criterion is required, e.g. `dummy`.",
				excerpt: trimmed.slice(0, 80)
			});
		}
		return;
	}
	if (group === "players") {
		if (action === "operation") {
			const objective = tokens[4];
			if (objective !== undefined) usedObjectives.push({ objective, rel, line: lineNo, context: trimmed.slice(0, 80) });
			const source = tokens[7];
			if (source !== undefined && !data.scoreboardOperations.includes(source) && !source.startsWith("=")) {
				usedObjectives.push({ objective: source, rel, line: lineNo, context: trimmed.slice(0, 80) });
			}
			return;
		}
		const objective = tokens[4];
		if (objective !== undefined) usedObjectives.push({ objective, rel, line: lineNo, context: trimmed.slice(0, 80) });
	}
}

/** Record a `function <id|#tag> [with ...]` reference. */
function checkFunctionCall(context, refs) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const argument = tokens[1];
	if (argument === undefined) {
		bag.error("MC-FUNC-023", rel, "function with no target", {
			line: lineNo,
			hint: "`function <namespace:path>` or `function #<namespace:tag>`.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	const hasWith = tokens[2] === "with";
	// A call inside `execute ... if/unless ... run` is conditional, so it cannot be
	// part of an infinite recursion cycle.
	const guarded = context.guarded === true;
	if (argument.startsWith("#")) {
		refs.push({ kind: "function_tag", id: argument.slice(1), rel, line: lineNo, guarded });
		return;
	}
	refs.push({ kind: "function", id: argument, rel, line: lineNo, guarded, with: hasWith });
	if (tokens[2] !== undefined && !hasWith) {
		bag.error("MC-FUNC-024", rel, `unexpected argument after the function id: "${tokens[2]}"`, {
			line: lineNo,
			hint: "A function call takes only a function id, optionally followed by `with block|entity|storage <target> <path>`.",
			excerpt: trimmed.slice(0, 80)
		});
	}
}

/** Record a `schedule function <id> <time>` reference. */
function checkSchedule(context, refs) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const argument = tokens[1];
	if (argument === undefined) {
		bag.error("MC-FUNC-025", rel, "schedule with no function", {
			line: lineNo,
			hint: "`schedule function <namespace:path> <time>`.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (argument !== "function" && argument !== "clear") {
		const suggestion = closestMatch(argument, ["clear", "function"]);
		bag.error("MC-FUNC-025", rel, `unknown schedule subcommand "${argument}"`, {
			line: lineNo,
			hint: suggestion ? `Did you mean "${suggestion}"?` : "Valid: `schedule function <id> <time>` and `schedule clear <id>`.",
			excerpt: trimmed.slice(0, 80)
		});
		return;
	}
	if (argument === "function" && tokens[2] !== undefined) {
		refs.push({ kind: "function", id: tokens[2], rel, line: lineNo, guarded: true, scheduled: true });
	} else if (argument === "clear" && tokens[2] !== undefined && !tokens[2].startsWith("#")) {
		refs.push({ kind: "function", id: tokens[2], rel, line: lineNo, guarded: true, scheduled: true });
	}
}

/** Record a `loot ... loot <id>` reference. */
function checkLoot(context, refs) {
	const { tokens, rel, lineNo } = context;
	const lootIndex = tokens.indexOf("loot", 1);
	if (lootIndex !== -1 && tokens[lootIndex + 1] !== undefined) {
		refs.push({ kind: "loot_table", id: tokens[lootIndex + 1], rel, line: lineNo, guarded: true });
	}
}

/** Record the first namespaced id argument at or after a position. */
function checkIdReference(context, refs, kind, position) {
	const { tokens, rel, lineNo } = context;
	for (let i = position; i < tokens.length; i += 1) {
		const argument = tokens[i];
		if (["everything", "from", "until", "only", "grant", "revoke"].includes(argument)) continue;
		if (!argument.includes(":")) continue;
		refs.push({ kind, id: argument, rel, line: lineNo, guarded: true });
		return;
	}
}

/** Validate the embedded JSON of tellraw/title/... arguments. */
function checkTextComponent(context, bag) {
	const { rel, lineNo, trimmed } = context;
	const group = firstGroupText(context.text);
	if (group === undefined) {
		if (/\btellraw\b/.test(trimmed) || /\btitle\b/.test(trimmed)) {
			const quoteStart = trimmed.indexOf("\"");
			if (quoteStart === -1) {
				bag.error("MC-FUNC-030", rel, "text argument is not a JSON component", {
					line: lineNo,
					hint: "Wrap the text in a component: {\"text\":\"hello\"} — a bare word is not valid here.",
					excerpt: trimmed.slice(0, 80)
				});
			} else {
				bag.error("MC-FUNC-030", rel, "text argument looks like a bare string instead of a text component", {
					line: lineNo,
					hint: "Write {\"text\":\"hello\"}. From 1.20.3 onward a plain \"hello\" also works, but the object form is always safe.",
					excerpt: trimmed.slice(0, 80)
				});
			}
		}
		return;
	}
	const findings = scanJsonText(group);
	for (const finding of findings) {
		bag.error("MC-FUNC-030", rel, `text component is invalid JSON: ${finding.message}`, {
			line: lineNo,
			hint: `${finding.hint} If the JSON sits inside a command, every inner double quote must be escaped as \\".`,
			excerpt: trimmed.slice(0, 100)
		});
	}
	if (findings.length === 0) {
		try {
			JSON.parse(group);
		} catch (error) {
			bag.error("MC-FUNC-030", rel, `text component is invalid JSON: ${error instanceof Error ? error.message : String(error)}`, {
				line: lineNo,
				hint: "Inside a command, escape inner double quotes as \\\".",
				excerpt: trimmed.slice(0, 100)
			});
		}
	}
}

/** Check enum-valued arguments at a fixed position, with a did-you-mean. */
function checkEnumValue(context, values, position) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const value = tokens[position];
	if (value === undefined || values.includes(value)) return;
	const suggestion = closestMatch(value, values);
	bag.error("MC-FUNC-026", rel, `invalid value "${value}"`, {
		line: lineNo,
		hint: suggestion ? `Did you mean "${suggestion}"?` : `Valid values: ${values.join(", ")}.`,
		excerpt: trimmed.slice(0, 80)
	});
}

/** `summon <entity> [<pos>] [<nbt>]` — NBT is only accepted after a position. */
function checkSummonPosition(context) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const second = tokens[2];
	if (second === undefined || !second.startsWith("{")) return;
	bag.error("MC-FUNC-027", rel, "summon takes NBT only after a position", {
		line: lineNo,
		hint: "Write `summon <entity> ~ ~ ~ {NBT}`; the position is not optional in front of NBT.",
		excerpt: trimmed.slice(0, 100)
	});
}

/** Report the 1.20.5 attribute operation renames. */
function checkAttribute(context, gatesApi) {
	const { tokens, rel, lineNo, bag, trimmed } = context;
	const modifierIndex = tokens.indexOf("modifier");
	if (modifierIndex === -1) return;
	// attribute <target> <attribute> modifier add <id> <value> <operation>
	const operation = tokens[modifierIndex + 4];
	if (operation === undefined) return;
	const renamed = { add: "add_value", multiply: "add_multiplied_total", multiply_base: "add_multiplied_base" };
	if (!Object.hasOwn(renamed, operation)) return;
	if (!gatesApi.isActive("1.20.5")) return;
	bag.error("MC-VERSION-001", rel, `attribute operation "${operation}" was renamed to "${renamed[operation]}" in 1.20.5`, {
		line: lineNo,
		hint: `Use "${renamed[operation]}"; the pack targets ${gatesApi.describeVersion()}.`,
		excerpt: trimmed.slice(0, 100)
	});
}

/** Report pre-1.20.5 item NBT used on a 1.20.5+ pack. */
function checkItemNbt(context, gatesApi) {
	if (!gatesApi.isActive("1.20.5")) return;
	const { rel, lineNo, bag, canonical, trimmed } = context;
	const group = firstGroupText(context.text);
	if (group === undefined) return;
	const legacy = legacyKeysIn(group);
	if (legacy.size === 0) return;
	const replacements = [...legacy].map((key) => `${key} → ${LEGACY_ITEM_KEYS.get(key)}`).join("; ");
	if (ITEM_STACK_COMMANDS.has(canonical)) {
		bag.error("MC-VERSION-002", rel, `pre-1.20.5 item NBT used in "${canonical}"`, {
			line: lineNo,
			hint: `Since 1.20.5 an item stack is {id, count, components:{...}}. ${replacements}. Arbitrary custom data goes in components:{\"minecraft:custom_data\":{...}}.`,
			excerpt: trimmed.slice(0, 100)
		});
		return;
	}
	if (NESTED_ITEM_COMMANDS.has(canonical)) {
		bag.warning("MC-VERSION-002", rel, `item NBT that became components in 1.20.5 appears inside "${canonical}"`, {
			line: lineNo,
			hint: `If these keys describe an item stack (${[...legacy].join(", ")}), convert them: ${replacements}. Entity NBT itself is unchanged.`,
			excerpt: trimmed.slice(0, 100)
		});
	}
}

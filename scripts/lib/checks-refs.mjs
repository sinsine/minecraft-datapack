/**
 * Cross-file integrity: do the ids a pack refers to actually exist, is every
 * function reachable, do macro functions get arguments, and does anything
 * recurse forever?
 *
 * These are the failures the game reports at runtime (or never reports at all,
 * leaving an author staring at a function that simply does nothing), and they are
 * exactly what a text validator can decide with certainty.
 */

import { closestMatch } from "./diagnostics.mjs";
import { canonicalRegistry } from "./checks-core.mjs";

/** Registries whose entries are addressable by `<namespace>:<path>`. */
const ADDRESSABLE = ["function", "loot_table", "predicate", "advancement", "recipe", "item_modifier", "damage_type", "structure"];

/** The file extension each registry's entries must use. */
const EXPECTED_EXTENSION = { function: ".mcfunction", structure: ".nbt" };

/**
 * Build the id index for every addressable registry in the pack.
 *
 * Only files with the right extension become ids: a stray foo.json inside
 * function/ is a structure error, not a function anything can call.
 */
function buildIndex(pack) {
	const index = new Map();
	const registries = pack.registries;
	for (const registry of ADDRESSABLE) index.set(registry, new Set());
	for (const [rel] of pack.entries) {
		const segments = rel.split("/");
		if (segments[0] !== "data" || segments.length < 4) continue;
		const namespace = segments[1];
		if (segments[2] === "tags" || segments[2] === "worldgen") continue;
		const registry = canonicalRegistry(segments[2], registries, "top");
		if (!index.has(registry)) continue;
		const tail = segments.slice(3).join("/");
		const dot = tail.lastIndexOf(".");
		const ext = dot === -1 ? "" : tail.slice(dot);
		if (ext !== (EXPECTED_EXTENSION[registry] ?? ".json")) continue;
		index.get(registry).add(`${namespace}:${tail.slice(0, dot)}`);
	}
	return index;
}

/** Turn a function file path into the id other files call it by. */
function idFromRel(rel) {
	const segments = rel.split("/");
	return `${segments[1]}:${segments.slice(3).join("/").replace(/\.mcfunction$/, "")}`;
}

/** Human label for a reference kind, used in messages. */
const LABEL = {
	function: "function",
	loot_table: "loot table",
	predicate: "predicate",
	advancement: "advancement",
	recipe: "recipe"
};

/**
 * Resolve every recorded reference and check the call graph.
 * @param {object} pack - pack model.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} facts - result of `analyzeFunctions`.
 * @param {Map<string, object>} tags - result of `checkTags`.
 * @returns {void}
 */
export function checkReferences(pack, bag, facts, tags) {
	const index = buildIndex(pack);
	const functionIds = index.get("function");
	const callEdges = new Map();
	const referenced = new Set();
	for (const id of functionIds) callEdges.set(id, new Set());

	for (const ref of facts.refs) {
		const id = ref.id;
		if (ref.kind === "function_tag") {
			const tag = tags.get(`function/${id}`);
			if (tag === undefined && !id.startsWith("minecraft:")) {
				const suggestion = closestMatch(id, [...tags.keys()].filter((key) => key.startsWith("function/")).map((key) => key.slice("function/".length)));
				bag.error("MC-REF-002", ref.rel, `function tag #${id} does not exist in this pack`, {
					line: ref.line,
					hint: suggestion
						? `Did you mean #${suggestion}? The file must be data/<namespace>/tags/function/<path>.json.`
						: "Create data/<namespace>/tags/function/<path>.json, or check the namespace and path."
				});
			}
			continue;
		}

		if (ref.kind === "function") {
			if (id.endsWith(".mcfunction")) {
				bag.error("MC-REF-004", ref.rel, `function id "${id}" has a file extension`, {
					line: ref.line,
					hint: `Function ids never carry an extension. Use "${id.replace(/\.mcfunction$/, "")}".`
				});
				continue;
			}
			if (!id.includes(":")) {
				bag.warning("MC-REF-005", ref.rel, `function id "${id}" has no namespace`, {
					line: ref.line,
					hint: `A bare name resolves to minecraft:${id}, which probably does not exist. Write "${pack.primaryNamespace}:${id}".`
				});
				continue;
			}
			if (functionIds.has(id)) {
				referenced.add(id);
				if (ref.guarded !== true) addEdge(callEdges, idFromRel(ref.rel), id);
				if (facts.macros.has(id) && ref.with !== true) {
					bag.error("MC-FUNC-040", ref.rel, `"${id}" contains macro lines but is called without arguments`, {
						line: ref.line,
						hint: `Call it as \`function ${id} with entity @s ...\` or \`with storage <id> <path>\`, passing the values the $() placeholders need.`
					});
				}
				if (ref.with === true && !facts.macros.has(id)) {
					bag.error("MC-FUNC-041", ref.rel, `"${id}" is called with arguments but has no macro lines`, {
						line: ref.line,
						hint: "Remove the `with` clause, or add at least one line that starts with $ and uses $(name)."
					});
				}
				continue;
			}
			if (id.startsWith("minecraft:")) continue;
			const suggestion = closestMatch(id, functionIds);
			bag.error("MC-REF-001", ref.rel, `function "${id}" does not exist in this pack`, {
				line: ref.line,
				hint: suggestion
					? `Did you mean "${suggestion}"?`
					: "Create data/<namespace>/function/<path>.mcfunction, or fix the namespace and path."
			});
			continue;
		}

		const registry = ref.kind;
		const pool = index.get(registry);
		if (pool === undefined || id.startsWith("minecraft:") || !id.includes(":")) continue;
		if (pool.has(id)) continue;
		const suggestion = closestMatch(id, pool);
		bag.error("MC-REF-003", ref.rel, `${LABEL[registry] ?? registry} "${id}" does not exist in this pack`, {
			line: ref.line,
			hint: suggestion ? `Did you mean "${suggestion}"?` : `Create data/<namespace>/${registry}/<path>.json, or fix the id.`
		});
	}

	// Tag membership is a reference too: a function listed in any tag is reachable,
	// and a macro function listed in a tag can never receive its arguments.
	for (const tag of tags.values()) {
		for (const value of tag.values) {
			if (value.id.startsWith("#")) continue;
			referenced.add(value.id);
			if (facts.macros.has(value.id)) {
				bag.error("MC-FUNC-043", tag.rel, `macro function "${value.id}" is invoked from a tag`, {
					hint: "Macros need arguments. A tag runs a function with none, so the macro line fails. Move the macro call into a normal function that uses `function <id> with ...`."
				});
			}
		}
	}

	checkJsonReferences(pack, bag, index, referenced);
	checkRecursion(pack, bag, functionIds, callEdges);
	checkReachability(pack, bag, functionIds, referenced);
	checkRunTags(pack, bag);
}

/** Add a directed call edge. */
function addEdge(edges, from, to) {
	const set = edges.get(from);
	if (set !== undefined) set.add(to);
}

/** Resolve ids referenced inside registry JSON (advancement parents and rewards, loot table indirection). */
function checkJsonReferences(pack, bag, index, referenced) {
	for (const [rel, entry] of pack.entries) {
		if (!entry.jsonOk || !rel.endsWith(".json")) continue;
		const segments = rel.split("/");
		if (segments[0] !== "data" || segments.length < 4) continue;
		const json = entry.json;
		if (json === null || typeof json !== "object") continue;

		if (segments[2] === "advancement") {
			const parent = json.parent;
			if (typeof parent === "string" && !parent.startsWith("minecraft:") && parent.includes(":")) {
				if (!index.get("advancement").has(parent)) {
					const suggestion = closestMatch(parent, index.get("advancement"));
					bag.error("MC-REF-006", rel, `advancement parent "${parent}" does not exist in this pack`, {
						hint: suggestion ? `Did you mean "${suggestion}"?` : "Create it, or point at a vanilla advancement such as minecraft:story/root."
					});
				}
			}
			checkRewards(rel, json, bag, index, referenced);
		}
		if (segments[2] === "loot_table") {
			checkLootEntries(rel, json, bag, index);
		}
	}
}

/** Resolve advancement rewards that name pack resources. */
function checkRewards(rel, json, bag, index, referenced) {
	const rewards = json.rewards;
	if (rewards === null || typeof rewards !== "object" || Array.isArray(rewards)) return;
	const singles = [
		["function", "function"],
		["loot", "loot_table"]
	];
	for (const [key, registry] of singles) {
		const value = rewards[key];
		if (typeof value !== "string" || value.startsWith("minecraft:") || !value.includes(":")) continue;
		if (!index.get(registry).has(value)) {
			bag.error("MC-REF-007", rel, `advancement reward ${key} "${value}" does not exist in this pack`, {
				hint: `Create data/<namespace>/${registry}/<path>.json, or remove the reward.`
			});
			continue;
		}
		// A reward is a real entry point: the function it names is reachable.
		if (registry === "function") referenced.add(value);
	}
	const recipes = rewards.recipes;
	if (Array.isArray(recipes)) {
		for (const value of recipes) {
			if (typeof value !== "string" || value.startsWith("minecraft:") || !value.includes(":")) continue;
			if (!index.get("recipe").has(value)) {
				bag.error("MC-REF-007", rel, `advancement reward recipe "${value}" does not exist in this pack`, {
					hint: "Create data/<namespace>/recipe/<path>.json, or remove the reward."
				});
			}
		}
	}
}

/** Resolve loot table entries that point at other loot tables or predicates. */
function checkLootEntries(rel, json, bag, index) {
	const pools = Array.isArray(json.pools) ? json.pools : [];
	const visit = (entries, depth) => {
		if (!Array.isArray(entries) || depth > 8) return;
		for (const entry of entries) {
			if (entry === null || typeof entry !== "object") continue;
			const type = typeof entry.type === "string" ? entry.type.replace(/^minecraft:/, "") : "";
			if (type === "loot_table" && typeof entry.value === "string" && !entry.value.startsWith("minecraft:") && entry.value.includes(":")) {
				if (!index.get("loot_table").has(entry.value)) {
					bag.error("MC-REF-008", rel, `nested loot table "${entry.value}" does not exist in this pack`, {
						hint: "Create it, or point at a vanilla loot table such as minecraft:chests/simple_dungeon."
					});
				}
			}
			if (Array.isArray(entry.children)) visit(entry.children, depth + 1);
		}
	};
	for (const pool of pools) {
		if (pool !== null && typeof pool === "object") visit(pool.entries, 0);
	}
}

/** Detect unconditional cycles in the function call graph. */
function checkRecursion(pack, bag, functionIds, edges) {
	const state = new Map();
	const stack = [];
	const reported = new Set();
	const visit = (id) => {
		state.set(id, 1);
		stack.push(id);
		for (const next of edges.get(id) ?? []) {
			if (!edges.has(next)) continue;
			if (state.get(next) === 1) {
				const start = stack.indexOf(next);
				const cycle = [...stack.slice(start), next];
				const key = [...cycle].sort().join("|");
				if (!reported.has(key)) {
					reported.add(key);
					const first = cycle[0];
					const namespace = first.split(":")[0];
					const path = first.split(":").slice(1).join(":");
					const file = pack.entries.get(`data/${namespace}/function/${path}.mcfunction`) ?? pack.entries.get(`data/${namespace}/functions/${path}.mcfunction`);
					bag.error("MC-REF-020", file?.rel ?? "data", `unguarded function recursion: ${cycle.join(" → ")}`, {
						hint: "The game aborts the whole function chain when a call recurses. Guard one call in the cycle with `execute if score ... run function ...` so it terminates."
					});
				}
				continue;
			}
			if (state.get(next) === undefined) visit(next);
		}
		stack.pop();
		state.set(id, 2);
	};
	for (const id of functionIds) if (state.get(id) === undefined) visit(id);
}

/** Report functions nothing refers to. */
function checkReachability(pack, bag, functionIds, referenced) {
	for (const id of functionIds) {
		if (referenced.has(id)) continue;
		const namespace = id.split(":")[0];
		const path = id.split(":").slice(1).join(":");
		const entry = pack.entries.get(`data/${namespace}/function/${path}.mcfunction`) ?? pack.entries.get(`data/${namespace}/functions/${path}.mcfunction`);
		bag.warning("MC-REF-010", entry?.rel ?? "data", `function "${id}" is never referenced by any file in this pack`, {
			hint: "It only runs if a player or another pack calls it. To run it every tick add it to data/minecraft/tags/function/tick.json; to run it once on load use load.json."
		});
	}
}

/**
 * Report scoreboard objectives that are used but never created in this pack.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} facts - result of `analyzeFunctions`.
 * @returns {void}
 */
export function checkObjectives(bag, facts) {
	// One diagnostic per objective, not per line: a pack can use an objective in
	// dozens of commands and repeating the same hint buries the other findings.
	const byObjective = new Map();
	for (const use of facts.usedObjectives) {
		if (facts.declaredObjectives.has(use.objective)) continue;
		if (use.objective.startsWith("$") || use.objective.includes(":")) continue;
		const existing = byObjective.get(use.objective);
		if (existing === undefined) {
			byObjective.set(use.objective, { use, count: 1 });
			continue;
		}
		existing.count += 1;
	}
	for (const [objective, { use, count }] of byObjective) {
		const scope = count === 1 ? "" : ` (used on ${count} lines)`;
		bag.warning("MC-FUNC-020", use.rel, `objective "${objective}" is used but never created in this pack${scope}`, {
			line: use.line,
			hint: `Add \`scoreboard objectives add ${objective} dummy\` to a function inside data/minecraft/tags/function/load.json, or use an objective another pack creates.`,
			excerpt: use.context
		});
	}
}

/** Check the load/tick wiring, including the minecraft-namespace requirement. */
function checkRunTags(pack, bag) {
	const functions = [...pack.entries.keys()].filter((rel) => rel.endsWith(".mcfunction"));
	if (functions.length === 0) return;
	const namespaces = new Set(functions.map((rel) => rel.split("/")[1]));
	const runTags = new Set();
	for (const rel of pack.entries.keys()) {
		const segments = rel.split("/");
		if (segments[0] !== "data" || segments[2] !== "tags") continue;
		if (canonicalRegistry(segments[3], pack.registries, "tags") !== "function") continue;
		const name = segments.at(-1)?.replace(/\.json$/, "");
		if (name !== "load" && name !== "tick") continue;
		runTags.add(`${segments[1]}:${name}`);
		if (segments[1] !== "minecraft") {
			bag.warning("MC-REF-011", rel, `"${name}" tag is declared outside the minecraft namespace`, {
				hint: `Only data/minecraft/tags/function/${name}.json is executed automatically. This file is a normal tag that nothing runs on its own.`
			});
		}
	}
	if (runTags.size === 0 && namespaces.size > 0) {
		bag.info("MC-REF-012", "data", "this pack defines functions but no minecraft:load or minecraft:tick tag", {
			hint: "Nothing runs on its own then. Add data/minecraft/tags/function/load.json (once at load) or tick.json (every tick) listing the function ids you want executed."
		});
	}
}

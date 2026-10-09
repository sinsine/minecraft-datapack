/**
 * Registry content checks: tag files, and a data-driven rule engine for the
 * JSON registries (advancements, recipes, loot tables, predicates, damage types,
 * item modifiers).
 *
 * Severity policy: an error is only reported when the game certainly rejects the
 * file. Anything version-dependent or merely suspicious is a warning, because a
 * validator that cries wolf stops being used.
 */

import { closestMatch } from "./diagnostics.mjs";
import { canonicalRegistry } from "./checks-core.mjs";

/**
 * Validate every tag file and collect the tags that exist.
 * @param {object} pack - pack model.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} registries - parsed `reference/data/registries.json`.
 * @returns {Map<string, {rel: string, values: Array<{id: string, required: boolean, line: number}>, replace: boolean}>} tags keyed by `<registry>/<namespace>:<path>`.
 */
export function checkTags(pack, bag, registries) {
	const tags = new Map();
	/** Registries the wiki lists as untaggable. */
	const untaggable = new Set(["advancement", "recipe", "structure"]);
	for (const [rel, entry] of pack.entries) {
		const segments = rel.split("/");
		if (segments[0] !== "data" || segments[2] !== "tags" || !rel.endsWith(".json")) continue;
		const namespace = segments[1];
		// Tag directories mirror registry names, so worldgen tags are two levels deep.
		const rawRegistry = segments[3] === "worldgen" && segments[4] !== undefined ? segments[4] : segments[3];
		const scope = segments[3] === "worldgen" ? "worldgen" : "tags";
		const registry = rawRegistry === undefined ? undefined : canonicalRegistry(rawRegistry, registries, scope);
		const depth = segments[3] === "worldgen" ? 5 : 4;
		if (registry === undefined) {
			bag.error("MC-TAG-001", rel, "tag file sits directly in tags/ with no registry directory", {
				hint: "Tags live at data/<namespace>/tags/<registry>/<name>.json, e.g. data/mypack/tags/function/tick.json."
			});
			continue;
		}
		if (untaggable.has(registry)) {
			bag.error("MC-TAG-007", rel, `the "${registry}" registry cannot carry tags`, {
				hint: "Recipes, advancements and structure templates have no tags. Tag the item or block the entry produces instead, under tags/item or tags/block."
			});
			continue;
		}
		const path = segments.slice(depth).join("/").replace(/\.json$/, "");
		const key = `${registry}/${namespace}:${path}`;
		const severitySource = rel;
		if (!entry.jsonOk) continue;
		const json = entry.json;
		if (json === null || typeof json !== "object" || Array.isArray(json)) {
			bag.error("MC-TAG-002", severitySource, "tag file must be a JSON object", {
				hint: "Use { \"values\": [ \"namespace:path\" ] }."
			});
			continue;
		}
		const values = json.values;
		if (values === undefined) {
			bag.error("MC-TAG-002", severitySource, "tag file has no \"values\" array", {
				hint: "Every tag needs \"values\": [ ... ]; an empty array is allowed."
			});
			continue;
		}
		if (!Array.isArray(values)) {
			bag.error("MC-TAG-002", severitySource, "\"values\" must be an array", {
				hint: "Write \"values\": [ \"mypack:my_function\" ]."
			});
			continue;
		}
		if (json.replace !== undefined && typeof json.replace !== "boolean") {
			bag.error("MC-TAG-003", severitySource, "\"replace\" must be true or false", {
				hint: "\"replace\": false is the default and merges with lower packs; true discards their entries."
			});
		}
		const collected = [];
		values.forEach((value, index) => {
			if (typeof value === "string") {
				collected.push({ id: value, required: true, line: 0 });
				if (!value.includes(":")) {
					bag.warning("MC-TAG-004", severitySource, `tag entry "${value}" has no namespace`, {
						hint: `A bare name resolves to minecraft:${value}. Write "${pack.primaryNamespace}:${value}" if you meant the entry in this pack.`
					});
				}
				if (value.startsWith("#") && value.slice(1) === `${namespace}:${path}`) {
					bag.error("MC-TAG-005", severitySource, "tag includes itself", {
						hint: "A tag that lists its own id recurses forever; remove the entry."
					});
				}
				return;
			}
			if (value !== null && typeof value === "object" && !Array.isArray(value)) {
				if (typeof value.id !== "string") {
					bag.error("MC-TAG-006", severitySource, `values[${index}] object has no "id" string`, {
						hint: "Optional-entry form is { \"id\": \"namespace:path\", \"required\": false }."
					});
					return;
				}
				if (value.required !== undefined && typeof value.required !== "boolean") {
					bag.error("MC-TAG-006", severitySource, `values[${index}].required must be true or false`, {
						hint: "Use \"required\": false to tolerate a missing entry from another pack."
					});
				}
				collected.push({ id: value.id, required: value.required !== false, line: 0 });
				return;
			}
			bag.error("MC-TAG-006", severitySource, `values[${index}] must be a string or an object`, {
				hint: "Tag entries are \"namespace:path\" strings, or { \"id\": \"...\", \"required\": false }."
			});
		});
		tags.set(key, { rel, values: collected, replace: json.replace === true });
	}
	return tags;
}

/** Look up a dotted key path in a parsed JSON value. */
function at(json, key) {
	if (json === null || typeof json !== "object") return undefined;
	return json[key];
}

/**
 * Validate registry entries against rules from registries.json.
 * @param {object} pack - pack model.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} registries - parsed `reference/data/registries.json`.
 * @param {object} gatesApi - version gate helpers.
 * @returns {void}
 */
export function checkRegistries(pack, bag, registries, gatesApi) {
	for (const [rel, entry] of pack.entries) {
		const segments = rel.split("/");
		if (segments[0] !== "data" || segments.length < 4) continue;
		if (segments[2] === "tags") continue;
		if (!rel.endsWith(".json")) continue;
		if (!entry.jsonOk) continue;
		const registry = canonicalRegistry(segments[2], registries, "top");
		if (registry === "function" || registry === "structure") continue;
		const json = entry.json;

		if (registry === "recipe") checkRecipe(rel, json, bag, registries, gatesApi);
		else if (registry === "loot_table") checkLootTable(rel, json, bag, registries);
		else if (registry === "advancement") checkAdvancement(rel, json, bag, registries);
		else if (registry === "item_modifier") checkItemModifier(rel, json, bag);

		const definition = registries.topLevel[registry];
		if (definition?.kind === "json" && gatesApi && definition.minVersion && !gatesApi.isActive(definition.minVersion)) {
			bag.warning("MC-VERSION-004", rel, `the "${registry}" registry requires Minecraft ${definition.minVersion}`, {
				hint: `The pack targets ${gatesApi.describeVersion()}; it will not load this file. Raise the target version or drop the file.`
			});
		}
		if (definition?.rules !== undefined) {
			applyRules(rel, json, bag, definition.rules, registries, registry);
		}
	}
}

/**
 * Apply the declarative rule list attached to a registry in registries.json.
 * @returns {void}
 */
function applyRules(rel, json, bag, rules, registries, registry) {
	if (json === null || typeof json !== "object" || Array.isArray(json)) return;
	for (const rule of rules) {
		switch (rule.kind) {
			case "requireKeys": {
				for (const key of rule.keys) {
					if (!Object.hasOwn(json, key)) {
						bag.error(rule.code ?? "MC-REG-001", rel, `required field "${key}" is missing`, {
							hint: `Every ${registry} file must contain "${key}".`
						});
					}
				}
				break;
			}
			case "eachObjectKey": {
				const container = at(json, rule.at);
				if (container === null || typeof container !== "object" || Array.isArray(container)) break;
				for (const [name, value] of Object.entries(container)) {
					if (value === null || typeof value !== "object" || Array.isArray(value)) {
						bag.error(rule.code ?? "MC-REG-011", rel, `"${rule.at}.${name}" must be an object`, {
							hint: `Each criterion is { "trigger": "..." }.`
						});
						continue;
					}
					for (const key of rule.requireKeys) {
						if (!Object.hasOwn(value, key)) {
							bag.error(rule.code ?? "MC-REG-011", rel, `criterion "${name}" has no "${key}"`, {
								hint: `Each entry under "${rule.at}" needs a "trigger", e.g. "minecraft:impossible" for a manual trigger.`
							});
						}
					}
				}
				break;
			}
			case "arrayOfObjectsWithKey": {
				if (!Array.isArray(json)) {
					bag.error("MC-REG-020", rel, "file must be a JSON array of item functions", {
						hint: "An item modifier is a list: [ { \"function\": \"minecraft:set_count\", ... } ]."
					});
					break;
				}
				json.forEach((value, index) => {
					if (value === null || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, rule.key)) {
						bag.error("MC-REG-020", rel, `element ${index} has no "${rule.key}" field`, {
							hint: `Every element needs "${rule.key}", e.g. "minecraft:set_count".`
						});
					}
				});
				break;
			}
			case "enumValue": {
				if (!Object.hasOwn(json, rule.key)) break;
				const value = json[rule.key];
				if (typeof value !== "string" || rule.values.includes(value)) break;
				const suggestion = closestMatch(value, rule.values);
				bag.error("MC-REG-002", rel, `"${rule.key}": "${value}" is not a valid value`, {
					hint: suggestion ? `Did you mean "${suggestion}"?` : `Valid values: ${rule.values.join(", ")}.`
				});
				break;
			}
			case "requireKeysWhenType": {
				const type = typeof json.type === "string" ? json.type.replace(/^minecraft:/, "") : undefined;
				if (type === undefined || !rule.poolsTypes.includes(type)) break;
				for (const key of rule.keys) {
					if (!Object.hasOwn(json, key)) {
						bag.error(rule.code ?? "MC-REG-021", rel, `loot table of type "${json.type}" needs a "${key}" array`, {
							hint: "A rollable loot table must define at least one pool."
						});
					}
				}
				break;
			}
			default:
				break;
		}
	}
}

/** Validate one recipe file. */
function checkRecipe(rel, json, bag, registries, gatesApi) {
	if (json === null || typeof json !== "object" || Array.isArray(json)) {
		bag.error("MC-REG-030", rel, "recipe must be a JSON object", { hint: "e.g. { \"type\": \"minecraft:crafting_shaped\", ... }." });
		return;
	}
	const type = json.type;
	if (typeof type !== "string") {
		bag.error("MC-REG-030", rel, "recipe has no \"type\"", {
			hint: "Every recipe starts with \"type\": \"minecraft:crafting_shaped\"."
		});
		return;
	}
	const bare = type.replace(/^minecraft:/, "");
	if (!registries.recipeTypes.includes(bare)) {
		const suggestion = closestMatch(bare, registries.recipeTypes);
		const extra = {
			hint: suggestion
				? `Did you mean "minecraft:${suggestion}"?`
				: `Known recipe types include ${registries.recipeTypes.slice(0, 6).join(", ")} and more; see reference/registries.md.`
		};
		if (suggestion) bag.error("MC-REG-031", rel, `unknown recipe type "${type}"`, extra);
		else bag.warning("MC-REG-031", rel, `recipe type "${type}" is not in the validator's table`, extra);
		return;
	}
	const required = registries.recipeRequiredKeys[bare] ?? [];
	for (const key of required) {
		if (!Object.hasOwn(json, key)) {
			bag.error("MC-REG-032", rel, `recipe type "${bare}" needs "${key}"`, {
				hint: `A ${bare} recipe requires: ${required.join(", ")}.`
			});
		}
	}
	if (bare === "crafting_shaped" && Array.isArray(json.pattern)) {
		const rows = json.pattern;
		if (!rows.every((row) => typeof row === "string")) {
			bag.error("MC-REG-033", rel, "crafting_shaped pattern must be an array of strings", {
				hint: "e.g. \"pattern\": [\"XX\", \"XX\"]."
			});
			return;
		}
		if (rows.length > 3 || rows.some((row) => row.length > 3)) {
			bag.error("MC-REG-033", rel, "crafting_shaped pattern is larger than 3x3", {
				hint: "A shaped recipe grid is at most 3 rows of 3 characters."
			});
		}
		const widths = new Set(rows.map((row) => row.length));
		if (widths.size > 1) {
			bag.error("MC-REG-033", rel, "crafting_shaped pattern rows have different lengths", {
				hint: "Pad every row with a space so all rows are the same length."
			});
		}
		const symbols = new Set(rows.join("").replace(/ /g, "").split(""));
		const keys = json.key !== null && typeof json.key === "object" && !Array.isArray(json.key) ? Object.keys(json.key) : [];
		for (const symbol of symbols) {
			if (!keys.includes(symbol)) {
				bag.error("MC-REG-034", rel, `pattern uses "${symbol}" but "key" does not define it`, {
					hint: `Add "${symbol}": { "item": "minecraft:..." } to "key", or remove the symbol from the pattern. A space means "empty slot".`
				});
			}
		}
		for (const key of keys) {
			if (!symbols.has(key)) {
				bag.warning("MC-REG-034", rel, `"key" defines "${key}" but the pattern never uses it`, {
					hint: "Remove the unused key entry or use the symbol in the pattern."
				});
			}
		}
	}
	if (Object.hasOwn(json, "result")) checkResultShape(rel, json.result, bag, gatesApi);
	if (bare === "crafting_shapeless" && Array.isArray(json.ingredients) && json.ingredients.length === 0) {
		bag.warning("MC-REG-035", rel, "crafting_shapeless recipe has no ingredients", {
			hint: "Add at least one entry to \"ingredients\"."
		});
	}
}

/** Check an item-stack result, whose key changed name in 1.20.5. */
function checkResultShape(rel, result, bag, gatesApi) {
	if (Array.isArray(result)) {
		result.forEach((item, index) => checkResultShape(rel, item, bag, gatesApi, index));
		return;
	}
	if (result === null || typeof result !== "object") {
		bag.error("MC-REG-036", rel, "\"result\" must be an item stack object", {
			hint: "e.g. { \"id\": \"minecraft:diamond\", \"count\": 1 }."
		});
		return;
	}
	const hasId = Object.hasOwn(result, "id");
	const hasItem = Object.hasOwn(result, "item");
	if (!hasId && !hasItem) {
		bag.error("MC-REG-036", rel, "\"result\" has neither \"id\" nor \"item\"", {
			hint: "Use { \"id\": \"minecraft:diamond\", \"count\": 1 } for 1.20.5 and later."
		});
		return;
	}
	if (gatesApi?.isActive("1.20.5") && !hasId) {
		bag.warning("MC-VERSION-005", rel, "recipe result uses the pre-1.20.5 \"item\" key", {
			hint: "Since 1.20.5 an item stack is { \"id\": \"minecraft:diamond\", \"count\": 1 } (with \"components\" instead of NBT tags)."
		});
	}
	if (gatesApi && !gatesApi.isActive("1.20.5") && !hasItem) {
		bag.warning("MC-VERSION-005", rel, "recipe result uses the post-1.20.5 \"id\" key on an older target", {
			hint: `The pack targets ${gatesApi.describeVersion()}, where the key is "item".`
		});
	}
}

/** Validate one loot table file. */
function checkLootTable(rel, json, bag, registries) {
	if (json === null || typeof json !== "object" || Array.isArray(json)) {
		bag.error("MC-REG-040", rel, "loot table must be a JSON object", { hint: "e.g. { \"type\": \"minecraft:block\", \"pools\": [ ... ] }." });
		return;
	}
	const type = json.type;
	if (typeof type === "string") {
		const bare = type.replace(/^minecraft:/, "");
		if (!registries.lootTableTypes.includes(bare)) {
			const suggestion = closestMatch(bare, registries.lootTableTypes);
			const extra = { hint: suggestion ? `Did you mean "minecraft:${suggestion}"?` : `Known types: ${registries.lootTableTypes.join(", ")}.` };
			if (suggestion) bag.error("MC-REG-041", rel, `unknown loot table type "${type}"`, extra);
			else bag.warning("MC-REG-041", rel, `loot table type "${type}" is not in the validator's table`, extra);
		}
	}
	if (Array.isArray(json.pools)) {
		json.pools.forEach((pool, index) => {
			if (pool === null || typeof pool !== "object" || Array.isArray(pool)) {
				bag.error("MC-REG-042", rel, `pools[${index}] must be an object`, { hint: "Each pool is { \"rolls\": 1, \"entries\": [ ... ] }." });
				return;
			}
			if (!Array.isArray(pool.entries) || pool.entries.length === 0) {
				bag.error("MC-REG-042", rel, `pools[${index}] has no "entries" array`, {
					hint: "A pool with no entries can never produce loot."
				});
			}
			if (pool.rolls !== undefined && typeof pool.rolls !== "number" && typeof pool.rolls !== "object") {
				bag.error("MC-REG-042", rel, `pools[${index}].rolls must be a number or a number provider`, {
					hint: "e.g. \"rolls\": 1 or { \"type\": \"minecraft:uniform\", \"min\": 1, \"max\": 3 }."
				});
			}
		});
	}
}

/** Validate one advancement file. */
function checkAdvancement(rel, json, bag, registries) {
	if (json === null || typeof json !== "object" || Array.isArray(json)) {
		bag.error("MC-REG-050", rel, "advancement must be a JSON object", { hint: "e.g. { \"criteria\": { \"tick\": { \"trigger\": \"minecraft:tick\" } } }." });
		return;
	}
	const criteria = json.criteria;
	if (criteria !== null && typeof criteria === "object" && !Array.isArray(criteria)) {
		const names = Object.keys(criteria);
		if (names.length === 0) {
			bag.error("MC-REG-051", rel, "advancement has an empty \"criteria\" object", {
				hint: "An advancement with no criteria can never be granted."
			});
		}
		for (const [name, criterion] of Object.entries(criteria)) {
			if (criterion === null || typeof criterion !== "object" || typeof criterion.trigger !== "string") continue;
			const bare = criterion.trigger.replace(/^minecraft:/, "");
			if (registries.advancementTriggers.includes(bare)) continue;
			const suggestion = closestMatch(bare, registries.advancementTriggers);
			if (suggestion) {
				bag.error("MC-REG-052", rel, `criterion "${name}" uses unknown trigger "${criterion.trigger}"`, {
					hint: `Did you mean "minecraft:${suggestion}"?`
				});
			} else {
				bag.warning("MC-REG-052", rel, `criterion "${name}" uses trigger "${criterion.trigger}", which is not in the validator's table`, {
					hint: "Use \"minecraft:impossible\" when the advancement should only be granted by the /advancement command."
				});
			}
		}
	}
	const display = json.display;
	if (display !== null && typeof display === "object" && !Array.isArray(display)) {
		for (const key of ["icon", "title", "description"]) {
			if (!Object.hasOwn(display, key)) {
				bag.error("MC-REG-053", rel, `"display" is missing "${key}"`, {
					hint: "A shown advancement needs icon, title and description; hidden background advancements should omit \"display\" entirely."
				});
			}
		}
	}
}

/** Validate an item modifier file shape; both the single-object and array forms are accepted. */
function checkItemModifier(rel, json, bag) {
	if (Array.isArray(json)) {
		json.forEach((element, index) => {
			if (element === null || typeof element !== "object" || Array.isArray(element) || typeof element.function !== "string") {
				bag.error("MC-REG-060", rel, `item modifier element ${index} has no "function" field`, {
					hint: "Each element names its function, e.g. { \"function\": \"minecraft:set_damage\", \"damage\": 0.5 }."
				});
			}
		});
		return;
	}
	if (json === null || typeof json !== "object") {
		bag.error("MC-REG-060", rel, "item modifier must be an object or an array of objects", {
			hint: "e.g. { \"function\": \"minecraft:set_count\", \"count\": 3 }."
		});
		return;
	}
	if (typeof json.function !== "string") {
		bag.error("MC-REG-060", rel, "item modifier has no \"function\" field", {
			hint: "Every item modifier names its function, e.g. \"minecraft:set_damage\"."
		});
	}
}

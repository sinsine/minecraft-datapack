/**
 * Pack-level checks: filesystem layout, namespace/path grammar, registry
 * directories, and pack.mcmeta.
 *
 * Everything here is decided from files on disk, so it catches the mistakes that
 * otherwise only show up as "the pack does not load" or "the function is not in
 * the list" inside the game.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { closestMatch } from "./diagnostics.mjs";
import { parseJsonText } from "./json-scan.mjs";

/** Files that are noise in a pack and are never loaded by the game. */
const CLUTTER = new Set([".DS_Store", "Thumbs.db", "desktop.ini", ".gitignore"]);

/** Report a markdown file inside a pack: harmless, but worth knowing about. */
function isDocumentation(name) {
	return name.toLowerCase().endsWith(".md");
}

/** Directories never worth descending into. */
const SKIP_DIRS = new Set([".git", "node_modules", ".vscode", ".idea", "__pycache__"]);

/**
 * Map a version-renamed registry directory to its modern name.
 *
 * 1.21 renamed the plural registry folders to singular (`functions/` →
 * `function/`, `advancements/` → `advancement/`, `tags/items/` → `tags/item/`),
 * and 26.3 renamed two worldgen folders. Both spellings are therefore valid, just
 * not in the same version, so every internal check works on the canonical name
 * and the era is reported separately.
 * @param {string} name - the directory segment as written.
 * @param {object} registries - parsed registries.json.
 * @param {"top"|"tags"|"worldgen"} [scope] - where the directory sits.
 * @returns {string} the modern name, or the input unchanged.
 */
export function canonicalRegistry(name, registries, scope = "top") {
	const rule = (registries.renames ?? []).find((entry) => entry.scope === scope && entry.from === name);
	return rule === undefined ? name : rule.to;
}

/**
 * Report a directory written in the wrong era's spelling.
 * @returns {void}
 */
function checkRenames(dir, name, scope, gatesApi, bag, registries) {
	const rules = registries.renames ?? [];
	const oldForm = rules.find((rule) => rule.scope === scope && rule.from === name);
	if (oldForm !== undefined) {
		if (gatesApi?.isActive(oldForm.minVersion) === true) {
			bag.error("MC-STRUCT-013", `${dir}/`, `directory "${name}" was renamed to "${oldForm.to}" in ${oldForm.minVersion}`, {
				hint: `This pack targets ${gatesApi.describeVersion()}, where the folder must be "${oldForm.to}". The old plural name is only read by ${oldForm.minVersion} and earlier.`
			});
		}
		return;
	}
	const newForm = rules.find((rule) => rule.scope === scope && rule.to === name);
	if (newForm !== undefined && gatesApi?.isActive(newForm.minVersion) === false) {
		bag.error("MC-STRUCT-014", `${dir}/`, `directory "${name}" is the name used from ${newForm.minVersion} onwards`, {
			hint: `This pack targets ${gatesApi.describeVersion()}, which reads "${newForm.from}" instead, so nothing in this folder loads. Rename it to "${newForm.from}", or raise the pack's target version.`
		});
	}
}

/**
 * Walk a pack directory into a flat, sorted file and directory list.
 * @param {string} root - absolute pack root.
 * @returns {{files: Array<{abs: string, rel: string, name: string, size: number}>, dirs: string[]}} inventory.
 */
export function walkPack(root) {
	const files = [];
	const dirs = [];
	const walk = (abs, rel) => {
		let entries;
		try {
			entries = readdirSync(abs, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
			const childAbs = join(abs, entry.name);
			const childRel = rel ? `${rel}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				dirs.push(childRel);
				if (!SKIP_DIRS.has(entry.name)) walk(childAbs, childRel);
				continue;
			}
			if (!entry.isFile()) continue;
			let size = 0;
			try {
				size = statSync(childAbs).size;
			} catch {
				size = 0;
			}
			files.push({ abs: childAbs, rel: childRel, name: entry.name, size });
		}
	};
	walk(root, "");
	return { files, dirs };
}

/**
 * Decide which directory is actually the pack root.
 * @param {string} input - directory the user pointed at.
 * @returns {{root: string, note: string|undefined}} resolved root and an optional explanation.
 */
export function resolvePackRoot(input) {
	try {
		if (statSync(join(input, "pack.mcmeta")).isFile()) return { root: input, note: undefined };
	} catch {
		/* fall through to the nested probe */
	}
	try {
		const entries = readdirSync(input, { withFileTypes: true }).filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name));
		const hits = entries.filter((e) => {
			try {
				return statSync(join(input, e.name, "pack.mcmeta")).isFile();
			} catch {
				return false;
			}
		});
		if (hits.length === 1) {
			return { root: join(input, hits[0].name), note: `pack root resolved to the nested directory "${hits[0].name}"` };
		}
	} catch {
		/* fall through */
	}
	return { root: input, note: undefined };
}

/**
 * Read every text entry worth parsing and parse the JSON ones.
 * @param {{files: Array<{abs: string, rel: string, name: string, size: number}>}} inventory - walk result.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @returns {Map<string, {rel: string, text: string|undefined, json: unknown, jsonOk: boolean, binary: boolean}>} entries by relative path.
 */
export function readEntries(inventory, bag) {
	const entries = new Map();
	for (const file of inventory.files) {
		const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
		const binary = [".nbt", ".png", ".jpg", ".jpeg", ".ogg", ".zip", ".dat"].includes(ext);
		if (binary || file.size > 4 * 1024 * 1024) {
			entries.set(file.rel, { rel: file.rel, text: undefined, json: undefined, jsonOk: false, binary: true });
			continue;
		}
		let text;
		try {
			text = readFileSync(file.abs, "utf8");
		} catch {
			entries.set(file.rel, { rel: file.rel, text: undefined, json: undefined, jsonOk: false, binary: true });
			continue;
		}
		const entry = { rel: file.rel, text, json: undefined, jsonOk: false, binary: false };
		if (ext === ".json" || file.name === "pack.mcmeta") {
			const parsed = parseJsonText(text, file.rel, bag);
			if (parsed !== undefined) {
				entry.json = parsed;
				entry.jsonOk = true;
			}
		}
		entries.set(file.rel, entry);
	}
	return entries;
}

/**
 * Check root layout, namespaces, paths and registry directories.
 * @param {object} pack - pack model from `buildPackModel`.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} registries - parsed `reference/data/registries.json`.
 * @returns {void}
 */
export function checkStructure(pack, bag, registries) {
	const knownTop = new Set(Object.keys(registries.topLevel));
	const overlayDirs = new Set();
	const overlays = pack.mcmeta?.overlays;
	if (Array.isArray(overlays?.entries)) {
		for (const entry of overlays.entries) {
			if (typeof entry?.directory === "string") overlayDirs.add(entry.directory);
		}
	}

	for (const file of pack.inventory.files) {
		const top = file.rel.split("/")[0];
		if (file.rel === "pack.mcmeta" || file.rel === "pack.png") continue;
		if (top === "data") continue;
		if (overlayDirs.has(top)) continue;
		if (file.rel.includes("/")) {
			bag.error("MC-STRUCT-001", file.rel, `file is outside both "data" and any declared overlay directory`, {
				hint: `Only pack.mcmeta, pack.png, data/ and directories listed in pack.mcmeta overlays.entries may sit at the pack root. Move this file into data/<namespace>/<registry>/.`
			});
			continue;
		}
		if (CLUTTER.has(file.rel)) {
			bag.warning("MC-STRUCT-016", file.rel, "editor or OS clutter file inside the pack", {
				hint: "Delete it; the game ignores it but it ships with the pack."
			});
			continue;
		}
		if (isDocumentation(file.rel)) {
			bag.info("MC-STRUCT-017", file.rel, "documentation file inside the pack", {
				hint: "The game ignores .md files. Keep it if you want notes to travel with the pack, otherwise delete it."
			});
			continue;
		}
		bag.error("MC-STRUCT-001", file.rel, `unexpected file at the pack root`, {
			hint: "Allowed root entries are pack.mcmeta, pack.png, data/, and overlay directories declared in pack.mcmeta."
		});
	}

	for (const dir of pack.inventory.dirs) {
		if (dir === "data") continue;
		const segments = dir.split("/");
		if (segments[0] !== "data") {
			if (overlayDirs.has(segments[0])) continue;
			continue;
		}
		if (segments.length === 2) {
			const namespace = segments[1];
			if (!new RegExp(registries.namespacePattern).test(namespace)) {
				bag.error("MC-STRUCT-004", `${dir}/`, `invalid namespace "${namespace}"`, {
					hint: "Namespaces allow only lowercase a-z, 0-9, underscore, dot and hyphen."
				});
			}
			continue;
		}
		if (segments.length === 3) {
			const registry = segments[2];
			checkRenames(dir, registry, "top", pack.gates, bag, registries);
			const canonical = canonicalRegistry(registry, registries, "top");
			if (!knownTop.has(canonical)) {
				const suggestion = closestMatch(registry, knownTop);
				bag.error("MC-STRUCT-003", `${dir}/`, `unknown registry directory "${registry}" under data/${segments[1]}/`, {
					hint: suggestion
						? `Rename it to "${suggestion}".`
						: "Check the registry list in reference/structure.md; a typo here silently makes the pack do nothing."
				});
			}
			continue;
		}
		if (segments.length === 4 && segments[2] === "tags") {
			const registry = segments[3];
			checkRenames(dir, registry, "tags", pack.gates, bag, registries);
			const canonical = canonicalRegistry(registry, registries, "tags");
			const known = new Set([...(registries.tagRegistries ?? []), ...knownTop]);
			// Every registry can carry tags, so an unfamiliar name is only worth
			// flagging when it is one edit away from a real one (tags/items, tags/blocks).
			const suggestion = known.has(canonical) ? undefined : closestMatch(canonical, known);
			if (suggestion !== undefined && suggestion !== canonical) {
				bag.warning("MC-STRUCT-012", `${dir}/`, `tag directory "${registry}" looks like a misspelling`, {
					hint: `Rename it to "${suggestion}". Tag directories are named after the registry in the singular: tags/item, tags/block, tags/function, tags/entity_type.`
				});
			}
			continue;
		}
		if (segments.length === 4 && segments[2] === "worldgen") {
			const registry = segments[3];
			checkRenames(dir, registry, "worldgen", pack.gates, bag, registries);
			const canonical = canonicalRegistry(registry, registries, "worldgen");
			if (!Object.hasOwn(registries.worldgen, canonical)) {
				const suggestion = closestMatch(canonical, Object.keys(registries.worldgen));
				bag.error("MC-STRUCT-011", `${dir}/`, `unknown worldgen directory "${registry}"`, {
					hint: suggestion ? `Rename it to "${suggestion}".` : "See the worldgen table in reference/structure.md."
				});
			}
		}
	}

	for (const file of pack.inventory.files) {
		const segments = file.rel.split("/");
		if (segments[0] !== "data" || segments.length < 3) continue;
		const registry = segments[2] === "tags" || segments[2] === "worldgen" ? segments[2] : canonicalRegistry(segments[2], registries, "top");
		const rest = segments.slice(3);
		const name = rest.at(-1) ?? "";
		const stem = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
		const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";

		if (!new RegExp(registries.pathPattern).test(rest.join("/"))) {
			bag.error("MC-STRUCT-005", file.rel, "path contains characters the game will not resolve", {
				hint: "Paths allow only lowercase a-z, 0-9, underscore, dot, hyphen and / as separator. No spaces, no capitals, no non-ASCII."
			});
			continue;
		}
		if (CLUTTER.has(name)) {
			bag.warning("MC-STRUCT-016", file.rel, "editor or OS clutter file inside the pack", {
				hint: "Delete it; it ships with the pack and is never loaded."
			});
			continue;
		}
		if (isDocumentation(name)) {
			bag.info("MC-STRUCT-017", file.rel, "documentation file inside a registry directory", {
				hint: "The game ignores .md files, but nothing else belongs next to registry entries. Move notes out of data/ if the pack should stay clean."
			});
			continue;
		}

		if (registry === "function") {
			if (ext === ".json") {
				bag.error("MC-STRUCT-006", file.rel, "function file uses a .json extension", {
					hint: `Functions are plain text with the .mcfunction extension. Rename to ${stem}.mcfunction.`
				});
			} else if (ext !== ".mcfunction") {
				bag.error("MC-STRUCT-006", file.rel, `function file has extension "${ext || "(none)"}"`, {
					hint: "Functions must end in .mcfunction."
				});
			}
			continue;
		}

		if (registry === "structure" && segments.length === 4) {
			if (ext !== ".nbt") {
				bag.error("MC-STRUCT-008", file.rel, `structure file has extension "${ext || "(none)"}"`, {
					hint: "Structure templates must end in .nbt."
				});
			}
			continue;
		}

		if (registry === "worldgen" && segments.length === 4 && segments[3] === "structure") {
			if (ext !== ".json") {
				bag.error("MC-STRUCT-007", file.rel, "worldgen structure definition must be a .json file", {
					hint: "data/<ns>/worldgen/structure/<name>.json is a definition; the .nbt template lives in data/<ns>/structure/."
				});
			}
			continue;
		}

		if (registry === "tags") {
			if (ext !== ".json") {
				bag.error("MC-STRUCT-007", file.rel, `tag file has extension "${ext || "(none)"}"`, {
					hint: "Tags are JSON files with a .json extension."
				});
			}
			continue;
		}

		if (ext !== ".json") {
			bag.error("MC-STRUCT-007", file.rel, `registry file has extension "${ext || "(none)"}"`, {
				hint: "Every registry entry under data/<namespace>/<registry>/ is a .json file."
			});
		}
	}

	if (!pack.inventory.dirs.includes("data")) {
		bag.warning("MC-STRUCT-021", "pack.mcmeta", "pack contains no data/ directory", {
			hint: "The pack loads but contributes nothing. Add data/<namespace>/<registry>/."
		});
	}
	for (const dir of pack.inventory.dirs) {
		const segments = dir.split("/");
		if (segments[0] === "data" && segments.length === 2) {
			const hasChild = pack.inventory.dirs.some((d) => d.startsWith(`${dir}/`)) || pack.inventory.files.some((f) => f.startsWith(`${dir}/`));
			if (!hasChild) {
				bag.warning("MC-STRUCT-010", `${dir}/`, `namespace "${segments[1]}" is empty`, {
					hint: "An empty namespace does nothing; remove it or add registry directories inside."
				});
			}
		}
	}
}

/**
 * Validate pack.mcmeta against the version-field rules for its era.
 * @param {object} pack - pack model from `buildPackModel`.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @param {object} versionTable - loaded `reference/data/versions.json`.
 * @returns {void}
 */
export function checkMeta(pack, bag, versionTable) {
	const rel = "pack.mcmeta";
	if (!pack.mcmetaEntry) {
		bag.error("MC-META-002", rel, "pack.mcmeta is missing", {
			hint: "Every datapack needs pack.mcmeta at its root. Copy templates/pack.mcmeta and set the format number from reference/data/versions.json."
		});
		return;
	}
	if (!pack.mcmetaEntry.jsonOk) return;

	const mcmeta = pack.mcmetaEntry.json;
	if (mcmeta === null || typeof mcmeta !== "object" || Array.isArray(mcmeta)) {
		bag.error("MC-META-002", rel, "pack.mcmeta root must be a JSON object", { hint: "It looks like { \"pack\": { ... } }." });
		return;
	}
	const packSection = mcmeta.pack;
	if (packSection === null || typeof packSection !== "object" || Array.isArray(packSection)) {
		bag.error("MC-META-002", rel, "pack.mcmeta has no \"pack\" object", {
			hint: "The metadata lives under the top-level key \"pack\"."
		});
		return;
	}

	const description = packSection.description;
	if (description === undefined) {
		bag.error("MC-META-003", rel, "pack.description is required", {
			hint: "Add \"description\": \"a short sentence\"."
		});
	} else if (typeof description !== "string" && typeof description !== "object") {
		bag.error("MC-META-008", rel, "pack.description must be a string or a text component", {
			hint: "Use a plain string, e.g. \"description\": \"My datapack\"."
		});
	}

	const hasLegacy = Object.hasOwn(packSection, "pack_format") || Object.hasOwn(packSection, "supported_formats");
	const hasModern = Object.hasOwn(packSection, "min_format") || Object.hasOwn(packSection, "max_format");

	if (!hasLegacy && !hasModern) {
		bag.error("MC-META-004", rel, "no pack format declared", {
			hint: `Add "pack_format": <n> (for 1.21.8 and earlier) or "min_format"/"max_format" (for 1.21.9 and later). See reference/data/versions.json for the current number.`
		});
	}

	const numbers = [];
	const pushNumber = (value, key) => {
		if (typeof value === "number" && Number.isInteger(value)) {
			numbers.push({ key, value });
			return;
		}
		if (Array.isArray(value)) {
			if (value.length < 1 || value.length > 2 || !value.every((item) => typeof item === "number" && Number.isInteger(item))) {
				bag.error("MC-META-013", rel, `"${key}" must be an integer or an array of one or two integers`, {
					hint: `Use "${key}": 81 or "${key}": [81, 0] (major, minor).`
				});
				return;
			}
			numbers.push({ key, value: value[0] });
			return;
		}
		bag.error("MC-META-013", rel, `"${key}" must be an integer`, {
			hint: `Remove the quotes: "${key}": 81.`
		});
	};

	for (const key of ["pack_format", "min_format", "max_format"]) {
		if (Object.hasOwn(packSection, key)) pushNumber(packSection[key], key);
	}

	// Both fields of the post-1.21.8 range are required together, with or without
	// the legacy fields alongside them.
	if (hasModern && !(Object.hasOwn(packSection, "min_format") && Object.hasOwn(packSection, "max_format"))) {
		bag.error("MC-META-007", rel, "min_format and max_format must be given together", {
			hint: `For ${versionTable.era.modernFromVersion} and later both are required: "min_format": [x, 0], "max_format": [y, 0].`
		});
	}

	if (hasLegacy && hasModern) {
		const legacy = versionTable.era.legacyMax;
		const packFormat = numbers.find((n) => n.key === "pack_format")?.value;
		const minFormat = numbers.find((n) => n.key === "min_format")?.value;
		const maxFormat = numbers.find((n) => n.key === "max_format")?.value;
		const hasSupported = Object.hasOwn(packSection, "supported_formats");
		if (minFormat !== undefined && maxFormat !== undefined) {
			const high = Math.max(minFormat, maxFormat);
			const low = Math.min(minFormat, maxFormat);
			if (high <= legacy) {
				bag.error("MC-META-005", rel, "min_format/max_format are used for a pack that only targets 1.21.8 or earlier", {
					hint: `Up to ${versionTable.era.legacyThroughVersion} (format ${legacy}) the fields are pack_format and optionally supported_formats. min_format/max_format exist only from ${versionTable.era.modernFromVersion}.`
				});
			} else if (low > legacy) {
				if (packFormat !== undefined) {
					bag.error("MC-META-005", rel, "pack_format cannot be combined with a 1.21.9+ version range", {
						hint: `A pack that only supports ${versionTable.era.modernFromVersion} and later must use min_format and max_format alone; pack_format and supported_formats are for ${versionTable.era.legacyThroughVersion} and earlier.`
					});
				}
				if (hasSupported) {
					bag.error("MC-META-005", rel, "supported_formats cannot be combined with a 1.21.9+ version range", {
						hint: "supported_formats is only read up to 1.21.8 (format 81). Use min_format/max_format instead."
					});
				}
			} else {
				if (packFormat === undefined) {
					bag.error("MC-META-005", rel, "a pack spanning 1.21.8 and 1.21.9 must also declare pack_format", {
						hint: "A pack that supports both eras needs all four fields: pack_format, supported_formats, min_format and max_format."
					});
				}
				if (!hasSupported) {
					bag.error("MC-META-005", rel, "a pack spanning 1.21.8 and 1.21.9 must also declare supported_formats", {
						hint: `Use "supported_formats": [low, ${legacy}] together with min_format/max_format so old versions can still read the range.`
					});
				}
				// The game requires one low end and one high end: min_format's major must
				// equal the minimum of supported_formats, and the high end is either equal
				// to supported_formats' maximum or capped at the era boundary.
				if (Array.isArray(packSection.supported_formats) && packSection.supported_formats.every((v) => typeof v === "number")) {
					const supportedMin = Math.min(...packSection.supported_formats);
					const supportedMax = Math.max(...packSection.supported_formats);
					if (supportedMin !== minFormat) {
						bag.error("MC-META-017", rel, `min_format (${minFormat}) and supported_formats minimum (${supportedMin}) disagree`, {
							hint: `They must describe one low end. Write "supported_formats": [${minFormat}, ${supportedMax}].`
						});
					}
					if (supportedMax !== maxFormat && supportedMax !== legacy) {
						bag.warning("MC-META-018", rel, `supported_formats maximum (${supportedMax}) matches neither max_format (${maxFormat}) nor ${legacy}`, {
							hint: `Either set max_format's major part to ${supportedMax}, or cap supported_formats at ${legacy}.`
						});
					}
				}
			}
		}
	} else if (!hasModern) {
		const packFormat = numbers.find((n) => n.key === "pack_format")?.value;
		const supported = Array.isArray(packSection.supported_formats) ? packSection.supported_formats : [];
		const supportedMax = supported.length > 0 ? Math.max(...supported) : undefined;
		const highest = Math.max(packFormat ?? 0, typeof supportedMax === "number" ? supportedMax : 0);
		if (highest > versionTable.era.legacyMax) {
			bag.error("MC-META-005", rel, `format ${highest} needs min_format/max_format, not pack_format`, {
				hint: `pack_format is only read up to ${versionTable.era.legacyThroughVersion} (format ${versionTable.era.legacyMax}). For ${versionTable.era.modernFromVersion} and later write "min_format": [${highest}, 0] and "max_format": [${highest}, 0].`
			});
		}
		if (supported.length === 2 && typeof packFormat === "number") {
			const supportedMin = Math.min(...supported);
			if (packFormat < supportedMin || packFormat > Math.max(...supported)) {
				bag.warning("MC-META-019", rel, `pack_format (${packFormat}) is outside supported_formats (${supportedMin}–${Math.max(...supported)})`, {
					hint: "supported_formats must contain pack_format."
				});
			}
			if (Math.max(...supported) < 15) {
				bag.warning("MC-META-019", rel, "supported_formats maximum is below 15", {
					hint: "The game rejects a legacy supported_formats range whose maximum is under 15."
				});
			}
		}
	}

	if (Object.hasOwn(packSection, "min_format") && Object.hasOwn(packSection, "max_format")) {
		const min = numbers.find((n) => n.key === "min_format")?.value;
		const max = numbers.find((n) => n.key === "max_format")?.value;
		if (min !== undefined && max !== undefined && min > max) {
			bag.error("MC-META-007", rel, `min_format (${min}) is greater than max_format (${max})`, {
				hint: "Swap them; min_format is the oldest compatible format."
			});
		}
	}

	const supported = packSection.supported_formats;
	if (supported !== undefined) {
		const ok = Array.isArray(supported)
			? supported.length === 2 && supported.every((v) => typeof v === "number" && Number.isInteger(v))
			: typeof supported === "number" && Number.isInteger(supported);
		if (!ok) {
			bag.error("MC-META-012", rel, "supported_formats must be an integer or a two-integer range", {
				hint: "Write \"supported_formats\": [48, 81] or a single number."
			});
		}
	}

	for (const { key, value } of numbers) {
		if (!versionTable.hasPackFormat(value)) {
			bag.warning("MC-META-006", rel, `${key} ${value} is not a known data pack format`, {
				hint: `Known numbers run ${versionTable.minFormat}–${versionTable.maxFormat}. Look yours up in reference/data/versions.json; a wrong number shows the pack as incompatible in the world creation screen.`
			});
		}
	}

	const overlays = mcmeta.overlays;
	if (overlays !== undefined) {
		if (overlays === null || typeof overlays !== "object" || !Array.isArray(overlays.entries)) {
			bag.error("MC-META-010", rel, "overlays must be an object with an entries array", {
				hint: "Use { \"overlays\": { \"entries\": [ { \"directory\": \"v1_21\" } ] } }."
			});
		} else {
			overlays.entries.forEach((entry, index) => {
				if (entry === null || typeof entry !== "object" || typeof entry.directory !== "string") {
					bag.error("MC-META-009", rel, `overlays.entries[${index}] has no "directory" string`, {
						hint: "Every overlay entry needs {\"directory\": \"<relative path>\"}."
					});
					return;
				}
				if (!/^[a-z0-9_-]+$/.test(entry.directory)) {
					bag.error("MC-META-009", rel, `overlay directory "${entry.directory}" uses characters the game will not resolve`, {
						hint: "Overlay directory names allow only a-z, 0-9, underscore and hyphen."
					});
				}
				if (!pack.inventory.dirs.includes(entry.directory)) {
					bag.warning("MC-META-016", rel, `overlay directory "${entry.directory}" does not exist in the pack`, {
						hint: "Create the directory or remove the entry."
					});
				}
			});
		}
	}

	const filter = mcmeta.filter;
	if (filter !== undefined) {
		if (filter === null || typeof filter !== "object" || !Array.isArray(filter.block)) {
			bag.error("MC-META-010", rel, "filter must be an object with a block array", {
				hint: "Use { \"filter\": { \"block\": [ { \"namespace\": \"^minecraft$\" } ] } }."
			});
		}
	}

	const features = mcmeta.features;
	if (features !== undefined) {
		if (features === null || typeof features !== "object" || !Array.isArray(features.enabled)) {
			bag.error("MC-META-010", rel, "features must be an object with an enabled array", {
				hint: "Use { \"features\": { \"enabled\": [\"minecraft:update_1_21\"] } }."
			});
		}
	}
}

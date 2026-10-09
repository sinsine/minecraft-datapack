#!/usr/bin/env node
/**
 * Minecraft datapack static validator.
 *
 * One run reports every problem in the pack, so an author fixes them in a single
 * batch instead of iterating inside the game. It never launches Minecraft and
 * needs no dependencies: plain Node (>= 18) and the JSON tables in reference/data.
 *
 * Usage:
 *   node validate.mjs <packDir> [--mc 1.21.8] [--json report.json] [--strict] [--quiet]
 *   node validate.mjs --self-test
 *
 * Exit codes: 0 clean (or warnings only), 1 errors (or warnings with --strict), 2 usage/internal failure.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { DiagnosticBag, SEVERITY } from "./lib/diagnostics.mjs";
import { walkPack, resolvePackRoot, readEntries, checkStructure, checkMeta } from "./lib/checks-core.mjs";
import { analyzeFunctions } from "./lib/checks-functions.mjs";
import { checkTags, checkRegistries } from "./lib/checks-registries.mjs";
import { checkReferences, checkObjectives } from "./lib/checks-refs.mjs";
import { loadVersionTable, createGates, targetLabel } from "./lib/versions.mjs";
import { scaffoldPack } from "./new-pack.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(HERE, "..", "reference", "data");
const FIXTURE_DIR = resolve(HERE, "..", "fixtures");

/** Read and parse a JSON table from reference/data. */
function loadData(name) {
	return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

/** Parse command-line arguments. */
function parseArgs(argv) {
	const options = { packDir: undefined, mc: undefined, json: undefined, strict: false, quiet: false, selfTest: false };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--self-test") options.selfTest = true;
		else if (arg === "--strict") options.strict = true;
		else if (arg === "--quiet") options.quiet = true;
		else if (arg === "--mc") options.mc = argv[++i];
		else if (arg === "--json") options.json = argv[++i];
		else if (arg === "--help" || arg === "-h") options.help = true;
		else if (arg.startsWith("-")) throw new Error(`unknown option "${arg}"`);
		else if (options.packDir === undefined) options.packDir = arg;
		else throw new Error(`unexpected argument "${arg}"`);
	}
	return options;
}

/** Every format number mentioned in pack.mcmeta, for target resolution. */
function collectDeclaredFormats(mcmeta) {
	const found = [];
	const packSection = mcmeta?.pack;
	if (packSection === null || typeof packSection !== "object") return found;
	// min_format/max_format are [major, minor] pairs, so only the major is a format
	// number. supported_formats is [low, high] — both are format numbers.
	const pushMajor = (value) => {
		if (typeof value === "number" && Number.isInteger(value)) found.push(value);
		else if (Array.isArray(value) && typeof value[0] === "number") found.push(Math.floor(value[0]));
	};
	for (const key of ["pack_format", "min_format", "max_format"]) {
		if (Object.hasOwn(packSection, key)) pushMajor(packSection[key]);
	}
	if (Object.hasOwn(packSection, "supported_formats")) {
		const value = packSection.supported_formats;
		if (typeof value === "number" && Number.isInteger(value)) found.push(value);
		else if (Array.isArray(value)) for (const item of value) if (typeof item === "number") found.push(Math.floor(item));
	}
	return found;
}

/**
 * Run every check over one pack directory.
 * @param {string} packDir - directory to validate.
 * @param {object} context - loaded tables and options.
 * @returns {{bag: DiagnosticBag, model: object, target: object, notes: string[]}} results.
 */
export function validatePack(packDir, context) {
	const bag = new DiagnosticBag();
	const notes = [];
	const { root, note } = resolvePackRoot(packDir);
	if (note !== undefined) notes.push(note);
	if (!existsSync(root)) {
		bag.error("MC-PACK-001", "<root>", `directory not found: ${root}`, { hint: "Pass the folder that contains pack.mcmeta." });
		return { bag, model: { root, entries: new Map(), inventory: { files: [], dirs: [] } }, target: {}, notes };
	}

	const inventory = walkPack(root);
	if (inventory.files.length === 0) {
		bag.error("MC-PACK-002", "<root>", "directory is empty", { hint: "Create pack.mcmeta and data/<namespace>/... or point at the right folder." });
	}
	const entries = readEntries(inventory, bag);
	const mcmetaEntry = entries.get("pack.mcmeta");
	const mcmeta = mcmetaEntry?.jsonOk ? mcmetaEntry.json : undefined;
	const namespaces = inventory.dirs.filter((dir) => /^data\/[^/]+$/.test(dir)).map((dir) => dir.split("/")[1]);
	const primaryNamespace = namespaces.find((name) => name !== "minecraft") ?? namespaces[0] ?? "mypack";
	const declaredFormats = collectDeclaredFormats(mcmeta);
	const target = context.versionTable.resolveTarget(context.options.mc, declaredFormats);
	const gates = createGates(context.versionTable, target);

	const model = {
		root,
		inventory,
		entries,
		mcmetaEntry,
		mcmeta,
		primaryNamespace,
		namespaces,
		registries: context.registries,
		versionTable: context.versionTable,
		target,
		gates
	};

	const run = (label, fn) => {
		try {
			fn();
		} catch (error) {
			bag.error("MC-INTERNAL-001", "<root>", `internal validator failure in ${label}: ${error instanceof Error ? error.message : String(error)}`, {
				hint: "This is a bug in the validator, not in the pack. Report it together with the pack path."
			});
		}
	};

	let facts = { refs: [], macros: new Set(), declaredObjectives: new Set(), usedObjectives: [], functions: [] };
	let tags = new Map();
	run("structure", () => checkStructure(model, bag, context.registries));
	run("meta", () => checkMeta(model, bag, context.versionTable));
	run("functions", () => {
		facts = analyzeFunctions(model, bag, context.commands, gates);
	});
	run("tags", () => {
		tags = checkTags(model, bag, context.registries);
	});
	run("registries", () => checkRegistries(model, bag, context.registries, gates));
	run("references", () => checkReferences(model, bag, facts, tags));
	run("objectives", () => checkObjectives(bag, facts));

	return { bag, model, target, notes };
}

/** Render the diagnostics as a readable report. */
function renderReport(result, options) {
	const { bag, model, target } = result;
	const lines = [];
	lines.push("minecraft-datapack validator");
	lines.push(`pack root: ${model.root}`);
	const label = targetLabel(target, model.versionTable);
	const format = target.packFormat === undefined ? "" : ` (data pack format ${target.packFormat})`;
	lines.push(`target: Minecraft ${label}${format}  [${target.source}]`);
	if (target.version !== undefined && target.versionTo !== undefined && target.versionTo !== target.version) {
		lines.push(`note: format ${target.packFormat} covers ${target.version} through ${target.versionTo}; the pack is written for the whole range.`);
	}
	for (const note of result.notes) lines.push(`note: ${note}`);

	const sorted = bag.sorted();
	const sections = [
		["error", "ERRORS"],
		["warning", "WARNINGS"],
		["info", "INFO"]
	];
	for (const [severity, title] of sections) {
		const items = sorted.filter((item) => item.severity === severity);
		if (items.length === 0) continue;
		if (severity === "info" && options.quiet) continue;
		lines.push("");
		lines.push(`${title} (${items.length})`);
		for (const item of items) {
			const position = item.line > 0 ? `${item.file}:${item.line}${item.col > 0 ? `:${item.col}` : ""}` : item.file;
			lines.push(`  ${position}  ${item.code}  ${item.message}`);
			if (item.excerpt !== "") lines.push(`      > ${item.excerpt}`);
			if (item.hint !== "") lines.push(`      fix: ${item.hint}`);
		}
	}

	const counts = bag.counts;
	lines.push("");
	if (counts.total === 0) {
		lines.push("summary: no problems found. Static checks passed.");
		lines.push("note: static checks cannot prove in-game behaviour. Load the pack, run /reload, then /datapack list.");
	} else {
		lines.push(`summary: ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info across ${model.inventory.files.length} file(s)`);
	}
	return lines.join("\n");
}

/** Build the machine-readable report object. */
function buildJsonReport(result) {
	return {
		packRoot: result.model.root,
		target: result.target,
		counts: result.bag.counts,
		diagnostics: result.bag.sorted()
	};
}

/** Compare a fixture's diagnostics against its expected.json. */
function checkFixture(name) {
	const dir = join(FIXTURE_DIR, name);
	const expectedPath = join(FIXTURE_DIR, `${name}.expected.json`);
	const versionTable = loadVersionTable(join(DATA_DIR, "versions.json"));
	const context = { versionTable, commands: loadData("commands.json"), registries: loadData("registries.json"), options: {} };
	const result = validatePack(dir, context);
	const actual = {};
	for (const item of result.bag.items) actual[item.code] = (actual[item.code] ?? 0) + 1;
	const expected = existsSync(expectedPath) ? (JSON.parse(readFileSync(expectedPath, "utf8")).codes ?? {}) : {};
	const problems = [];
	for (const [code, count] of Object.entries(expected)) {
		if ((actual[code] ?? 0) !== count) problems.push(`expected ${count}x ${code}, saw ${actual[code] ?? 0}`);
	}
	for (const [code, count] of Object.entries(actual)) {
		if (expected[code] === undefined) problems.push(`unexpected ${count}x ${code}`);
	}
	return { name, problems, counts: result.bag.counts };
}

/** Run every fixture and report whether the validator behaves as specified. */
function runSelfTest() {
	if (!existsSync(FIXTURE_DIR)) {
		process.stderr.write(`no fixtures directory at ${FIXTURE_DIR}\n`);
		return 2;
	}
	const names = readdirSync(FIXTURE_DIR).filter((entry) => statSync(join(FIXTURE_DIR, entry)).isDirectory());
	let failed = 0;
	for (const name of names.sort()) {
		const outcome = checkFixture(name);
		const status = outcome.problems.length === 0 ? "ok  " : "FAIL";
		const counts = outcome.counts;
		process.stdout.write(`${status} ${name} — ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info\n`);
		for (const problem of outcome.problems) process.stdout.write(`       ${problem}\n`);
		if (outcome.problems.length > 0) failed += 1;
	}

	// The scaffolder writes the version fields and the era's folder names for the
	// author, so its output must always validate clean on both sides of the 1.21 split.
	const examplesDir = resolve(HERE, "..", "examples");
	const scaffoldTargets = ["1.20.4", "1.21.8", "26.3"];
	const scratch = mkdtempSync(join(tmpdir(), "mcdp-selftest-"));
	try {
		for (const mc of scaffoldTargets) {
			const dir = join(scratch, mc);
			try {
				scaffoldPack({ dir, namespace: `scaffold_${mc.replace(/[^a-z0-9]/gi, "_")}`, mc, description: "self-test scaffold" });
				const versionTable = loadVersionTable(join(DATA_DIR, "versions.json"));
				const context = { versionTable, commands: loadData("commands.json"), registries: loadData("registries.json"), options: {} };
				const result = validatePack(dir, context);
				const counts = result.bag.counts;
				const status = counts.error === 0 && counts.warning === 0 ? "ok  " : "FAIL";
				process.stdout.write(`${status} scaffold ${mc} — ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info\n`);
				for (const item of result.bag.sorted()) {
					process.stdout.write(`       ${item.code} ${item.file}:${item.line} ${item.message}\n`);
				}
				if (counts.error > 0 || counts.warning > 0) failed += 1;
			} catch (error) {
				process.stdout.write(`FAIL scaffold ${mc} threw: ${error instanceof Error ? error.message : String(error)}\n`);
				failed += 1;
			}
		}
	} finally {
		rmSync(scratch, { recursive: true, force: true });
	}

	let exampleCount = 0;
	if (existsSync(examplesDir)) {
		const versionTable = loadVersionTable(join(DATA_DIR, "versions.json"));
		const context = { versionTable, commands: loadData("commands.json"), registries: loadData("registries.json"), options: {} };
		for (const name of readdirSync(examplesDir).sort()) {
			const dir = join(examplesDir, name);
			if (!statSync(dir).isDirectory()) continue;
			exampleCount += 1;
			const result = validatePack(dir, context);
			const counts = result.bag.counts;
			const status = counts.error === 0 ? "ok  " : "FAIL";
			process.stdout.write(`${status} examples/${name} — ${counts.error} error(s), ${counts.warning} warning(s), ${counts.info} info\n`);
			for (const item of result.bag.sorted()) {
				if (item.severity !== "error") continue;
				process.stdout.write(`       ${item.code} ${item.file}:${item.line} ${item.message}\n`);
			}
			if (counts.error > 0) failed += 1;
		}
	}

	const total = names.length + scaffoldTargets.length + exampleCount;
	process.stdout.write(failed === 0 ? `\nself-test passed (${total} packs)\n` : `\nself-test FAILED (${failed} of ${total} packs)\n`);
	return failed === 0 ? 0 : 1;
}

function main() {
	let options;
	try {
		options = parseArgs(process.argv.slice(2));
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 2;
	}
	if (options.help) {
		process.stdout.write("usage: node validate.mjs <packDir> [--mc <version>] [--json <report>] [--strict] [--quiet]\n       node validate.mjs --self-test\n");
		return 0;
	}
	if (options.selfTest) return runSelfTest();
	if (options.packDir === undefined) {
		process.stderr.write("usage: node validate.mjs <packDir> [--mc <version>] [--json <report>] [--strict] [--quiet]\n");
		return 2;
	}

	const versionTable = loadVersionTable(join(DATA_DIR, "versions.json"));
	const context = { versionTable, commands: loadData("commands.json"), registries: loadData("registries.json"), options };
	const result = validatePack(options.packDir, context);
	process.stdout.write(`${renderReport(result, options)}\n`);
	if (options.json !== undefined) {
		writeFileSync(options.json, `${JSON.stringify(buildJsonReport(result), null, 2)}\n`, "utf8");
		process.stdout.write(`\nreport written to ${options.json}\n`);
	}
	const counts = result.bag.counts;
	if (counts.error > 0) return 1;
	if (options.strict && counts.warning > 0) return 1;
	return 0;
}

process.exitCode = main();

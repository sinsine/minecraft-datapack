#!/usr/bin/env node
/**
 * Scaffold a datapack that is already correct for its target version.
 *
 * The two things an author most often gets wrong are both mechanical: which
 * number goes in pack.mcmeta, and whether the registry folders are plural
 * (`functions/`, up to 1.20.6) or singular (`function/`, from 1.21). Both are
 * decided here from reference/data/versions.json, so a new pack starts correct
 * and the validator has nothing to say about its skeleton.
 *
 * Usage:
 *   node new-pack.mjs <directory> --namespace <name> [--mc <version>] [--description "..."] [--force]
 *
 * Exit codes: 0 written, 1 refused (exists without --force), 2 usage/data error.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(HERE, "..", "reference", "data");
const NAMESPACE_PATTERN = /^[a-z0-9_.-]+$/;

// The plural→singular folder rename shipped in 1.21, which is data pack format 48.
const RENAME_FORMAT = 48;

/** Load the generated version table. */
function loadVersions() {
	return JSON.parse(readFileSync(join(DATA_DIR, "versions.json"), "utf8"));
}

/**
 * Work out every version-dependent choice for a target release.
 * @param {object} versions - parsed versions.json.
 * @param {string|undefined} mcVersion - requested release, or undefined for the latest.
 * @returns {{version: string, format: number, minor: number, source: string}} target description.
 */
function resolveTarget(versions, mcVersion) {
	if (mcVersion === undefined) {
		const latest = versions.latest_release;
		const group = versions.formatGroups.find((entry) => entry.pack_format === latest.pack_format);
		return { version: latest.version, format: latest.pack_format, minor: group?.minor ?? 0, source: "latest release" };
	}
	const format = versions.versionToFormat[mcVersion];
	if (format === undefined) {
		throw new Error(`unknown Minecraft version "${mcVersion}"; known releases: ${Object.keys(versions.versionToFormat).join(", ")}`);
	}
	const group = versions.formatGroups.find((entry) => entry.pack_format === format);
	return { version: mcVersion, format, minor: group?.minor ?? 0, source: "--mc" };
}

/**
 * Build the pack.mcmeta content for a target.
 * @param {object} versions - parsed versions.json.
 * @param {object} target - resolved target.
 * @param {string} description - pack description.
 * @returns {string} file contents.
 */
function packMcmeta(versions, target, description) {
	const { modernMin } = versions.era;
	const pack = { description };
	if (target.format >= modernMin) {
		pack.min_format = [target.format, target.minor];
		pack.max_format = [target.format, target.minor];
	} else {
		pack.pack_format = target.format;
	}
	// Field order is cosmetic, but description-first matches every wiki example.
	const ordered = {};
	for (const key of ["description", "pack_format", "min_format", "max_format"]) {
		if (Object.hasOwn(pack, key)) ordered[key] = pack[key];
	}
	return `${JSON.stringify({ pack: ordered }, null, 2)}\n`;
}

/**
 * Write a minimal, era-correct pack.
 * @param {object} options - scaffold options.
 * @param {string} options.dir - destination directory.
 * @param {string} options.namespace - pack namespace.
 * @param {string} [options.mc] - target release.
 * @param {string} [options.description] - pack description.
 * @param {boolean} [options.force] - overwrite existing files.
 * @returns {{target: object, files: string[], functionDir: string}} what was written.
 */
export function scaffoldPack(options) {
	const { dir, namespace, mc, description = "REPLACE: what this pack does", force = false } = options;
	if (!NAMESPACE_PATTERN.test(namespace)) {
		throw new Error(`invalid namespace "${namespace}": use lowercase a-z, 0-9, underscore, dot and hyphen`);
	}
	const versions = loadVersions();
	const target = resolveTarget(versions, mc);
	const plural = target.format < RENAME_FORMAT;
	const functionDir = plural ? "functions" : "function";
	const tagDir = plural ? "functions" : "function";
	const root = resolve(dir);

	const files = new Map();
	files.set("pack.mcmeta", packMcmeta(versions, target, description));
	files.set(
		`data/${namespace}/${functionDir}/load.mcfunction`,
		`# Runs once when the world loads.\n# Declare shared state here: objectives, storage defaults, tags.\nscoreboard objectives add ${namespace}.state dummy\n`
	);
	files.set(
		`data/${namespace}/${functionDir}/tick.mcfunction`,
		`# Runs every tick. Keep it cheap: select the few entities you need, then act.\nexecute as @a[tag=!${namespace}.ready] run function ${namespace}:on_join\n`
	);
	files.set(
		`data/${namespace}/${functionDir}/on_join.mcfunction`,
		`# Runs for each player once, the first time they are seen.\ntag @s add ${namespace}.ready\ntellraw @s {"text":"Welcome!","color":"gold"}\n`
	);
	files.set(`data/minecraft/tags/${tagDir}/load.json`, `{ "values": ["${namespace}:load"] }\n`);
	files.set(`data/minecraft/tags/${tagDir}/tick.json`, `{ "values": ["${namespace}:tick"] }\n`);

	for (const [rel, content] of files) {
		const full = join(root, rel);
		if (!force && existsSync(full)) {
			throw new Error(`${full} already exists; pass --force to overwrite`);
		}
		mkdirSync(dirname(full), { recursive: true });
		writeFileSync(full, content, "utf8");
	}
	return { target, files: [...files.keys()], functionDir };
}

/** Parse command-line arguments. */
function parseArgs(argv) {
	const options = { dir: undefined, namespace: undefined, mc: undefined, description: undefined, force: false, help: false };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--force") options.force = true;
		else if (arg === "--help" || arg === "-h") options.help = true;
		else if (arg === "--namespace") options.namespace = argv[++i];
		else if (arg === "--mc") options.mc = argv[++i];
		else if (arg === "--description") options.description = argv[++i];
		else if (arg.startsWith("-")) throw new Error(`unknown option "${arg}"`);
		else if (options.dir === undefined) options.dir = arg;
		else throw new Error(`unexpected argument "${arg}"`);
	}
	return options;
}

function main() {
	let options;
	try {
		options = parseArgs(process.argv.slice(2));
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 2;
	}
	if (options.help || options.dir === undefined || options.namespace === undefined) {
		process.stdout.write("usage: node new-pack.mjs <directory> --namespace <name> [--mc <version>] [--description \"...\"] [--force]\n");
		return options.help ? 0 : 2;
	}
	try {
		const result = scaffoldPack(options);
		process.stdout.write(`created ${result.files.length} files in ${resolve(options.dir)}\n`);
		process.stdout.write(`target: Minecraft ${result.target.version} (data pack format ${result.target.format}, ${result.target.source})\n`);
		process.stdout.write(`function directory: ${result.functionDir}/\n`);
		for (const rel of result.files) process.stdout.write(`  ${rel}\n`);
		process.stdout.write(`\nnext: node "${join(HERE, "validate.mjs")}" "${resolve(options.dir)}"\n`);
		return 0;
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		return 2;
	}
}

const invokedDirectly = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exitCode = main();

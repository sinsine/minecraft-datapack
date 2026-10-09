/**
 * Version table lookups shared by the validator and the CLI.
 *
 * The numbers come from reference/data/versions.json, which is generated from
 * wiki research by scripts/tools/build-versions.mjs. Nothing here hard-codes a
 * release number, so refreshing the table refreshes every check.
 */

import { readFileSync } from "node:fs";

/**
 * Wrap the generated version table in the lookups the checks need.
 * @param {object} raw - parsed reference/data/versions.json.
 * @returns {object} table with format/version lookups, era bounds, and gate helpers.
 */
export function createVersionTable(raw) {
	const known = new Set(raw.knownFormats ?? []);
	const byVersion = raw.versionToFormat ?? {};
	const dataVersions = raw.versionToDataVersion ?? {};
	const groups = raw.formatGroups ?? [];
	const era = raw.era ?? { legacyThroughVersion: "1.21.8", legacyMax: 81, modernFromVersion: "1.21.9", modernMin: 82 };

	const groupFor = (format) => groups.find((group) => group.pack_format === format);

	return {
		raw,
		era,
		minFormat: raw.knownFormats?.[0],
		maxFormat: raw.knownFormats?.at(-1),
		latest: raw.latest_release?.version,
		latestFormat: raw.latest_release?.pack_format,

		/** @returns {boolean} whether `format` is a data pack format that has ever existed. */
		hasPackFormat(format) {
			return known.has(Math.floor(format));
		},

		/** @returns {string} human label for a format number, e.g. "1.21.7–1.21.8". */
		labelForFormat(format) {
			const group = groupFor(Math.floor(format));
			if (group === undefined) return `format ${format}`;
			return group.from === group.to ? group.from : `${group.from}–${group.to}`;
		},

		/** @returns {number|undefined} major data pack format for a release version like "1.20.5". */
		formatForVersion(version) {
			const exact = byVersion[version];
			if (exact !== undefined) return exact;
			const prefix = String(version).match(/^(\d+\.\d+)/)?.[1];
			if (prefix !== undefined) {
				for (const [key, value] of Object.entries(byVersion)) {
					if (key === prefix || key.startsWith(`${prefix}.`)) return value;
				}
			}
			return undefined;
		},

		/** @returns {number|undefined} NBT DataVersion for a release version. */
		dataVersionFor(version) {
			return dataVersions[version];
		},

		/**
		 * Find the release range that owns a format number.
		 * @param {number} format - data pack format.
		 * @returns {{from: string, to: string, display: string}|undefined} the range.
		 */
		rangeForFormat(format) {
			const group = groupFor(Math.floor(format));
			if (group === undefined) return undefined;
			return { from: group.from, to: group.to, display: group.display };
		},

		/**
		 * Decide which Minecraft version a pack is being written for.
		 *
		 * When the author passes --mc that wins. Otherwise the pack's own declared
		 * fields are used, and the *lowest* declared format wins, because a feature
		 * must exist in the oldest version the pack claims to support.
		 * @param {string|undefined} explicitVersion - `--mc` value.
		 * @param {number[]} declaredFormats - every format number found in pack.mcmeta.
		 * @returns {{version: string|undefined, packFormat: number|undefined, source: string}} resolved target.
		 */
		resolveTarget(explicitVersion, declaredFormats) {
			if (explicitVersion !== undefined) {
				const format = this.formatForVersion(explicitVersion);
				return { version: explicitVersion, versionTo: explicitVersion, packFormat: format, source: "--mc" };
			}
			const usable = declaredFormats.filter((value) => Number.isInteger(value));
			if (usable.length > 0) {
				const lowest = Math.min(...usable);
				const range = this.rangeForFormat(lowest);
				return { version: range?.from, versionTo: range?.to, packFormat: lowest, source: "pack.mcmeta" };
			}
			const latest = raw.latest_release;
			const range = latest === undefined ? undefined : this.rangeForFormat(latest.pack_format);
			return {
				version: latest?.version,
				versionTo: range?.to ?? latest?.version,
				packFormat: latest?.pack_format,
				source: "latest release fallback"
			};
		}
	};
}

/**
 * Load the generated version table from disk.
 * @param {string} path - absolute path to versions.json.
 * @returns {object} version table.
 */
export function loadVersionTable(path) {
	return createVersionTable(JSON.parse(readFileSync(path, "utf8")));
}

/**
 * Name a resolved target for a human. One format number can cover several
 * releases (format 81 is 1.21.7 and 1.21.8), so a range is reported as a range
 * rather than pretending the pack targets the first release in it.
 * @param {{version: string|undefined, versionTo: string|undefined, packFormat: number|undefined}} target - resolved target.
 * @param {object} table - version table, for a fallback label.
 * @returns {string} label such as "1.21.7–1.21.8" or "an unknown Minecraft version".
 */
export function targetLabel(target, table) {
	if (target.version === undefined) {
		if (target.packFormat === undefined || table === undefined) return "an unknown Minecraft version";
		return table.labelForFormat(target.packFormat);
	}
	if (target.versionTo !== undefined && target.versionTo !== target.version) return `${target.version}–${target.versionTo}`;
	return target.version;
}

/**
 * Build the object the checks use to ask "does this feature exist in the target?".
 * @param {object} table - version table from `createVersionTable`.
 * @param {{version: string|undefined, versionTo: string|undefined, packFormat: number|undefined}} target - resolved target.
 * @returns {{isActive: (minVersion: string|undefined) => boolean, describeVersion: () => string, target: object}} gate helpers.
 */
export function createGates(table, target) {
	return {
		target,
		/**
		 * @param {string|undefined} minVersion - release a feature needs.
		 * @returns {boolean} true when the target is new enough, or when either side is unknown.
		 */
		isActive(minVersion) {
			if (minVersion === undefined) return true;
			if (target.packFormat === undefined) return true;
			const needed = table.formatForVersion(minVersion);
			if (needed === undefined) return true;
			return target.packFormat >= needed;
		},
		/** @returns {string} how to name the target in a diagnostic. */
		describeVersion() {
			const label = targetLabel(target, table);
			return target.packFormat === undefined ? `Minecraft ${label}` : `Minecraft ${label} (format ${target.packFormat})`;
		}
	};
}

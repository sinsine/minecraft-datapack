/**
 * Diagnostic collection for the Minecraft datapack validator.
 *
 * Design rule: a run NEVER stops at the first problem. Every check appends to
 * the bag and returns, so one invocation reports every error in the pack. The
 * whole point of this skill is that the author runs this once and fixes
 * everything in a single batch.
 */

/** Severity ordering; lower sorts first. */
export const SEVERITY = Object.freeze({
	error: 0,
	warning: 1,
	info: 2
});

/** Human labels used by the text reporter. */
export const SEVERITY_LABEL = Object.freeze({
	error: "ERROR",
	warning: "WARN ",
	info: "INFO "
});

/**
 * Convert a 0-based character index into 1-based line/column.
 * @param {string} text - full file text.
 * @param {number} index - 0-based character offset.
 * @returns {{line: number, col: number}} 1-based position.
 */
export function lineColAt(text, index) {
	if (!Number.isFinite(index) || index < 0) return { line: 1, col: 1 };
	let line = 1;
	let lineStart = 0;
	const limit = Math.min(index, text.length);
	for (let i = 0; i < limit; i += 1) {
		if (text.charCodeAt(i) === 10) {
			line += 1;
			lineStart = i + 1;
		}
	}
	return { line, col: limit - lineStart + 1 };
}

/** Return the single line of text containing `line` (1-based), trimmed for display. */
export function excerptAt(text, line, maxLength = 120) {
	const lines = text.split(/\r?\n/);
	const raw = lines[line - 1];
	if (raw === undefined) return "";
	const trimmed = raw.trim();
	return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}…` : trimmed;
}

/**
 * Accumulates diagnostics and hands back a stable, sorted list.
 */
export class DiagnosticBag {
	constructor() {
		/** @type {Array<object>} */
		this.items = [];
	}

	/**
	 * Record one diagnostic.
	 * @param {object} entry - diagnostic fields.
	 * @param {string} entry.code - stable code, e.g. `MC-STRUCT-003`.
	 * @param {"error"|"warning"|"info"} entry.severity - severity bucket.
	 * @param {string} entry.file - pack-relative path, or `<root>` for pack-wide.
	 * @param {number} [entry.line] - 1-based line, when the issue is positional.
	 * @param {number} [entry.col] - 1-based column.
	 * @param {string} entry.message - what is wrong.
	 * @param {string} [entry.hint] - exactly how to fix it.
	 * @param {string} [entry.excerpt] - offending source text.
	 * @returns {void}
	 */
	add(entry) {
		this.items.push({
			code: entry.code,
			severity: entry.severity,
			file: entry.file,
			line: entry.line ?? 0,
			col: entry.col ?? 0,
			message: entry.message,
			hint: entry.hint ?? "",
			excerpt: entry.excerpt ?? ""
		});
	}

	error(code, file, message, extra = {}) {
		this.add({ code, severity: "error", file, message, ...extra });
	}

	warning(code, file, message, extra = {}) {
		this.add({ code, severity: "warning", file, message, ...extra });
	}

	info(code, file, message, extra = {}) {
		this.add({ code, severity: "info", file, message, ...extra });
	}

	/** @returns {{error: number, warning: number, info: number, total: number}} */
	get counts() {
		const counts = { error: 0, warning: 0, info: 0, total: this.items.length };
		for (const item of this.items) counts[item.severity] += 1;
		return counts;
	}

	/**
	 * Stable presentation order: file, then line, then severity, then code.
	 * @returns {Array<object>} sorted copy.
	 */
	sorted() {
		return [...this.items].sort((a, b) => {
			if (a.file !== b.file) return a.file < b.file ? -1 : 1;
			if (a.line !== b.line) return a.line - b.line;
			if (a.col !== b.col) return a.col - b.col;
			if (a.severity !== b.severity) return SEVERITY[a.severity] - SEVERITY[b.severity];
			return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
		});
	}
}

/**
 * Levenshtein distance, capped for speed. Used for "did you mean" hints, which
 * are the single highest-value part of a diagnostic: they turn a report into an
 * instruction the author can apply without thinking.
 * @param {string} a - first string.
 * @param {string} b - second string.
 * @returns {number} edit distance.
 */
export function editDistance(a, b) {
	if (a === b) return 0;
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	let current = new Array(b.length + 1).fill(0);
	for (let i = 1; i <= a.length; i += 1) {
		current[0] = i;
		for (let j = 1; j <= b.length; j += 1) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
		}
		const swap = previous;
		previous = current;
		current = swap;
	}
	return previous[b.length];
}

/**
 * Find the closest candidate to `value`, when it is close enough to be a typo.
 * @param {string} value - the written token.
 * @param {Iterable<string>} candidates - known-good names.
 * @param {number} [maxDistance] - distance ceiling; scaled by length when defaulted.
 * @returns {string|undefined} the suggested replacement.
 */
export function closestMatch(value, candidates, maxDistance) {
	const limit = maxDistance ?? (value.length <= 4 ? 1 : value.length <= 12 ? 2 : 3);
	let best;
	let bestDistance = Number.POSITIVE_INFINITY;
	for (const candidate of candidates) {
		const distance = editDistance(value, candidate);
		if (distance < bestDistance) {
			bestDistance = distance;
			best = candidate;
		}
	}
	return bestDistance <= limit ? best : undefined;
}

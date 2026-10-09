/**
 * JSON ingestion with causes, not symptoms.
 *
 * `JSON.parse` reports "Unexpected token } in JSON at position 812", which tells
 * an author nothing about the trailing comma they actually wrote. Datapack JSON
 * fails in a small, well-known set of ways, so this module scans the raw text
 * first and names the likely mistake with a line and column. Only when the text
 * is clean but still invalid does it fall back to the raw parse error.
 */

import { lineColAt, excerptAt } from "./diagnostics.mjs";

/** Characters that appear when text was written in a word processor or an IME. */
const SMART_QUOTES = new Map([
	["\u201c", "\""],
	["\u201d", "\""],
	["\u2018", "'"],
	["\u2019", "'"],
	["\uff02", "\""],
	["\uff07", "'"]
]);

/** Characters that must not appear literally inside a JSON string. */
function isRawControl(char) {
	const code = char.charCodeAt(0);
	return code < 0x20;
}

/**
 * Walk JSON-looking text and report the well-known authoring mistakes.
 * @param {string} text - raw file content.
 * @returns {Array<{code: string, message: string, hint: string, index: number}>} findings in source order.
 */
export function scanJsonText(text) {
	const found = [];
	const length = text.length;
	if (text.charCodeAt(0) === 0xfeff) {
		found.push({
			code: "MC-JSON-004",
			message: "file starts with a UTF-8 byte-order mark, which the game's parser rejects",
			hint: "Save the file as UTF-8 without BOM.",
			index: 0
		});
	}
	let inString = false;
	let stringStart = -1;
	for (let i = 0; i < length; i += 1) {
		const char = text[i];
		if (inString) {
			if (char === "\\") {
				const next = text[i + 1];
				if (next === undefined) {
					found.push({
						code: "MC-JSON-007",
						message: "string ends with a dangling backslash",
						hint: "Escape it as \\\\ or remove it.",
						index: i
					});
					break;
				}
				const valid = "\"\\/bfnrtu".includes(next);
				if (!valid) {
					found.push({
						code: "MC-JSON-006",
						message: `invalid escape sequence "\\${next}" inside a string`,
						hint: "JSON only allows \\\" \\\\ \\/ \\b \\f \\n \\r \\t \\uXXXX. In regexes and NBT paths, double the backslash: \\\\.",
						index: i
					});
				}
				i += 1;
				continue;
			}
			if (char === "\"") {
				inString = false;
				continue;
			}
			if (SMART_QUOTES.has(char)) {
				found.push({
					code: "MC-JSON-005",
					message: `full-width or curly quote ${JSON.stringify(char)} inside a string`,
					hint: `Replace it with the plain ASCII character ${JSON.stringify(SMART_QUOTES.get(char))}.`,
					index: i
				});
				continue;
			}
			if (isRawControl(char) && char !== "\t") {
				found.push({
					code: "MC-JSON-008",
					message: "raw control character inside a string",
					hint: "Escape it (\\n, \\t, \\u0000-style), or remove it.",
					index: i
				});
			}
			continue;
		}
		if (SMART_QUOTES.has(char)) {
			found.push({
				code: "MC-JSON-005",
				message: `full-width or curly quote ${JSON.stringify(char)} used where JSON expects a plain quote`,
				hint: `Replace it with ${JSON.stringify(SMART_QUOTES.get(char))}.`,
				index: i
			});
			continue;
		}
		if (char === "\"") {
			inString = true;
			stringStart = i;
			continue;
		}
		if (char === "/" && text[i + 1] === "/") {
			found.push({
				code: "MC-JSON-002",
				message: "// comment, which JSON does not allow",
				hint: "Delete the comment. JSON has no comments; put notes in a separate .md file.",
				index: i
			});
			while (i < length && text[i] !== "\n") i += 1;
			continue;
		}
		if (char === "/" && text[i + 1] === "*") {
			found.push({
				code: "MC-JSON-002",
				message: "/* */ comment, which JSON does not allow",
				hint: "Delete the comment. JSON has no comments.",
				index: i
			});
			const end = text.indexOf("*/", i + 2);
			i = end === -1 ? length : end + 1;
			continue;
		}
		if (char === "'") {
			found.push({
				code: "MC-JSON-003",
				message: "single-quoted string, which JSON does not allow",
				hint: "JSON strings use double quotes only.",
				index: i
			});
			continue;
		}
		if (char === ",") {
			let j = i + 1;
			while (j < length && /\s/.test(text[j])) j += 1;
			const next = text[j];
			if (next === "}" || next === "]") {
				found.push({
					code: "MC-JSON-001",
					message: `trailing comma before "${next}"`,
					hint: "Delete the comma; JSON forbids a comma after the last element.",
					index: i
				});
			}
			continue;
		}
	}
	if (inString && stringStart !== -1) {
		found.push({
			code: "MC-JSON-011",
			message: "string is never closed before end of file",
			hint: "Add the missing closing double quote.",
			index: stringStart
		});
	}
	return found;
}

/**
 * Parse JSON text, reporting every authoring mistake found plus the raw parser
 * error when the text still does not parse.
 * @param {string} text - raw file content.
 * @param {string} rel - pack-relative path used in diagnostics.
 * @param {import("./diagnostics.mjs").DiagnosticBag} bag - sink for diagnostics.
 * @returns {unknown|undefined} parsed value, or undefined when invalid.
 */
export function parseJsonText(text, rel, bag) {
	const findings = scanJsonText(text);
	for (const finding of findings) {
		const { line, col } = lineColAt(text, finding.index);
		bag.error(finding.code, rel, finding.message, {
			line,
			col,
			hint: finding.hint,
			excerpt: excerptAt(text, line)
		});
	}
	try {
		return JSON.parse(text);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (findings.length === 0) {
			const position = /position (\d+)/.exec(message);
			const index = position ? Number(position[1]) : 0;
			const { line, col } = lineColAt(text, index);
			bag.error("MC-JSON-012", rel, `invalid JSON: ${message}`, {
				line,
				col,
				hint: "Check brackets, commas and quotes at the reported position.",
				excerpt: excerptAt(text, line)
			});
		}
		return undefined;
	}
}

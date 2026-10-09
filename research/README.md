# research/ — build-time provenance

This directory is **not part of the skill**. It is the evidence the skill's data
tables were derived from, kept so the tables can be re-derived and audited
instead of trusted.

| File | What it is |
|---|---|
| `pack-formats.json` / `pack-formats.md` | Every Java release 1.13–26.3 mapped to its data pack format and NBT DataVersion, plus the `pack.mcmeta` era rules. Cross-checked between the Chinese and English wiki module pages. |
| `datapack-folder-renames.md` | The 1.21 plural→singular registry folder rename (split across 24w19a and 24w21a), the two 26.3 worldgen renames, and the release that introduced each modern registry directory. |
| `mcfunction-reference.md` | Command and function grammar copied verbatim from the wiki, with a version-gated difference table, a grammar wall for copy-paste, and an uncertainties section. |
| `mcfunction-gotchas.md` | WRONG/RIGHT traps collected by category, including a "looks wrong but is not" section and a list of things the wiki does not state. |

The intermediate extraction output (`_parts/`, a scratch generator script) is not
published here. Only what can be re-read and audited is.

## What consumes it

- `../.dsh/skills/minecraft-datapack/scripts/tools/build-versions.mjs` reads
  `pack-formats.json` and regenerates
  `../.dsh/skills/minecraft-datapack/reference/data/versions.json`.
- The other three fed `reference/version-gates.md`, `reference/pitfalls.md` and
  `reference/functions.md` by hand. Their uncertainties sections were carried
  over into the reference files rather than dropped.

## Known limits

Each file ends with its own uncertainties list. The ones that matter most:

- April Fools versions come from a single wiki module, so they are not
  independently corroborated.
- One snapshot DataVersion (`1.21.9-pre1`: 4549 vs 4548) disagrees between the two
  wikis. No release is affected.
- The wiki does not state every pre-1.21 nuance (for example the exact argument
  order of `attribute ... modifier add` before `uuid`/`name` became `id`), and
  those rows are marked as unverified rather than filled in.

When a table and the wiki disagree, the wiki wins: update the table.

---
name: minecraft-datapack
description: Write Minecraft Java Edition datapacks — functions, tags, recipes, advancements, loot tables, predicates, pack.mcmeta — that load and behave correctly on the first try. Use when asked to create or change a datapack, write .mcfunction files, add a recipe/advancement/loot table/tag, or fix a pack that loads but does nothing. Java Edition only; Bedrock behavior packs are not covered.
whenToUse: Use for any Minecraft Java datapack authoring or repair task, including a single function file, a pack.mcmeta format number, or a pack that silently does nothing in game.
---

# Authoring Minecraft datapacks

Your job is a datapack the game loads and runs on the first attempt. The enemy is
trial and error: every mistake found inside the game costs a launch, a world
load, and one error at a time. So the whole method is **look it up, write it once,
verify statically once**.

## The budget

These are limits, not aspirations.

| Limit | Why |
|---|---|
| **Zero** Minecraft launches | You cannot run the game here. The user runs it, once, at the end. |
| **At most 2** validator runs | One after writing, one after a batch fix. If you need a third, stop and report what is still failing. |
| **Zero** throwaway scripts to "test a snippet" | The validator already parses the snippets. A scratch script is a second, worse validator. |
| **Zero** invented syntax, ids, or version numbers | Everything comes from `reference/` or the wiki. |

If you catch yourself guessing — a command name, an item id, a `pack_format`
number, whether a feature existed then — stop and look it up. A guess feels free
and costs a rewrite.

## Phase 0 — Decide, once

Answer all four before writing a file. Changing them halfway invalidates work.

1. **Target Minecraft version.** Read `pack.mcmeta` if the pack exists. Otherwise
   ask, or default to the latest release in
   `reference/data/versions.json` → `latest_release`, and say so. This decides the
   format number and, on the 1.21 boundary, the folder names.
2. **Namespace.** Lowercase `a-z0-9_.-`, e.g. `mypack`. Used in folder names and
   in every id.
3. **What the pack does**, in one sentence per feature.
4. **The file list.** Namespace, functions, tags, and registry files. Write it
   down before creating anything; this is what `/reload` will load.

## Phase 1 — Read only what you need

The reference files are deliberately separate. Read the rows that match the task
in [reference/00-index.md](reference/00-index.md) and stop:

- always: `00-index.md` → the `structure.md` section you need
- any `.mcfunction`: [reference/functions.md](reference/functions.md)
- any registry JSON: [reference/registries.md](reference/registries.md)
- before writing syntax you are not certain about:
  [reference/version-gates.md](reference/version-gates.md)
- before the pre-flight review: [reference/pitfalls.md](reference/pitfalls.md)

Three machine-readable tables exist so you can look up a fact instead of
recalling it: `reference/data/versions.json` (version ↔ pack format),
`reference/data/commands.json` (does this command exist, since when),
`reference/data/registries.json` (is this a registry directory, what keys are
required).

## Phase 2 — Write the tree

For a **new pack**, start with the scaffolder. It writes `pack.mcmeta` with the
right format fields for the target, the load/tick entry points, and the folder
names that match that version's era — the three things most often gotten wrong:

```powershell
node "<skill base directory>/scripts/new-pack.mjs" "<pack folder>" --namespace mypack --mc 1.21.8
```

Omit `--mc` to target the newest release. It never overwrites without `--force`.

For an **existing pack**, or beyond the skeleton, copy shapes from `templates/`
rather than composing from scratch — they are already in the era-correct form. In
this order, because each step depends on the previous one:

1. `pack.mcmeta` — the format number from `versions.json`, nothing from memory.
2. `data/minecraft/tags/function/load.json` and `tick.json` — the entry points.
   These two files must be in the `minecraft` namespace or nothing runs.
3. The functions those tags name, then everything they reference.
4. Registry JSON: recipes, advancements, loot tables, predicates, tags.
5. A `README.md` in the pack only if the user asked; it does not load.

Write complete files. A placeholder like `"description": "TODO"` is fine; a
half-written command is not, because the pack fails to load and hides the rest.

## Phase 3 — Pre-flight, in your head

Before running anything, re-read your own pack as a reviewer would and walk the
checklists:

- the function checklist at the end of
  [reference/functions.md](reference/functions.md)
- the top-15 list at the start of [reference/pitfalls.md](reference/pitfalls.md)
- the era questions in
  [reference/version-gates.md](reference/version-gates.md) — especially: does the
  target version use `functions/` or `function/`, and does it need item components?

This pass catches most of what the validator would report, and it is the reason
one run is usually enough.

## Phase 4 — Validate once, fix in one batch

```powershell
node "<skill base directory>/scripts/validate.mjs" "<pack folder>" --json "$env:TEMP\pack-report.json"
```

Run it from the skill directory or use the absolute path shown in the
`<skill_resources>` block of this skill. `<pack folder>` is the directory that
contains `pack.mcmeta`. Add `--mc 1.26.3` to pin the target version when
`pack.mcmeta` is missing or being repaired.

Then:

1. Read **every** diagnostic. The validator is not fail-fast: one run lists all of
   them, by file and line, each with the fix.
2. Apply all fixes in one batch. Do not fix one error and re-run — that converts
   one run into ten.
3. Re-run at most once. Exit code 0 means no errors; `MC-REF-010` (an unreferenced
   function) and `MC-REF-012` (no load/tick tag) are worth reading even at 0,
   because they describe a pack that loads and then does nothing.
4. Anything still failing after two runs: report it as a blocker with the exact
   diagnostic text. Do not start guessing again.

The validator's severities are deliberate. An **error** is something the game
rejects. A **warning** is something that is legal but almost certainly not what
was meant. Neither substitutes for the game: it cannot know whether a scoreboard
objective is declared by another pack, or whether an id exists in vanilla.

## Phase 5 — Hand off

Give the user, in this order:

1. The file tree you created, as a tree.
2. Where to put it: `<world>/datapacks/<pack folder>/`.
3. What to run in game: `/reload`, then `/datapack list`, then `/function
   <namespace>:<entry>` for each entry point so a failure shows up immediately.
4. What you could not verify statically, stated plainly. "The recipe unlocks
   correctly, but I cannot confirm the advancement shows its toast" is worth more
   than a confident claim.

## What this skill deliberately does not do

- **Bedrock Edition behavior packs.** Different format entirely.
- **Custom world generation, dimensions, biomes, enchantments.** Real formats,
  large cross-referenced schemas, not reloadable with `/reload`. If the task needs
  them, say so and work from the wiki's `自定义世界生成` pages rather than from
  memory.
- **`pack.png` or any binary asset.** Tell the user where it goes instead of
  generating bytes.
- **Trusting the validator over the wiki.** The tables in `reference/data/` are a
  derived snapshot. When a table and the wiki disagree, the wiki is right — say so
  and use the wiki's value.

## Reference

- Structure and `pack.mcmeta`: <https://zh.minecraft.wiki/w/数据包>
- Functions: <https://zh.minecraft.wiki/w/Java版函数>
- Commands: <https://zh.minecraft.wiki/w/命令/execute>, `/data`, `/scoreboard`
- Selectors: <https://zh.minecraft.wiki/w/目标选择器>
- Registry formats: 配方, 战利品表, 进度定义格式, 谓词, Java版标签

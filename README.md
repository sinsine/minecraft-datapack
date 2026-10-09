# minecraft-datapack

An agent skill for writing Minecraft Java datapacks, plus the offline checker that
comes with it.

The checker exists to find mistakes before the game does. Datapacks give poor
feedback. A JSON file with a trailing comma stops `/reload` from doing anything
at all. One unparseable line takes down every command in the function that
contains it. A pack whose folders are named for the wrong game version loads
without a word and then does nothing, which is worse than an error message. The
usual way to work is to load a world, read one error, fix it, and reload, ten
times for ten mistakes. Most of those mistakes are visible in the files.

So the order of work is: look the facts up in tables, write the pack, check it
once with a script that reports everything at once. You can get to a working pack
without starting Minecraft.

## What's here

| | |
|---|---|
| `SKILL.md` | The instructions an agent follows. Written for the agent, readable by anyone. |
| `reference/` | Syntax and structure material, loaded on demand: functions, registries, folder layout, version gates, a page of known traps. |
| `reference/data/` | Version numbers, command names and registry names as JSON, so nothing is answered from memory. |
| `templates/` | Skeletons for `pack.mcmeta`, functions, tags, recipes, advancements, loot tables, predicates. |
| `scripts/validate.mjs` | The checker. Node 18+ and nothing else. |
| `scripts/new-pack.mjs` | Scaffolding for a new pack. |
| `examples/` | Two complete packs, both kept clean by the test suite. |
| `fixtures/` | Test packs, including one full of deliberate mistakes. |
| `research/` | Where the version tables came from, with sources and open questions. |

## Install

```bash
git clone https://github.com/sinsine/minecraft-datapack.git ~/.dsh/skills/minecraft-datapack
```

Claude Code loads skills from `~/.claude/skills/`, and the file format is the
same, so the same clone works there:

```bash
git clone https://github.com/sinsine/minecraft-datapack.git ~/.claude/skills/minecraft-datapack
```

The two scripts need Node 18 or newer. They don't need Minecraft and they don't
touch the network.

## Use

```bash
# start a pack for a specific game version
node scripts/new-pack.mjs my-pack --namespace mypack --mc 1.21.8

# ...write the functions, recipes, advancements...

# one run, every problem at once
node scripts/validate.mjs my-pack
```

`new-pack.mjs` writes `pack.mcmeta` with the version fields that release needs,
the load and tick tag files, and three starter functions. It also picks the
registry folder names, which changed from plural to singular in 1.21: a 1.20.4
pack gets `functions/`, a 1.21.8 pack gets `function/`. That one detail accounts
for a lot of packs that load and do nothing.

The checker is not fail-fast. It reads the whole pack and reports everything it
finds, sorted by file and line, each with a suggested fix:

```
minecraft-datapack validator
pack root: my-pack
target: Minecraft 1.21.7–1.21.8 (data pack format 81)  [pack.mcmeta]

ERRORS (4)
  data/demo/function/tick.mcfunction:1  MC-REF-001  function "demo:greet" does not exist in this pack
      fix: Create data/<namespace>/function/<path>.mcfunction, or fix the namespace and path.
  data/demo/function/tick.mcfunction:2  MC-VERSION-002  pre-1.20.5 item NBT used in "give"
      > give @s minecraft:diamond_sword{display:{Name:"Sword"}}
      fix: Since 1.20.5 an item stack is {id, count, components:{...}}. display → components: custom_name / lore / tooltip_display.
  data/demo/function/tick.mcfunction:3  MC-REF-003  advancement "demo:missing_advancement" does not exist in this pack
  data/demo/recipe/oops.json:3:51  MC-JSON-001  trailing comma before "}"
      > "ingredients": [ { "item": "minecraft:stick" } ],

WARNINGS (2)
  data/demo/function/tick.mcfunction:1  MC-FUNC-020  objective "demo.points" is used but never created in this pack (used on 2 lines)

summary: 4 error(s), 2 warning(s), 0 info across 7 file(s)
```

Exit code is 0 when there are no errors, 1 when there are. `--json report.json`
writes the same thing in machine-readable form, `--mc 1.20.4` checks a pack
against a version other than the one in its metadata, and `--strict` treats
warnings as failures.

## What it finds

Roughly in order of how often each one bites:

- **JSON written by hand.** A trailing comma, a `//` comment, single quotes, a
  byte-order mark, a smart quote from an editor. The message names the cause
  rather than saying `Unexpected token`.
- **Folder names for the wrong version.** `functions/` in a 1.21 pack and
  `function/` in a 1.20.4 pack are both reported, with the folder to rename.
- **`pack.mcmeta` version fields.** `pack_format` mixed with `min_format`, a
  number that has never been a data pack format, a range whose low and high ends
  disagree.
- **Broken function lines.** Unknown commands (with a suggestion), a leading
  slash, unbalanced brackets, an `execute` clause written after a condition, a
  chain that ends without `run` (unless it ends in a condition, which is legal),
  `data` and `scoreboard` arguments in the wrong order, `~` mixed with `^`.
- **Macro mistakes.** `$(name)` on a line that doesn't start with `$`, a macro
  function called without `with`, a macro function listed in a tag, where it can
  never receive arguments.
- **References that go nowhere.** A `function`, `#tag`, loot table, predicate,
  advancement or recipe naming something the pack doesn't contain. Also the
  reverse: functions that nothing calls and no tag runs.
- **Tags.** Entries with no namespace, which silently resolve to `minecraft:`, a
  tag that includes itself, tags on recipes or advancements, which can't have
  them.
- **Registry schemas.** A recipe missing the keys its type requires, a shaped
  pattern whose symbols aren't in `key`, a loot table pool with no entries, an
  advancement with no criteria or a trigger that doesn't exist.
- **Syntax from a later version.** Item components on a pack targeting 1.20.4,
  `execute if items` before 1.20.5, the old `attribute` operation names after
  1.20.5, macros before 1.20.2.

## What it won't tell you

It doesn't know vanilla ids. Any `minecraft:` name passes, whether or not it
exists. It can't tell whether a scoreboard objective is created by another pack,
so it warns instead of failing. It doesn't look inside `overlays` sub-packs, and
world generation, biomes, dimensions and enchantments are not validated beyond
their folder names. Those formats are large, full of cross-references, and not
reloadable with `/reload`, so getting one wrong costs a lot more than the checker
can save.

The rule followed throughout was: don't report something that might be valid.
Where the answer depends on the game version or on a fact I couldn't confirm from
the wiki, the report stays quiet or the reference file says so outright. A
checker that cries wolf is one people stop reading.

## Keeping the version data current

The numbers live in one generated file. When a new release ships:

```bash
node scripts/tools/build-versions.mjs research/pack-formats.json reference/data/versions.json
node scripts/validate.mjs --self-test
```

`versions.json` is generated because transcribing a version table by hand is how
these tools rot. Command names and registry names are the other two JSON files in
`reference/data/`, which are maintained by hand and read by the checker. Adding a
new command is a one-line edit.

## Tests

```bash
node scripts/validate.mjs --self-test
```

That validates thirteen packs: the two examples, seven fixtures, and three packs
built by the scaffolder for different game versions. The fixtures carry expected
results, so a check that stops firing and a check that starts firing on valid code
both fail the test. `fixtures/broken-pack` holds sixteen deliberate defects;
`fixtures/clean-pack` must produce nothing at all.

## Sources

The version tables were extracted from the Chinese Minecraft Wiki and
cross-checked against the English one where the two overlap: 数据包, Pack.mcmeta,
Java版函数, 命令/execute, 命令/data, 命令/scoreboard, 目标选择器, NBT路径,
文本组件, 配方, 战利品表 and 进度定义格式.

`research/` holds what came out of that, and more usefully, a list of what the
wiki doesn't say. A few of those gaps are things this project could get wrong,
which is why they're written down instead of guessed at.

## License

MIT. See [LICENSE](LICENSE).

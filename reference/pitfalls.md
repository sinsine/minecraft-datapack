# Datapack pitfalls: the lines that load but do nothing

These are the traps that produce a datapack which loads and then silently does nothing, or which errors at runtime. Read this as a checklist before writing: scan the section headings, compare each WRONG form against the line you were about to emit, and use the RIGHT form. `Caught by: validator MC-...` means a static check can flag the line before the game loads the pack; `Caught by: runtime only` means nothing catches it until the command runs (or fails to run), and the failure is usually silent. Version-gated entries state the version the RIGHT form applies to.

## The top 15

1. **`execute as @a say hi`** - every `execute` chain must end in `run <command>` or a condition: `execute as @a run say hi`.
2. **A line starting with `/`** - function lines carry no leading slash: `give @s minecraft:stone`.
3. **`// comment`** - only `#` starts a comment: `# set up the score`.
4. **`scoreboard objectives add` in a `#tick` function** - create objectives in a `#load` function; the second `add` of the same name fails.
5. **`@a` / `@s` in a `#load` function** - `#load` runs before players exist; do player work from `#tick`.
6. **`data/<ns>/functions/`** - since 1.21 the folder is `function/` (singular) and the tag folder is `tags/function/`.
7. **`execute at @e[type=pig] run kill`** - `at` does not change the executor: `execute as @e[type=pig] at @s run kill`.
8. **`execute as @a if score @s obj matches 1..`** - a chain ending in a bare condition only tests; add `run <command>` when you wanted an effect.
9. **`give @s minecraft:diamond_sword{Unbreakable:1b}`** - 1.20.5+ replaced item NBT with components: `give @s diamond_sword[unbreakable={}]`.
10. **`tellraw @a {"text":Hello}`** - JSON string values need quotes: `tellraw @a {"text":"Hello"}`.
11. **`tp @a @e[type=pig]`** - a single-entity argument rejects a multi-entity selector: `tp @a @n[type=pig]`.
12. **`scoreboard objectives add mypack:points dummy`** - objective names may not contain `:`; use `mypack.points`.
13. **`give @s $(id)` with no `$`** - the `$` must be the first non-whitespace character: `$give @s $(id)`.
14. **`setblock ~ ~ ~ oak_stairs{facing:"north"}`** - block states go in `[...]`: `setblock ~ ~ ~ minecraft:oak_stairs[facing=north]`.
15. **`function mypack:init.mcfunction`** - a function id carries no extension: `function mypack:init`.

## Functions and control flow
### Never start a function line with `/`
```mcfunction
# WRONG
/give @s minecraft:stone
# RIGHT
give @s minecraft:stone
```
**Why:** commands inside a function are not prefixed with `/`; a leading slash makes the line unparseable, and one unparseable non-macro line makes the whole function fail to load.
**Caught by:** validator MC-FUNC-001
### Comment with `#`, never `//`
```mcfunction
# WRONG
// set up the score
# RIGHT
# set up the score
```
**Why:** `//` is not a comment in a function file - it is read as a command starting with a slash, so the function fails to load.
**Caught by:** validator MC-FUNC-001
### Mark a macro line with `$`
```mcfunction
# WRONG
give @s $(id)
# RIGHT
$give @s $(id)
```
**Why:** a line is a macro line only when `$` is its first non-whitespace character; without it `$(id)` is never substituted and the line is not a valid command.
**Caught by:** validator MC-FUNC-042
### Pass every parameter a macro function needs
```mcfunction
# WRONG
function mypack:give_item
# RIGHT
data modify storage mypack:args id set value "minecraft:apple"
function mypack:give_item with storage mypack:args id
```
**Why:** a macro function called with no arguments does not run at all, and `with` accepts only a block, an entity or storage plus an NBT path - there is no inline-compound form. The keys the `$` lines use must exist at that path; extra keys there are ignored.
**Caught by:** validator MC-FUNC-040

## ID, namespace and reference mistakes
### Write function ids namespaced and without an extension
```mcfunction
# WRONG
function mypack:init.mcfunction
function init
# RIGHT
function mypack:init
```
**Why:** the id is `<namespace>:<path-within-function/>` - the file extension is not part of it, and an omitted namespace is read as `minecraft:`, which does not exist.
**Caught by:** validator MC-REF-004
### Namespace your own ids
```mcfunction
# WRONG - both resolve to minecraft:..., which does not exist
function init
schedule clear later
# RIGHT
function mypack:init
schedule clear mypack:later
```
**Why:** an unqualified id is read as `minecraft:<name>`. That is harmless for vanilla content (`execute if biome ~ ~ ~ jungle` correctly means `minecraft:jungle`), but your own functions, tags, predicates, loot tables and recipes must carry your namespace or they name a minecraft resource that does not exist. Note that `function init` fails loudly while `schedule clear later` fails silently.
**Caught by:** validator MC-REF-005
### Objective names may not contain `:`
```mcfunction
# WRONG
scoreboard objectives add mypack:points dummy
# RIGHT
scoreboard objectives add mypack.points dummy
```
**Why:** since 1.13 an objective name allows only letters, digits, `_`, `.`, `-` and `+`; a colon makes the command malformed.
**Caught by:** validator MC-FUNC-022

## Directory and file naming
### Use the singular `function/` folder on 1.21+
```mcfunction
# WRONG
data/mypack/functions/init.mcfunction
# RIGHT
data/mypack/function/init.mcfunction
```
**Why:** the folder was renamed from `functions/` to `function/` in 1.21, and the tag folder from `tags/functions/` to `tags/function/`; the old spelling is not read, so the function does not exist.
**Caught by:** validator MC-STRUCT-013
### Give a function file the `.mcfunction` extension
```mcfunction
# WRONG
data/mypack/function/init.txt
# RIGHT
data/mypack/function/init.mcfunction
```
**Why:** only `.mcfunction` files are read from the function folder; anything else there is skipped, so the id is unreachable.
**Caught by:** validator MC-STRUCT-006

## execute
### End the chain with `run` and give it something to run
```mcfunction
# WRONG
execute as @a say hi
execute as @a at @s run
# RIGHT
execute as @a run say hi
execute as @a at @s run say hi
```
**Why:** an `execute` chain that ends in neither a condition nor `run` does not parse, and a bare trailing `run` has no command; both are load-time failures that take the whole function with them.
**Caught by:** validator MC-FUNC-012 (the first line), MC-FUNC-013 (the bare `run`)
### Put every subcommand before `run`
```mcfunction
# WRONG
execute as @a run say hi store result score #n obj
# RIGHT
execute store result score #n obj as @a run say hi
```
**Why:** `run` must be last and used once; everything after it is parsed as arguments of the inner command, so `say hi store result score #n obj` fails to parse.
**Caught by:** runtime only
### `as` before `at` when the target should use its own position
```mcfunction
# WRONG
execute at @s as @e run tp @s ^ ^ ^1
# RIGHT
execute as @e at @s run tp @s ^ ^ ^1
```
**Why:** subcommands apply in the order written; `at @s ... as @e` teleports every entity along the *executor's* facing, while `as @e at @s` uses each entity's own position and rotation.
**Caught by:** runtime only
### `at` changes position and rotation, not the executor
```mcfunction
# WRONG
execute at @e[type=pig] run kill
# RIGHT
execute as @e[type=pig] at @s run kill
```
**Why:** `at` does not modify the executor, so the WRONG line kills whoever ran it (a command block or the server), not the pigs.
**Caught by:** runtime only
### A bare trailing condition only tests
```mcfunction
# WRONG
execute as @a if score @s obj matches 1..
# RIGHT
execute as @a if score @s obj matches 1.. run say hello
```
**Why:** `run` is optional, and a chain that ends in a condition just outputs the test result - nothing happens, with no error.
**Caught by:** runtime only
### An aborted branch stores nothing
```mcfunction
# WRONG
execute store result score #n obj as @e[type=pig] if data entity @s NoAI run data get entity @s NoAI
# RIGHT
scoreboard players set #n obj 0
execute store result score #n obj as @e[type=pig] if data entity @s NoAI run data get entity @s NoAI
```
**Why:** when a condition fails the branch aborts, so the store never runs and the score keeps its previous value - reset it first so the result is meaningful.
**Caught by:** runtime only
### Give single-entity arguments a single entity
```mcfunction
# WRONG
data get entity @e[type=pig] Pos
tp @a @e[type=pig]
# RIGHT
data get entity @e[type=pig,limit=1] Pos
tp @a @n[type=pig]
```
**Why:** arguments marked `amount=single` accept only `@a`/`@e` with `limit=1`, `@s` without `limit`, or `@p`/`@r`/`@n` - anything else does not parse, so the function fails to load.
**Caught by:** runtime only

## Data and NBT paths
### Write the operation before the source
```mcfunction
# WRONG
data modify storage a:b out from storage a:b in
# RIGHT
data modify storage a:b out set from storage a:b in
```
**Why:** the order is `<targetPath> <operation> [<index>] <source> [<sourcePath>]`; without `set`, `from` is read where the operation keyword belongs and the command is malformed.
**Caught by:** validator MC-FUNC-021
### `set` overwrites the whole tag, `merge` keeps siblings
```mcfunction
# WRONG
data modify entity @s equipment set value {head:{id:"minecraft:diamond_helmet"}}
# RIGHT
data modify entity @s equipment merge value {head:{id:"minecraft:diamond_helmet"}}
```
**Why:** `set` replaces the target tag outright, destroying every sibling key; `merge` overwrites only names that collide, and `merge` works on compounds only.
**Caught by:** runtime only
### `data get` needs a path that matches exactly one tag
```mcfunction
# WRONG
data get entity @s Inventory[].id
# RIGHT
data get entity @s Inventory[0].id
```
**Why:** `data get` requires a tag set of size 1; a path selecting several tags fails. `data modify`/`data remove` accept many and apply to all of them.
**Caught by:** runtime only
### Player NBT cannot be written
```mcfunction
# WRONG
data modify entity @s Health set value 20
# RIGHT
effect give @s instant_health 1 10
```
**Why:** `/data` (and `execute store ... entity`) cannot set or remove any part of a player's NBT; use `/effect`, `/item`, `/attribute` and friends instead.
**Caught by:** runtime only

## Scoreboard
### Create objectives in a `#load` function
```mcfunction
# WRONG
# mypack:tick
scoreboard objectives add myobj dummy
scoreboard players add @a myobj 1
# RIGHT
# mypack:load
scoreboard objectives add myobj dummy
# mypack:tick
scoreboard players add @a myobj 1
```
**Why:** `objectives add` fails once the objective exists, so it fails on every tick after the first, and while the objective is missing every `players ...` command fails too. `#load` runs on world load, server start and every `/reload`.
**Caught by:** runtime only
### Read-only criteria cannot be written by commands
```mcfunction
# WRONG
scoreboard objectives add hearts health
scoreboard players set @s hearts 20
# RIGHT
scoreboard objectives add points dummy
scoreboard players set @s points 20
```
**Why:** the built-in criteria (`health`, `xp`, `level`, `food`, `air`, `armor`, ...) are read-only; `players set|add|remove` on them fails. Read the game value with `execute store` or a predicate.
**Caught by:** runtime only
### `players get` takes exactly one score holder
```mcfunction
# WRONG
scoreboard players get @a obj
# RIGHT
scoreboard players get @a[limit=1] obj
```
**Why:** the target is a single `score_holder`; a selector that can match several entities (or `*`) does not parse, so the function fails to load.
**Caught by:** runtime only
### Materialise a score before reading it
```mcfunction
# WRONG
execute store result score #n var run scoreboard players get #temp var
# RIGHT
scoreboard players add #temp var 0
execute store result score #n var run scoreboard players get #temp var
```
**Why:** `players get` fails when the holder has no score in that objective, and a failed command stored with `execute store result` writes 0 - silently poisoning the logic. `add 0` initialises the score.
**Caught by:** runtime only

## Text components and tellraw
### Quote every JSON string value
```mcfunction
# WRONG
tellraw @a {"text":Hello}
tellraw @a {text:Hello}
# RIGHT
tellraw @a {"text":"Hello"}
```
**Why:** a component argument is JSON, where a string value must be double-quoted; an unquoted word is not valid JSON and the command is malformed.
**Caught by:** validator MC-FUNC-030
### Escape double quotes inside a component string
```mcfunction
# WRONG
tellraw @a {"text":"say "hi""}
# RIGHT
tellraw @a {"text":"say \"hi\""}
```
**Why:** the outer `"` delimit the JSON string, so an inner quote must be written `\"`; otherwise the string ends early and the rest of the component is unparseable.
**Caught by:** validator MC-FUNC-030
### On 1.21.5+ use `click_event` / `hover_event`
```mcfunction
# WRONG
tellraw @a {"text":"click","clickEvent":{"action":"run_command","value":"/say hi"}}
# RIGHT
tellraw @a {"text":"click","click_event":{"action":"run_command","command":"say hi"}}
```
**Why:** 1.21.5 renamed both event keys and their payload fields (`value` to `command`/`url`/`page`/`path`, `contents` moved to the root); the old spelling is no longer read, so the click does nothing.
**Caught by:** runtime only
### The first element of a list component is the root
```mcfunction
# WRONG
title @a title [{"color":"red","text":"A"},{"text":"B"}]
# RIGHT
title @a title ["",{"color":"red","text":"A"},{"text":"B"}]
```
**Why:** a list component makes its first element the root and puts the rest in `extra`, so the first element's style is inherited by everything after it; an empty component first absorbs the pollution.
**Caught by:** runtime only

## Items and components
### On 1.20.5+ use item components, not item NBT
```mcfunction
# WRONG
give @s minecraft:diamond_sword{display:{Name:'"Excalibur"'}}
# RIGHT
give @s minecraft:diamond_sword[minecraft:custom_name='"Excalibur"']
```
**Why:** 1.20.5 replaced the trailing `{NBT}` on an item with `[component=...]`; the old form no longer parses, so the command - and the function containing it - fails to load. `custom_name` and `lore` are stable from 1.20.5 on; `unbreakable`, `damage` and the predicate-shaped components changed spelling once more in 1.21.5, so check `version-gates.md` before using those.
**Caught by:** validator MC-VERSION-002
### Tag your own items with `custom_data`
```mcfunction
# WRONG
give @s stick{myid:"test:bar"}
execute if data entity @s SelectedItem.tag.myid run say hi
# RIGHT
give @s stick[minecraft:custom_data={id:"test:bar"}]
execute if items entity @s weapon.mainhand *[minecraft:custom_data~{id:"test:bar"}] run say hi
```
**Why:** the old `tag:{...}` compound is gone (1.20.5+); the modern marker is the `custom_data` component, tested with the item predicate `~` (contains) operator in `execute if items`.
**Caught by:** validator MC-VERSION-002
### `/summon` needs an explicit position before NBT
```mcfunction
# WRONG
summon pig {NoAI:1b}
# RIGHT
summon pig ~ ~ ~ {NoAI:1b}
```
**Why:** the grammar is `summon <entity> [<pos>] [<nbt>]` - NBT is only accepted after a position, so omitting `~ ~ ~` makes the line unparseable.
**Caught by:** runtime only
### Block states use `[...]`; block NBT uses `{...}`
```mcfunction
# WRONG
setblock ~ ~ ~ minecraft:oak_stairs{facing:"north"}
# RIGHT
setblock ~ ~ ~ minecraft:oak_stairs[facing=north]
setblock ~ ~ ~ birch_sign{front_text:{messages:["","","",""]}}
```
**Why:** `{...}` after a block is block-entity data, which a stairs block does not have, so the command fails; states belong in `[key=value]`. A sign's four message lines must also always be written out in full.
**Caught by:** runtime only
### On 1.21.5+ a component stored in NBT is SNBT, not a JSON string
```mcfunction
# WRONG
summon pig ~ ~ ~ {CustomName:'{"text":"Bob"}'}
# RIGHT
summon pig ~ ~ ~ {CustomName:{text:"Bob"}}
```
**Why:** components are stored as NBT now. A string is still a valid component, but it is the pure-text shorthand, so the JSON text is displayed literally instead of being parsed.
**Caught by:** runtime only

## Tags and the load/tick wiring
### `#load` cannot see players
```mcfunction
# WRONG
# mypack:load
tellraw @a {"text":"Datapack loaded!"}
# RIGHT
# mypack:load
scoreboard objectives add mypack.timer dummy
# mypack:tick
execute as @a run tellraw @s {"text":"Datapack active"}
```
**Why:** `#load` functions run before players enter the world, so no selector finds a player and `tellraw`/`title` reaches nobody. Create objectives, storages and constants there and do player work from `#tick`.
**Caught by:** runtime only
### `load.json` and `tick.json` live in the `minecraft` namespace
```mcfunction
# WRONG
data/mypack/tags/function/load.json
# RIGHT
data/minecraft/tags/function/load.json
```
**Why:** only the tags `#minecraft:load` and `#minecraft:tick` are wired to world load and the tick loop; the same file under your own namespace is never executed.
**Caught by:** validator MC-REF-011
### Re-establish the executor and position in tick and scheduled functions
```mcfunction
# WRONG
tag @s add ticked
setblock ~ ~-1 ~ minecraft:stone
# RIGHT
execute as @a at @s run tag @s add ticked
execute at @p run setblock ~ ~-1 ~ minecraft:stone
```
**Why:** a `#tick` function has no player executor, and a `/schedule`d function runs as the server at world spawn - so `@s` matches nothing and `~ ~ ~` is the world spawn unless you re-position with `execute at`.
**Caught by:** runtime only

## Version-era traps
### Use the current `attribute` modifier operation names
```mcfunction
# WRONG
attribute @p minecraft:gravity modifier add test:antigravity -0.16 multiply
# RIGHT
attribute @p minecraft:gravity modifier add test:antigravity -0.16 add_multiplied_total
```
**Why:** 1.20.5 renamed the operations to `add_value`, `add_multiplied_base` and `add_multiplied_total`; the old `add`/`multiply_base`/`multiply` are no longer accepted.
**Caught by:** validator MC-VERSION-001
### `effect give` / `effect clear`, not the Bedrock form
```mcfunction
# WRONG
effect @s speed 60 1
# RIGHT
effect give @s speed 60 1
```
**Why:** the single-word Bedrock spelling has not been valid in Java since 1.13; the arguments are read where `give|clear` is expected and the command does not parse.
**Caught by:** runtime only
### The amplifier is one less than the level
```mcfunction
# WRONG
effect give @s speed 60 2
# RIGHT
effect give @s speed 60 1
```
**Why:** level I is amplifier 0, so speed II needs amplifier `1` - writing `2` silently grants speed III.
**Caught by:** runtime only

## Looks wrong but is not

Do not "fix" these; each is explicitly permitted.

- **Trailing whitespace on a line** - leading and trailing whitespace is stripped from every line.
- **Indentation or tabs before a command** - same rule.
- **A very long single command** - function commands are not capped at the command block's 32,500 characters; the function limit is 2,000,000 characters since 1.20.5.
- **Line continuation with a trailing `\`** - legal since 1.20.2; the next line's whitespace is trimmed and the parts are joined.
- **Spaces around `[`, `=` and `,` inside a selector** - allowed; only a space between the selector variable and its first `[` is not.
- **Repeated selector arguments** - `@e[tag=a,tag=b,tag=!c]` is legal and means AND.
- **An `execute` chain with a condition but no `run`** - legal; it just outputs a result.
- **`count` omitted in `/give`** - defaults to 1.
- **`hideParticles` omitted in `/effect give`** - defaults to `false`, and `seconds` defaults to 30 s (1 tick for instant effects).
- **`sort` without `limit`** - parseable; it only has an effect together with `limit`.

## Unverified

Widely repeated rules that could not be confirmed from the source pages. Verify before relying on them.

1. **Mixing `~` and `^` in one coordinate triple is invalid.** Every example uses a homogeneous triple (`~ ~ ~`, `^ ^ ^1`, `^5 ^ ^`), but the prohibition itself is never stated where coordinates are documented. (The bundled validator does report this as `MC-FUNC-004`.)
2. **The `time` argument's unit suffixes.** `3s` and `5d` appear in `/schedule` examples and a bare `0` is documented as failing, but whether a bare number means ticks, and whether `t` is accepted, is not stated where `/schedule` is documented.
3. **`#` comments with leading indentation.** Per-line leading whitespace is ignored and `#` at the start of a line comments it, but the comment rule (unlike the macro rule) never says "first non-whitespace character".
4. **Whether the executor of a `#tick` function has a position or an entity.** This is documented for `/schedule`d functions (server executor, world spawn) and for the player-blindness of `#load`, but the `#tick` executor is not spelled out.
5. **`nbt` subset-match details for lists** - whether a list must match exactly in length and order.
6. **The version that removed the `generic.` prefix from attribute ids.** The current examples are all unprefixed, but the pages read for this state no date for the rename.
7. **Whether unquoted SNBT keys parse inside a command's text-component argument** (`tellraw @a {text:"hi"}`). Command examples use double-quoted JSON; the component page presents SNBT structures.
8. **Colour-code escape characters in Java text.** Only Bedrock examples were found.
9. **`schedule`, `teleport` and `fill` specifics** beyond the forms given above.

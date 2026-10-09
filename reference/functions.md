# Functions and commands

A `.mcfunction` file is a list of commands, one per line, written **without** the
leading slash.

```mcfunction
# A comment line starts with # as the first non-whitespace character.
say This line runs.

# Blank lines are ignored.
execute as @a at @s run say Hello from every player's position.
```

| Rule | Consequence |
|---|---|
| No `/` at the start of a line | `/say hi` is an error; write `say hi` |
| `#` only comments when it is the line's first non-whitespace character | `say #not a comment` says the text |
| One command per line | Two commands on a line is an error |
| No semicolons, no line breaks inside a command | Split long commands with a trailing `\` (1.20.2+) |
| Empty lines and trailing whitespace are fine | |

A trailing backslash continues the command on the next line (1.20.2 and later):

```mcfunction
tellraw @a [{"text":"a very long line that we \
split for readability"}]
```

## Macros

A line whose **first character** is `$` is a macro line. `$(name)` inside it is
replaced by the value the caller passes (1.20.2+).

```mcfunction
# data/mypack/function/announce.mcfunction
$tellraw @a {"text":"$(message)","color":"yellow"}
```

```mcfunction
# the caller must supply every placeholder, from a block, an entity or storage
data modify storage mypack:config message set value "Server restarted."
function mypack:announce with storage mypack:config message
```

Consequences the game enforces:

- Calling a macro function **without** `with` fails. The validator reports `MC-FUNC-040`.
- Using `with` on a function with no `$` line fails. `MC-FUNC-041`.
- `$(name)` on a line that does not start with `$` is not substituted. `MC-FUNC-042`.
- A macro function listed in a tag never gets arguments, so it fails at runtime. `MC-FUNC-043`.
- The substituted text is parsed as a command, so an argument that contains spaces
  or quotes must be quoted by the caller, not by the macro line.

## `execute`

`execute` is the command you will use most and the one with the strictest shape:
clauses run in a fixed order, then any number of conditions, then exactly one
`run`.

```
execute
  (as <targets>)
  (at <targets>)
  (positioned <pos>)
  (rotated <rot>)
  (facing <pos> | entity <targets> <anchor>)
  (in <dimension>)
  (anchored <eyes|feet>)
  (align <axes>)
  (on <relation>)          # 1.19.4+
  (summon <entity>)        # 1.19.4+
  (if|unless <condition>)  # repeatable
  run <command>
```

```mcfunction
# Right: select, then position, then test, then run.
execute as @a at @s if block ~ ~-0.1 ~ minecraft:grass_block run effect give @s minecraft:speed 2 0 true

# Wrong: a clause after a condition, and no run at all.
execute as @a if block ~ ~ ~ minecraft:stone at @s
```

Conditions, with what each needs:

| Condition | Form | Since |
|---|---|---|
| `block` | `if block <pos> <block predicate>` | |
| `blocks` | `if blocks <start> <end> <destination> <all\|masked>` | |
| `data` | `if data block <pos> <path>` / `if data entity <targets> <path>` / `if data storage <id> <path>` | |
| `entity` | `if entity <targets>` | |
| `score` | `if score <target> <objective> <op> <source> <sourceObjective>` or `... <op> <value>` | |
| `predicate` | `if predicate <id>` | 1.15 |
| `biome` | `if biome <pos> <biome>` | 1.19.3 |
| `loaded` | `if loaded <pos>` | 1.19.4 |
| `dimension` | `if dimension <id>` | 1.19.4 |
| `function` | `if function <id>` | 1.20.3 |
| `items` | `if items block <pos> <slots> <item predicate>` / `if items entity <targets> <slots> <item predicate>` | 1.20.5 |

`op` for `score` is one of `<` `<=` `=` `>=` `>` `matches`. `matches` takes a
range: `1..`, `..5`, `3..7`.

## `data`

```
data get    <block <pos> | entity <targets> | storage <id>> [<path>] [<scale>]
data merge  <block <pos> | entity <targets> | storage <id>> <nbt>
data modify <block <pos> | entity <targets> | storage <id>> <path> <operation> ...
data remove <block <pos> | entity <targets> | storage <id>> <path>
```

`data modify` operations: `set`, `merge`, `append`, `prepend`, `insert <index>`.
The value comes from one of three sources; a whole value is removed with
`data remove`:

```mcfunction
data modify storage mypack:config message set value "hello"
data modify storage mypack:config count   set from entity @s SelectedItem.count
data modify storage mypack:config note    set string entity @s SelectedItem.components."minecraft:custom_data".note
data modify storage mypack:config list    append from storage mypack:config message
data modify storage mypack:config list    insert 0 from storage mypack:config message
data remove storage mypack:config message
```

`storage` is the usual place to keep state that is not per-entity; it survives
`/reload` and is never saved to disk unless `data merge storage` targets a
persistent id.

## `scoreboard`

```
scoreboard objectives add <name> <criteria> [<display name>]
scoreboard objectives remove <name>
scoreboard objectives setdisplay <slot> [<objective>]
scoreboard objectives modify <name> displayname <component>
scoreboard objectives modify <name> rendertype <hearts|integer>
scoreboard players set|add|remove <targets> <objective> <score>
scoreboard players reset <targets> [<objective>]
scoreboard players enable <targets> <objective>
scoreboard players operation <targets> <objective> <op> <source> <sourceObjective>
```

`op` for `players operation`: `=`, `+=`, `-=`, `*=`, `/=`, `%=`, `<`, `>`, `><`.

```mcfunction
# Declare every objective you use, once, in the load function.
scoreboard objectives add mypack.points dummy

scoreboard players set @s mypack.points 0
scoreboard players add @s mypack.points 1
scoreboard players operation @s mypack.points += @s mypack.bonus
```

Rules that bite:

- An objective must exist before it is used. Create it in the function listed in
  `data/minecraft/tags/function/load.json`. The validator warns with `MC-FUNC-020`.
- Objective names may not contain `:` (since 1.13). `mypack.points`, not `mypack:points`.
- `criteria` is required. `dummy` is the right choice for a counter you manage
  yourself; `trigger` makes `scoreboard players enable` and `/trigger` work.

Criteria worth knowing (the full list is on the wiki's 记分板 page):

| Criteria | What it counts |
|---|---|
| `dummy` | Nothing. You set it. Use this for anything the pack manages. |
| `trigger` | Nothing until a player runs `/trigger <objective> set <value>`; requires `scoreboard players enable` first. |
| `deathCount` | The player's deaths. |
| `playerKillCount` | Players killed. |
| `totalKillCount` | Any mob killed. |
| `health`, `food`, `air`, `armor`, `level`, `xp` | That player statistic, kept in sync by the game. |
| `minecraft.custom:minecraft.<stat>` | A custom statistic, e.g. `minecraft.custom:minecraft.jump`. |
| `minecraft.mined:minecraft.<block>` | Blocks of that type mined, e.g. `minecraft.mined:minecraft.stone`. |
| `teamkill.<colour>`, `killedByTeam.<colour>` | Team-relative kills. |

A statistic criterion updates by itself, so `scoreboard players get @s <objective>`
is enough to read it — you never set it.

## Selectors

`@a` all players, `@e` all entities, `@p` nearest player, `@r` random player,
`@s` the executing entity, `@n` nearest entity (1.21+).

| Argument | Example |
|---|---|
| `type` | `@e[type=minecraft:zombie]`, `@e[type=!#minecraft:undead]` |
| `name` | `@a[name=Alice]`, `@a[name=!Alice]` |
| `tag` | `@a[tag=mypack.ready]`, `@a[tag=!mypack.ready]` |
| `team` | `@a[team=red]` |
| `scores` | `@a[scores={mypack.points=10..}]` |
| `level` | `@a[level=30..]` |
| `gamemode` | `@a[gamemode=!creative]` |
| `distance` | `@e[distance=..10]` |
| `x` `y` `z` `dx` `dy` `dz` | `@e[x=0,y=64,z=0,distance=..5]` |
| `sort` `limit` | `@e[sort=nearest,limit=1]` |
| `advancements` | `@a[advancements={mypack:first=true}]` |
| `predicate` | `@a[predicate=mypack:sneaking]` |
| `nbt` | `@e[nbt={IsBaby:1b}]` |

`nbt=` matches a **subset** of the entity's NBT and is the slowest argument;
prefer `predicate=` for anything you test every tick. `@s` only means something
inside a context that has an executor, and `@e` with no `distance` scans every
loaded entity.

## NBT paths

```
foo.bar.baz          nested keys
foo[0]               list index; foo[-1] is the last element
foo[]                every element of a list
foo[{id:"x"}]        elements whose id is x
"a key with spaces".b  quote a key that is not a bare word
{id:"x"}             the path itself may be a filter
```

`~` is relative to the command's position, `^` is local to the executor's
rotation. You may not mix them inside one position: `~ ~ ~` or `^ ^ ^`, never
`~ ^ ~`. The validator reports this as `MC-FUNC-004`.

## Text components

Almost every message argument takes a JSON text component, not a plain string.

```mcfunction
tellraw @s {"text":"plain"}
tellraw @s {"text":"gold","color":"gold","bold":true}
tellraw @s [{"text":"Score: "},{"score":{"name":"@s","objective":"mypack.points"}}]
tellraw @s {"selector":"@a"}
tellraw @s {"translate":"block.minecraft.diamond_block"}
title @s title {"text":"Big"}
title @s actionbar {"text":"Small"}
```

The trap: inside a command, the component's own double quotes must be escaped.

```mcfunction
# WRONG — the outer parse ends at the first inner quote
tellraw @s {"text":"He said "hi""}

# RIGHT
tellraw @s {"text":"He said \"hi\""}
```

Elements available in the simple form: `text`, `translate`, `score`, `selector`,
`keybind`, `nbt`, `extra`, `color`, `bold`, `italic`, `underlined`,
`strikethrough`, `obfuscated`.

Interactive events were renamed in 1.21.5: `clickEvent` → `click_event`,
`hoverEvent` → `hover_event`, and the payload keys changed (`value` →
`command`/`url`/`page`, `contents` → `value`). Check
[version-gates.md](version-gates.md) before writing one; the safest pack avoids
them entirely.

## Calling functions

```mcfunction
function mypack:on_join                  # by id
function #mypack:tick_handlers           # every function in a tag
function mypack:announce with storage mypack:config message   # macro
schedule function mypack:later 20t       # run in 20 ticks, 20s, 1d ...
```

A function id is `<namespace>:<path>` with **no extension**. `function
mypack:on_join.mcfunction` is wrong. The validator reports `MC-REF-004`.

Recursion is legal only when it terminates. An unguarded cycle makes the game
abort the whole chain, so guard one call:

```mcfunction
# countdown.mcfunction
execute if score @s mypack.timer matches 1.. run function mypack:countdown
```

## Command cheat sheet

```mcfunction
give @s minecraft:diamond 1
clear @s minecraft:dirt
summon minecraft:zombie ~ ~ ~ {IsBaby:1b,PersistenceRequired:1b}
setblock ~ ~ ~ minecraft:stone replace
fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 minecraft:stone
clone <begin> <end> <destination> [replace|masked] [force|move|normal]
effect give @s minecraft:regeneration 10 1 true
effect clear @s
attribute @s minecraft:max_health modifier add mypack:bonus 4 add_value
tag @s add mypack.ready
tag @s remove mypack.ready
team add mypack.red
team join mypack.red @s
team modify mypack.red color red
title @a title {"text":"Hi"}
title @a times 10 40 10
bossbar add mypack:progress {"text":"Boss"}
bossbar set mypack:progress value 50
particle minecraft:happy_villager ~ ~1 ~ 0 0 0 0 1
playsound minecraft:entity.player.levelup player @a ~ ~ ~ 1 1
schedule function mypack:later 20t
item replace entity @s weapon.mainhand with minecraft:diamond_sword
loot give @s loot mypack:blocks/diamond
advancement grant @s only mypack:first_diamond
recipe give @s mypack:leather_from_rotten_flesh
place structure minecraft:igloo ~ ~ ~
random value 1..6
damage @s 5 minecraft:generic
forceload add ~ ~
time set day
weather clear
gamerule doDaylightCycle false
difficulty normal
gamemode survival @s
tp @s ~ ~ ~
kill @e[type=minecraft:item]
```

Entity and block NBT is unchanged across versions. **Item stacks are not** — see
[../templates/README.md](../templates/README.md) and
[version-gates.md](version-gates.md).

## Pre-flight check for every function you write

Read your own file and answer these. Each one maps to an error the validator
would otherwise report; catching them here is what keeps the run count at one.

1. Does every line start with a command word, `#`, or nothing at all — no `/`?
2. Does every `execute` either end with `run <command>`, or end in a condition
   *deliberately* (a chain that stops at `if` only tests and does nothing)?
3. Every `@s`/`@e`/`@a`: is there an executor at that point in the line?
4. Every `if score`: does that objective get created in the load function?
5. Every `function <id>`: does that file exist, with no extension in the id?
6. Every `$(name)`: does the line start with `$`, and does every caller pass it
   with `with`?
7. Every JSON argument: are the inner quotes escaped as `\"`, and does the
   component use `{"text":...}` rather than a bare string?
8. Every item stack: is it written in the component form your target version
   needs?
9. Any recursion: is one call in the cycle guarded by `if`/`unless`?
10. Any coordinate triple: are the three symbols all `~` or all `^`?
11. Is anything you expect to run listed in `data/minecraft/tags/function/load.json`
    or `tick.json` — and are those two files in the `minecraft` namespace?
12. Does anything you wrote need a newer Minecraft than the pack targets? (Check
    `version-gates.md`, not memory.)

# Version gates — the syntax that exists in the version you are targeting

A pack is written for exactly one decided Minecraft Java version, and that version is recorded in `pack.mcmeta` (`pack_format`, or `min_format` + `max_format` from 1.21.9 on); the same numbers, mapped to their releases, are in `data/versions.json`. Read the target version from there first, then walk the table in this file and apply every row whose **needs version** is at or below the target. A feature listed as needing a newer version **must simply not be emitted**: in a `.mcfunction` file every non-macro line is parsed when the function loads, so one line that only exists in a later release makes the whole function fail to load — there is no "it will just be ignored" fallback. Gate a feature by shipping it in a different file for a different version (see *If the pack must support several versions*), never by hoping the target tolerates it.

Rows are keyed by the **release** that shipped the change; the snapshot in parentheses is the development build named on the source page. `before` shows what a pack had to write up to the previous release, `after` what it must write from the listed release on. Since data packs themselves only exist from 1.13 (17w43a moved custom functions into them), the table starts at 1.13; the older function-file changes (`.txt` → `.mcfunction`, no leading `/`, `#`-only comments) all belong to 1.12 pre3 and are listed in `research/mcfunction-reference.md` §0 for completeness.

---

## Era boundary: 1.21.8 vs 1.21.9

Java picks the *format* of the version fields from game version **1.21.8 / data pack format 81** onward. A pack whose range ends at 81 or below uses the old field spelling; a pack whose range starts at 82 or above uses the new one; a pack that spans both must supply **all four** fields. Requesting `pack_format`/`supported_formats` in a modern-only pack, or `min_format`/`max_format` in a legacy-only pack, fails validation.

Two extra rules apply inside the new spelling. A single integer `min_format` means minor version `0` (`94`, `[94]` and `[94, 0]` are the same). A single integer `max_format` means minor version `0x7fffffff`. From 1.21.9 (25w31a) a data pack format number has a major and a minor part (`88.0`, `94.1`, `101.1`, `107.1`, `121.0`), and only the major part is ever compared against the old `supported_formats` numbers.

`description` is required and is a text component; a plain JSON string is the form the source's own examples use.

**Case A — the pack applies to 1.21.8 and earlier only (data pack format ≤ 81).** `pack_format` is required; `supported_formats` is optional and, if present, must contain `pack_format` and must not have a maximum below 15. `min_format` and `max_format` must not appear.

```json
{
  "pack": {
    "pack_format": 81,
    "supported_formats": [48, 81],
    "description": "Example pack"
  }
}
```

**Case B — the pack applies after 1.21.8 only (data pack format ≥ 82).** `min_format` and `max_format` are required. `pack_format` and `supported_formats` must not appear.

```json
{
  "pack": {
    "min_format": [88, 0],
    "max_format": [107, 1],
    "description": "Example pack"
  }
}
```

**Case C — the pack applies both before and after 1.21.8.** All four fields must be present. The game then checks that the low end is unique (`min_format`'s major part equals the minimum of `supported_formats`) and that the high end is unique, by one of two accepted routes: `max_format`'s major part equals the maximum of `supported_formats`, or the maximum of `supported_formats` is exactly **81**, in which case `supported_formats` is only ever used up to 1.21.8 and `max_format` becomes the real maximum. `pack_format` must still lie inside the range.

```json
{
  "pack": {
    "pack_format": 107,
    "supported_formats": [48, 107],
    "min_format": 48,
    "max_format": [107, 1],
    "description": "Example pack"
  }
}
```

The same spanning pack written with the second accepted high end (`supported_formats` stopping at 81):

```json
{
  "pack": {
    "pack_format": 81,
    "supported_formats": [48, 81],
    "min_format": 48,
    "max_format": [107, 1],
    "description": "Example pack"
  }
}
```

For a pack that targets **1.20 – 1.20.1 or earlier**, neither `supported_formats` nor `overlays` exists at all (both were added in 1.20.2 / 23w31a): such a pack carries `pack_format` alone, and its only way to vary per version is separate pack files with different `pack_format` values.

---

## 1.21 folder rename

The plural → singular rename landed in **two snapshots of the 1.21 cycle, both shipped in release 1.21 (pack format 48, 2024-06-13)**. The practical rule is absolute:

- a pack targeting **1.20.x or earlier** (up to pack format 41 / 1.20.6) must use the **OLD plural directory names**;
- a pack targeting **1.21 or later** (pack format 48+) must use the **NEW singular directory names**.

The directory name is not part of the ID: `data/ns/function/foo.mcfunction` and the old `data/ns/functions/foo.mcfunction` are both referenced as `ns:foo`. Only the on-disk path changes — but a wrong path means the file is never found, and a function tag that is never found silently does nothing.

**1.21 / 24w19a (pack format 43) — tag directories** (this half landed first, so the 1.21 pre-release window 24w19a–24w20a is a mixed state: these five are singular while the root registries below are still plural):

| old directory | new directory |
|---|---|
| `data/<ns>/tags/items/` | `data/<ns>/tags/item/` |
| `data/<ns>/tags/blocks/` | `data/<ns>/tags/block/` |
| `data/<ns>/tags/entity_types/` | `data/<ns>/tags/entity_type/` |
| `data/<ns>/tags/fluids/` | `data/<ns>/tags/fluid/` |
| `data/<ns>/tags/game_events/` | `data/<ns>/tags/game_event/` |

**1.21 / 24w21a (pack format 45) — root registries and the function tag directory:**

| old directory | new directory |
|---|---|
| `data/<ns>/structures/` | `data/<ns>/structure/` |
| `data/<ns>/advancements/` | `data/<ns>/advancement/` |
| `data/<ns>/recipes/` | `data/<ns>/recipe/` |
| `data/<ns>/loot_tables/` | `data/<ns>/loot_table/` |
| `data/<ns>/predicates/` | `data/<ns>/predicate/` |
| `data/<ns>/item_modifiers/` | `data/<ns>/item_modifier/` |
| `data/<ns>/functions/` | `data/<ns>/function/` |
| `data/<ns>/tags/functions/` | `data/<ns>/tags/function/` |

So the two files every pack has move like this:

```
# 1.20.x and earlier                      # 1.21 and later
data/<ns>/functions/load.mcfunction        data/<ns>/function/load.mcfunction
data/minecraft/tags/functions/tick.json    data/minecraft/tags/function/tick.json
```

Other `worldgen/` subdirectories (`biome`, `density_function`, `noise`, `placed_feature`, `processor_list`, `structure`, `structure_set`, `template_pool`, …) were already singular and are not part of this rename. No plural form of `damage_types`, `configured_features`, `placed_features` or `biomes` is documented as having existed.

**26.3 renames two worldgen directories** (contributing to pack format 121.0): `data/<ns>/worldgen/configured_feature/` → `data/<ns>/worldgen/feature/` (26.3 snapshot-1) and `data/<ns>/worldgen/configured_carver/` → `data/<ns>/worldgen/carver/` (26.3 snapshot-2).

### Directories that only exist from a given version

A path under one of these is simply not read by an older release. Introduction versions, from `research/datapack-folder-renames.md` §2:

| from | directories a pack may define |
|---|---|
| 1.19 / 22w18a | `chat_type` |
| 1.19.4 / 23w04a–23w06a | `damage_type`, `trim_material`, `trim_pattern` |
| 1.20.5 / 24w10a | `banner_pattern`, `wolf_variant` |
| 1.21 / 24w18a–24w21a | `enchantment`, `enchantment_provider`, `painting_variant`, `jukebox_song` |
| 1.21.2 / 24w33a–24w35a | `instrument`, `trial_spawner` |
| 1.21.5 / 25w02a–25w08a | `pig_variant`, `cat_variant`, `frog_variant`, `cow_variant`, `chicken_variant`, `test_environment`, `test_instance`, `wolf_sound_variant` |
| 1.21.6 / 25w20a | `dialog` |
| 1.21.11 / 25w45a | `timeline`, `zombie_nautilus_variant` |
| 26.1 / snapshot-1–snapshot-7 | `trade_set`, `villager_trade`, `world_clock`, `cat_sound_variant`, `chicken_sound_variant`, `cow_sound_variant`, `pig_sound_variant` |
| 26.2 / snapshot-1 | `sulfur_cube_archetype` |
| 26.3 / snapshot-1–snapshot-10 | `decorated_pot_pattern`, `slot_source`, `context_float_provider`, `context_int_provider`, `block_transformer` |
| 26.4 / snapshot-3 (**not yet released**) | `block_sound_set` |

---

## Version-gated features, by the version they arrived in

| needs version | feature or change | before | after | source |
|---|---|---|---|---|
| 1.13 (17w45a) | `/effect` split into `give` and `clear` | `effect @s speed 60 1` | `effect give @s speed 60 1` | [命令/effect](https://zh.minecraft.wiki/w/命令/effect) |
| 1.13 (17w45a) | Objective names may no longer contain `:` | `scoreboard objectives add foo:bar dummy` | `scoreboard objectives add foo.bar dummy` | [记分板](https://zh.minecraft.wiki/w/记分板) |
| 1.13 (pre8) | Team names and team display names are text components; `team option` became `team modify` | `team add my_team my_team`<br>`team option my_team color gold` | `team add my_team "my_team"`<br>`team modify my_team color gold` | [命令/team](https://zh.minecraft.wiki/w/命令/team) |
| 1.13 (pre8) | Objective display names are text components and must be valid quoted JSON | `scoreboard objectives add info dummy 公告` | `scoreboard objectives add info dummy "公告"` | [命令/scoreboard](https://zh.minecraft.wiki/w/命令/scoreboard) |
| 1.13.1 (18w31a) | `%=` is `Math.floorMod`: the sign follows the divisor | `# score -7, then: scoreboard players operation @s a %= @s b (b = 3)`<br>`# result -1` | `# score -7, then: scoreboard players operation @s a %= @s b (b = 3)`<br>`# result 2` | [记分板](https://zh.minecraft.wiki/w/记分板) |
| 1.14 (18w43a) | `execute if data` / `execute unless data` | `# no data condition before 1.14` | `execute if data entity @s {OnGround:1b} run say ok` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.15 (19w38a) | `execute if predicate`, `execute store … storage`, command storage | `# not available before 1.15` | `execute if predicate {condition:weather_check, raining:true}`<br>`execute store result score #temp var run data get storage ns:data value` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.15 (19w38a) | Command storage as a `data` source and target | `# not available before 1.15` | `data modify storage test:test output set value 1`<br>`data modify storage test:A append from storage test:B[]` | [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| 1.18 (21w37a) | 16-character limit on objective names and score holders removed | `scoreboard objectives add averylongobjective dummy` | `scoreboard objectives add averylongobjectivename dummy` | [记分板](https://zh.minecraft.wiki/w/记分板) |
| 1.18 (21w37a) | Team-name 16-character and member 40-character limits removed | `team add averylongteamname` | `team add averylongteamname_that_keeps_going` | [命令/team](https://zh.minecraft.wiki/w/命令/team) |
| 1.19 (22w18a) | `/place` command | `# not available before 1.19` | `place structure minecraft:trial_chambers ~ ~ ~`<br>`place template ancient_city/city_center/city_center_1 ~ ~ ~ clockwise_90 left_right 0.5 0` | [命令/place](https://zh.minecraft.wiki/w/命令/place) — `data/commands.json` records 1.19.4, see *Uncertainties* |
| 1.19.3 (22w46a) | `/fillbiome` command (`replace` form added in pre1) | `# not available before 1.19.3` | `fillbiome 0 0 0 32 28 32 minecraft:badlands replace #minecraft:has_structure/ancient_city` | [命令/fillbiome](https://zh.minecraft.wiki/w/命令/fillbiome) |
| 1.19.3 (22w46a) | `execute if biome` / `execute unless biome` | `# not available before 1.19.3` | `execute if biome ~ ~ ~ #minecraft:has_structure/jungle_temple` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.19.4 (23w03a) | `data modify … string …` slice source (`<start>`/`<end>` accept negatives from 1.20 pre1) | `# not available before 1.19.4` | `data modify storage wiki:string cur_char set string storage wiki:string buffer 0 1` | [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| 1.19.4 (23w03a) | `execute on` relations (`origin` from 23w04a; `owner` also covers vexes from 26.2 pre-1) | `# not available before 1.19.4` | `execute as @e[type=sheep] on attacker run kill` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.19.4 (23w03a) | `execute if loaded` / `execute unless loaded` | `# not available before 1.19.4` | `execute if loaded ~ ~ ~500` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.19.4 (23w03a) | `execute if dimension` / `execute unless dimension` | `# not available before 1.19.4` | `execute as @a at @s if dimension minecraft:overworld run say YES` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.19.4 (23w03a) | `fill` block limit moved from a hard-coded value to the `max_block_modifications` game rule | `# hard-coded limit; no game rule` | `gamerule max_block_modifications 32768` | [命令/fill](https://zh.minecraft.wiki/w/命令/fill) |
| 1.19.4 (pre1) | `execute positioned over <heightmap>` | `# not available before 1.19.4` | `execute positioned over motion_blocking run setblock ~ ~-1 ~ stone` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.19.4 (23w06a) | `execute summon` | `# not available before 1.19.4` | `execute summon pig run tag @s add test` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.19.4 (23w06a) | `/damage` command | `# not available before 1.19.4` | `damage @n[type=iron_golem] 1 generic by @n[type=villager, name="dummy"]` | [命令/damage](https://zh.minecraft.wiki/w/命令/damage) |
| 1.20 (23w16a) | `/return` gives a function an early exit and a return value (`return run` from 1.20.2, `return fail` from 1.20.3 / 23w44a) | `# no early exit and no return value before 1.20` | `return run function test3`<br>`return fail` | [命令/return](https://zh.minecraft.wiki/w/命令/return) — `data/commands.json` records 1.20.2, see *Uncertainties* |
| 1.20 (pre2) | NBT path nodes may be quoted with `'` as well as `"` | `data get entity @s "a b"` | `data get entity @s 'a b'` | [NBT路径](https://zh.minecraft.wiki/w/NBT路径) |
| 1.20.2 (23w31a) | Function macros: `$` lines and `function … with` | `# before macros: one function per value, no substitution` | `$give @s $(id) $(count)`<br>`function test:macro_func with entity @p SelectedItem`<br>`function test:test {x:1s, y:2b, z:3L}` | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| 1.20.2 (23w31a) | `\` at end of line continues the command | `say 你好` | <code>say 你 \</code><br><code>    好</code> | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| 1.20.2 (23w31a) | `execute if function` / `execute unless function` (absent from the 1.20.2 release itself, restored in 1.20.3 / 23w41a) | `# not available before 1.20.2` | `execute unless function generic:test run say 1` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.20.2 (23w31a) | `/random` and stored random sequences | `# not available before 1.20.2` | `execute store result score player Score run random value 5..10`<br>`random roll 1000.. minecraft:blocks/acacia_leaves`<br>`random reset *` | [命令/random](https://zh.minecraft.wiki/w/命令/random) |
| 1.20.2 (23w31a) | `scoreboard` display slot `belowName` renamed `below_name` | `scoreboard objectives setdisplay belowName obj` | `scoreboard objectives setdisplay below_name obj` | [记分板](https://zh.minecraft.wiki/w/记分板) |
| 1.20.2 (23w31a) | `pack.mcmeta` gains `supported_formats` and `overlays` | `{"pack":{"pack_format":81}}` | `{"pack":{"pack_format":81,"supported_formats":[48,81]}}` | [Pack.mcmeta](https://zh.minecraft.wiki/w/Pack.mcmeta) |
| 1.20.3 (23w40a) | Text components: `type` added; `null` and `[]` expressions removed; bad `color`/event data no longer ignored | `tellraw @a null`<br>`tellraw @a []` | `tellraw @a ""` | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| 1.20.3 (23w41a) | `return run` restored (absent from the 1.20.2 release); `return fail` added in 23w44a; `return run` now propagates `success` | `# return run is absent from the 1.20.2 release` | `execute if entity @s[tag=test1] run return run function test1` | [命令/return](https://zh.minecraft.wiki/w/命令/return) |
| 1.20.3 (23w43a) | `/tick` command (`<time>` optional from 23w44a) | `# not available before 1.20.3` | `tick rate 30`<br>`tick sprint 5s`<br>`tick step 1630` | [命令/tick](https://zh.minecraft.wiki/w/命令/tick) |
| 1.20.3 (23w46a) | `scoreboard players display name` / `display numberformat`; `objectives modify numberformat` | `# not available before 1.20.3` | `scoreboard objectives modify info numberformat blank`<br>`scoreboard players display name info4 info ""` | [记分板](https://zh.minecraft.wiki/w/记分板) |
| 1.20.5 (24w04a) | `/transfer` command (server only, op level 3) | `# not available before 1.20.5` | `transfer localhost 1630`<br>`transfer minecraft.server.example 25565 Steve` | [命令/transfer](https://zh.minecraft.wiki/w/命令/transfer) |
| 1.20.5 (24w06a) | A function line may reach 2,000,000 characters, macro expansion included | `# no documented 2,000,000-character cap on one function line` | `# a single macro-expanded line may now reach 2,000,000 characters` | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| 1.20.5 (24w09a) | Item NBT replaced by item stack components in `/give` and in every item argument | `/give @p minecraft:diamond_sword{display:{Lore:['"Sword"']}} 1`<br>`/give @s minecraft:diamond_block{CanPlaceOn:["minecraft:dirt"]} 1` | `/give @p minecraft:diamond_sword[minecraft:lore=['"Sword"']] 1`<br>`/give @s minecraft:diamond_block[minecraft:can_place_on={predicates:[{blocks:"minecraft:dirt"}]}] 1` | [命令/give](https://zh.minecraft.wiki/w/命令/give) |
| 1.20.5 (24w09a) | `attribute` modifier operation names renamed | `# up to 1.20.4: modifier add <uuid> <name> <value> multiply_base` | `attribute @p minecraft:gravity modifier add test:antigravity -0.16 add_multiplied_base` | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| 1.20.5 (24w09a) | Item stacks inside entity and block NBT use `count` and `components` | `summon item ~ ~ ~ {Item:{id:"minecraft:diamond",Count:64b}}` | `summon item ~ ~ ~ {Item:{id:"minecraft:diamond",count:64}}` | [命令/summon](https://zh.minecraft.wiki/w/命令/summon), [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| 1.20.5 (24w10a) | `execute if items` / `execute unless items` | `# not available before 1.20.5` | `execute if items entity @p armor.* *[minecraft:custom_data~{id:"test:bar"}]` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 1.21 (24w19a) | Tag directories renamed to the singular registry name | `data/<ns>/tags/items/gems.json`<br>`data/<ns>/tags/blocks/stone.json` | `data/<ns>/tags/item/gems.json`<br>`data/<ns>/tags/block/stone.json` | [Java版24w19a](https://zh.minecraft.wiki/w/Java版24w19a) |
| 1.21 (24w21a) | Registry directories renamed; `functions` → `function` and `tags/functions` → `tags/function` | `data/<ns>/functions/load.mcfunction`<br>`data/<ns>/tags/functions/tick.json` | `data/<ns>/function/load.mcfunction`<br>`data/<ns>/tags/function/tick.json` | [Java版24w21a](https://zh.minecraft.wiki/w/Java版24w21a) |
| 1.21 (24w21a) | `attribute` modifier identity: `uuid` + `name` parameters replaced by the namespaced `id` | `# up to 1.20.6: the modifier carried uuid and name parameters` | `attribute @p minecraft:gravity modifier add test:antigravity -0.16 add_value` | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| 1.21 (24w21a) | `@n` selector (since 1.21 pre1 it cannot select dying entities) | `@e[sort=nearest,limit=1]` | `@n[type=pig]` | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| 1.21.2 (24w40a) | `/rotate` command (op level 2 from pre1; was 0 in 24w40a) | `execute as @p at @s run teleport @s ~ ~ ~ ~10 ~` | `rotate @s ~10 ~`<br>`rotate @p facing entity @n[type=minecraft:sheep]` | [命令/rotate](https://zh.minecraft.wiki/w/命令/rotate), [命令/teleport](https://zh.minecraft.wiki/w/命令/teleport) |
| 1.21.4 (24w44a) | Text component style field `shadow_color` | `# not available before 1.21.4` | `tellraw @a {text:"hi", shadow_color:[255,0,0,0]}` | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| 1.21.4 (24w44a) | `attribute … base reset` | `# not available before 1.21.4` | `attribute @p minecraft:gravity base reset` | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| 1.21.5 (25w02a) | Text components are stored as NBT; `clickEvent` → `click_event`, `hoverEvent` → `hover_event`, payload keys renamed | `tellraw @a {"text":"hi","clickEvent":{"action":"run_command","value":"/say hi"}}` | `tellraw @a {text:"hi",click_event:{action:"run_command",command:"say hi"}}` | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| 1.21.5 (25w02a) | List- and compound-shaped item components drop the `predicates` wrapper | `/give @p minecraft:diamond_sword[minecraft:lore=['"Sword"']] 1`<br>`/give @s minecraft:diamond_block[minecraft:can_place_on={predicates:[{blocks:"minecraft:dirt"}]}] 1` | `/give @p minecraft:diamond_sword[minecraft:lore=["Sword"]] 1`<br>`/give @s minecraft:diamond_block[minecraft:can_place_on={blocks:"minecraft:dirt"}] 1` | [命令/give](https://zh.minecraft.wiki/w/命令/give) |
| 1.21.5 (25w02a) | `unbreakable` and `damage` as plain components | `/give @s minecraft:diamond_sword{Unbreakable:1b}`<br>`/give @s wooden_pickaxe 1 58` | `/give @s diamond_sword[unbreakable={}]`<br>`/give @s wooden_pickaxe[damage=58] 1` | [命令/give](https://zh.minecraft.wiki/w/命令/give) — the 1.20.5–1.21.4 spelling is not recorded in the source, see *Uncertainties* |
| 1.21.5 (25w02a) | `setblock` and `fill` gain `strict`; `fill … replace` may be followed by other options; block-entity data handling changed | `setblock ~ ~ ~ stone`<br>`fill ~ ~ ~ ~9 ~9 ~9 stone replace #minecraft:base_stone_overworld` | `setblock ~ ~ ~ stone strict`<br>`fill ~ ~ ~ ~9 ~9 ~9 stone replace #minecraft:base_stone_overworld strict` | [命令/setblock](https://zh.minecraft.wiki/w/命令/setblock), [命令/fill](https://zh.minecraft.wiki/w/命令/fill) |
| 1.21.5 (25w03a) | Hover `show_text` payload `contents` → `value` (`text` only during 25w02a) | `hoverEvent:{action:"show_text",contents:"hi"}` | `hover_event:{action:"show_text",value:"hi"}` | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| 1.21.5 (25w05a) | Text components in `/bossbar`, `/scoreboard` and `/team` resolve with `@s`; the `team` selector matches non-mob entities | `# text components resolved with the command's own executor semantics` | `# text components now resolve with the executing player as @s` | [文本组件](https://zh.minecraft.wiki/w/文本组件), [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| 1.21.5 (25w09a) | NBT path child node no longer accepts the empty string | `data get entity @s ""` | `# rejected from 1.21.5: name the real key instead` | [NBT路径](https://zh.minecraft.wiki/w/NBT路径) |
| 1.21.6 (25w15a) | `/waypoint` (left experimental in 25w17a, which also added `style` and removed `fade`) | `# not available before 1.21.6` | `waypoint modify @n[tag=waypoint_test] color gold`<br>`waypoint list` | [命令/waypoint](https://zh.minecraft.wiki/w/命令/waypoint) |
| 1.21.6 (25w20a) | `/dialog` command and the `data/<ns>/dialog/` directory | `# not available before 1.21.6` | `dialog show @p custom:example/test`<br>`dialog show @a {type:"minecraft:notice", title:"你好", body:[{type:"minecraft:plain_message", contents:"很高兴认识你！"}]}`<br>`dialog clear @a` | [命令/dialog](https://zh.minecraft.wiki/w/命令/dialog) |
| 1.21.6 (25w20a) | `custom` and `show_dialog` click events | `# not available before 1.21.6` | `tellraw @a {text:"open",click_event:{action:"show_dialog",dialog:"ns:my_dialog"}}` | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| 1.21.9 (25w31a) | `pack.mcmeta` version fields: `min_format` + `max_format` required, `pack_format` / `supported_formats` forbidden | `{"pack":{"pack_format":81,"supported_formats":[48,81]}}` | `{"pack":{"min_format":[88,0],"max_format":[88,0]}}` | [Pack.mcmeta](https://zh.minecraft.wiki/w/Pack.mcmeta) |
| 1.21.9 (25w31a) | Summoning a hostile mob at Peaceful difficulty fails | `summon minecraft:zombie ~ ~ ~` | `# fails at Peaceful from 1.21.9 — gate the line or check the difficulty first` | [命令/summon](https://zh.minecraft.wiki/w/命令/summon) |
| 1.21.11 (25w41a) | `execute if stopwatch` / `execute unless stopwatch` | `# not available before 1.21.11` | `execute if stopwatch sw ..10` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 26.1 (snapshot-5, snapshot-8) | `nbt` text component `plain` field; SNBT syntax highlighting when `interpret:false` | `# no plain field before 26.1` | `tellraw @a {type:"nbt", nbt:"Motion", entity:"@s", plain:true}` | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| 26.2 (snapshot-5) | Team and waypoint colour arguments accept only snake_case colour names | `team modify my_team color darkGreen` | `team modify my_team color dark_green` | [命令/team](https://zh.minecraft.wiki/w/命令/team), [命令/waypoint](https://zh.minecraft.wiki/w/命令/waypoint) |
| 26.3 (snapshot-1) | `execute if slots` / `execute unless slots`; `items` takes a slot source | `# not available before 26.3` | `execute if slots entity @n container.*` | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| 26.3 (snapshot-10) | `data modify … compute …` data source (`integer`/`float` literals from 26.3 pre-1) | `# not available before 26.3` | `data modify storage ns:calc out compute default int <provider>` | [命令/data](https://zh.minecraft.wiki/w/命令/data) |

Three notes that apply to the whole table. `minecraft:` may be omitted from item component names (`[can_place_on={…}]`), and the source's examples switch between the two spellings freely. A nested `/execute` after `run` is always a no-op, and a chain must end with a condition subcommand or `run`, in every version. And `/tp` and `/teleport` are exact aliases since 1.13, so either spelling is correct everywhere in this table.

### Item component arguments in practice

The form you will actually write, for any target from 1.20.5 on:

```mcfunction
give @s minecraft:diamond_sword[minecraft:custom_name='"Excalibur"']
give @s minecraft:diamond_sword[minecraft:lore=['"Line one"','"Line two"']]
give @s minecraft:stone[minecraft:custom_data={mypack:{rune:1}}]
```

`custom_name` and `lore` hold a **text component written as SNBT**: a bare JSON
string inside single quotes, so `'"Excalibur"'` — not `{"text":"Excalibur"}` and
not `"Excalibur"`. The `minecraft:` prefix may be dropped. Anything the components
cannot express goes in `minecraft:custom_data`, read back with
`entity @s SelectedItem.components."minecraft:custom_data"...`.

Components whose value is itself a predicate changed shape once more in 1.21.5
(rows above): `{predicates:[{blocks:"minecraft:dirt"}]}` up to 1.21.4, then the
plain `{blocks:"minecraft:dirt"}`. `unbreakable` and `damage` are `[unbreakable={}]`
and `[damage=58]` from 1.21.5; the 1.20.5–1.21.4 spelling of exactly those two is
not recorded in the sources this table was built from (see *Uncertainties*), so
prefer `custom_name`/`lore`/`custom_data` when the pack must cover that era.

---

## If the pack must support several versions

Do not try to make one file work everywhere. Every line that is illegal in one supported release breaks the function there, so split the per-version content into **overlay sub-packs**: an overlay directory holds a complete data pack tree (`data/`, its own tags, its own functions) and the game applies it only while the running data pack format is inside the entry's range. Entries are order-sensitive: the first entry in `entries` is applied first, and later entries take priority over earlier ones. `directory` is relative to the pack root and may contain only `a-z`, `0-9`, `_` and `-`. Overlay metadata and icons are ignored; the sub-pack's own `pack.mcmeta` is not read.

Skeleton for a pack whose whole range is 1.21.8 or earlier — the entries carry `formats` only:

```json
{
  "pack": {
    "pack_format": 81,
    "supported_formats": [48, 81],
    "description": "Example pack"
  },
  "overlays": {
    "entries": [
      { "formats": [48, 48], "directory": "overlay_1_21" },
      { "formats": [61, 61], "directory": "overlay_1_21_4" },
      { "formats": [71, 81], "directory": "overlay_1_21_5" }
    ]
  }
}
```

Skeleton for a pack that spans the era boundary — the base `pack` carries all four fields, and because at least one overlay applies at 1.21.8 or earlier, `formats` is kept on the entries; an overlay that only applies after 1.21.8 also carries `min_format` / `max_format`:

```json
{
  "pack": {
    "pack_format": 81,
    "supported_formats": [48, 81],
    "min_format": 48,
    "max_format": [107, 1],
    "description": "Example pack"
  },
  "overlays": {
    "entries": [
      { "formats": [48, 61], "directory": "overlay_1_21_through_1_21_4" },
      { "formats": [71, 81], "directory": "overlay_1_21_5" },
      { "formats": [88, 107], "min_format": [88, 0], "max_format": [107, 1], "directory": "overlay_1_21_9_and_later" }
    ]
  }
}
```

Overlay version checks are derived by analogy from the base rules, with one deliberate difference: **if any overlay applies at 1.21.8 or earlier, `formats` must be kept even on overlays that only apply after 1.21.8** — old releases need the file-format validation. Conversely, if no overlay applies at 1.21.8 or earlier, `formats` must not be specified at all; use `min_format` / `max_format` on the entries. The layout to copy is therefore: the **base** `data/` tree holds the content common to every supported version, and each overlay directory holds a full replacement copy of the files that differ for its range.

---

## Uncertainties

Nothing below was verified from a page, so none of it may be treated as syntax to emit.

**From `research/mcfunction-reference.md` §13:**

1. Attribute ID naming: current examples use `minecraft:armor`, `minecraft:max_health`, `minecraft:gravity`, but the page history never states the `generic.` prefix being dropped, nor when. Check the attribute registry for the target version.
2. `schedule <time>` units: the page shows `3s` and `5d` and says `0` fails; whether a bare number means ticks, and whether `t` is a valid suffix, is on a page not read.
3. `/scoreboard players reset` arity is contradictory inside one page: the syntax box says `reset <targets> [<objective>]` while the worked examples add a trailing integer.
4. Named colour list for text components: the 16 names come from the team-colour list on 记分板; `reset` is named there as a team colour but its validity as a component `color` is not confirmed on the text-component page.
5. Whether an indented `   # comment` line is a comment: the macro rule says the `$` must be the first non-whitespace character, the comment rule does not say the same.
6. When `/teleport <targets> <location> <rotation>` and its `facing` variants were introduced: `facing` is dated 18w01a, the `<rotation>` form is undated.
7. Trailing whitespace after a line-continuation `\`: whether the line is trimmed before or after the trailing-backslash test is not stated. Never put a space after the `\`.
8. Whether `function <macro> with entity @s` without a path is valid: only `with entity @p SelectedItem` and `with {…}` are demonstrated.
9. `haspermission` and `hasitem` are Bedrock-only selector arguments; they are not part of the Java argument list. For Java, use `predicate` (1.15+) or `execute if items` (1.20.5+).
10. `minecraft:custom_data` as an item component: only the item-*predicate* form `*[minecraft:custom_data~{id:"test:bar"}]` is documented on the pages read; the write-side component name and its exact semantics are not confirmed.
11. Whether unquoted SNBT keys always parse inside a command argument: the `/scoreboard` examples use JSON with quoted keys, while the text-component page presents the SNBT structure. The cross-version-safe form is double-quoted JSON.
12. `§` (section sign) in Java text was not verified on the pages read; use `color` in the component instead.
13. The `26.x` names are official releases, but development build strings such as `26.2 (pre-1)` and `26.3 (snapshot-10)` were copied verbatim from history tables and their internal build numbering was not cross-checked.
14. The valid `<slots>` / slot-source enumerations for `execute if items` and `execute if slots` live on pages not read.
15. The `/function` command's own argument grammar was not read; the `with` spelling comes from the function page's prose only.
16. The `time`, `rotation`, `item_stack`, `block_predicate`, `score_holder` and `slot_source` argument-type pages were not read, so those types' full grammars are not reproduced here.

**From `research/pack-formats.md` §6:**

17. April Fools version `2.0` (2013) has protocol versions only — no data version, no data pack format.
18. April Fools `15w14a` has a `nil` data version and no data pack format.
19. April Fools `1.RV-Pre1`'s data version 173 predates the stated data-version start (15w32a) and has no second source.
20. Every April Fools data pack format (`24w14potato` 36, `22w13oneBlockAtATime` 9, `20w14∞` 5, `3D Shareware v1.34` 4, `26w14a` 101.1) comes from a single wiki module; the English wiki uses the same module, so this is not an independent source.
21. Conflicting data: `1.21.9-pre1`'s data version is 4549 in the Chinese wiki module and 4548 in the English module and the data-version page. Snapshots only; no release is affected.
22. `26.4` has snapshots only (122.0, 122.1, 123.0) and no release; its final data pack format may stay at 123.0 or rise.
23. Formats `88.0`, `94.1`, `101.1`, `107.1`, `121.0` and the 122.x/123.0 snapshots use major.minor; JSON numbers cannot keep the `.0`, so the display string is authoritative.
24. The source's own release table writes the 101.1 row as "26.1" while the modules and the English wiki cover 26.1 – 26.1.2; this file follows the longer range.

**From `research/datapack-folder-renames.md` §3:**

25. Which snapshot moved `tags/functions` → `tags/function`: the pack-format table (format 43 excludes it, format 45 includes it) and the per-tag history say 24w21a; the 1.21 summary page and the English history lump all six tag renames into 24w19a. 24w21a is treated as correct here.
26. Whether `tags/damage_types` or other plural tag paths ever existed before 24w19a: not confirmed or denied.
27. `decorated_pot_pattern`: the registry ID rename (`decorated_pot_patterns` → `decorated_pot_pattern`) is documented in 24w19a, but the *directory* is documented as newly added in 26.3 snapshot-1; whether a usable `decorated_pot_patterns` directory existed in 1.20.x–26.2 is unconfirmed, so it is absent from the rename tables.
28. `block_transformer` has two dates: the format/component arrived in 26.3 snapshot-2, the standalone file directory only in snapshot-10.
29. `slot_source` behaves the same way: the concept shipped in 1.21.11 / 25w44a, the directory only in 26.3 snapshot-1.
30. `number_provider` was added in 26.3 snapshot-3 and split into `context_float_provider` + `context_int_provider` in 26.3 pre-1; whether `number_provider` still works as an alias is unverified.
31. `pig_variant` is dated 25w02a by the Chinese sources and 25w03a by the English history; both agree on release 1.21.5.
32. `chat_type` is dated 22w18a by the Chinese sources and 22w42a by the English history; both agree on release 1.19.
33. Both the 24w19a/24w21a pages and the English history list only the five tag directories plus `tags/functions`; none lists `damage_types`, so `damage_type` appears in the introduction table only, not as a rename.
34. Coverage beyond 26.3: the 26.4 rows come from snapshot-3 pages and the pack-format template, and 26.4 has not shipped, so its pack format is provisional.

**Found while writing this file:**

35. `data/commands.json` records `place` with `"min": "1.19.4"`; 命令/place dates the command to 1.19 (22w18a), with `template` added in 22w19a. The table above uses 1.19.
36. `data/commands.json` records `return` with `"min": "1.20.2"`; 命令/return dates bare `/return` to 1.20 (23w16a) and only `return run` to 1.20.2.
37. `data/commands.json` lists the objective subcommand `setnumberformat`, while the grammar box on 命令/scoreboard and 记分板 says `scoreboard objectives modify <objective> numberformat`.
38. `data/commands.json`'s `executeConditions` omits `items` (1.20.5), `slots` (26.3) and `stopwatch` (1.21.11), all of which exist in the versions named in this file.
39. The pre-1.21 `attribute … modifier add` argument order around `uuid` and `name` was not read from any page; only the fact that those two parameters were replaced by an `id` in 1.21 (24w21a) is sourced. The `before` cell for that row is therefore a comment, not an emit-ready line.
40. The spelling of `unbreakable` and `damage` during 1.20.5–1.21.4 is not recorded: the source's old-format table shows those two components only for 1.13–1.20.4 (`{Unbreakable:1b}`) and for 1.21.5+ (`[unbreakable={}]`), with the middle era left blank.
41. Whether every individual overlay entry must carry `formats` (rather than only the entry that applies at 1.21.8 or earlier) is not stated; the rule is written about "any overlay" and about the pack "as a whole". The spanning skeleton above puts `formats` on all three entries as the conservative reading.
42. Combining `formats` with `min_format`/`max_format` on a single overlay entry is derived from the stated "by analogy" rule, not from an example; only the base `pack` combination has a worked example.
43. `pack.mcmeta` `description` as a plain JSON string is what the source's own template examples emit for both the old and the new field spelling, but the page's field table types it as a text component; a component object may behave differently on some versions.

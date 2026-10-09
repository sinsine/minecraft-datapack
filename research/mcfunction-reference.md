# Minecraft Java Edition — mcfunction / command syntax reference

**Scope:** only what a datapack author writing `.mcfunction` files needs. Every syntax line is copied from the Chinese Minecraft Wiki grammar box it cites; the source URL is next to each section. Anything ambiguous or unverified is listed in §13 Unverified / uncertain.

**Primary rule for a code generator:** if a line below is not an exact copy of a syntax line or example from the cited page, do not invent a variant of it. The grammar boxes are authoritative; the worked examples are verbatim from the same pages.

**Source pages actually read** (all fetched with `?action=raw`):

| # | Page | URL |
|---|---|---|
| 1 | Java版函数 | https://zh.minecraft.wiki/w/Java版函数 |
| 2 | 命令/execute | https://zh.minecraft.wiki/w/命令/execute |
| 3 | 目标选择器 | https://zh.minecraft.wiki/w/目标选择器 |
| 4 | 命令/data | https://zh.minecraft.wiki/w/命令/data |
| 5 | NBT路径 | https://zh.minecraft.wiki/w/NBT路径 |
| 6 | 命令/scoreboard | https://zh.minecraft.wiki/w/命令/scoreboard |
| 7 | 记分板 (criteria + history) | https://zh.minecraft.wiki/w/记分板 |
| 8 | 文本组件 | https://zh.minecraft.wiki/w/文本组件 |
| 9 | 命令/summon | https://zh.minecraft.wiki/w/命令/summon |
| 10 | 命令/give | https://zh.minecraft.wiki/w/命令/give |
| 11 | 命令/setblock | https://zh.minecraft.wiki/w/命令/setblock |
| 12 | 命令/fill | https://zh.minecraft.wiki/w/命令/fill |
| 13 | 命令/tag | https://zh.minecraft.wiki/w/命令/tag |
| 14 | 命令/schedule | https://zh.minecraft.wiki/w/命令/schedule |
| 15 | 命令/return | https://zh.minecraft.wiki/w/命令/return |
| 16 | 命令/teleport (also covers 命令/tp, which redirects here) | https://zh.minecraft.wiki/w/命令/teleport |
| 17 | 命令/effect | https://zh.minecraft.wiki/w/命令/effect |
| 18 | 命令/attribute | https://zh.minecraft.wiki/w/命令/attribute |

---

## 0. Version-gated differences — the read-me-first table

Pick your target version, then apply every row whose "applies from" is ≤ your version. Rows are the places where the **same intent requires different syntax**.

| # | Feature | Before | From | Applies from | Source |
|---|---|---|---|---|---|
| V1 | Function file folder | `data/<ns>/functions/`, `tags/functions/` | `data/<ns>/function/`, `tags/function/` | **1.21 (24w21a)** | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V2 | Function file extension | `.txt` | `.mcfunction` | 1.12 (pre3) | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V3 | Leading `/` in function lines | allowed | **not allowed** | 1.12 (pre3) | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V4 | Comment syntax | `//` and `#` | **only `#`** | 1.12 (pre3) | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V5 | Line continuation with trailing `\` | — | supported | 1.20.2 (23w31a) | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V6 | Macros (`$` lines, `function … with`) | — | supported | **1.20.2 (23w31a)** | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V7 | `#load` / `#tick` tags | — | `#tick` 1.13 (17w49b), `#load` 1.13 (18w01a) | 1.13 | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V8 | Max command length in a function (incl. macro expansion) | — | 2,000,000 chars | 1.20.5 (24w06a) | [Java版函数](https://zh.minecraft.wiki/w/Java版函数) |
| V9 | Function return value | — | `/return`, functions become Void unless `return` runs | **1.20 (23w16a)** | [命令/return](https://zh.minecraft.wiki/w/命令/return) |
| V10 | `return run` | — | supported (removed in 1.20.2 pre1, restored) | 1.20.2 (23w31a) → 1.20.3 (23w41a) | [命令/return](https://zh.minecraft.wiki/w/命令/return) |
| V11 | `return fail` | — | supported | 1.20.3 (23w44a) | [命令/return](https://zh.minecraft.wiki/w/命令/return) |
| V12 | `execute if function` / `execute unless function` | — | supported (temporarily removed in 1.20.2 pre1) | **1.20.2 (23w31a) / 1.20.3 (23w41a)** | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V13 | `execute if\|unless loaded` | — | supported | 1.19.4 (23w03a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V14 | `execute if\|unless dimension` | — | supported | 1.19.4 (23w03a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V15 | `execute on` (relations) | — | supported (`origin` added 23w04a; `owner` extended to vexes in 26.2) | 1.19.4 (23w03a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V16 | `execute summon` | — | supported | 1.19.4 (23w06a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V17 | `execute positioned over <heightmap>` | — | supported | 1.19.4 (pre1) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V18 | `execute if\|unless biome` | — | supported | 1.19.3 (22w46a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V19 | `execute if\|unless predicate`, `execute store … storage` | — | supported | 1.15 (19w38a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V20 | `execute if\|unless data` | — | supported | 1.14 (18w43a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V21 | `execute if\|unless items` | — | supported | 1.20.5 (24w10a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V22 | `execute if\|unless slots` | — | supported; `items` then takes a slot source | 26.3 (snapshot-1) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V23 | `execute if\|unless stopwatch` | — | supported | 1.21.11 (25w41a) | [命令/execute](https://zh.minecraft.wiki/w/命令/execute) |
| V24 | `data modify … string …` data source | — | supported (`<start>`/`<end>` accept negatives from 1.20 pre1) | **1.19.4 (23w03a)** | [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| V25 | `data modify … compute …` data source | — | supported (`integer`/`float` literals since 26.3 pre-1) | 26.3 (snapshot-10) | [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| V26 | Command storage (`storage <id>` as source/target) | — | supported | 1.15 (19w38a) | [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| V27 | NBT path single quotes `'a b'` | — | supported | 1.20 (pre2) | [NBT路径](https://zh.minecraft.wiki/w/NBT路径) |
| V28 | NBT path child node accepts empty string `""` | accepted | **rejected** | 1.21.5 (25w09a) | [NBT路径](https://zh.minecraft.wiki/w/NBT路径) |
| V29 | Item NBT vs item components in `/give` (and item arguments generally) | `/give @p minecraft:diamond_sword{display:{Lore:[…]}} 1` (1.13–1.20.4) | `[component=…]` two-step change: 1.20.5–1.21.4 predicate-wrapped (`[minecraft:can_place_on={predicates:[{blocks:"minecraft:dirt"}]}]`), then **1.21.5+** the plain component form (`[minecraft:can_place_on={blocks:"minecraft:dirt"}]`) | **1.20.5 (24w09a)**, simplified 1.21.5 | [命令/give](https://zh.minecraft.wiki/w/命令/give) |
| V30 | Component names may omit `minecraft:` | — | `[can_place_on={…}]` accepted | seen in the current examples | [命令/give](https://zh.minecraft.wiki/w/命令/give) |
| V31 | `setblock` block-entity data handling; `strict` mode | modes `destroy\|keep\|replace` | modes `destroy\|keep\|replace\|strict` | 1.21.5 (25w02a) | [命令/setblock](https://zh.minecraft.wiki/w/命令/setblock) |
| V32 | `fill` `strict` mode; `replace` may be followed by extra options; block-entity data handling | — | as stated | 1.21.5 (25w02a) | [命令/fill](https://zh.minecraft.wiki/w/命令/fill) |
| V33 | `fill` block-count limit | hard-coded | game rule `commandModificationBlockLimit` / `max_block_modifications` | 1.19.4 (23w03a) | [命令/fill](https://zh.minecraft.wiki/w/命令/fill) |
| V34 | `summon` `<entity>` argument type | `entity_summon` | `resource` | 1.19.3 (22w42a) | [命令/summon](https://zh.minecraft.wiki/w/命令/summon) |
| V35 | `summon` of hostile mobs at Peaceful difficulty | succeeded | fails | 1.21.9 (25w31a) | [命令/summon](https://zh.minecraft.wiki/w/命令/summon) |
| V36 | `scoreboard` display slot `belowName` | `belowName` | `below_name` | 1.20.2 (23w31a) | [记分板](https://zh.minecraft.wiki/w/记分板) |
| V37 | `scoreboard players display name\|numberformat`, `objectives modify numberformat` / `displayautoupdate` | — | added | 1.20.3 (23w46a) | [记分板](https://zh.minecraft.wiki/w/记分板) |
| V38 | Objective/score-holder name length limit | 16 characters | unlimited | 1.18 (21w37a) | [记分板](https://zh.minecraft.wiki/w/记分板) |
| V39 | `%=` sign semantics | sign of the dividend | `Math.floorMod(x, y)` — sign of the **divisor** | 1.13.1 (18w31a) | [记分板](https://zh.minecraft.wiki/w/记分板) |
| V40 | Objective names may contain `:` | allowed | **rejected** | 1.13 (17w45a) | [记分板](https://zh.minecraft.wiki/w/记分板) |
| V41 | Text components in `/bossbar`, `/scoreboard`, `/team` | resolved with the command's own executor semantics | resolved with `@s` as executor | 1.21.5 (25w05a) | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V42 | **Text components stored as NBT instead of JSON strings**; `clickEvent`→`click_event`; `hoverEvent`→`hover_event`; payload renames (`value`→`url`/`command`/`page`/`path`; `contents`→root; `show_entity.type`→`id`, `show_entity.id`→`uuid`; `show_text.contents`→`value`) | old JSON/`clickEvent`/`hoverEvent` form | new SNBT/`click_event`/`hover_event` form | **1.21.5 (25w02a / 25w03a)** | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V43 | `type` field in text components; plain text always serialized as a string; `null` and `[]` JSON text expressions unsupported | no `type`; `{"text":"x"}` kept; `null`/`[]` allowed | as stated | 1.20.3 (23w40a) | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V44 | `shadow_color` | — | supported | 1.21.4 (24w44a) | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V45 | `custom` / `show_dialog` click events | — | supported | 1.21.6 (25w20a) | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V46 | `object` (sprite) text component type | — | supported (`player` sprite since 25w35a) | 1.21.9 (25w32a) | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V47 | `nbt` text component `plain` field; SNBT syntax highlighting when `interpret:false` | — | supported | 26.1 (snapshot-5 / snapshot-8) | [文本组件](https://zh.minecraft.wiki/w/文本组件) |
| V48 | `attribute` modifier operations | `add`, `multiply_base`, `multiply` | `add_value`, `add_multiplied_base`, `add_multiplied_total` | **1.20.5 (24w09a)** | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| V49 | `attribute` modifier identity | `uuid` + `name` parameters | namespaced ID `id` only | **1.21 (24w21a)** | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| V50 | `attribute … base reset` | — | supported | 1.21.4 (24w44a) | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| V51 | `attribute` `<attribute>` argument type | `resource_location` | `resource` | 1.18.2 (pre3) | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| V52 | Attribute namespaced IDs (`minecraft:generic.movement_speed` → `minecraft:movement_speed`) | `generic.`-prefixed | no `generic.` prefix (all current page examples) | **not verified on the pages read** — see §13 | [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) |
| V53 | `effect` syntax | `effect <目标> <效果> [秒数] [等级] [隐藏粒子]` and `effect <目标> clear` | `effect give …` / `effect clear …` | 1.13 (17w45a) | [命令/effect](https://zh.minecraft.wiki/w/命令/effect) |
| V54 | `effect` infinite duration | — | `<seconds>` may be `infinite` | 1.19.4 (23w05a) | [命令/effect](https://zh.minecraft.wiki/w/命令/effect) |
| V55 | `schedule clear` and `append\|replace` | — | supported (default `replace`) | 1.15 (19w38a) | [命令/schedule](https://zh.minecraft.wiki/w/命令/schedule) |
| V56 | `teleport` gaining `facing` / simplified multi-dimension syntax | — | `facing` 1.13 (18w01a), simplified + cross-dimension 1.13 (18w02a) | 1.13 | [命令/teleport](https://zh.minecraft.wiki/w/命令/teleport) |
| V57 | `@n` selector and `sort=random` for non-players | — | `@n` added | 1.21 (24w21a) | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| V58 | `predicate` selector argument | — | supported | 1.15 (19w38a) | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| V59 | Selector `nbt` argument | — | supported; selector arguments heavily reworked | 1.13 (17w45a) | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| V60 | Invalid selectors silently ignored | ignored | error | 1.11 (16w38a) | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| V61 | `team` selector can match non-mob entities | mobs only | all entities | 1.21.5 (25w05a) | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| V62 | `@n` can select dying entities | yes | no | 1.21 (pre1) | [目标选择器](https://zh.minecraft.wiki/w/目标选择器) |
| V63 | `execute store … entity`/`block` block-entity & item NBT shapes | old `{id:…, Count:…, tag:{…}}` | `{id:…, count:…}` + `components` | 1.20.5 (24w09a) | [命令/give](https://zh.minecraft.wiki/w/命令/give) + [命令/data](https://zh.minecraft.wiki/w/命令/data) |
| V64 | `pack.mcmeta`: `pack_format` value; and since 1.21.9 the required `min_format` / `max_format` fields (with `pack_format` becoming optional, `supported_formats` deprecated) | a different `pack_format` for almost every release | see §0.2 | every release; the `min_format`/`max_format` scheme from **1.21.9–1.21.10 (pack format 88.0)** | `research/pack-formats.md` (sources: [Template:Data pack format](https://zh.minecraft.wiki/w/Template:Data_pack_format), [Module:Protocol version/Versions](https://zh.minecraft.wiki/w/Module:Protocol_version/Versions), [Pack.mcmeta](https://zh.minecraft.wiki/w/Pack.mcmeta), [数据包](https://zh.minecraft.wiki/w/数据包)) |

### 0.1 Quick "which syntax do I emit?" cheat sheet

- **Target 1.20.4 or earlier:** `{NBT}` after the item in `/give`, `functions/` folder, `execute if function` unavailable, `/return` unavailable, `clickEvent`/`hoverEvent`, plain `{"text":"..."}` JSON components.
- **Target 1.20.5 / 1.21.4:** item components with `[...]` where list-shaped components are wrapped, e.g. `[minecraft:lore=['"Sword"']]`, `[minecraft:can_place_on={predicates:[{blocks:"minecraft:dirt"}]}]`; `function/` folder (1.21+); `execute if function` present; `/return` present; `clickEvent`/`hoverEvent` still the spelling; `attribute` operations renamed to `add_value`/`add_multiplied_base`/`add_multiplied_total`; `attribute` modifiers keyed by namespaced `id`.
- **Target 1.21.5+:** item components plain, e.g. `[minecraft:lore=["Sword"]]`, `[minecraft:can_place_on={blocks:"minecraft:dirt"}]`, `[damage=58]`, `[unbreakable={}]`; **`click_event`/`hover_event`** with the renamed payload keys; NPC/NBT (`{id:…, count:…, components:{…}}`) item shape everywhere; `setblock`/`fill` gained `strict`.
- **Target the newest releases (1.21.11 / 26.x):** `execute if stopwatch`, `execute if slots`, `data modify … compute …`, text-component `plain`/sprite `object` — all very recent and unlikely to be supported by a player's client.

### 0.2 `pack.mcmeta` pack formats (sourced from the companion file, not re-derived here)

This table is a summary; the authoritative, fully-sourced version with a per-version listing and a machine-readable `pack-formats.json` lives in the companion file **`research/pack-formats.md`** in this same directory.

| `pack_format` | Release range | Notable breaking change for function authors |
|---|---|---|
| 4 | 1.13 – 1.14.4 | initial data pack format |
| 5 | 1.15 – 1.16.1 | predicates added (`execute if predicate`) |
| 6 | 1.16.2 – 1.16.5 | experimental custom worldgen |
| 7 | 1.17 – 1.17.1 | `/replaceitem` → `/item` |
| 8 | 1.18 – 1.18.1 | worldgen features |
| 9 | 1.18.2 | custom structures / cave generation |
| 10 | 1.19 – 1.19.3 | `filter` field in `pack.mcmeta`; `execute if biome`; macros' precursor era |
| 12 | 1.19.4 | damage types; `data modify … string`, `execute on`/`dimension`/`loaded`, `execute positioned over` |
| 15 | 1.20 – 1.20.1 | sign NBT `Text1` → `front_text.messages[0]`; `/return` added (1.20) |
| 18 | 1.20.2 | **function macros, `\` line continuation, `execute if function`** |
| 26 | 1.20.3 – 1.20.4 | stricter text-component parsing (`type`, no `null`/`[]`); `/return run`/`fail` |
| 41 | 1.20.5 – 1.20.6 | **unstructured item NBT replaced by item components** (`give`, `summon`, item arguments) |
| 48 | 1.21 – 1.21.1 | enchantment / painting-variant definitions; `function/` folder rename; `attribute` modifier `id` |
| 57 | 1.21.2 – 1.21.3 | `trial_spawner`, `instrument` subfolders |
| 61 | 1.21.4 | winter drop data pack removed; `shadow_color` |
| 71 | 1.21.5 | **SNBT format and text-component format substantially changed** (`click_event`/`hover_event`, components stored as NBT, plain item components); `setblock`/`fill` `strict` |
| 80 | 1.21.6 | `dialog` subfolder |
| 81 | 1.21.7 – 1.21.8 | no breaking changes |
| 88.0 | 1.21.9 – 1.21.10 | `supported_formats` deprecated; `pack_format` becomes optional; required `min_format`/`max_format` |
| 94.1 | 1.21.11 | `attack_range` item components, timeline definitions; `execute if stopwatch` |
| 101.1 | 26.1 – 26.1.2 | world clocks, mob sound-variant definitions |
| 107.1 | 26.2 | sulfur cube content; entity predicate format → data-component-like map |
| 121.0 | 26.3 | (no notable change listed) |

Source for the pack-format numbers: `research/pack-formats.md` §1, which derives them from S1 (`Template:Data pack format`), S2 (`Module:Protocol version/Versions`) and S4 (`数据包`), cross-checked against the English wiki. Note that since 1.21.9 the numbers take the form `major.minor`.


---

## 1. Functions (`.mcfunction` files)

Source: https://zh.minecraft.wiki/w/Java版函数 (raw: `?action=raw`)

### 1.1 File location and namespace ID

```
datapacks/<数据包名称>/data/<命名空间>/function/<名称>.mcfunction
```

- The folder is `function` (**singular**) since 1.21 (24w21a). Before 1.21 it was `functions` (plural). The same rename applied to the tag folder: `tags/functions` → `tags/function`.
- Sub-folders are allowed and become part of the function ID: `data/custom/function/example/test.mcfunction` is called as `custom:example/test`.
- There are no functions in vanilla by default; a data pack must define them.

### 1.2 Line-by-line file rules (verbatim)

> 在 `.mcfunction` 文件中，每一行都允许一条不带前导正斜杠 `/` 的命令。可以在每条命令的行首行末添加若干制表符或空格——在读取函数文件时，每行首尾的空白字符都会被忽略。在函数文件中，单个命令的长度不受命令方块字符数上限32,500的限制。

> **单行命令的拆分和续接**：对于一行命令，如果在末尾使用反斜杠 `\`，则允许在下一行添加后续部分。后续行的前后两端的空白会被截去后连接在上一行命令后。

Example of continuation, verbatim (the two lines become the single command `say 你好`):
```mcfunction
say 你 \
    好
```

> **注释**：目前函数文件仅支持单行注释，玩家可以在行首添加 `#` 来注释单行文本。

Rules a generator must obey:
1. **One command per line, no leading `/`.**
2. Leading and trailing whitespace on every line is **ignored** — indentation and trailing spaces are harmless.
3. A line ending in `\` continues on the next line (since 1.20.2 / 23w31a); the next line's leading/trailing whitespace is trimmed and the parts are concatenated.
4. Comments are single-line `#`. `//` is **not** supported (removed in 1.12 pre3).
5. Since 1.20.5 (24w06a) the maximum command length **in a function, including macro expansion, is 2,000,000 characters**.
6. A single command is **not** limited to the command block's 32,500-character cap.

### 1.3 Macros (since 1.20.2 / 23w31a)

> 将函数中的一行以 `$` 开头（作为首个非空白字符），即可标记这一行为宏命令，同时所在函数也将成为宏函数；宏命令还必须以 `$(键)` 的形式包含一个或更多的替换段。

Key character set (verbatim — anything else makes the replacement segment invalid):
```
abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ
0123456789
_
```

Example macro function, verbatim:
```mcfunction
$give @s $(id) $(count)
```
Called as:
```mcfunction
function test:macro_func with entity @p SelectedItem
# test:macro_func中实际可能执行的命令根据玩家手持物品变化：
# give @s minecraft:apple 1
# give @s minecraft:stick 33
# ...
```

`function ... with` sources shown on the page:
```mcfunction
function test:macro_func with entity @p SelectedItem
function test:test {x:1s, y:2b, z:3L}
```

Value conversion rules (verbatim):
> * 对于 int、float、double、byte、long、short，则直接转化为文本形式，不保留类型尾缀，小数位数最多保留15位，且会将浮点数的指数形式化为小数形式（例如 `1.2E1` 将会转化为 `12`）。
> * 对于 string，直接提取其值（无最外层作为字符串标识的引号）。
> * 对于 list、compound、int-array、byte-array、long-array，则使用相应的 SNBT 形式。

Macro failure rules (verbatim):
> 传递给宏函数的复合标签中可以有多余的键值对，但不能缺漏所执行宏函数所需的参数，否则整个宏函数也将不会运行。
> 由于每条宏命令实际上最终都将被替换为一个普通命令并解析执行，所以若其中的一条在替换后无法形成有效命令也会导致整个所在函数解析失败。
> 若调用非宏函数使用复合标签，则会忽略而不报错。

Performance note (verbatim): non-macro lines are parsed at load time; macro lines are parsed **every call**, and the game caches (parameter → parsed command) results, so repeated calls with identical parameters are cheaper but still cost more than a plain function.

### 1.4 Loading, parsing and execution

- `/reload` re-reads functions from disk. Functions are also loaded when opening the world/server.
- **On load, every non-macro line must parse as a command, otherwise the whole function fails to load.** Macro lines are only parsed when the function is called.
- In singleplayer/LAN, a function may run any command with permission level ≤ 2. On a server, the limit is `function-permission-level` in `server.properties` (added in 1.14.4 pre4).
- All commands in one function call, including sub-functions called via `/function`, run **within a single game tick**. The total command count per tick is limited by the `maxCommandChainLength` game rule (default 65536); commands beyond it are ignored at runtime.
- The function stores the caller's parameters (execution entity, position, rotation, dimension, anchor) into its execution context and provides them to every command. `/execute` inside the function changes the context **only for that one command**; the change is not carried over to later lines.
- If the executor is the server (display name "Server"), the execution position is the **world spawn**.
- Recursion is allowed and is bounded by `maxCommandChainLength`.

Worked example copied verbatim:

```mcfunction
execute as @a at @s run function foo:bar
```
where `foo:bar` contains:
```mcfunction
teleport @s ~ ~5 ~
execute at @s run setblock ~ ~-1 ~ minecraft:diamond_block
setblock ~ ~-1 ~ minecraft:emerald_block
```
> 以上命令执行成功后，所有玩家都将被向上传送5格，并在其传送前脚下的位置放置绿宝石块。由于第2条命令使用 `execute` 的 `at` 子命令改变了其位置参数，故钻石块会被放置在传送后的位置。

This is the canonical demonstration that `/execute` state does not leak between lines.

### 1.5 Return values

- `/return` (see §10.1) aborts the function. Without any `return` the function is a **Void function** and has no return value at all.
- A function called by `/function` passes its result to `/function`'s output; a function called by `/execute (if|unless) function` is tested for a **non-zero return value**.
- Return result = success flag (boolean) + integer return value; the wiki shows the message `commands.function.result` e.g. "42".

### 1.6 Calling functions

```mcfunction
function #example:example_tag
```
calls every function listed in `data/example/tags/function/example_tag.json`.

Other callers:
- **Progress (advancement) rewards** — the executing entity is the player who completed the advancement:
  ```json
  {
      "rewards": {
           "function": "命名空间:指向函数文件的路径"
      }
  }
  ```
- **Function tags** — functions run in the order they are defined in the tag file; if the same function appears more than once, it runs **only on the first occurrence**.
- **`/schedule`** — the server executes it later (executor = server, position = world spawn).
- **Enchantment effect `run_function`** — executor is generally the effect's target:
  ```json
  ...
    "type": "run_function",
    "function": "test:test",
  ...
  ```

### 1.7 The two special tags: `minecraft:load` and `minecraft:tick`

Verbatim:
> * 在 `#load` 标签中列出的函数将在世界加载时或者服务器被启动时执行。每当数据包重载时，这些函数也将被执行。
>   * 除了在数据包重载时执行外，这些函数执行的时间早于玩家进入世界的时间，因此无法使用目标选择器来找到玩家，诸如 `tellraw` 和 `title` 命令将不会为任何玩家显示消息。
> * 在 `#tick` 标签中列出的函数将在每一刻开始时执行。随着游戏刻递增，这些函数持续反复执行。

So: **`#load` cannot see players** — no `@a`, `@p`, `@r`, `@s`, no `tellraw` reaching anyone. It is the right place to create objectives, storages and constants. `#tick` runs at the start of every tick.

Both tag files live at `data/minecraft/tags/function/load.json` and `data/minecraft/tags/function/tick.json` (folder `tags/function` since 1.21).

### 1.8 Function version history (verbatim, condensed)

| Version | Change |
|---|---|
| 1.12 (pre1) | functions added, stored as `data/<namespace>/<file>.txt`; `gameLoopFunction` game rule added |
| 1.12 (pre3) | extension changed `.txt` → `.mcfunction`; commands may no longer begin with `/`; only `#` comments (the previous `//` removed) |
| 1.13 (17w43a) | custom functions moved into data packs |
| 1.13 (17w45a) | functions are fully parsed and cached **at load time** |
| 1.13 (17w49b) | functions can have tags; `minecraft:tick` runs at the start of every tick; `gameLoopFunction` removed |
| 1.13 (18w01a) | `minecraft:load` functions run after loading/reloading a data pack |
| 1.14.1 (pre1) | functions execute in file order |
| 1.14.4 (pre4) | `function-permission-level` added to `server.properties` |
| 1.19.3 (22w46a) | fixed `#tick` running before `#load` (MC-187539) |
| **1.20.2 (23w31a)** | **backslash line continuation added; macros added (macro lines / macro functions)** |
| 1.20.2 (pre1) | numeric macro arguments no longer include an SNBT type suffix when inserted |
| 1.20.3 (23w41a) | functions and `/function` adapted to `/return`: functions no longer have a return result unless `/return` executes; the behaviour where every command in a function called by `execute store ... run function` stored a value was removed; command-count limit handling improved |
| 1.20.5 (24w06a) | maximum command length in a function (**including macro expansion**) is 2,000,000 characters |
| **1.21 (24w21a)** | **data pack folder `functions` renamed to `function`; function tag folder `tags/functions` renamed to `tags/function`** |


---

## 2. `/execute`

Source: https://zh.minecraft.wiki/w/命令/execute (raw: `?action=raw`)

`/execute` is a **collection of subcommands**. It changes the command execution context (modifier subcommands), performs conditional tests (condition subcommands), stores return values (store subcommands, Java only), and then runs another command.

### 2.1 The hard ordering / structure rules (read this first)

Verbatim rules from the wiki (用法 → 子命令):

> 子命令可以在 `execute` 后串连在一起使用，可出现在命令的任意位置及重复任意次数。但 `run` 子命令除外，其只能位于 `execute` 末尾且只能使用一次，同时可用于嵌套执行 `execute`。
>
> `execute` 命令的结尾必须为条件子命令或 `run` 子命令，否则命令不可解析。
>
> 各子命令按其在命令中的顺序被依次处理

Consequences for an author (all directly implied by the quoted text):

| Rule | Detail |
|---|---|
| `run` | Optional, but if present it **must be last** and used **once**. |
| Command end | The chain **must end** with either a condition subcommand (`if`/`unless`) **or** `run`. `execute as @a` alone does not parse. |
| Repetition | Modifier and condition subcommands may repeat and appear in any order. |
| `store` position | `store` must come before the final `run`/condition; it is itself a subcommand that is "processed, recording the storage location in advance, without affecting the other subcommands". |
| Same subcommands, different order ⇒ different result | `execute as @e at @s run tp @s ^ ^ ^1` moves every entity along **its own** facing; `execute at @s as @e run tp @s ^ ^ ^1` moves all entities one block along the **executor's** facing. |
| `run execute` | `... run execute ...` never does anything (`... run execute ...` 在任何情况下都不会起任何作用) — it just resets to the root command node. |
| Forking | `as`/`at`/`facing entity`/`positioned as|over`/`rotated as` fork the chain into one branch per matched entity. |
| Aborted branch | If a condition fails or `as` selects nothing, that branch **aborts and does nothing** (does not run `run`, does not store). If all branches abort, `/execute` itself aborts. |
| Depth order | Java processes subcommands **breadth-first** (广度优先): all other subcommands are handled before `run`, so `run` cannot influence the other subcommands. |

### 2.2 Full Java syntax tree (verbatim from 语法树)

`''-> execute''` marks every position where the next subcommand may continue the chain.

```
execute ...
... align <axes> -> execute
... anchored <anchor> -> execute
... as <targets> -> execute
... at <targets> -> execute
... facing ...
    ... <pos> -> execute
    ... entity <targets> <anchor> -> execute
... in <dimension> -> execute
... on (attacker|controller|leasher|origin|owner|passengers|target|vehicle) -> execute
... positioned ...
    ... <pos> -> execute
    ... as <targets> -> execute
    ... over <heightmap> -> execute
... rotated ...
    ... <rot> -> execute
    ... as <targets> -> execute
... (if|unless) ...
    ... biome <pos> <biome> -> execute
    ... block <pos> <block> -> execute
    ... blocks <start> <end> <destination> (all|masked) -> execute
    ... data ...
        ... block <source> <path> -> execute
        ... entity <source> <path> -> execute
        ... storage <source> <path> -> execute
    ... dimension <dimension> -> execute
    ... entity <entities> -> execute
    ... function <name> -> execute
    ... items ...
        ... block <source> <slots> <item_predicate> -> execute
        ... entity <source> <slots> <item_predicate> -> execute
    ... loaded <pos> -> execute
    ... predicate <predicate> -> execute
    ... score <target> <targetObjective>
        ... (=|<|<=|>|>=) <source> <sourceObjective> -> execute
        ... matches <range> -> execute
    ... stopwatch <id> <range> -> execute
... store (result|success) ...
    ... block <target> <path> (int|float|short|long|double|byte) <scale> -> execute
    ... bossbar <id> (value|max) -> execute
    ... entity <target> <path> (int|float|short|long|double|byte) <scale> -> execute
    ... score <targets> <objective> -> execute
    ... storage <target> <path> (int|float|short|long|double|byte) <scale> -> execute
... run ...
```

> Note: the newest snapshot additions (`stopwatch` = 1.21.11 / 25w41a, `slots` = 26.3 snapshot-1) appear in the live syntax tree. See §13 version table.

### 2.3 Modifier subcommands — exact syntax + arguments

#### align
```
align <axes> -> execute
```
`<axes>` is a swizzle: any non-empty combination of `x`, `y`, `z` **in the order x → y → z as written** (e.g. `xz`, `yxz`, `y`). Floors the named axes of the execution position, turning them into block coordinates. Wrong argument == syntax error.

- `execute positioned 2.4 -1.1 3.8 align yxz run spawnpoint @p ~ ~ ~` → execution position (2.4,-1.1,3.8) becomes (2,-2,3).

#### anchored
```
anchored <anchor> -> execute
```
`<anchor>` = `eyes` | `feet`. Default is `feet`. Affects `facing` and local coordinates `^ ^ ^`.

- `execute anchored eyes run tp ^ ^ ^` moves the executor's **feet** to its former **eye** position.

#### as
```
as <targets> -> execute
```
Sets the **executor** (执行者) to `<targets>`. Forks breadth-first in Java. If `<targets>` selects nothing ⇒ the command terminates (分支中断).

#### at
```
at <targets> -> execute
```
Sets execution **dimension + position + rotation** from `<targets>`. Does **not** change the executor.

- `execute at @e[type=sheep] run kill` kills **the executor**, not the sheep (the wiki states this explicitly).

#### facing
```
facing <pos> -> execute
facing entity <targets> <anchor> -> execute
```
Turns the vector from the execution anchor to the given point (or the entity's anchor point) into the execution rotation. `<anchor>` = `eyes`|`feet`. If start ≈ end, rotation is fixed to (-90, 0).

#### in
```
in <dimension> -> execute
```
Sets execution dimension. Position is rescaled by `S = s1/s2` (source `coordinate_scale` / target `coordinate_scale`) on **x and z only, y unchanged** — this is why `in the_nether run tp ~ ~ ~` divides x,z by 8.

- `execute in the_end run locate structure end_city`

#### on (Java only)
```
on (attacker|controller|leasher|origin|owner|passengers|target|vehicle) -> execute
```
Sets the executor to the entity related by that relation. Returns 0 elements (aborts the branch) if the relation does not apply / no match.

Relation meanings (verbatim list): `attacker` = last entity to damage the executor within the last 5 seconds; `controller` = entity controlling the executor; `leasher` = entity holding the executor on a lead; `origin` = the executor's source (projectile→shooter, item→thrower, area_effect_cloud→source, primed TNT→igniter, evoker fangs/vex→summoner); `owner` = owner of a tameable mob or vex; `passengers` = entities directly riding the executor; `target` = the mob's attack target (mob memory) or the interaction entity's player; `vehicle` = the entity the executor rides.

- `execute as @e[type=sheep] on attacker run kill`

#### positioned
```
positioned <pos> -> execute
positioned as <targets> -> execute
positioned over <heightmap> -> execute
```
- Relative/local coordinates apply the current anchor; otherwise the anchor is **reset to `feet`**.
- `<heightmap>` ∈ `world_surface` | `motion_blocking` | `motion_blocking_no_leaves` | `ocean_floor`. Aborts if the position is not loaded.

#### rotated
```
rotated <rot> -> execute
rotated as <targets> -> execute
```
`<rot>` = `<yaw> <pitch>` (two numbers). Both forms fork when multiple entities are selected.

#### summon (Java only)
```
summon <entity> -> execute
```
Immediately summons one entity and sets it as the **executor**.
- `execute summon pig run tag @s add test`

### 2.4 Condition subcommands — `if` / `unless`

Semantics (verbatim): `if` = "如果……就", `unless` = "除非……否则". Identical argument structure, opposite result.

Placement rules (verbatim):
> * 位于整条命令的末尾时，条件子命令会直接输出测试结果。
> * 不位于整条命令的末尾时，条件子命令会根据自身语义与测试结果，决定后续子命令是否执行。

So `execute if ...` **without `run`** is legal and returns `success`/`result` (both `1` on success for most conditions). **`run` is not mandatory** — but if you want a side effect you must add it.

Complete condition list:

| Condition | Exact syntax | Since (Java) |
|---|---|---|
| block | `(if\|unless) block <pos> <block>` | 1.13 |
| blocks | `(if\|unless) blocks <start> <end> <destination> (all\|masked)` | 1.13 |
| data | `(if\|unless) data block <source> <path>` / `data entity <source> <path>` / `data storage <source> <path>` | 1.14 (18w43a) |
| entity | `(if\|unless) entity <entities>` | 1.13 |
| score | `(if\|unless) score <target> <targetObjective> (=|<|<=|>|>=) <source> <sourceObjective>` and `... matches <range>` | 1.13 |
| predicate | `(if\|unless) predicate <predicate>` | 1.15 (19w38a) |
| biome | `(if\|unless) biome <pos> <biome>` | 1.19.3 (22w46a) |
| dimension | `(if\|unless) dimension <dimension>` | 1.19.4 (23w03a) |
| loaded | `(if\|unless) loaded <pos>` | 1.19.4 (23w03a) |
| function | `(if\|unless) function <name>` | 1.20.2 (23w31a), removed in pre1, re-added 1.20.3 (23w41a) |
| items | `(if\|unless) items block <source> <slots> <item_predicate>` / `items entity <source> <slots> <item_predicate>` | 1.20.5 (24w10a) |
| stopwatch | `(if\|unless) stopwatch <id> <range>` | 1.21.11 (25w41a) |
| slots | `(if\|unless) slots block <source> <slots>` / `slots entity <source> <slots>` | 26.3 snapshot-1 |

Per-condition detail and gotchas:

- **block** — `<pos>` must be a block position, loaded and inside the world, otherwise the branch aborts. `<block>` may carry block states and NBT (`block_predicate`).
- **blocks** — compares a source region against a destination region of the same size; `<destination>` is the north-west-bottom corner (smallest coordinate). Aborts if the source region has **more than 32768 blocks**. `all` matches all blocks, `masked` ignores air. `result` = number of matched blocks for `if`, `1` for `unless`; `success` = 1.
- **data** — `if`/`unless data` returns `result` = count of matched tags for `if`, `1` for `unless`. Aborts if a `block` source is not a block entity or is unloaded, or if an `entity` source selects nothing.
  - `execute as @a if data entity @s {OnGround:1b} run give @s minecraft:stone 1`
  - `execute as @e[type=zombie] unless data entity @s equipment.head.id run kill`
- **entity** — `result` = number of matched entities (`if`) / `1` (`unless`).
  - `execute if entity @e[type=sheep] run function foo:bar`
- **function** — **cannot be placed at the end of the subcommand chain** (wiki cites MC-267799 as Invalid). It executes the function and tests for a non-zero return value. If the function or tag does not exist, or the tag is empty, the whole `/execute` terminates. With a tag, functions run in tag order and the first non-zero result ends the tag's execution.
  - `execute unless function generic:test run say 1`
- **loaded** — `success` and `result` both `1` on success. Aborts if `<pos>` is outside the world.
  - `execute if loaded ~ ~ ~500`
- **predicate** — accepts a namespaced predicate ID **or an inline predicate compound**: `/execute if predicate {condition:weather_check, raining:true}`. `success`/`result` = 1. Aborts if the predicate does not exist.
- **score** — the `matches <range>` form uses an int range (`5`, `5..`, `..5`, `5..10`). If either holder is `*`, the test fails (可以执行`*`但判定失败).
  - `execute if score @s a = @s b`
  - `execute as @a unless score @s test = @s test run say "分数已重置"` (true when the score is **unset**)
- **items** — `result` = total number of matched items (`if`) / `1` (`unless`). Aborts if `<slots>` is not a valid slot for that block/entity, or if the item predicate matches nothing in those slots. Item predicate syntax includes component tests:
  - `execute if items entity @p armor.* *[minecraft:custom_data~{id:"test:bar"}]`
- **slots** — tests only whether matching slots exist; `result` = number of matched slots.

### 2.5 Store subcommands (Java only)

```
store (result|success) block <target> <path> (int|float|short|long|double|byte) <scale> -> execute
store (result|success) bossbar <id> (value|max) -> execute
store (result|success) entity <target> <path> (int|float|short|long|double|byte) <scale> -> execute
store (result|success) score <targets> <objective> -> execute
store (result|success) storage <target> <path> (int|float|short|long|double|byte) <scale> -> execute
```

- `result` vs `success`: `result` is the integer return value of the final subcommand (floor-rounded if fractional); `success` is always `0` or `1`.
- `store ... block|entity|storage` requires the **type keyword** (`int|float|short|long|double|byte`) **and** the `<scale>` multiplier — in that order, both mandatory. Missing either ⇒ syntax error.
- `store ... score` takes **no** type and **no** scale.
- `store ... block|entity` does nothing if the path does not exist (路径不存在时不进行操作).
- `store ... storage` **creates** the storage if it does not exist.
- `store ... entity` cannot modify a player's NBT (与 `data` 一样).
- Value stored is `floor(returnValue) * scale`.
- Storing multiple branches into the same location overwrites, it does not accumulate; the value left is the last branch's.
  - `execute store result score #temp var run data get entity @s Motion`
  - `execute store result entity @n[type=pig] Motion[1] double 0.5 run scoreboard players get #temp var`
  - `execute store result bossbar minecraft:test value run scoreboard players get boss_health var`

### 2.6 run

```
run ...
```
`...` = one complete command, **without a leading slash** in Java. `run` resets the command node to the brigadier root, so the command after `run` is parsed as a fresh top-level command (this is why `run execute ...` is a no-op).

### 2.7 Worked examples copied verbatim from the page

```
execute positioned -1.8 2.3 5.9 align xz run tp ~ ~ ~
execute positioned 2.4 -1.1 3.8 align yxz run spawnpoint @p ~ ~ ~
execute anchored eyes run tp ^ ^ ^
execute anchored eyes run tp ^5 ^ ^
execute as @e[type=sheep] run data get entity @s
execute as @a[gamemode=spectator] run spectate
execute at @r run setblock ~ ~-1 ~ stone
execute as @e[type=sheep] at @s run tp ~ ~1 ~
execute at @e[type=sheep] run kill
execute in the_end run locate structure end_city
execute in the_nether positioned as @s run tp ~ ~ ~
execute as @e[type=sheep] on attacker run kill
execute as @e[type=cat] on leasher run damage @s 2 generic
execute positioned 0 64 0 run locate structure #village
execute as @e[type=sheep] at @s rotated as @p run tp @s ^ ^ ^1
execute summon pig run tag @s add test
execute summon pig run function test:test
execute as @a at @s if block ~ ~-1 ~ stone run kill
execute if biome ~ ~ ~ #minecraft:has_structure/jungle_temple
execute as @a if data entity @s {OnGround:1b} run give @s minecraft:stone 1
execute as @a at @s if dimension minecraft:overworld run say YES
execute if entity @e[type=sheep] run function foo:bar
execute as @e[type=creeper] at @s unless entity @e[type=ocelot,distance=..3] run kill
execute unless function generic:test run say 1
execute if items entity @p armor.* *[minecraft:custom_data~{id:"test:bar"}]
execute if loaded ~ ~ ~500
execute if predicate {condition:weather_check, raining:true}
execute if predicate test:foo
execute if score @s a = @s b
execute if slots entity @n container.*
execute if stopwatch sw ..10
execute store result bossbar minecraft:test value run scoreboard players get boss_health var
execute store result entity @n[type=pig] Motion[1] double 0.5 run scoreboard players get #temp var
execute store result score #temp var run data get entity @s Motion
execute as @a at @s anchored eyes run particle smoke ^ ^ ^3
execute as @a at @s if block ~ ~ ~ water run say "我的脚湿了！"
execute as @a unless score @s test = @s test run say "分数已重置"
execute at @p as @e[type=pig,distance=..3] run data merge entity @s {Motion:[0.0,2.0,0.0]}
execute as @e[type=zombie] unless data entity @s equipment.head.id run kill
execute as @e[type=armor_stand] as @e[type=armor_stand] run summon armor_stand
execute as @a if data entity @s Inventory[{Slot:0b}].components."minecraft: enchantments".levels."minecraft:efficiency" run tp 0 64 0
```

### 2.8 Java version history for `/execute` (verbatim, condensed)

| Version | Change |
|---|---|
| 1.8 (14w07a) | `/execute` added |
| 1.13 (17w45a) | Syntax split into subcommands |
| 1.13 (17w45b) | `execute store (result\|success)` reworked |
| 1.13 (18w02a) | New subcommands added |
| 1.13 (18w05a) | `execute store (result\|success) bossbar` added |
| 1.14 (18w43a) | `execute (if\|unless) data` added |
| 1.15 (19w38a) | `execute (if\|unless) predicate` and `execute store (result\|success) storage` added |
| 1.19.3 (22w46a) | `execute (if\|unless) biome` added |
| 1.19.4 (23w03a) | `execute on`, `execute (if\|unless) dimension`, `execute (if\|unless) loaded` added |
| 1.19.4 (23w04a) | `on origin` added |
| 1.19.4 (23w06a) | `execute summon` added |
| 1.19.4 (pre1) | `execute positioned over` added |
| 1.20.2 (23w31a) | `execute (if\|unless) function` added |
| 1.20.2 (pre1) | `execute (if\|unless) function` temporarily removed |
| 1.20.3 (23w41a) | `execute (if\|unless) function` re-added |
| 1.20.5 (24w10a) | `execute (if\|unless) items` added |
| 1.21.11 (25w41a) | `execute (if\|unless) stopwatch` added |
| 26.2 (pre-1) | `execute on owner` now also works for vexes |
| 26.3 (snapshot-1) | `execute (if\|unless) slots` added; `items` changed to accept a slot source |


---

## 3. Target selectors

Source: https://zh.minecraft.wiki/w/目标选择器 (raw: `?action=raw`)

Java and Bedrock selectors differ substantially; **everything below is Java unless marked Bedrock**.

### 3.1 Selector variables

| Variable | Meaning |
|---|---|
| `@p` | nearest player |
| `@r` | random player |
| `@a` | all players (alive or dead) |
| `@e` | all **living** entities in loaded chunks (including players); cannot select dying entities |
| `@s` | the command's **executor** (1 entity, even if dying) |
| `@n` | nearest entity (1) — added in Java 1.21 (24w21a) |
| `@c` / `@v` | Education Edition only (your agent / all agents) |
| `@initiator` | Bedrock/EE only (player interacting with an NPC) |

Verbatim notes that matter for datapacks:

> `@s` — 只选择1个实体：该命令的执行者，无论是否濒死。若命令执行者为命令方块或服务器控制台执行命令，则此选择器不会选中任何东西。

> `type` 参数不适用于 `@p`。
> `type` 参数不适用于 `@a`。

> [[#数量|limit/sort]] — `@r` 只能选玩家；要随机选非玩家实体，Java 用 `@n[sort=random,type=<实体类型>]` 或 `@e[sort=random,limit=1,type=<实体类型>]`。

### 3.2 Selector argument syntax

> 在目标选择器变量之后附加键值对构成的逗号分隔，并包含在方括号中：
> `@<变量>[<参数>=<值>,<参数>=<值>,…]`
> 参数和值区分大小写，括号、等号和逗号旁可以有空格（目标选择器和第一个方括号之间除外）。键值对只能用逗号分隔。

So all of these are legal in Java: `@e[type=pig]`, `@e[ type = pig ]` — but **not** `@e [type=pig]`.

Argument list (Java):

| Argument | Exact syntax | Filters by |
|---|---|---|
| `x`,`y`,`z` | `[x=<值>,y=<值>,z=<值>]` | selector origin (does **not** move the execution position) |
| `distance` | `[distance=<值>]`, `[distance=<最小>..<最大>]`, `[distance=<最小>..]`, `[distance=..<最大>]` | Euclidean sphere around the origin; **non-negative only**; cannot cross dimensions |
| `dx`,`dy`,`dz` | `[dx=<值>,dy=<值>,dz=<值>]` | axis-aligned box; entity hitbox must **intersect** it |
| `scores` | `[scores={<记分项>=<值>,...}]` | scoreboard scores, supports ranges |
| `tag` | `[tag=<标签>]`, `[tag=!<标签>]`, `[tag=]`, `[tag=!]` | scoreboard tags |
| `team` | `[team=<队伍>]`, `[team=!<队伍>]`, `[team=]`, `[team=!]` | team membership |
| `name` | `[name=<名称>]`, `[name=!<名称>]` | entity **display name** (a plain string, not JSON) |
| `type` | `[type=<实体ID>]`, `[type=!<实体ID>]`, `[type=#<实体标签>]` | entity type or entity-type tag |
| `predicate` | `[predicate=<命名空间ID>]`, `[predicate=!<命名空间ID>]` | data-driven predicate |
| `x_rotation` | `[x_rotation=<值>]`, ranges | vertical rotation (−90 up … 90 down; increases downward) |
| `y_rotation` | `[y_rotation=<值>]`, ranges | horizontal rotation (−180 north, −90 east, 0 south, 90 west, 180 north) |
| `nbt` | `[nbt=<SNBT复合标签>]` | subset SNBT match of entity data |
| `level` | `[level=<值>]`, ranges | XP level; auto-excludes non-players |
| `gamemode` | `[gamemode=<模式>]`, `[gamemode=!<模式>]` | `spectator`/`adventure`/`creative`/`survival`; auto-excludes non-players |
| `advancements` | `[advancements={<进度ID>=<true\|false>},...]` and the nested criterion form | advancement progress |
| `limit` | `[limit=<值>]` | max count |
| `sort` | `[sort=(nearest\|furthest\|random\|arbitrary)]` | ordering (only meaningful with `limit`) |

Bedrock-only arguments documented on the same page: `r`/`rm` (instead of `distance`), `rx`/`rxm`, `ry`/`rym`, `c` (instead of `limit`/`sort`), `m` (instead of `gamemode`), `l`/`lm` (instead of `level`), `family`, `hasitem`, `haspermission`, `has_property`. **`haspermission`, `hasitem`, `family` and `has_property` are NOT Java selector arguments** (the wiki marks each `{{exclusive|bedrock}}` / `{{only|be}}`).

### 3.3 Origin / distance / volume semantics (verbatim formulas)

Origin (`x`,`y`,`z`):
> 这个位置将成为目标选择器原点（不修改命令执行位置）… 如果其中任意参数未定义，则默认使用命令执行位置的坐标。如果定义了其中任意一个参数，则此目标选择器不能跨维度选择目标。
> 坐标可以是整数或像 `12.34` 这样的小数（具体为双精度浮点数）且不会进行中心校正（center-corrected），这意味着 `x=0` 不再自动更正为 `x=0.5`。

Volume (`dx`,`dy`,`dz`) — the exact box is:
- minimum corner: `(min(x, x+dx), min(y, y+dy), min(z, z+dz))`
- maximum corner: `(max(x, x+dx)+1, max(y, y+dy)+1, max(z, z+dz)+1)`
- side lengths are always `|dx|+1`, `|dy|+1`, `|dz|+1`
- unspecified components default to `0`; each may be negative or fractional; each may not be repeated

`limit`/`sort` defaults:
- `@p` and `@n` default to `sort=nearest`; `@r` defaults to `sort=random`; `@a` and `@e` default to `sort=arbitrary` (生成时间由远到近).
- `limit` **can** cross dimensions (unlike `distance`/`dx`/`dy`/`dz`).
- Fewer matching targets than `limit` does not fail the command.

### 3.4 NBT filter vs predicate

- `[nbt=<SNBT>]` is a **subset** match on the entity's NBT. The wiki note:
  > 注意：当匹配字符串内的命名空间ID时，不得省略其命名空间。因此 `@e[type=item,nbt={Item:{id:"slime_ball"}}]` 找不到任何东西，因为 `id` 字段始终包含一个已经被转换的命名空间ID字符串。
- `@e[nbt={Tags:["a","b"]}]` is equivalent to `@e[tag=a,tag=b]`, but the latter is simpler and cheaper (verbatim: 后者更简单，且减少了CPU的负载).
- `[predicate=<id>]` is the data-driven replacement for complex NBT tests (added 1.15 / 19w38a).

### 3.5 Selector restrictions imposed by command arguments (Java)

Verbatim rules from 命令参数限制 — these are the rules that make a command **fail to parse**:

> === 必须为玩家类型 ===
> 受到此限制的选择器须符合以下条件之一：
> * 变量为 `@e` 或 `@n`，且包含参数 `type=player`
> * 变量为 `@a`、`@p`、`@r`、`@s`
> 若命令参数要求选择器必须为玩家类型，但输入的不符合条件，Java 中命令将无法解析。

> === 必须单一数量 === (Java only)
> 受到此限制的选择器须符合以下条件之一：
> * 变量为 `@a`、`@e`，且包含参数 `limit=1`
> * 变量为 `@s`，且不包含 `limit` 参数
> * 变量为 `@p`、`@r`、`@n`，且不包含 `limit` 参数或 `limit` 参数为 `limit=1`
> 若命令参数要求选择器必须为单一数量，但输入的不符合条件，命令将无法解析。

Practical consequence: `tellraw @e[...]` is a parse error (`tellraw` requires players), and `data get entity @e[type=pig]` is a parse error (requires a single entity) — write `@e[type=pig,limit=1]`.

### 3.6 Examples copied verbatim

```
@p[x=0,y=0,z=0]
@e[limit=3,sort=nearest,dx=10,dz=10]
@e[distance=10]
@e[distance=10..12]
@e[distance=5..]
@e[distance=..15]
@e[x=1,y=2,z=3,dx=4,dy=5,dz=6]
@e[x=1,y=2,z=3,dx=0,dy=0,dz=0]
@e[x=0,y=0,z=0,dx=-1,dy=-2,dz=-3]
@a[x=0,y=0,z=0,dx=-0.5,dy=0,dz=0.5]
@s[y=320,dy=100]
@e[scores={myscore=10}]
@e[scores={myscore=10..12}]
@e[scores={myscore=5..}]
@e[scores={myscore=..15}]
@e[scores={foo=10,bar=1..5}]
@e[tag=a,tag=b,tag=!c]
@r[tag=a]
@a[team=red]
@e[name=!Steve]
@e[name=""]
@e[type=minecart]
@e[type=!chicken,type=!cow]
@e[type=#skeletons]
@a[predicate=example:test_predicate]
@e[predicate=!minecraft-wiki:smart_entity]
@e[x_rotation=0]
@e[x_rotation=30..60]
@e[x_rotation=45..]
@e[x_rotation=..0]
@a[y_rotation=0]
@a[y_rotation=45]
@a[y_rotation=96]
@a[y_rotation=-90..0]
@a[y_rotation=-90..90]
@a[y_rotation=90..-90]
@a[y_rotation=0..]
@a[nbt={SelectedItem:{id:"minecraft:diamond_sword"}}]
@e[type=sheep,nbt={Color:0b}]
@e[type=item,nbt={Item:{id:"minecraft:slime_ball"}}]
@e[nbt={Tags:["a","b"]}]
@a[level=5]
@a[level=5..15]
@a[level=5..]
@a[level=..15]
@a[gamemode=survival]
@a[gamemode=!survival,gamemode=!adventure]
@a[advancements={story/form_obsidian=true}]
@a[advancements={story/form_obsidian=false}]
@a[advancements={story/obtain_armor={iron_helmet=true}}]
@p[limit=3]
@a[limit=4,sort=furthest]
@r[limit=2]
```

Explicitly documented illegal / empty-selection cases:

```
@e[team=red,team=blue]   # 非法，因为一个实体只能加入一个队伍
@e[type=chicken,type=cow]  # 无效选择：选择所有既是鸡又是牛的目标（不存在）
@e[Type=creeper]         # 无效（参数名大小写敏感）— 1.11 起产生错误而非静默忽略
@e[asdf=nonexistent]     # 同上
@e[malformed]            # 同上
@e[type=item,nbt={Item:{id:"slime_ball"}}]  # 永远匹配不到，id 必须带命名空间
```

### 3.7 Version history (Java)

| Version | Change |
|---|---|
| 1.4.2 (12w32a) | target selectors added |
| 1.8 (14w02a) | `@e` added |
| 1.8 (14w03a) | `dx`,`dy`,`dz` added |
| 1.9 (16w02a) | `gamemode` accepts full names and abbreviations, negation allowed |
| 1.11 (16w38a) | implicit arguments removed (`@e[167,28,454,5]` must be written `@e[x=167,y=28,z=454,r=5]`); invalid selectors now error instead of being silently ignored |
| 1.12 (17w16b) | `@s` added |
| 1.13 (17w45a) | `nbt` added; selector arguments heavily reworked |
| 1.15 (19w38a) | `predicate` added |
| 1.21 (24w21a) | `@n` added |
| 1.21 (pre1) | `@n` can no longer select dying entities |
| 1.21.5 (25w05a) | `team` selector can now select non-mob entities (MC-108495) |


---

## 4. `/data` and NBT paths

Sources:
- https://zh.minecraft.wiki/w/命令/data (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/NBT路径 (raw: `?action=raw`)

### 4.1 `/data` syntax (compressed grammar box, verbatim)

```
/data get (block|entity|storage) <target> [<path>] [<scale>]
/data merge (block|entity|storage) <target> <nbt>
/data modify (block|entity|storage) <target> <targetPath> (append|insert <index>|merge|prepend|set) (from (block|entity|storage) <source> [<sourcePath>]|string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]|value <value>|compute (default|block <computePos>|entity <computeTarget>) (int|float) <provider>)
/data remove (block|entity|storage) <target> <path>
```

Fully expanded (the same grammar, one line per accepted form):

```
data get block <target> [<path>]
data get block <target> <path> [<scale>]
data get entity <target> [<path>]
data get entity <target> <path> [<scale>]
data get storage <target> [<path>]
data get storage <target> <path> [<scale>]
data merge block <target> <nbt>
data merge entity <target> <nbt>
data merge storage <target> <nbt>
data modify (block|entity|storage) <target> <targetPath> append from (block|entity|storage) <source> [<sourcePath>]
data modify (block|entity|storage) <target> <targetPath> append string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]
data modify (block|entity|storage) <target> <targetPath> append value <value>
data modify (block|entity|storage) <target> <targetPath> insert <index> from (block|entity|storage) <source> [<sourcePath>]
data modify (block|entity|storage) <target> <targetPath> insert <index> string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]
data modify (block|entity|storage) <target> <targetPath> insert <index> value <value>
data modify (block|entity|storage) <target> <targetPath> merge from (block|entity|storage) <source> [<sourcePath>]
data modify (block|entity|storage) <target> <targetPath> merge string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]
data modify (block|entity|storage) <target> <targetPath> merge value <value>
data modify (block|entity|storage) <target> <targetPath> prepend from (block|entity|storage) <source> [<sourcePath>]
data modify (block|entity|storage) <target> <targetPath> prepend string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]
data modify (block|entity|storage) <target> <targetPath> prepend value <value>
data modify (block|entity|storage) <target> <targetPath> set from (block|entity|storage) <source> [<sourcePath>]
data modify (block|entity|storage) <target> <targetPath> set string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]
data modify (block|entity|storage) <target> <targetPath> set value <value>
data remove block <target> <path>
data remove entity <target> <path>
data remove storage <target> <path>
```

> **Order is `<operation> <source-type> <source>`, not the reverse.** `set value <value>`, `set from entity @s Path`, `set string storage ns:id Foo 0 1`. Putting `from` before `set` is a syntax error.

Operation semantics (verbatim):
- `set` — 将指定NBT标签覆盖为新的值。若指定NBT标签不存在，将同时创建该NBT标签。
- `merge` — 将一个复合标签与指定的复合标签合并。若存在同名标签，则后者覆盖前者。
- `append` — 在指定列表或数组的**末尾**增加元素；元素数 +1。
- `prepend` — 在指定列表或数组**开头**插入元素；所有元素后移，元素数 +1。
- `insert <index>` — 在指定元素位置**前**插入元素。
- `remove` — 删除指定NBT。

`merge` **only** works on compounds; `append`/`insert`/`prepend` **only** work on lists and int/byte/long arrays (verbatim: 只能对列表和 int-array byte-array long-array 数组操作). Anything else fails ("任一目标标签不是数组或列表").

### 4.2 `string` source (slice syntax) — since 1.19.4 (23w03a)

> `data modify ... set string ...` 将从数据源获取字符串并对其进行切片，然后使用切片结果修改该目标。若数据源为数值则会先转换为字符串。

- `<start>` = index of first character to take (0-based); negative counts from the end.
- `<end>` = index of first character to **exclude**; negative counts from the end.
- Omitting `<start>` starts at 0; omitting `<end>` runs to the end. Either may be negative (since 1.20 pre1).
- Command fails if the source path selects a tag that is neither a string nor a number, if `start` is after `end`, or if `end` exceeds the source string's maximum index.

```
# 从 buffer 取第一个字符到 cur_char，然后清除 buffer 中的第一个字符
data modify storage wiki:string cur_char set string storage wiki:string buffer 0 1
data modify storage wiki:string buffer set string storage wiki:string buffer 1
```
(Example copied verbatim from the page.)

### 4.3 `/data` failure conditions (Result table, verbatim)

Unparseable when the command is incomplete / arguments are malformed. It **fails** (does not modify anything) when:

- `<target>` (`block`) is outside the world or unloaded; the block is not a block entity
- `<target>` (`entity`) cannot select a **single** entity (players must be online)
- `/data get ...` selected multiple tags
- `/data get ... <path>` — no NBT tag exists at `<path>`
- `/data get ... <path> <scale>` — the obtained tag is not numeric
- `/data merge ...`, `/data remove ...`, `/data modify ...` — 未能成功更改任何NBT (nothing was changed)
- trying to modify a **player** entity's NBT
- `/data remove ...` or `/data modify ... set ...` where `<path>` is the **root tag** (`<path>指定的是根标签`)
- `/data modify ... compute ...` provider evaluation error; `compute block` outside world/unloaded; `compute entity` not a single entity
- `/data modify ... (from|string) block ...` outside world/unloaded or not a block entity
- `/data modify ... (from|string) entity ...` not a single entity
- `/data modify ... (from|string) ... <sourcePath>` — no tag at `<sourcePath>`
- `/data modify ... string ... <sourcePath> <start> <end>` — selected tag is not a string or number
- append/insert/prepend: target is not an array or list; source type incompatible with every target; `insert <index>` invalid for every target
- merge: any target is not a compound; any source NBT is not a compound

`/data` **cannot** modify a player's NBT at all (verbatim: 无法修改（包括设置和删除）玩家的NBT数据). For inventories use `/item`.

### 4.4 `/data` output values (for `execute store`)

| Command | success | result |
|---|---|---|
| `/data get ...` | 1 | numeric → floor(value); list/array → element count; string → length; compound → number of first-level children |
| `/data get ... <path> <scale>` | 1 | floor(value × scale) |
| `/data merge ...` | 1 | 1 |
| `/data remove ...` | 1 | 1 |
| `append` / `insert` / `prepend` | 1 | number of lists/arrays that received the new element |
| `set ...` | 1 | number of target tags successfully changed |
| `merge ...` | 1 | number of target compounds successfully changed |

So `execute store result score #len var run data get entity @s Inventory` stores the item count — a standard datapack idiom.

### 4.5 `/data` examples copied verbatim

```
/data get entity @p foodSaturationLevel
/data modify entity @n[type=item,distance=..10] PickupDelay set value -1
/data get entity @e[type=item,limit=1,sort=random] Pos[1]
/data get entity @p Inventory[{Slot:0b}].id
/data modify entity @n[x=0,y=64,z=0,type=dolphin] attributes[{id:"minecraft:armor"}].base set value 20
/data modify block 1 64 1 Items[0].id set value "minecraft:diamond_block"
/data merge entity @n[type=zombie] {drop_chances:{offhand:0.8f,mainhand:0.0f}}
/data merge entity @n[type=minecart] {CustomDisplayTile:1b,DisplayState:{Name:"stonecutter",Properties:{facing:"west"}},DisplayOffset:-4}
/data merge storage test:test {input:{arg1: 233}, output: {fun_res1: 0}}
/data modify block 2 64 0 Items append from block 0 64 0 Items[0]
/data modify block 0 64 0 Items[0].components merge value {damage:700}
/data modify block 0 64 0 Items[0].components.damage set value 700
/data modify block 0 64 0 Items[0].id set string block 2 64 0 Items[0].id 0
/data modify storage wiki:string cur_char set string storage wiki:string buffer 0 1
/data modify storage wiki:string buffer set string storage wiki:string buffer 1
/data modify storage wiki:test args.output prepend from storage wiki:test args.input[]
/data modify storage test A append from storage test B[]
```

Documented behaviour of those examples, worth knowing:
- `data modify ... newbar set value 1b` on `{foo: 1}` yields `{foo: 1, newbar:1b}` (set **creates** the tag).
- Merging `{foo: [1, 2, 3], bar: true}` into `{foo: 1, pol: 1.2f}` yields `{foo: [1, 2, 3], bar: true, pol:1.2f}` (same-name tags are overwritten, different-type overwrite included).
- `data modify storage test A append from storage test B[]` on `{A: [0,1], B:[2,3]}` yields `{A: [0,1,2,3], B:[2,3]}`.
- `data modify storage test L append string storage test S 0 1` on `{S: "abc", L:[]}` yields `{S: "abc", L:["a"]}`.
- Index relations: `正索引值 = 负索引值 + 元素总数 + 1`; table from the page:
  ```
  SNBT列表:   [    1,   2,   3,   ]
  正索引值:       0    1    2    3
  负索引值:      -4   -3   -2   -1
  ```

### 4.6 `/data` version history

| Version | Change |
|---|---|
| 1.13 (17w45b) | `/data` added |
| 1.13 (18w03a) | `data get` with a path now works for non-numeric values |
| 1.14 (18w43a) | `data modify` added |
| 1.15 (19w38a) | command storage added; `storage <namespaced id>` usable as source or target |
| 1.19.4 (23w03a) | **`string` data source added** |
| 1.20 (pre1) | `string` `<start>`/`<end>` accept negatives (count from end) |
| 1.20 (pre2) | invalid `<start>`/`<end>` now fails the command instead of throwing (MC-260602) |
| 26.3 (snapshot-10) | `compute` data source added |
| 26.3 (pre-1) | `integer` literal removed from `compute`; `integer`/`float` literals added to select the provider type |

### 4.7 NBT path grammar (verbatim table)

Basic form: `节点.节点.….节点` — one or more nodes separated by `.`; the `.` **may be omitted** before some nodes (see below). A path starts from the root tag; each node is applied to every tag in the current tag set.

> 根复合标签节点必须为路径之首，其他所有节点按需随意排列使用。

| Node | Format | Applies to | New tag-set size | Example |
|---|---|---|---|---|
| root compound | `{<tags>}`, `tags` may be empty | matches/selects the root tag; **only at the start of the path** | 1, or empty on match failure | `{Invisible:1b}`, `{}` |
| named child | `name` (may be wrapped in `"` or `'`; may not be an empty string) | selects the child named `name` of a compound | ≤ current, may be empty | `VillagerData`, `"A cool name[]"` |
| named compound child | `name{<tags>}`, `tags` may be empty | selects the compound child named `name` matching `tags` | ≤ current, may be empty | `VillagerData{foo:text}`, `VillagerData{}` |
| all elements | `[]` (the preceding `.` **may be omitted**) | all elements of a list/array | any size, may be empty | `ActiveEffects.[]` = `ActiveEffects[]` |
| one element | `[<index>]` (the preceding `.` **may be omitted**) | element at `index`; negative ⇒ `列表长度 + index` | ≤ current, may be empty | `Pos.[0]`, `Pos[0]`, `Inventory[-1]` |
| compound elements | `[{<tags>}]` (the preceding `.` **may be omitted**) | compound elements of a list matching `tags`; `tags` may be empty | any size, may be empty | `Inventory[{count:25}]`, `Foo[{}]` |

Mixed-path examples copied verbatim:

```
{}
{foo:4.0f}
foo
foo.bar          /  foo{}.bar
foo.bar[0]
foo.bar[-1]
foo.bar[0]."A [crazy name]!"
foo.bar[0]."A [crazy name]!".baz
foo.bar[]
foo.bar[].baz
foo.bar[{baz:5b}]
foo{bar:"baz"}
foo{bar:"baz"}.bar
foo.[].[{}]   /  foo.[][{}]  /  foo[].[{}]  /  foo[][{}]
foo.bar.[0].[0].baz   /  foo.bar[0][0].baz
```

### 4.8 NBT path quoting rules (verbatim)

A node must be wrapped in a pair of quotes when the tag name:
- contains a dot `.` — e.g. for `{a.b: 0}` use `'a.b'`
- contains whitespace — e.g. for `{"a b": 6}` use `'a b'`
- contains a single or double quote — e.g. for `{'"测试"': 1, "'测试'": 2, "\"tes't": 3}` the paths are `'"测试"'`, `"'测试'"`, `"\"tes't"`

Both `"` and `'` work (single quotes since 1.20 pre2, MC-175504).

### 4.9 NBT path gotchas

- `/data get` requires the path to resolve to **exactly one** tag (标签集大小为1); `data modify`/`data remove` may resolve to **many** tags (标签集大小大于1) and apply to all of them.
- Array/list index out of range ⇒ empty tag set ⇒ the operation does nothing (`data modify`) or fails (`data get`).
- A `.` is required before a name node but optional before `[`-nodes; `foo.bar[0]` and `foo.bar.[0]` are both valid, `foobar` is one name, and `foo."a b"` needs quotes.
- Keys are **case-sensitive** and namespaced IDs inside NBT must always be written in full (`"minecraft:stone"`, never `"stone"`).
- Since 1.21.5 (25w09a) a child-tag node **does not accept an empty string** as a name (现在子标签节点不再接受空字符串).

Real-world path example (verbatim from the page) — the `minecraft:` colon is fine unquoted inside a path node here, but qouting is safer when in doubt:

```
/data get block ~ ~ ~ Items[1].components.minecraft:written_book_content.pages[3].raw
/data modify block ~ ~ ~ Items[1].components.minecraft:written_book_content.pages prepend value {raw: '"Call me Ishmael."'}
/data modify block ~ ~ ~ Items[1].components.minecraft:written_book_content.author set value "Cthulhu the Sleeper"
```


---

## 5. `/scoreboard`

Sources:
- https://zh.minecraft.wiki/w/命令/scoreboard (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/记分板 (raw: `?action=raw`) — criteria list and history (the command page transcludes its history from here)

### 5.1 Java syntax (verbatim from the syntax box)

**Objective subcommands:**

```
scoreboard objectives list
scoreboard objectives add <objective> <criteria> [<displayName>]
scoreboard objectives remove <objective>
scoreboard objectives setdisplay <slot> [<objective>]
scoreboard objectives modify <objective> displayautoupdate (true|false)
scoreboard objectives modify <objective> displayname <displayName>
scoreboard objectives modify <objective> numberformat
scoreboard objectives modify <objective> numberformat blank
scoreboard objectives modify <objective> numberformat fixed <component>
scoreboard objectives modify <objective> numberformat styled <style>
scoreboard objectives modify <objective> rendertype (hearts|integer)
```

**Score-holder subcommands:**

```
scoreboard players list [<target>]
scoreboard players get <target> <objective>
scoreboard players set <targets> <objective> <score>
scoreboard players add <targets> <objective> <score>
scoreboard players remove <targets> <objective> <score>
scoreboard players reset <targets> [<objective>]
scoreboard players enable <targets> <objective>
scoreboard players operation <targets> <targetObjective> <operation> <source> <sourceObjective>
scoreboard players display name <targets> <objective>
scoreboard players display name <targets> <objective> <text>
scoreboard players display numberformat <targets> <objective>
scoreboard players display numberformat <targets> <objective> blank
scoreboard players display numberformat <targets> <objective> fixed <contents>
scoreboard players display numberformat <targets> <objective> styled <style>
```

> Note the wiki's own example text writes `/scoreboard players reset @s bar 100` and `/scoreboard players reset * bar 100` while the syntax box is `reset <targets> [<objective>]`. Treat the syntax box as authoritative; the extra trailing number in the example is not part of the current grammar. See uncertainties.

### 5.2 `<criteria>` — the complete Java list

Single criteria (记分板 § 准则 → 单一准则):

| Criteria | Meaning | Command-modifiable? |
|---|---|---|
| `dummy` | score only changed by commands; used as event flags, state maps, currency, etc. **The default choice for datapacks.** | yes |
| `trigger` | like dummy, but players may change it with `/trigger` **only while it is "enabled"** for them; each successful `/trigger` re-disables it. Works without cheats, so it is the usual "player input" hook with `tellraw`. | yes |
| `deathCount` | +1 when the player dies | yes |
| `playerKillCount` | +1 when the player kills another player | yes |
| `totalKillCount` | +1 when the player kills another mob (including players) | yes |
| `health` | player's health + absorption | **no (read-only)** |
| `xp` | player's XP points | **no (read-only)** |
| `level` | player's XP level | **no (read-only)** |
| `food` | hunger, 0–20 | **no (read-only)** |
| `air` | remaining air, 0–300 (the `Air` NBT tag) | **no (read-only)** |
| `armor` | armor value, 0–20 | **no (read-only)** |

Compound criteria — formed with `.` separators, and **all of their scores are command-modifiable**:

- `teamkill.<color>` — increases when the player kills a member of a team of that color.
- `killedByTeam.<color>` — increases when the player is killed by a member of a team of that color.
- Any **statistic namespaced ID** (`stat.*`) works as a compound criterion, e.g. `stat.walkOneCm`, `stat.mineBlock.minecraft.stone`, `stat.craftItem.minecraft.stick`, `stat.useItem.minecraft.bow`, `stat.killEntity.minecraft.zombie`, `stat.mobKills`, `stat.deaths`, `stat.leaveGame`, `stat.playOneMinute`, `stat.sneakTime`, `stat.timeSinceDeath`, `stat.drop`, `stat.pickup`.

Valid team colors (verbatim list used for `teamkill.` / `killedByTeam.` and `sidebar.team.<color>`):
```
black, dark_blue, dark_green, dark_aqua, dark_red, dark_purple, gold, gray,
dark_gray, blue, green, aqua, red, light_purple, yellow, white
```

Bedrock only supports `dummy` (目前只支持 `dummy` 准则).

### 5.3 Objective names and score values

Verbatim from 记分板:
- Score is a **32-bit integer**: −2,147,483,648 … 2,147,483,647. It cannot be a decimal.
- Objective names are **case-sensitive**; in Java they may contain letters, digits, `_`, `.`, `-` and `+`. Since 1.13 they cannot contain `:`. The 16-character length limit was removed in 1.18 (21w37a).
- The display name is a **text component** in Java (a plain text in Bedrock).
- A score holder is a player name or an entity UUID; a player name need not be a real player (a "virtual player"). Non-player entities' scores can only be modified by commands and are **deleted when the entity dies**.
- Virtual players whose name starts with `#` are never shown on any display slot (以 `#` 开头的伪造的玩家名称在任何情况下都不会在侧边栏可见). This is why `#temp`, `#const` etc. are safe scratch holders.

### 5.4 `<slot>` — display slots

| Slot | Effect |
|---|---|
| `list` | in the player list (TAB), score after the player's name |
| `sidebar` | right side of the screen; shows the objective's display name as a header |
| `sidebar.team.<color>` | 16 team-specific sidebars; **higher priority than `sidebar`**, so it occupies the sidebar content |
| `below_name` | under the nametag (Java). Renamed from `belowName` in 1.20.2 (23w31a). Bedrock spells it `belowname`. |

`scoreboard objectives setdisplay <slot>` with no objective clears that display slot.

### 5.5 `players operation` — exact operators

```
<operation> = ( = | += | -= | *= | /= | %= | >< | < | > )
```

| Operator | Meaning |
|---|---|
| `=` | assign source score to target |
| `+=` | target = target + source |
| `-=` | target = target − source |
| `*=` | target = target × source |
| `/=` | target = target ÷ source, **floor** (Java) / truncate toward zero (Bedrock) |
| `%=` | target = integer-division remainder; sign follows the **divisor** (Java) / the dividend (Bedrock) |
| `><` | swap source and target |
| `<` | only if source is smaller: target = source |
| `>` | only if source is larger: target = source |

Verbatim rules:
- For every operator except `><`, the source score is unchanged; only the target may change.
- If the target or source has no score for the objective, it is **implicitly initialised to 0** and the association is created first (隐式初始化).
- With multiple sources, the operation is applied once per source; with multiple targets, once per target; by default in order of distance from the executor, nearest first.
- For `/=` and `%=`, if the source is 0 the command **fails** in Java (Bedrock succeeds with no change).

`*` may be used as a score holder in `players operation` (e.g. `scoreboard players operation Steve A < * A` iterates every tracked holder), but **not** in `players get`/`set`/`add`/… where only 1 holder is allowed and `*` does not work in Java (MC-136858).

### 5.6 Result / failure behaviour that matters

From the Result table (verbatim conditions):
- `objectives add` fails if `<objective>` already exists.
- `objectives remove`, `setdisplay`, `modify` fail if `<objective>` does not exist.
- `players get` **fails** if the objective does not exist, if the selector does not select exactly one score holder, or if that holder has no score in that objective.
- `players set|add|remove|reset|enable|display` fail (result) if the objective does not exist or the selector selects no holder.
- `players set|add|remove` require a **non-read-only** objective; targeting a read-only objective fails.
- `players enable` fails if the objective's criterion is not `trigger`, or if all targets are already enabled. If the holder has no score, `enable` **sets it to 0**.
- `players operation` fails if the source or target objective does not exist, or if the source objective (or target objective when using `><`) is read-only.

Output values (Java), for `execute store`:

| Command | result |
|---|---|
| `objectives list` | number of objectives |
| `objectives add` / `remove` | number of objectives after execution |
| `players list <targets>` | total number of objectives tracked for that holder |
| `players get` | the score value |
| `players set` | score × number of targets |
| `players add` / `remove` | sum of the scores after applying |
| `players reset` | number of targets |
| `players enable` | number of targets whose score was enabled for the first time |
| `players operation` | sum of the resulting scores over all targets |
| other | 0 |

`players get` with `execute store result score` is the canonical way to copy one score into another:

```
execute store result score #temp var run scoreboard players get @s myobj
```

**The trap this creates:** if the objective does not exist, `players get` fails, so `execute store` stores **0** and the `execute` chain reports failure. Always create the objective in a `#load` function before reading it.

### 5.7 Examples copied verbatim

```
/scoreboard objectives add foo health
/scoreboard objectives modify foo displayname {"text":"❤","color":"red"}
/scoreboard objectives add bar dummy "Scoreboard"
/scoreboard objectives remove bar
/scoreboard players set Alex bar 100
/scoreboard players set @s bar 100
/scoreboard players get Alex bar
/scoreboard objectives setdisplay sidebar bar
/scoreboard objectives setdisplay sidebar
/scoreboard objectives setdisplay list foo
/scoreboard objectives modify foo rendertype hearts
/scoreboard objectives modify foo rendertype integer
/scoreboard players set #test bar 233
/scoreboard objectives list
/scoreboard players list
/scoreboard players list @s
/scoreboard objectives add A dummy
/scoreboard objectives add B dummy
/scoreboard players add Steve A 0
/scoreboard players operation Steve A = Steve B
/scoreboard players operation Steve A -= Steve B
/scoreboard players operation Steve A /= Steve B
/scoreboard players set Steve A 2147483647
/scoreboard players operation Steve A < * A
/scoreboard objectives add info dummy
/scoreboard objectives modify info displayname {"text":"公告", "color":"yellow", "bold":true}
/scoreboard objectives setdisplay sidebar info
/scoreboard players set info4 info 4
/scoreboard objectives modify info numberformat blank
/scoreboard players display name info4 info ""
/scoreboard players display name info3 info [{"text":"     欢迎来到    ","color":"green"}]
/scoreboard players display name info2 info [{"text":"   Minecraft Wiki!  ", "color":"green", "font":"minecraft:uniform"}]
/scoreboard players display name info1 info ""
```

Notable example commentary (verbatim):
- The display name argument must be valid JSON: `"Scoreboard"`, not `Scoreboard` (这里的显示名称 Scoreboard 必须符合 JSON 语法…所以应该写为 `"Scoreboard"` 而非 `Scoreboard`).
- `scoreboard players set Alex bar 100` succeeds even if player Alex does not exist — the name creates a "virtual player". **But** if the argument parses as a selector and matches nothing, the command fails and no score is set.
- Adding 0 (`scoreboard players add Steve A 0`) implicitly initialises the score to 0 — the standard "ensure the score exists" idiom.
- `Steve A` with `2147483647` then `operation Steve A < * A` computes the minimum over all tracked holders.

### 5.8 Scoreboard version history (Java)

| Version | Change |
|---|---|
| 1.5 (13w04a) | scoreboard added |
| 1.7.2 (13w36a) | statistic criteria added |
| 1.8 (14w02a) | non-player entities can join teams and hold scores |
| 1.8 (14w06a) | `trigger` and team-kill criteria added; `scoreboard players enable` added; `*` usable as a player-name argument; `objective` argument added to `players reset`; statistic criteria use IDs |
| 1.8 (14w07a) | `players operation` and `players test` added; virtual players prefixed with `#` no longer shown in the sidebar; team-specific sidebar slots added |
| 1.8 (14w25a) | `=`, `<`, `>` added to `players operation` |
| 1.8 (14w26a) | `><` added to `players operation` |
| 1.9 (15w32b) | `xp`, `food`, `air` criteria added |
| 1.9 (15w33a) | `stat.pickup`, `stat.drop` criteria; `armor`, `level` criteria added |
| 1.13 (17w45a) | `scoreboard players tag` and `scoreboard teams` removed (replaced by `/tag` and `/team`) |
| 1.13 (pre7) | `scoreboard objectives modify` added |
| 1.13 (pre8) | `modify <objective> rendertype hearts\|integer` added; objective names are now text components rather than plain strings |
| 1.13.1 (18w31a) | `%=` changed from `x % y` to `Math.floorMod(x, y)` (sign now follows the divisor) |
| 1.18 (21w37a) | 16-character length limit on objective names and score holders removed |
| 1.20.2 (23w31a) | display slot `belowName` renamed to `below_name` |
| 1.20.3 (23w46a) | new subcommands added to change how a specific objective is displayed in the sidebar — this is the `players display name|numberformat` and `objectives modify numberformat` family |
| 1.21.5 (25w05a) | text components in `/scoreboard` are now parsed with `@s` as the executor |


---

## 6. Text components

Source: https://zh.minecraft.wiki/w/文本组件 (raw: `?action=raw`)

### 6.1 1.21.5 is a breaking change — read first

Verbatim from the 1.21.5 (25w02a) history entry:

> 文本组件现在以NBT形式存储，不再存储为JSON字符串。
> 将点击事件的标签名由 `clickEvent` 重命名为 `click_event`，并修改了除 `copy_to_clipboard` 外所有点击事件的格式：
> * 将 `change_page` 的 `value` 重命名为 `page`，现在需要数字而不是数字的字符串表示页码。
> * 将 `open_url` 的 `value` 重命名为 `url`，且不再静默忽略非 `http` 或 `https` 协议的URI。
> * 将 `open_file` 的 `value` 重命名为 `path`。
> * 将 `run_command` 的 `value` 重命名为 `command`，且不再必须带 `/` 前缀、包含非法字符时不再静默忽略。
> * 将 `suggest_command` 的 `value` 重命名为 `command`，且包含非法字符时不再静默忽略。
> 将悬停事件的标签名由 `hoverEvent` 重命名为 `hover_event`，并修改了所有悬停事件的格式：
> * 将 `show_item` 的 `contents` 移到根标签，并移除了早已弃用的 `value`。
> * 将 `show_entity` 的 `contents` 移到根标签，且重命名 `id` 为 `uuid`、重命名 `type` 为 `id`，并移除了早已弃用的 `value`。
> * 将 `show_text` 的 `contents` 重命名为 `text`，并移除了早已弃用的 `value`。

Then, immediately after, 1.21.5 (25w03a):

> 将悬停事件 `show_text` 的 `text` 字段重命名为 `value`。

So the **final** 1.21.5+ spelling for `show_text` is `value` (it was named `contents` before 25w02a, `text` only in 25w02a, `value` from 25w03a).

| Thing | ≤ 1.21.4 (and in JSON command syntax) | ≥ 1.21.5 (SNBT) |
|---|---|---|
| click event key | `clickEvent` | `click_event` |
| hover event key | `hoverEvent` | `hover_event` |
| `open_url` payload | `{"action":"open_url","value":"https://…"}` | `{action:"open_url",url:"https://…"}` |
| `run_command` payload | `{"action":"run_command","value":"/say hi"}` | `{action:"run_command",command:"say hi"}` (leading `/` no longer required) |
| `suggest_command` payload | `value` | `command` |
| `change_page` payload | `value` (number as string) | `page` (number) |
| `open_file` payload | `value` | `path` |
| `copy_to_clipboard` payload | `value` | `value` (**unchanged**) |
| `show_text` | `contents` | `value` (via `text` in 25w02a only) |
| `show_item` | `contents` | contents moved to root |
| `show_entity` | `contents:{type,id,name}` | root: `id` = entity type, `uuid`, `name` |
| storage format | JSON string | NBT |

Also from 1.20.3 (23w40a) — these already changed how authors must write components:
> 加入了 `type`，用于提升解析与错误检查的速度。
> 纯文本聊天组件（只有文本内容，无并列的组件，无格式）现在总会被序列化成字符串，而非 `{"text": "字符串"}`。
> 不再支持 `null` 和 `[]` JSON文本表达式。
> 若 `color`、`clickEvent` 和 `hoverEvent` 类型字段中出现错误，现在将不再被静默忽略。

Practical guidance for a datapack author targeting **1.20.5 – 1.21.4**: use the JSON/SNBT object form `{"text":"hi","color":"red"}` and the old `clickEvent`/`hoverEvent` keys.
Targeting **1.21.5+**: the same object form still parses (`{text:"hi",color:"red"}`), but events must use `click_event`/`hover_event` and the renamed payload keys.

### 6.2 The three base structures

Text components have three equivalent forms (the page states JSON and SNBT are identical apart from syntax):

1. **String form** — pure-text shorthand. Exactly equivalent to `{text: <字符串>}`.
2. **List form** — several components concatenated; each element may itself be a compound, list or string, and forms may be mixed. Conversion rules (verbatim):
   > 游戏将以第一个文本组件作为根组件，并将剩余所有组件作为子组件写入第一个文本组件的 `extra` 中。
   > 如果第一个文本组件的 `extra` 不为空，游戏自动将剩余组件拼接在第一个文本组件 `extra` 列表的后方。
   > 在转换过程中，所有子组件将以原样直接写入子组件列表中，不会修改子组件的任何信息。
3. **Compound form** — the base format:

```
{
    type: <组件类型>,          // optional in most cases
    extra: [ <子文本组件>, ... ],   // child components
    ...样式字段,
    ...组件类型字段
}
```

### 6.3 Component types (`type` values)

| `type` value | Tag used when `type` is omitted | Kind |
|---|---|---|
| `text` | `text` | static |
| `translatable` | `translate` | static |
| `keybind` | `keybind` | static |
| `score` | `score` | dynamic (needs a context) |
| `selector` | `selector` | dynamic |
| `nbt` | `nbt` | dynamic |
| `object` | `object` (sprite) | static |

Verbatim resolution rule:
> 如果 `type` 不存在，游戏会按照上文顺序，找到第一个具有对应名称且类型对应的标签，作为此组件的组件类型；如果 `type` 不存在或无效、且上文定义的所有标签都不存在或类型不对应，文本组件解析失败。

And:
> {{nbt|string|type}} 是用于严格校验组件正确性的标签。因为游戏保持了文本组件的旧版本兼容性，此项为非必须项，且在序列化与持久化时 `type` 不会保存。

Worked example from the page: `{text: {}, keybind: 'key.inventory', translate: 'addServer.add'}` resolves as a **translatable** component, because `text` requires a string (a compound does not satisfy it) and `translate` precedes `keybind` in the resolution order.

### 6.4 Per-type fields (verbatim structures)

**Pure text**
```
{ type: "text", text: <要渲染的文字> }        // text is required
```

**Translatable**
```
{
    type: "translatable",
    translate: <本地化键名>,    // required
    fallback: <回落文本>,
    with: [ <文本组件|字符串|数字|布尔值>, ... ]
}
```
> 客户端在解析此组件时会先读取本地化键名，从当前语言中查找…如果没有找到，则寻找默认语言（英语（美国），即 `en_us`）…如果仍然没有找到，则尝试使用回落文本 `fallback`。如果 `fallback` 没有定义，则使用键名直接作为本地化文本使用。
> 对于成功解析的本地化文本，游戏会计算有多少个参数需要填入，如果 `with` 中定义的参数数量小于需要的参数数量，解析也会失败。

**Keybind**
```
{ type: "keybind", keybind: <绑定键位标识符> }   // required; e.g. {keybind: "key.inventory"} shows "E"
```

**Score**
```
{
    type: "score",
    score: {                 // required
        name: <分数持有者>,   // required: selector | player name/UUID | "*"
        objective: <记分项>   // required
    }
}
```
> `name` 可以为下列3种格式：有效的目标选择器（查找到的实体不止一个则预解析直接报错）、玩家名称或UUID、分数持有者通配符 `*`（使用触发预解析行为的实体）。
> 如果分数持有者为空，或分数持有者的对应记分项信息不存在，则游戏预解析后此项直接转变为空纯文本组件。

**Selector**
```
{
    type: "selector",
    selector: <目标选择器|玩家名称|UUID>,     // required
    separator: <文本组件>                     // default {text: ', ', color: 'gray'}
}
```
Display-name derivation (verbatim summary): player name → `CustomName` (click-event style stripped) → `{translate: 'entity.<type id>'}`; then team prefix/suffix and team color; then a `show_entity` hover event; then an insertion of the UUID; and for players a `suggest_command` click event with `/tell <player> `.

**NBT**
```
{
    type: "nbt",
    nbt: <NBT路径>,            // required
    interpret: <bool>,         // default false; must be false if plain is true
    plain: <bool>,             // default false (since 26.1 snapshot-8); must be false if interpret is true
    separator: <文本组件>,
    source: <"entity"|"block"|"storage">,
    entity: <目标选择器|玩家名|UUID>,   // at least one of entity/block/storage required
    block: <方块位置>,
    storage: <命名空间ID>
}
```
> `source` … 可选值为 `entity`、`block`、`storage` … 当 `source` 不存在时，游戏按照 `entity`、`block`、`storage` 的顺序尝试读取。如果这三项都不存在，此文本组件解析无效。
> 如果 `interpret` 为 `false` … 若 `plain` 为 `true`，则直接拼接为简单的单一字符串进行输出，否则游戏会将各字符串重新整理为更复杂的文本组件，使其按照SNBT的语法结构渲染。

Examples of NBT-path flattening with two entities having `Motion` `[1d,0d,-1d]` and `[-2d,0d,2d]`:
- path `Motion` → 2 results: `[1d, 0d, -1d]` and `[-2d, 0d, 2d]`
- path `Motion[]` → 6 results: `1d, 0d, -1d, -2d, 0d, 2d`
- path `Motion[0]` → 2 results: `1d` and `-2d`

**Object / sprite (since 1.21.9 / 25w32a)**
```
{ type: "object", fallback: <文本组件>, object: <"atlas"|"player">, ... }
```
- `atlas` (tag name `sprite` when `object` omitted): `atlas` (default `blocks`), `sprite` (required).
- `player`: `player` (required; string = name), `hat` (default `true`).
> 组件样式中强行指定精灵图组件的字体无效，粗体、斜体和随机字符样式会被忽略。

### 6.5 Style fields

```
color:         <#RRGGBB | 颜色代码名>
shadow_color:  <int | [A,R,G,B]>       // since 1.21.4 (24w44a); integer form only when saved
font:          <命名空间ID>            // default minecraft:default
bold:          <bool>
italic:        <bool>
underlined:    <bool>
strikethrough: <bool>
obfuscated:    <bool>
insertion:     <string>
click_event:   { ... }
hover_event:   { ... }
```

`color` (verbatim): either a hex string starting with `#` whose value must not exceed 0xFFFFFF and must not be negative (no alpha channel), e.g. `#FF0000`; or a colour-code name (see 格式化代码#颜色代码). The named colours are the 16 used everywhere else in the game:
```
black, dark_blue, dark_green, dark_aqua, dark_red, dark_purple, gold, gray,
dark_gray, blue, green, aqua, red, light_purple, yellow, white
```
(plus `reset` to clear styling — `reset` is named in the 记分板 page for team color; the 文本组件 page defers the authoritative colour-code list to 格式化代码.)

`shadow_color`: unlike `color` it may carry an alpha channel; because of shader limits the shadow is not rendered when alpha < 0.1 (0x1A in integer form).

`insertion` only works in the chat screen; on click it replaces the selected chat text or inserts at the cursor.

### 6.6 Click events — current (1.21.5+) grammar

```
click_event: {
    action: <"change_page"|"copy_to_clipboard"|"custom"|"open_file"|"open_url"|"run_command"|"show_dialog"|"suggest_command">
    // change_page:
    page: <int >= 1>
    // copy_to_clipboard:
    value: <string>
    // custom:
    id: <命名空间ID>
    payload: <any NBT>          // nesting ≤ 16 levels, serialized ≤ 32768 bytes
    // open_file:
    path: <string>
    // open_url:
    url: <string>               // scheme must be http or https
    // run_command:
    command: <string>           // leading "/" optional; may not contain \u00a7, \u007f or chars < \u0020
    // show_dialog:
    dialog: <命名空间ID|内联对话框>
    // suggest_command:
    command: <string>           // same character restrictions
}
```

Where each event can fire (verbatim):
- `change_page` — only in the written-book preview screen.
- `copy_to_clipboard` — chat screen and book preview.
- `custom` — chat, book preview and signs; client sends a `custom_click_action` packet.
- `open_file` — chat and book preview; client-internal only, cannot be serialized.
- `open_url` — death screen, chat and book preview; disabled if the client option `chatLinks` is `false`.
- `run_command` — signs, chat and book preview.
- `show_dialog` — chat, book preview and signs.
- `suggest_command` — chat screen only.

A click event only triggers when clicking: the death message on the death screen (must be `open_url`), a sign (must be on the **root** component and be `run_command`, `custom` or `show_dialog`), any text in the chat screen, or text inside a book in the book preview.

### 6.7 Hover events — current (1.21.5+) grammar

```
hover_event: {
    action: <"show_entity"|"show_item"|"show_text">
    // show_entity:
    id: <实体类型命名空间ID>      // required (this was "type" before 1.21.5)
    name: <文本组件>              // 此文本组件无法被预解析
    uuid: <UUID字符串 | [I; a,b,c,d]>   // required (this was "id" before 1.21.5)
    // show_item:
    // (item codec fields inline at this level — the old "contents" wrapper is gone)
    // show_text:
    value: <文本组件>             // required
}
```
Hover events only fire in the death screen, the chat screen and the book preview screen. `show_entity` requires the client option `advancedItemTooltips` (F3+H) to be on.

Non-resolvable example given verbatim:
```
{text: 'test', hover_event: {action: 'show_entity', uuid: [I; 0, 0, 0, 0], id: 'player', name: {selector: '@e'}}}
```
→ hovering shows the literal `@e`, not the resolved entity list.

### 6.8 Inheritance and rendering order

> 子组件会自动继承父组件内的样式信息，但不会继承组件类型及其他组件数据；如果子组件内定义了与父组件内相同的标签，则子组件定义的信息将替代继承自父组件的信息。
> `{text: 'A', color: 'red', extra: ['B', {text: 'C', color: 'yellow'}]}` 中，`AB` 将以红色渲染，`C` 将以黄色渲染。
> `{text: 'A', extra: ['B', {text: 'C', extra:['E', 'F']}, {text: 'D', extra: ['G']}]}` 将渲染为 `ABCEFDG`。

**List-form style pollution:** the first element of a list form becomes the root component, so its style is inherited by everything. To avoid it, put an empty text component first:
> 如果使用列表格式时不想让第一个列表元素的样式控制整个文本组件，可以在第一个元素前插入空纯文本组件 `""` 以防止样式污染。

### 6.9 Pre-resolution (预解析) — why dynamic components go blank

Dynamic components are resolved on the server before being sent; the "trigger entity" differs per call site:
> * 使用 `tellraw`、`title` 显示文本组件时，文本组件将在发送到各个客户端前进行预解析，触发预解析的实体是将要发送到的客户端的玩家。
> * 其他所有命令，在接收文本组件参数时，都会立刻进行预解析，触发预解析的实体是执行此命令的玩家。
> 如果树的深度超过100，则深度超过100的部分将无法预解析。

Consequence: `selector`/`score`/`nbt` inside `title`/`tellraw` resolve **per receiving player**; inside any other command they resolve **once, as the executing player**. `@s`-free `*` in a `score` component means "the entity that triggered pre-resolution".

### 6.10 Text component version history (Java, verbatim)

| Version | Change |
|---|---|
| 1.7.2 (13w37a) | text components and `/tellraw` added |
| 1.8 (14w02a) | `insertion` added |
| 1.8 (14w07a) | `score` added |
| 1.8 (14w20a) | `/title` added; `selector` added |
| 1.8 (14w25a) | usable in signs and written books |
| 1.12 (17w16a) | `keybind` added |
| 1.13 (18w01a) | usable in custom names |
| 1.13 (18w05a) | `/bossbar` `<name>` is a text component |
| 1.14 (18w43a) | `nbt`, `block`, `entity` added; usable in item lore |
| 1.14 (18w44a) | `interpret` added |
| 1.15 (19w39a) | `storage` added |
| 1.15 (19w41a) | `copy_to_clipboard` click event added |
| 1.16 (20w17a) | `font` added; `hoverEvent` gained `contents`, `value` deprecated but still supported; hex colour codes; `score`'s `value` removed |
| 1.17 (21w15a) | `separator` added |
| 1.19.1 (rc1 / pre6) | `run_command` can no longer send chat messages; all values need a `/` prefix |
| 1.19.4 (23w03a) | `fallback` added; out-of-range `translate` arguments are no longer silently ignored |
| 1.20.3 (23w40a) | `type` added; plain text always serialized as a string; `null` and `[]` JSON text expressions no longer supported; errors in `color`/`clickEvent`/`hoverEvent` no longer silently ignored; `show_entity.id` accepts a 4-int UUID array |
| 1.21.4 (24w44a) | `shadow_color` added |
| **1.21.5 (25w02a)** | **stored as NBT, not JSON; `clickEvent`→`click_event`, `hoverEvent`→`hover_event`; payload renames (see §6.1)** |
| 1.21.5 (25w03a) | `show_text`'s `text` renamed to `value` |
| 1.21.5 (25w05a) | text components in `/bossbar`, `/scoreboard` and `/team` are resolved with the executor `@s` |
| 1.21.6 (25w20a) | `custom` and `show_dialog` click events added; a confirmation screen appears for client-side `run_command` needing permission > 0 or an unparseable command |
| 1.21.9 (25w32a) | `object` text component type added |
| 1.21.9 (25w35a) | `object` extended with the `player` type |
| 26.1 (snapshot-5) | with `interpret: false`, NBT output is syntax-highlighted instead of flat text |
| 26.1 (snapshot-8) | `plain` field added to the NBT component |
| 26.1 (pre-1..pre-3) | sprite `fallback` field; MOTD sprite/depth rules |


---

## 7. Short commands — `/summon`, `/give`

Sources:
- https://zh.minecraft.wiki/w/命令/summon (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/命令/give (raw: `?action=raw`)

### 7.1 `/summon`

```
summon <entity> [<pos>]
summon <entity> <pos> [<nbt>]
```

Argument order: **entity → position → NBT**. The NBT argument can only be given if the position is given; a bare `summon pig` uses the execution position.

Facts and gotchas (verbatim):
- `<entity>` is a `resource` argument (registry `minecraft:entity_type`) — since 1.19.3 (22w42a); before that the type was `entity_summon`.
- `minecraft:player` and `minecraft:fishing_bobber` **cannot** be summoned; attempting it fails the command.
- `<pos>` defaults to the execution position.
- The command **fails** if the position is not loaded, if the entity is `player`/`fishing_bobber`, if a hostile mob is summoned at Peaceful difficulty (since 1.21.9 / 25w31a), or if the UUID duplicates another entity.
- If `x`/`z` are outside [-30000000, 30000000) or `y` outside [-20000000, 20000000) the command reports success but nothing is spawned (the values are clamped/ignored).
- Output: `success` = 1, `result` = 1 on success; 0/0 on failure.

Current (1.20.5+) NBT/component style examples — **these are the ones to copy**:

```
/summon lightning_bolt ~-10 ~ ~
/summon pig 0 0 0
/summon creeper ~ ~ ~ {powered:1b,CustomName:"充能苦力怕"}
/summon spider ~ ~ ~ {Passengers:[{id:"minecraft:skeleton",equipment:{mainhand:{id:"minecraft:bow",count:1}}}]}
/summon item ~ ~ ~ {Item:{id:"minecraft:diamond",count:64}}
/summon skeleton ~ ~ ~ {NoAI:1b,Rotation:[90F,0F]}
/summon pig ~ ~ ~ {Motion:[0d,5d,0d]}
/summon axolotl ~ ~ ~ {Variant:4}
/summon zombie ~ ~ ~ {IsBaby:1b,equipment:{head:{id:"diamond_helmet"}},attributes:[{id:"scale",base:0.1d}]}
/summon happy_ghast ~ ~ ~ {Age:-1,AgeLocked:1b}
```

Note how entity data itself uses the **modern** shape: item stacks inside entity NBT use `{id:..., count:...}` (an `item_stack` compound), not the pre-1.20.5 `{id:..., Count:..., tag:{...}}`.

`/summon` version history (Java):

| Version | Change |
|---|---|
| 1.7.2 (13w36a) | `/summon` added |
| 1.8 (14w30a) | can summon lightning |
| 1.13 (17w45a) | entity NBT may be specified at the end |
| 1.16 (20w06a / 20w11a) | coordinate bounds enforced; fireballs can be summoned |
| 1.16.2 (20w30a) | duplicate UUID now errors |
| 1.19.3 (22w42a) | `<entity>` now uses the `resource` argument type (was `entity_summon`) |
| 1.21.9 (25w31a) | summoning hostile mobs on Peaceful now fails |

### 7.2 `/give`

```
give <targets> <item> [<count>]
```

- `<targets>` is an **entity** argument restricted to players (`amount=multiple`, `type=players`) — a selector that can match non-players will not parse.
- `<item>` is an `item_stack` argument: `namespace:item` optionally followed by `[...]` item components.
- `<count>` must be between 1 and **100 stacks** (max stack size × 100, normally 6400). Default 1. More than 100 stacks fails the command.
- The command fails if `<item>` is an unobtainable item, or if `<targets>` selects no players.
- Output: `success` = 1, `result` = number of players given the item.
- Behaviour: the item is spawned as an item entity at the target's position; if the inventory has room or the player is in creative the entity is decorative and vanishes after 1 game tick; if the inventory is full the entity is the overflow and only that player can pick it up.

### 7.3 THE BIG 1.20.5 / 1.21.5 CHANGE for `/give` (and item arguments everywhere)

Verbatim history entry:
> 1.20.5 (24w09a) 更改了语法，现在不再使用物品 `NBT标签`，而是 `物品堆叠组件`。

The wiki keeps an explicit **旧格式 (old format)** example box mapping each era. This is the single most valuable version table in this reference:

| Purpose | 1.13 – 1.20.4 (`{NBT}`) | 1.20.5 – 1.21.4 (`[component={…}]` with predicate wrappers) | 1.21.5+ (current) |
|---|---|---|---|
| unbreakable diamond sword | `/give @s minecraft:diamond_sword{Unbreakable:1b}` | — | `/give @s diamond_sword[unbreakable={}]` |
| lore "Sword" | `/give @p minecraft:diamond_sword{display:{Lore:['"Sword"']}} 1` | `/give @p minecraft:diamond_sword[minecraft:lore=['"Sword"']] 1` | `/give @p minecraft:diamond_sword[minecraft:lore=["Sword"]] 1` |
| potion of night vision | `/give @a potion{Potion:"minecraft:night_vision"}` | — | `/give @a potion[minecraft:potion_contents={potion:"minecraft:night_vision"}]` |
| sharpness X diamond sword | `/give @s minecraft:diamond_sword{Enchantments:[{id:"minecraft:sharpness",lvl:10}]} 1` | — | `/give @s minecraft:diamond_sword[minecraft:enchantments={"minecraft:sharpness":10}]` |
| can_place_on dirt + can_break quartz | `/give @s minecraft:diamond_block{CanPlaceOn:["minecraft:dirt"],CanDestroy:["minecraft:quartz_block"]} 1` | `/give @s minecraft:diamond_block[minecraft:can_place_on={predicates:[{blocks:"minecraft:dirt"}]},minecraft:can_break={predicates:[{blocks:"minecraft:quartz_block"}]}] 1` | `/give @s minecraft:diamond_block[minecraft:can_place_on={blocks:"minecraft:dirt"},minecraft:can_break={blocks:"minecraft:quartz_block"}] 1` |
| loot chest | `/give @s chest{BlockEntityTag:{LootTable:"chests/village/village_armorer"}} 1` | — | `/give @s chest[block_entity_data={id:"chest",LootTable:"chests/village/village_armorer"}] 1` or `/give @s chest[container_loot={loot_table:"chests/village/village_armorer"}] 1` |
| damaged wooden pickaxe | `/give @s wooden_pickaxe 1 58` (1.7.2–1.12.2) | — | `/give @s wooden_pickaxe[damage=58] 1` |

More current-form examples copied verbatim:

```
/give @s dirt 64
/give @s iron_shovel[minecraft:can_break={blocks:"minecraft:grass_block"}] 1
/give @p minecraft:creeper_spawn_egg[minecraft:entity_data={id:"minecraft:creeper",powered:1b},minecraft:item_name="闪电苦力怕刷怪蛋"]
/give @s grass_block[can_place_on={blocks:"stone"}] 1
/give @a minecraft:potion[minecraft:potion_contents={custom_effects:[{id:"minecraft:wither", amplifier:1b, duration:420}], custom_color:5653821}, minecraft:custom_name={type:"text", text:"衰变药水", italic:false}, minecraft:enchantments={"minecraft:knockback":10}] 1
```

Observe:
- Component names may be written with or without the `minecraft:` namespace (`can_place_on` vs `minecraft:can_place_on`).
- `minecraft:custom_name` takes a **text component**, and in the current form the example even spells out `{type:"text", text:"…", italic:false}`.
- `minecraft:item_name` may take a plain string.

**`minecraft:custom_data`** — the datapack-owned marker component. Source: https://zh.minecraft.wiki/w/命令/execute (the `items` condition example) uses the *item predicate* form with `~` for "contains":

```
execute if items entity @p armor.* *[minecraft:custom_data~{id:"test:bar"}]
```

So to tag an item for later detection: `give @s stick[minecraft:custom_data={id:"test:bar"}]` and detect it with `[minecraft:custom_data~{id:"test:bar"}]` (or `execute if data entity @s SelectedItem.components."minecraft:custom_data".id`).

`/give` version history (Java):

| Version | Change |
|---|---|
| Alpha 0.1.0 / 0.1.2 | `/give` added; count argument added |
| 1.0.0 (Beta 1.9-pre4) | durability argument added |
| 1.3.1 (12w16a) | usable in singleplayer |
| 1.4.2 (12w38a) | items go straight into the inventory instead of being dropped |
| 1.5 (13w04a) | accepts a data value as 4th argument |
| 1.7.2 (13w36a) | `dataTag` argument added |
| 1.7.2 (13w37a) | item argument accepts name IDs |
| 1.8 (14w03b) | numeric IDs no longer accepted |
| 1.8 (14w32b) | item argument can no longer exceed stack limits |
| 1.12 (17w16b) | when the target is the player themself, `@s` is used internally |
| 1.13 (17w45a) | **data value and NBT tag arguments removed** |
| 1.17 (21w10a) | 100-stack limit added |
| **1.20.5 (24w09a)** | **syntax changed: item NBT replaced by item stack components** |
| 26.1 (snapshot-5) | an invalid `<item>` now fails the command instead of failing to parse |
| 26.3 (snapshot-1) | exceeding the count limit now returns an error instead of printing a message and returning 0 |


---

## 8. Short commands — `/setblock`, `/fill`

Sources:
- https://zh.minecraft.wiki/w/命令/setblock (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/命令/fill (raw: `?action=raw`)

### 8.1 `/setblock`

```
setblock <pos> <block> [destroy|keep|replace|strict]
```

`<block>` is a `block_state` argument: `namespace:block[state=value,...]{nbt...}`. Default mode is `replace`.

Mode meanings (verbatim):
- `destroy` — 原方块以掉落物的形式掉落（液体方块及如藤蔓等仅可由剪刀采集的方块除外），并播放方块被破坏的音效。
- `keep` — 仅当原方块是空气类方块时才进行更改。
- `replace` — 原方块不掉落物品，且不播放方块被破坏的音效。
- `strict` — 在放置方块时不触发自身及紧挨着的方块的方块更新和形状更新。（**Java 1.21.5+**）

Failure conditions:
- command incomplete / malformed arguments ⇒ unparseable
- the position is unloaded or outside the world ⇒ fail
- changing a block in **debug mode** ⇒ Bedrock only
- `keep` when the existing block is not air ⇒ fail
- `replace` / `strict` / `keep` when the old and new block are identical (ignoring block entities — a block *entity* difference still counts as a change, e.g. sign text) ⇒ fail

Output: `success` = 1, `result` = 1.

Examples verbatim:
```
/setblock ~ ~ ~ chest[facing=north]
/setblock ~ ~2 ~ quartz_slab[type=top]
/setblock ~ ~ ~-1 birch_sign{front_text:{messages:["我的箱子","请勿打开！","",""]}}
/setblock ~ ~ ~ minecraft:suspicious_gravel{item:{id:"minecraft:apple",count:1}}
```
Note the sign gotcha stated on the page: **the four `messages` lines must all be present** (告示牌即使有几行空着也要把总共四行写全，否则无法正确解析). And note the modern `{item:{id:...,count:...}}` item stack shape inside block NBT.

History: 1.7.2 (13w37a) added; 1.11 (16w32a) block states; 1.16 (20w06a) `air destroy` can break fluids; **1.21.5 (25w02a) block-entity data handling changed and `strict` added**.

### 8.2 `/fill`

```
fill <from> <to> <block> [outline|hollow|destroy|strict|replace|keep]
fill <from> <to> <block> replace <filter> [outline|hollow|destroy|strict]
```

- `<from>` and `<to>` are two opposite corners. Verbatim volume rule: the corner block extends in the positive direction, so the smaller coordinate sits exactly on the boundary and the larger exceeds it by 1; the volume is `(x_big − x_small + 1) × (y_big − y_small + 1) × (z_big − z_small + 1)`.
- `<filter>` is a `block_predicate` (Java) — a block ID, optionally with states/NBT, or a block tag `#namespace:tag`. **Only the `replace` form takes a filter**, and the filter must come **immediately after `replace`**, before any of `outline|hollow|destroy|strict`.
- Default (no mode) replaces every block in the region including air, without dropping anything.

Mode meanings (verbatim):
- `destroy` — replaces every block including air; the old blocks drop as if mined with an unenchanted netherite shovel/pickaxe (so scissor-only blocks like vines and fluids do not drop).
- `hollow` — replaces only the outer layer; the interior is replaced with air. If the region has no interior (any dimension < 3) it behaves like the default.
- `outline` — replaces only the outer layer; the interior is untouched.
- `keep` — replaces only air blocks.
- `replace` — alone it equals the default, but may be followed by `<filter>` to restrict which blocks are replaced.
- `strict` — Java-only; placing blocks triggers no block/shape updates for the block itself or its neighbours.

Failure conditions:
- at least one coordinate is outside the world or unloaded ⇒ fail
- the region has more blocks than the Java game rule `max_block_modifications` (the Bedrock limit is 32768) ⇒ fail
- `hollow` / `keep` / `outline` / `replace …` / `strict` with **no block changed** ⇒ fail
- `destroy` when filling air into an all-air region ⇒ fail

Output: `success` = 1, `result` = number of changed blocks.

Examples verbatim:
```
/fill 52 63 -1516 33 73 -1536 gold_block replace white_concrete
/fill ~-3 ~-3 ~-3 ~3 ~-1 ~3 water
/fill ~-3 ~ ~-4 ~3 ~4 ~4 oak_planks hollow
/fill ~-15 ~-15 ~-15 ~15 ~15 ~15 stone
/fill ~ ~ ~ ~9 ~9 ~9 glass outline
/fill ~-1 ~ ~ ~1 ~ ~ prismarine_brick_stairs[facing=south,waterlogged=true]
```

History: 1.8 (14w03a) added; 1.11 (16w32a) block states; 1.19.4 (23w03a) the `commandModificationBlockLimit` game rule controls the maximum number of blocks changed per execution; **1.21.5 (25w02a) block-entity data handling changed, `replace` may now be followed by extra options, and `strict` was added**.


---

## 9. Short commands — `/tag`, `/schedule`

Sources:
- https://zh.minecraft.wiki/w/命令/tag (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/命令/schedule (raw: `?action=raw`)

### 9.1 `/tag`

```
tag <targets> add <name>
tag <targets> remove <name>
tag <targets> list
```

- One entity may hold at most **1024** tags in Java (一个实体拥有的标签数不能超过1024个).
- `<name>` is a `string` argument of type **`word`** in Java — i.e. a single word with **no spaces**.
- From the target-selector page, the `tag=` selector argument can only be matched for names composed of `-`, `+`, `.`, `_`, `A-Z`, `a-z`, `0-9`. Verbatim: 这是目标选择器参数的限制，记分板标签自身可以为任意字符组成的字符串，因而并非所有的记分板标签都可以被选中。
- `<targets>` fails if it selects no entity (named players must be online).
- `add` fails if **every** selected entity already has the tag, or already has 1024 tags.
- `remove` fails if no entity's tag was removed.
- `list` reports success even when no entity has tags.
- Output: `success` = 1; `result` = number of entities that gained the tag / number of entities whose tag was removed / number of tags the selected entities have.

Examples verbatim:
```
/tag @s add std
/tag @a[nbt={SelectedItem:{id:"minecraft:fire_charge"}}] add std
/tag @a[tag=std] remove std
/tag @a[gamemode=spectator] list
```

**Gotcha:** tags are not persistent across a save/reload cycle in the sense that they are entity data — a tag put on a player persists while the player exists, but a `#load` function cannot find players at all (see §1), so "tag players on load" cannot work.

History: 1.13 (17w45a) added; Bedrock 1.9.0.

### 9.2 `/schedule` (Java)

```
schedule function <function> <time> [append|replace]
schedule clear <function>
```

- `<function>` accepts a function ID or a function tag (`#namespace:path`).
- `<time>` is a time argument; **0 fails the command**. Examples on the page use `3s` and `5d`.
- `replace` (the default) overwrites any pending schedule for that same function/tag; `append` adds another pending run.
  > 同一个函数或同一个函数标签不能有在同一个时间执行的两个计划。默认使用 `replace` 模式…若使用 `append` 模式则在原有的计划后追加，不覆盖相同函数的计划。
- **The scheduled function runs with the server as the executor and the world spawn as the execution position.** Verbatim: 计划的函数以服务端为执行者执行，执行位置为世界出生点。 → inside it, `@s` selects nothing and `~ ~ ~` is world spawn.
- `schedule clear <function>` fails if there is no pending plan for it. `<function>` there is a greedy `string` and must include the namespace (`minecraft:` prefix must be written out).
- Output: `schedule function` → `result` = the game tick at which the function will run; `schedule clear` → `result` = number of cleared plans.

Examples verbatim:
```
/schedule function foo:bar 3s
/schedule function #foo:bar 5d
```

History: 1.14 (18w43a) added; 1.15 (19w38a) `clear` and the optional `append`/`replace` (default `replace`) added.


---

## 10. Short commands — `/return`, `/tp` (= `/teleport`)

Sources:
- https://zh.minecraft.wiki/w/命令/return (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/命令/tp → redirect → https://zh.minecraft.wiki/w/命令/teleport (raw: `?action=raw`)

### 10.1 `/return` (Java only)

```
return <value>
return fail
return run <命令>
```

- `return <value>` — ends the enclosing function, sets its return value to the integer `<value>` and its success flag to "success".
- `return fail` — ends the function, return value `0`, success flag "failure".
- `return run <命令>` — runs the command, then ends the function, setting the function's **success flag and return value to that command's `success` and `result` outputs**. If the command is a multi-branch `/execute`, **only the first branch runs**.

Semantics (verbatim):
- It stops the enclosing function at that point; all later commands are not executed.
- If the function was called by `/function`, the value and flag are passed back as `/function`'s output (so `execute store` can capture them).
- If the function was called by `/execute if function`, only whether the return value is non-zero is tested.
- `return run execute ... run <命令>` vs `execute ... run return run <命令>` — verbatim:
  > 前者的 `return` 命令一定会执行，若 `execute` 命令执行中断则返回"失败"和 `0` 值；而后者的 `return` 命令在 `execute` 命令执行中断时就不会执行了。
- A `return` after a multi-branch `/execute` also **ends the `/execute` after its first branch**, which is the standard trick to make a command run exactly once:
  > `execute as @e[type=zombie] at @s if block ~ ~-1 ~ grass_block run return run tp @s Steve` 只会把1只在草方块上的僵尸…传送到Steve。

Result table:
- `/return fail` ⇒ failed in all cases
- `/return run ...` ⇒ failed if the command failed, if the command was an `/execute` that aborted, if it was a `/function` whose result is Void, or if it was `execute ... run function` whose first branch's function is Void
- otherwise succeed

Outputs:

| Command | success | result |
|---|---|---|
| `/return <value>` | 1 | the `value` argument |
| `/return fail` | 0 | 0 |
| `/return run ...` (success) | 1 | the command's `result` (first branch if `/execute`) |
| `/return run ...` (failure) | 0 | 0 |

The function's success flag equals this `success`, and the function's return value equals this `result`.

**Conditional-branch idiom from the page, verbatim:**
```mcfunction
# 若执行者带有"test1"标签(@s[tag=test1])则执行函数"test1"
execute if entity @s[tag=test1] run return run function test1
# 否则若执行者为玩家(@s[type=player])则执行函数"test2"
execute if entity @s[type=player] run return run function test2
# 若以上皆不满足，执行函数"test3"
return run function test3
```

A Void function (no `return` executed) has **no** return value, so `execute store success score` / `execute store result score` leave the score unchanged — demonstrated by the page:
```mcfunction
/execute store success score @s test run function example:test3
/execute store result score @s test run function example:test3
```

**Version history (Java) — note the real numbers:**
| Version | Change |
|---|---|
| **1.20 (23w16a)** | **`/return` added** (not 1.20.2) |
| 1.20.2 (23w31a) | `run` subcommand added |
| 1.20.2 (pre1) | `run` subcommand temporarily removed |
| 1.20.3 (23w41a) | `run` subcommand re-added |
| 1.20.3 (23w44a) | `return run function <tag>` ends after the first function returns; `return run function` returns after one execution; `fail` subcommand added; `return run` now always returns and propagates `success` (previously `success` was always 1); `execute store ... run return run <命令>` can now store values |
| 1.20.5 (23w51a) | fixed `/return run function` not returning in some cases (MC-267194) |

### 10.2 `/tp` / `/teleport`

`/tp` is an **alias** of `/teleport` (Java 1.13, 17w45a: `tp` 现在用法与 `teleport` 没有任何区别，作为 `teleport` 的别名). Use `/tp` freely.

```
teleport <destination>
teleport <targets> <destination>
teleport <location>
teleport <targets> <location>
teleport <targets> <location> <rotation>
teleport <targets> <location> facing <facingLocation>
teleport <targets> <location> facing entity <facingEntity> [<facingAnchor>]
```

Semantics of each form (verbatim from the syntax box):
- `teleport <destination>` — 将执行者传送到另一个实体所在的位置，并使其旋转角度与该实体一致。
- `teleport <targets> <destination>` — 将指定的实体传送到另一个实体所在的位置，并使其旋转角度与该实体一致。
- `teleport <location>` — 将执行者传送到指定的坐标，并使其旋转角度与命令执行角度一致。
- `teleport <targets> <location>` — 将指定的实体传送到一个确定的坐标位置，**但不会修改其旋转角度**。
- The `rotation` and `facing` forms — 传送到坐标位置，并使其旋转角度与指定的一致。

Argument types:
- `<targets>` is `entity` with `amount=multiple` — a multi-entity selector is fine.
- `<destination>` is `entity` with `amount=single` — **a selector that can match more than one entity will not parse**. `@e[type=pig]` is a parse error; use `@e[type=pig,limit=1]` or `@n[type=pig]`.
- `<rotation>` = `<yaw> <pitch>` (the `rotation` argument type).
- `facingAnchor` = `eyes` | `feet`, **default `eyes`**.
- `<targets>` omitted ⇒ the executor is teleported.

Behaviour notes verbatim:
- Unlike most commands, `/teleport` can teleport into **not-yet-generated** chunks — the target chunk is generated first.
- If a mob riding a minecart/boat/mob is teleported, **the rider dismounts and is teleported separately**; the vehicle stays. If the *vehicle* is teleported, the rider follows and stays riding.
- Coordinates out of range (`x`/`z` outside [-30000000, 30000000), `y` outside (-20000000, 20000000]) ⇒ the command reports success but does not teleport.
- Fails if `<targets>` selects no entity, or if `<destination>`/`<facingEntity>` does not resolve to a single entity.

Output: `success` = 1, `result` = number of entities teleported.

Examples verbatim:
```
/teleport Alice
/teleport @a @s
/teleport 100 ~3 100
/execute as @p at @s run teleport @s ~ ~ ~ ~10 ~
/execute in minecraft:the_nether run teleport ~ ~ ~
/execute as @a in minecraft:the_end run teleport 84 57 79
/execute as Alice in minecraft:overworld run teleport 251 64 -160
```
The `execute in minecraft:the_nether run teleport ~ ~ ~` example divides X and Z by 8 automatically (dimension coordinate scaling, see §2.3 `in`).

**Rotation-only trick** (from the page): `/execute as @p at @s run teleport @s ~ ~ ~ ~10 ~` turns the nearest player 10 degrees without moving them.

History (Java): 1.10 (pre1) `/teleport` added, differing from `/tp`; 1.13 (17w45a) `/tp` becomes an alias; 1.13 (18w01a) `facing` mode added; 1.13 (18w02a) syntax simplified and cross-dimension teleporting allowed; 1.16 (20w06a) out-of-range coordinates no longer teleport.


---

## 11. Short commands — `/effect`, `/attribute`

Sources:
- https://zh.minecraft.wiki/w/命令/effect (raw: `?action=raw`)
- https://zh.minecraft.wiki/w/命令/attribute (raw: `?action=raw`)

### 11.1 `/effect` (Java syntax)

```
effect clear [<targets>]
effect clear <targets> [<effect>]
effect give <targets> <effect> [<seconds>]
effect give <targets> <effect> <seconds> [<amplifier>]
effect give <targets> <effect> <seconds> <amplifier> [<hideParticles>]
```

Note the Java form is the **two-word** `effect give` / `effect clear` (changed in 1.13 / 17w45a; before that it was `effect <目标> <效果> [秒数] [等级] [隐藏粒子]`). Bedrock still uses the single-word form `effect <target> <effect> [seconds]` — do not mix them.

Arguments:
- `<targets>` is `entity`, `amount=multiple`, `type=entities`.
- `<effect>` is a `resource` argument (registry `minecraft:mob_effect`); the effect **must exist** or the command does not parse.
- `<seconds>` — duration in seconds; `infinite` is allowed (since 1.19.4 / 23w05a). **The three exceptions** `minecraft:instant_damage`, `minecraft:instant_health` and `minecraft:saturation` are measured in **game ticks**, not seconds. Java range: **1 to 1,000,000**. Default 30 seconds (1 tick for the three exceptions).
- `<amplifier>` — 0 to 255, default 0. Level = amplifier + 1 (so speed II = `1`, speed III = `2`). Some effects have no levels (e.g. night vision).
- `<hideParticles>` — `true`/`false`, default `false`. Hides the effect particles **and** the HUD effect indicator.

Failure conditions:
- `<targets>` selects no entity (named players must be online) ⇒ fail
- `effect give` fails if **every** target is immune to the effect, or already has the same effect with the same `hideParticles` and no higher amplifier and no longer duration
- `effect clear` with `<targets>` omitted fails if the executor is not a player
- `effect clear` fails if there is no effect to remove

Output: `success` = 1, `result` = number of entities given/removed an effect.

Examples verbatim:
```
/effect give @s speed 60 1
/effect give @s speed 60 2
/effect give @a night_vision infinite 0 true
/effect clear @a
/effect clear @a haste
/effect clear @e[type=zombie]
```

History (Java): 1.5 (13w09b) added; 1.6.1 (pre) `clear` added; 1.8 (14w06a) `<hideParticles>` added; 1.13 (17w45a) syntax changed to `give`/`clear`; 1.19.4 (23w05a) `infinite` allowed; 1.20.5 (24w05b) amplifier limit changed to 127, then (24w06a) reverted.

### 11.2 `/attribute` (Java only)

```
attribute <target> <attribute> get [<scale>]
attribute <target> <attribute> base get [<scale>]
attribute <target> <attribute> base reset
attribute <target> <attribute> base set <value>
attribute <target> <attribute> modifier add <id> <value> (add_value|add_multiplied_total|add_multiplied_base)
attribute <target> <attribute> modifier remove <id>
attribute <target> <attribute> modifier value get <id> [<scale>]
```

Argument order is strict: `<target> <attribute> <get|base|modifier> …`.

- `<target>` is `entity` with `amount=single` — **a selector that can match more than one entity will not parse**; and 只有生物才有属性 (only mobs have attributes).
- `<attribute>` is a `resource` argument (registry `minecraft:attribute`), a namespaced ID.
- Operation modes (1.20.5+ names):
  - `add_value` — 累加值 (was `add`)
  - `add_multiplied_base` — 累加基值乘积 (was `multiply_base`)
  - `add_multiplied_total` — 累加总值乘积 (was `multiply`)
- `<id>` is a `resource_location` used as the modifier's namespaced ID; multiple modifiers may share everything except the ID.
- `<scale>` is used with `execute store result` and truncates the fraction (小数会被截断取整).

Failure conditions:
- `<target>` does not resolve to a single mob (players must be online) ⇒ fail
- the entity does not have that attribute (e.g. a player has no `minecraft:horse.jump_strength`) ⇒ fail
- `modifier add` fails if a modifier with the same namespaced ID already exists
- `modifier remove` / `modifier value get` fail if no such modifier exists

Outputs: `get`, `base get`, `modifier value get` ⇒ `result` = the value × scale, truncated. `base set`, `modifier add`, `modifier remove` ⇒ `result` = 1.

Examples verbatim:
```
/attribute @s minecraft:armor base set 5
/execute as @a run attribute @s minecraft:max_health base set 1
/attribute @p minecraft:gravity modifier add test:antigravity -0.16 add_value
/attribute @p minecraft:gravity modifier remove test:antigravity
/attribute @p minecraft:gravity base reset
```

**Attribute-name gotcha:** the page's own examples use namespaced IDs **without the old `generic.` prefix** (`minecraft:armor`, `minecraft:max_health`, `minecraft:gravity`). If you are writing for an older version, the same attributes were `minecraft:generic.armor`, `minecraft:generic.max_health`, `minecraft:generic.gravity`. Always check the attribute registry for the target version.

History (Java):
| Version | Change |
|---|---|
| 1.16 (20w17a) | `/attribute` added |
| 1.18.2 (pre3) | attribute argument type changed from `resource_location` to `resource` |
| **1.20.5 (24w09a)** | **operations renamed: `add`→`add_value`, `multiply_base`→`add_multiplied_base`, `multiply`→`add_multiplied_total`** |
| **1.21 (24w21a)** | **modifier `uuid` and `name` parameters removed; both replaced by the namespaced ID `id`** |
| 1.21.4 (24w44a) | `base reset` subcommand added |


---

## 12. Copy-paste grammar wall (all syntax lines in one place)

Java Edition. `<…>` = required, `[…]` = optional, `(a|b)` = choose one. Copied from the grammar boxes cited in §1–§11.

```
# ---- /execute ------------------------------------------------------------------
execute ...
... align <axes> -> execute
... anchored <anchor> -> execute
... as <targets> -> execute
... at <targets> -> execute
... facing <pos> -> execute
... facing entity <targets> <anchor> -> execute
... in <dimension> -> execute
... on (attacker|controller|leasher|origin|owner|passengers|target|vehicle) -> execute
... positioned <pos> -> execute
... positioned as <targets> -> execute
... positioned over <heightmap> -> execute
... rotated <rot> -> execute
... rotated as <targets> -> execute
... summon <entity> -> execute
... (if|unless) biome <pos> <biome> -> execute
... (if|unless) block <pos> <block> -> execute
... (if|unless) blocks <start> <end> <destination> (all|masked) -> execute
... (if|unless) data block <source> <path> -> execute
... (if|unless) data entity <source> <path> -> execute
... (if|unless) data storage <source> <path> -> execute
... (if|unless) dimension <dimension> -> execute
... (if|unless) entity <entities> -> execute
... (if|unless) function <name> -> execute
... (if|unless) items block <source> <slots> <item_predicate> -> execute
... (if|unless) items entity <source> <slots> <item_predicate> -> execute
... (if|unless) loaded <pos> -> execute
... (if|unless) predicate <predicate> -> execute
... (if|unless) score <target> <targetObjective> (=|<|<=|>|>=) <source> <sourceObjective> -> execute
... (if|unless) score <target> <targetObjective> matches <range> -> execute
... (if|unless) stopwatch <id> <range> -> execute
... (if|unless) slots block <source> <slots> -> execute
... (if|unless) slots entity <source> <slots> -> execute
... store (result|success) block <target> <path> (int|float|short|long|double|byte) <scale> -> execute
... store (result|success) bossbar <id> (value|max) -> execute
... store (result|success) entity <target> <path> (int|float|short|long|double|byte) <scale> -> execute
... store (result|success) score <targets> <objective> -> execute
... store (result|success) storage <target> <path> (int|float|short|long|double|byte) <scale> -> execute
... run ...
# `run` is optional but must be LAST and used ONCE; the chain must end with a
# condition subcommand or `run`. Modifier/condition subcommands may repeat, any order.

# ---- /function (calls) ---------------------------------------------------------
function <name>
function <name> with entity <target> <path>
function <name> with <compound>

# ---- /data ---------------------------------------------------------------------
data get (block|entity|storage) <target> [<path>] [<scale>]
data merge (block|entity|storage) <target> <nbt>
data modify (block|entity|storage) <target> <targetPath> (append|insert <index>|merge|prepend|set) (from (block|entity|storage) <source> [<sourcePath>]|string (block|entity|storage) <source> [<sourcePath>] [<start>] [<end>]|value <value>|compute (default|block <computePos>|entity <computeTarget>) (int|float) <provider>)
data remove (block|entity|storage) <target> <path>

# ---- NBT path ------------------------------------------------------------------
{}
{<snbt tags>}
name
"quoted name"
name{<snbt tags>}
name[]
name[<index>]
name[{<snbt tags>}]
a.b[0]."A [crazy name]!".baz

# ---- /scoreboard ---------------------------------------------------------------
scoreboard objectives list
scoreboard objectives add <objective> <criteria> [<displayName>]
scoreboard objectives remove <objective>
scoreboard objectives setdisplay <slot> [<objective>]
scoreboard objectives modify <objective> displayautoupdate (true|false)
scoreboard objectives modify <objective> displayname <displayName>
scoreboard objectives modify <objective> numberformat
scoreboard objectives modify <objective> numberformat blank
scoreboard objectives modify <objective> numberformat fixed <component>
scoreboard objectives modify <objective> numberformat styled <style>
scoreboard objectives modify <objective> rendertype (hearts|integer)
scoreboard players list [<target>]
scoreboard players get <target> <objective>
scoreboard players set <targets> <objective> <score>
scoreboard players add <targets> <objective> <score>
scoreboard players remove <targets> <objective> <score>
scoreboard players reset <targets> [<objective>]
scoreboard players enable <targets> <objective>
scoreboard players operation <targets> <targetObjective> <operation> <source> <sourceObjective>
scoreboard players display name <targets> <objective>
scoreboard players display name <targets> <objective> <text>
scoreboard players display numberformat <targets> <objective>
scoreboard players display numberformat <targets> <objective> blank
scoreboard players display numberformat <targets> <objective> fixed <contents>
scoreboard players display numberformat <targets> <objective> styled <style>
# <operation> = = | += | -= | *= | /= | %= | >< | < | >

# ---- selectors -----------------------------------------------------------------
@<variable>[<argument>=<value>,<argument>=<value>,…]
# variables: @p @r @a @e @s @n   (Java)
# arguments (Java): x y z distance dx dy dz scores tag team name type predicate
#                   x_rotation y_rotation nbt level gamemode advancements limit sort

# ---- /summon /give /setblock /fill ---------------------------------------------
summon <entity> [<pos>]
summon <entity> <pos> [<nbt>]
give <targets> <item> [<count>]
setblock <pos> <block> [destroy|keep|replace|strict]
fill <from> <to> <block> [outline|hollow|destroy|strict|replace|keep]
fill <from> <to> <block> replace <filter> [outline|hollow|destroy|strict]

# ---- /tag /schedule ------------------------------------------------------------
tag <targets> add <name>
tag <targets> remove <name>
tag <targets> list
schedule function <function> <time> [append|replace]
schedule clear <function>

# ---- /return /teleport ---------------------------------------------------------
return <value>
return fail
return run <命令>
teleport <destination>
teleport <targets> <destination>
teleport <location>
teleport <targets> <location>
teleport <targets> <location> <rotation>
teleport <targets> <location> facing <facingLocation>
teleport <targets> <location> facing entity <facingEntity> [<facingAnchor>]

# ---- /effect /attribute --------------------------------------------------------
effect clear [<targets>]
effect clear <targets> [<effect>]
effect give <targets> <effect> [<seconds>]
effect give <targets> <effect> <seconds> [<amplifier>]
effect give <targets> <effect> <seconds> <amplifier> [<hideParticles>]
attribute <target> <attribute> get [<scale>]
attribute <target> <attribute> base get [<scale>]
attribute <target> <attribute> base reset
attribute <target> <attribute> base set <value>
attribute <target> <attribute> modifier add <id> <value> (add_value|add_multiplied_total|add_multiplied_base)
attribute <target> <attribute> modifier remove <id>
attribute <target> <attribute> modifier value get <id> [<scale>]

# ---- .mcfunction file rules ----------------------------------------------------
# one command per line, NO leading '/'
# leading/trailing whitespace per line is ignored
# a line ending in '\' continues on the next line (1.20.2+)
# comments: a line whose first non-whitespace character is '#'
# macro line: first non-whitespace character is '$', and it contains $(key)
# macro keys: A-Z a-z 0-9 _
```

### 12.1 `execute` subcommand order — the single most error-prone rule

Checks a generator should apply before emitting an `execute` line:

1. Does the chain end with a condition subcommand (`if`/`unless`) **or** `run`? If not, it will not parse.
2. Is `run` present at most once, and is it the last element?
3. Is anything placed **after** `run`? That is a parse error.
4. Is `store` placed before the final `run`/condition? `store … run <cmd>` is the valid order.
5. Is `execute ... run execute ...` used? It is always a no-op — collapse it.
6. Is the *intended* subcommand order correct for the semantics, not just the syntax? `as … at @s` and `at @s as …` produce different results (see §2.1).
7. Does the line rely on `result`/`success` from a branch that might abort? Aborted branches do not store anything.


---

## 13. Unverified / uncertain

These are things I could **not** verify from the pages I actually read. They are stated here as open questions instead of guesses. Do not treat any of them as syntax to emit.

1. **`pack_format` values per Minecraft version** — *partially resolved.* The numbers are **not** in §0's version table because I did not read the pack-format pages myself for this task. However, the companion file **`research/pack-formats.md`** (already present in this directory, with its own list of nine source URLs) documents them, and §0.2 summarises that table. Consult `research/pack-formats.md` / `pack-formats.json` for the authoritative values rather than the summary.
2. **Attribute ID rename (`minecraft:generic.movement_speed` → `minecraft:movement_speed`).** All examples on [命令/attribute](https://zh.minecraft.wiki/w/命令/attribute) use the unprefixed form (`minecraft:armor`, `minecraft:max_health`, `minecraft:gravity`), and the page history mentions the `operation` renames and the `uuid`/`name`→`id` change but **not** the attribute-ID rename or the version it landed in. Check 属性/ID for the target version.
3. **`schedule <time>` units.** The page's examples are `3s` and `5d` and it says a time of `0` fails. Whether a bare number means ticks, and whether `t` is a valid suffix, is documented on the `time` argument-type page, which I did not read.
4. **`/scoreboard players reset` arity contradiction inside the same page.** The syntax box says `scoreboard players reset <targets> [<objective>]`, while the worked examples write `/scoreboard players reset @s bar 100` and `/scoreboard players reset * bar 100` (an extra trailing integer). Treat the syntax box as authoritative; the examples appear to be stale.
5. **Named colour list for text components.** [文本组件](https://zh.minecraft.wiki/w/文本组件) defers to 格式化代码#颜色代码 (not read). The 16 names listed in §6.5 are taken from the team-colour list on [记分板](https://zh.minecraft.wiki/w/记分板); `reset` is named there as a team-colour value, and its validity as a text-component `color` value is not directly verified on the 文本组件 page.
6. **Comment lines with leading whitespace.** The function page says leading/trailing whitespace on each line is ignored, and that `#` at 行首 comments a line. The macro rule explicitly says "$ 作为首个非空白字符" (first non-whitespace character) but the comment rule does not say that. Whether `   # comment` (indented) is a comment is not explicitly stated.
7. **When `/teleport <targets> <location> <rotation>` and the `facing` variants were introduced.** The Java history on [命令/teleport](https://zh.minecraft.wiki/w/命令/teleport) lists `facing` (18w01a) but does not date the `rotation`-argument form; the wiki's Bedrock history does.
8. **Trailing whitespace after a line-continuation backslash.** The rule is "line ends with `\`" and "each line's leading/trailing whitespace is ignored", but the ordering (trim-then-check vs check-then-trim) is not stated. Safe practice: never put a space after the `\`.
9. **Whether `/function <macro> with entity @s` without a path is valid.** The page only demonstrates `with entity @p SelectedItem` (target + NBT path) and `with {…}` (inline compound). A path-less `with entity` form was not shown and is not verified here.
10. **`haspermission` and `hasitem` as Java selector arguments.** The task brief suggested these might exist in modern Java. [目标选择器](https://zh.minecraft.wiki/w/目标选择器) marks `haspermission` (`{{exclusive|bedrock}}`) and `hasitem` (`{{only|be}}`) as **Bedrock-only**, and does not list them under the Java arguments. They are documented here as Bedrock-only; if you need a Java equivalent, use `predicate` (1.15+) or `execute if items` (1.20.5+).
11. **`minecraft:custom_data` as an item component.** The only in-page evidence I found is the item-*predicate* form `*[minecraft:custom_data~{id:"test:bar"}]` on [命令/execute](https://zh.minecraft.wiki/w/命令/execute). The write-side component name and its exact semantics are not confirmed by a page read here.
12. **Whether unquoted SNBT keys always parse in a text-component command argument.** The wiki's own `/scoreboard` examples use `{"text":"❤","color":"red"}` (JSON), while [文本组件](https://zh.minecraft.wiki/w/文本组件) presents the SNBT structure `{text: 'A', color: 'red'}`. Whether `tellraw @a {text:"hi"}` (unquoted key, no outer JSON) parses on every version is not verified here; the cross-version-safe form is double-quoted JSON.
13. **`§` (section sign) in Java text.** The Bedrock section of [文本组件](https://zh.minecraft.wiki/w/文本组件) shows `§` combining with score components to form formatting codes, and the Bedrock `/summon` example uses `"§6海豚"`. Java-side behaviour and the versions/places where `§` is accepted were not verified on the pages read; in Java use `color` in the component instead.
14. **Newest-version numbering.** The wiki uses `1.21.11`, `26.1`, `26.2`, `26.3` for the newest versions (a new scheme; per `research/pack-formats.md` these are **official releases**, not snapshots — 26.3 has pack format 121.0 and DataVersion 5023). A separate uncertainty remains: the wiki's `执行` history mentions development builds such as `26.2 (pre-1)` and `26.3 (snapshot-10)` whose strings I copied verbatim; their exact internal build numbering was not cross-checked.
15. **`execute if items` `<slots>` / slot-source values** and **`execute if slots`** — both are new and their valid slot/slot-source enumerations live on pages not read here.
16. **`/function` command's own syntax** (`function <name> [<arguments>]` including the `with` keyword spelling) — the function page demonstrates `function test:macro_func with entity @p SelectedItem` and `function test:test {x:1s, y:2b, z:3L}`, but the [命令/function](https://zh.minecraft.wiki/w/命令/function) page itself was not read, so the exact argument grammar and return-value semantics of `/function` come from the function page's prose only.
17. **The `time` / `rotation` / `item_stack` / `block_predicate` / `score_holder` / `slot_source` argument-type pages** were not read. Where a syntax line above says e.g. `<targets>` is a `score_holder` argument, the *type name* is copied from the page, but the type's full grammar is not reproduced here.


---


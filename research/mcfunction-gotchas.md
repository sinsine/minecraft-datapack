# mcfunction / command syntax gotchas

Concrete traps with a WRONG line and a RIGHT line. Everything in §A–§L is traceable to a wiki page (source URL per entry). §M lists traps I could not fully verify from the pages I read, and §N lists things that are **not** errors even though they look like they should be.

All lines are Java Edition.

---

## A. Function file mechanics

**A1. Missing `run` — the single most common parse error.**
```mcfunction
execute as @a say hi
```
```mcfunction
execute as @a run say hi
```
Why: `execute` 命令的结尾必须为条件子命令或 `run` 子命令，否则命令不可解析. An `execute` chain with neither a trailing condition nor `run` fails **at function load time**, so the entire function refuses to load. Source: https://zh.minecraft.wiki/w/命令/execute

**A2. `run` with nothing after it.**
```mcfunction
execute as @a at @s run
```
```mcfunction
execute as @a at @s run say hi
```
Why: `run` takes a complete command; an empty tail does not parse. Source: https://zh.minecraft.wiki/w/命令/execute

**A3. Subcommand placed *after* `run`.**
```mcfunction
execute as @a run say hi store result score #n obj
```
```mcfunction
execute store result score #n obj as @a run say hi
```
Why: `run` 只能位于 `execute` 末尾且只能使用一次. Everything after `run` is parsed as part of the inner command, so `say hi store result …` becomes the inner command's arguments and fails. Source: https://zh.minecraft.wiki/w/命令/execute

**A4. Two `run`s.**
```mcfunction
execute as @a run execute as @s run say hi
execute as @a run say hi run say bye
```
```mcfunction
execute as @a run say hi
execute as @a as @s run say hi
```
Why: `run` is used once, and `... run execute ...` 在任何情况下都不会起任何作用 — collapse it instead. Source: https://zh.minecraft.wiki/w/命令/execute

**A5. `/` prefix inside a function file.**
```mcfunction
/give @s minecraft:stone
```
```mcfunction
give @s minecraft:stone
```
Why: 每一行都允许一条不带前导正斜杠 `/` 的命令; since 1.12 pre3 commands in functions 不再允许以 `/` 开头. Source: https://zh.minecraft.wiki/w/Java版函数

**A6. `//` comments.**
```mcfunction
// set up the score
scoreboard objectives add obj dummy
```
```mcfunction
# set up the score
scoreboard objectives add obj dummy
```
Why: since 1.12 pre3 仅能使用 `#` 来注释，不再允许使用先前的 `//`. Source: https://zh.minecraft.wiki/w/Java版函数

**A7. A non-macro line that contains `$(…)`.**
```mcfunction
give @s $(id)
```
```mcfunction
$give @s $(id)
```
Why: a macro line is marked by `$` **as the first non-whitespace character**; without it, `$(id)` is never substituted and the line fails to parse as a command. Source: https://zh.minecraft.wiki/w/Java版函数

**A8. Calling a macro function without its parameters.**
```mcfunction
function mypack:give_item
```
```mcfunction
function mypack:give_item with {id:"minecraft:apple", count:3}
```
Why: 不能缺漏所执行宏函数所需的参数，否则整个宏函数也将不会运行 — the failure is silent. Source: https://zh.minecraft.wiki/w/Java版函数

**A9. Macro key containing an illegal character.**
```mcfunction
$give @s $(item-id)
```
```mcfunction
$give @s $(item_id)
```
Why: a key may only contain `a-z A-Z 0-9 _`; 否则替换段将无效. Source: https://zh.minecraft.wiki/w/Java版函数

**A10. Quoting a macro substitution that must be bare.**
```mcfunction
$give @s "$(id)"
```
```mcfunction
$give @s $(id)
```
Why: for a `string` tag the value is extracted **without its outer quotes** (直接提取其值（无最外层作为字符串标识的引号）), so `SelectedItem.id` already inserts `minecraft:apple` with no quotes. Wrapping it again makes the item argument invalid. Source: https://zh.minecraft.wiki/w/Java版函数

**A11. Expecting a numeric macro substitution to keep its SNBT suffix.**
```mcfunction
$scoreboard players set @s obj $(n)b
```
```mcfunction
$scoreboard players set @s obj $(n)
```
Why: numeric tag values are converted to text without the type suffix (不保留类型尾缀) and float exponents are expanded (`1.2E1` → `12`). Source: https://zh.minecraft.wiki/w/Java版函数

**A12. A macro call with a compound that has *extra* keys is fine — a missing key is not.**
```mcfunction
function mypack:f with {id:"minecraft:apple"}
```
```mcfunction
function mypack:f with {id:"minecraft:apple", count:1, extra:"ignored"}
```
Why: 复合标签中可以有多余的键值对，但不能缺漏…所需的参数. Source: https://zh.minecraft.wiki/w/Java版函数

---

## B. `execute` ordering and semantics (parses fine, does the wrong thing)

**B1. `as` / `at` order changes the meaning.**
```mcfunction
execute as @e at @s run tp @s ^ ^ ^1
```
This is the **right** line for "each entity moves 1 block in *its own* facing". The equally valid but semantically different line is:
```mcfunction
execute at @s as @e run tp @s ^ ^ ^1
```
which moves every entity 1 block along the **executor's** facing. Source: https://zh.minecraft.wiki/w/命令/execute

**B2. `at` does not change the executor.**
```mcfunction
execute at @e[type=pig] run kill
```
```mcfunction
execute as @e[type=pig] at @s run kill
```
Why: `at` 子命令不修改执行者 — the wiki's own example says `execute at @e[type=sheep] run kill` 杀死执行者而非所有绵羊. Source: https://zh.minecraft.wiki/w/命令/execute

**B3. `positioned` resets the anchor.**
```mcfunction
execute anchored eyes positioned ~ ~ ~ run tp ^ ^ ^1
```
```mcfunction
execute positioned ~ ~ ~ anchored eyes run tp ^ ^ ^1
```
Why: with `positioned`, 若指定局部坐标，将应用执行锚点。否则，将执行锚点重置为 `feet` — putting `anchored` after `positioned` is the safe order when you want eye-relative `^`. Source: https://zh.minecraft.wiki/w/命令/execute

**B4. `execute ... run execute ...` is always a no-op.**
```mcfunction
execute as @e[type=armor_stand] run execute as @e[type=armor_stand] run summon armor_stand
```
```mcfunction
execute as @e[type=armor_stand] as @e[type=armor_stand] run summon armor_stand
```
Why: `run` resets the parser to the root command node, so the nested `execute` just restarts; the two forms are identical and the first is pointless. Source: https://zh.minecraft.wiki/w/命令/execute

**B5. `execute if …` used where a side effect was intended.**
```mcfunction
execute as @a if score @s obj matches 1..
```
```mcfunction
execute as @a if score @s obj matches 1.. run say hello
```
Why: a condition subcommand **at the end of the chain** only outputs the test result; it runs nothing. `run` is optional, which is exactly the trap. Source: https://zh.minecraft.wiki/w/命令/execute

**B6. Fortifying `return` against an aborted `execute`.**
```mcfunction
execute as @e[type=zombie] at @s if block ~ ~-1 ~ grass_block return run tp @s Steve
```
This is the **right** idiom for "run exactly once" — but note it is `execute … run return run …`, and `return run execute … run <cmd>` differs: the former's `return` is skipped when the `execute` aborts and returns 失败/0, the latter's `return` always executes. Source: https://zh.minecraft.wiki/w/命令/return

**B7. Forgetting that an aborted branch stores nothing.**
```mcfunction
execute store result score #n obj as @e[type=pig] if data entity @s NoAI run data get entity @s NoAI
```
```mcfunction
scoreboard players set #n obj 0
execute store result score #n obj as @e[type=pig] if data entity @s NoAI run data get entity @s NoAI
```
Why: a branch that aborts (condition false) does not run the store, so the score keeps its **previous** value; and if all branches abort the whole `execute` aborts. Source: https://zh.minecraft.wiki/w/命令/execute

---

## C. Conditions and scores

**C1. Reading a score from an objective that does not exist.**
```mcfunction
execute if score @s objA = @s objB run say equal
execute store result score #n obj run scoreboard players get @s missing
```
```mcfunction
# in a #load function, before anything reads it:
scoreboard objectives add objA dummy
scoreboard objectives add objB dummy
scoreboard objectives add obj dummy
```
Why: `players get` fails when the objective does not exist, and a failed command stored via `execute store` writes **0** — silently poisoning your logic. `execute if score` against a missing objective also fails. Create objectives in the `#load` function. Sources: https://zh.minecraft.wiki/w/命令/scoreboard, https://zh.minecraft.wiki/w/Java版函数

**C2. `if score` without a comparison form.**
```mcfunction
execute if score @s obj 5 run say hi
```
```mcfunction
execute if score @s obj matches 5 run say hi
execute if score @s obj = @s other run say hi
```
Why: the only two forms are `<target> <targetObjective> (=|<|<=|>|>=) <source> <sourceObjective>` and `<target> <targetObjective> matches <range>`. Source: https://zh.minecraft.wiki/w/命令/execute

**C3. `matches` with an exclusive intent.**
```mcfunction
execute if score @s obj matches 1..10 run say hi
```
```mcfunction
execute if score @s obj matches 2..9 run say hi
```
Why: `matches <range>` is an **inclusive** int range; `5`, `5..`, `..5` and `5..10` are the forms. Source: https://zh.minecraft.wiki/w/命令/execute

**C4. `@a[scores={obj=1..}]` when `obj` does not exist.**
```mcfunction
execute if entity @a[scores={myobj=1..}] run say someone has it
```
```mcfunction
scoreboard objectives add myobj dummy
execute if entity @a[scores={myobj=1..}] run say someone has it
```
Why: nothing matches a nonexistent objective, so the condition is silently false forever. Sources: https://zh.minecraft.wiki/w/目标选择器, https://zh.minecraft.wiki/w/记分板

**C5. Using a read-only objective as a writable one.**
```mcfunction
scoreboard objectives add hearts health
scoreboard players set @s hearts 20
```
```mcfunction
scoreboard objectives add points dummy
scoreboard players set @s points 20
```
Why: `health`, `xp`, `level`, `food`, `air` and `armor` cannot be modified by commands; `players set|add|remove` on them fails. Use `dummy` (or `trigger`) and read the game value with `execute store`/`predicate` instead. Source: https://zh.minecraft.wiki/w/记分板

**C6. `if data` with a multi-entity selector.**
```mcfunction
execute if data entity @a SelectedItem run say hi
```
```mcfunction
execute as @a if data entity @s SelectedItem run say hi
```
Why: the `data entity <source>` argument is `amount=single` — a selector able to match more than one entity does not parse. Source: https://zh.minecraft.wiki/w/命令/execute

**C7. `execute if function` at the end of the chain.**
```mcfunction
execute if function mypack:check
```
```mcfunction
execute if function mypack:check run say passed
```
Why: 与其他条件子命令不同，此子命令不能置于子命令链的末尾 (MC-267799, Invalid). Source: https://zh.minecraft.wiki/w/命令/execute

**C8. `if blocks` on a huge region.**
```mcfunction
execute if blocks 0 0 0 100 100 100 0 0 0 all run say same
```
```mcfunction
# keep the source region ≤ 32768 blocks
execute if blocks 0 0 0 31 31 31 0 0 0 all run say same
```
Why: 要检测的源区域方块数大于32768 aborts the branch. Source: https://zh.minecraft.wiki/w/命令/execute

**C9. `if loaded` on a position outside the world.**
```mcfunction
execute if loaded 0 -100 0 run say loaded
```
```mcfunction
execute if loaded ~ ~ ~ run say loaded
```
Why: `loaded` aborts (fails) when `<pos>` 位于世界外, and there is no way to distinguish that from "not loaded". Source: https://zh.minecraft.wiki/w/命令/execute

**C10. `if biome` with a bare biome name.**
```mcfunction
execute if biome ~ ~ ~ jungle run say here
```
```mcfunction
execute if biome ~ ~ ~ minecraft:jungle run say here
execute if biome ~ ~ ~ #minecraft:is_jungle run say here
```
Why: the argument is a biome or biome-tag resource ID; the wiki's own example is `execute if biome ~ ~ ~ #minecraft:has_structure/jungle_temple`. Source: https://zh.minecraft.wiki/w/命令/execute

---

## D. Selectors, entity context, and argument restrictions

**D1. `@s` with no entity executor.**
```mcfunction
tag @s add loaded
```
```mcfunction
tag @a add loaded
```
Why: `@s` 只选择1个实体：该命令的执行者…若命令执行者为命令方块或服务器控制台执行命令，则此选择器不会选中任何东西. This applies inside `#load` functions (which run before players exist: 无法使用目标选择器来找到玩家) and inside `/schedule`d functions (计划的函数以服务端为执行者执行，执行位置为世界出生点). Sources: https://zh.minecraft.wiki/w/目标选择器, https://zh.minecraft.wiki/w/Java版函数, https://zh.minecraft.wiki/w/命令/schedule

**D2. A player-only argument given a non-player selector.**
```mcfunction
tellraw @e[type=pig] {"text":"hi"}
```
```mcfunction
tellraw @a {"text":"hi"}
tellraw @e[type=player] {"text":"hi"}
```
Why: if an argument requires a player-type selector, 输入的不符合条件 … 命令将无法解析 — it is a **parse error**, so the whole function fails to load. Valid player-only selectors: `@a`, `@p`, `@r`, `@s`, or `@e`/`@n` with `type=player`. Source: https://zh.minecraft.wiki/w/目标选择器

**D3. A single-entity argument given a multi-entity selector.**
```mcfunction
data get entity @e[type=pig] Pos
tp @a @e[type=pig]
```
```mcfunction
data get entity @e[type=pig,limit=1] Pos
tp @a @n[type=pig]
```
Why: 受到此限制的选择器须符合以下条件之一: `@a`/`@e` 且包含 `limit=1`; `@s` 且不包含 `limit`; `@p`/`@r`/`@n` 且不包含 `limit` 或 `limit=1`. Otherwise the command does not parse. Source: https://zh.minecraft.wiki/w/目标选择器

**D4. `scoreboard players get` with a multi-target selector.**
```mcfunction
scoreboard players get @a obj
```
```mcfunction
scoreboard players get @a[limit=1] obj
```
Why: `<target>` is a `score_holder` limited to one holder, and 仅允许指定1个分数持有者。且 `*` 将失效 (MC-136858). Source: https://zh.minecraft.wiki/w/命令/scoreboard

**D5. Spaces after the selector variable.**
```mcfunction
@e [type=pig]
```
```mcfunction
@e[type=pig]
```
Why: 目标选择器和第一个方括号之间 must not have spaces (spaces around `[`, `=`, `,` are allowed, but not there). Source: https://zh.minecraft.wiki/w/目标选择器

**D6. Case-mismatched selector arguments.**
```mcfunction
@e[Type=creeper]
```
```mcfunction
@e[type=creeper]
```
Why: 参数和值区分大小写, and since 1.11 invalid selectors 现在会产生错误，而不再被静默忽略 (which also means a function containing one fails to load). Source: https://zh.minecraft.wiki/w/目标选择器

**D7. Contradictory single-valued arguments.**
```mcfunction
@e[type=chicken,type=cow]
@e[team=red,team=blue]
```
```mcfunction
@e[type=chicken]
@e[team=red]
```
Why: `@e[type=chicken,type=cow]` is 无效选择 (nothing is both), and `@e[team=red,team=blue]` 是非法的，因为一个实体只能加入一个队伍. Repeated `tag=` **is** legal and means AND (`@e[tag=a,tag=b,tag=!c]`). Source: https://zh.minecraft.wiki/w/目标选择器

**D8. Unnamespaced IDs in an `nbt` filter.**
```mcfunction
@e[type=item,nbt={Item:{id:"slime_ball"}}]
```
```mcfunction
@e[type=item,nbt={Item:{id:"minecraft:slime_ball"}}]
```
Why: 当匹配字符串内的命名空间ID时，不得省略其命名空间 … `id` 字段始终包含一个已经被转换的命名空间ID字符串. Source: https://zh.minecraft.wiki/w/目标选择器

**D9. Using `nbt` where `tag` is cheaper and clearer.**
```mcfunction
@e[nbt={Tags:["a","b"]}]
```
```mcfunction
@e[tag=a,tag=b]
```
Why: the wiki states the two are equivalent but 后者更简单，且减少了CPU的负载. Source: https://zh.minecraft.wiki/w/目标选择器

**D10. Bedrock-only selector arguments in a Java datapack.**
```mcfunction
@a[hasitem={item=diamond}]
@a[haspermission={camera=enabled}]
@e[family=monster]
@e[has_property={minecraft:is_rolled_up=true}]
```
```mcfunction
@a[predicate=mypack:has_diamond]
execute if items entity @a * *[minecraft:diamond]
```
Why: `hasitem`, `haspermission`, `family` and `has_property` are marked Bedrock-only on the target-selector page; Java has `predicate` (1.15+) and `execute if items` (1.20.5+) instead. Source: https://zh.minecraft.wiki/w/目标选择器

**D11. `distance` with a negative or non-numeric value.**
```mcfunction
@e[distance=-5..5]
```
```mcfunction
@e[distance=0..5]
```
Why: `distance` 只允许使用非负数. Source: https://zh.minecraft.wiki/w/目标选择器

**D12. Expecting `distance`/`dx` to cross dimensions.**
```mcfunction
execute in the_nether if entity @e[distance=..10] run say near
```
```mcfunction
execute in the_nether as @e[distance=..10] run say near
```
Why: `distance` and `dx/dy/dz` 不能跨维度选择目标 (they are spatial parameters); only `limit` can cross dimensions. Source: https://zh.minecraft.wiki/w/目标选择器

**D13. `@e` and dying entities.**
```mcfunction
execute as @e[type=zombie] run data get entity @s Health
```
```mcfunction
execute as @e[type=zombie] run data get entity @s Health
# if you must catch dying entities, only @s can select them:
execute as @s run say hi
```
Why: `@e`/`@n` cannot select 濒死的实体, while `@s` can (无论是否濒死). Source: https://zh.minecraft.wiki/w/目标选择器

---

## E. Coordinates

**E1. Mixing `~` and `^` in one coordinate triple.** *(see §M for verification status)*
```mcfunction
execute at @s run tp @s ^ ^ ~1
```
```mcfunction
execute at @s run tp @s ^ ^ ^1
execute at @s run tp @s ~ ~ ~1
```
Why: a single triple is either relative (`~`), local (`^`), or absolute — do not mix them within one triple. Source needed: https://zh.minecraft.wiki/w/坐标 (not read for this task).

**E2. `^` with no meaningful rotation.**
```mcfunction
execute positioned ~ ~ ~ run tp @s ^ ^ ^1
```
```mcfunction
execute at @s run tp @s ^ ^ ^1
```
Why: local coordinates are computed from the execution rotation and anchor, not the position; after `positioned` the rotation is whatever the executor's was (and a command block's is 0/0). Source: https://zh.minecraft.wiki/w/命令/execute

**E3. `~` inside a function that runs with the server as executor.**
```mcfunction
schedule function mypack:later 1s
```
```mcfunction
# mypack:later
execute at @p run setblock ~ ~-1 ~ minecraft:stone
```
Why: the scheduled function runs 以服务端为执行者，执行位置为世界出生点, so `~ ~ ~` is world spawn unless you re-position with `execute at`/`positioned`. Source: https://zh.minecraft.wiki/w/命令/schedule

---

## F. `/data` and NBT paths

**F1. `from` before the operation.**
```mcfunction
data modify storage a:b out from storage a:b in
```
```mcfunction
data modify storage a:b out set from storage a:b in
```
Why: the order is `<targetPath> <operation> [<index>] <source-kind> <source> [<sourcePath>]`. Source: https://zh.minecraft.wiki/w/命令/data

**F2. `append`/`insert`/`prepend` on a path that does not exist.**
```mcfunction
data modify storage mypack:data list append value "a"
```
```mcfunction
data modify storage mypack:data list set value []
data modify storage mypack:data list append value "a"
```
Why: 若未能成功更改任何NBT the command fails; and append/insert/prepend 只能对列表和数组操作, so a missing path (not yet a list) cannot be appended to. Source: https://zh.minecraft.wiki/w/命令/data

**F3. `merge` on a non-compound.**
```mcfunction
data modify storage mypack:data list merge value {a:1}
```
```mcfunction
data modify storage mypack:data obj set value {}
data modify storage mypack:data obj merge value {a:1}
```
Why: `merge` 只能对复合标签操作. Source: https://zh.minecraft.wiki/w/命令/data

**F4. `set value` where `merge` was intended.**
```mcfunction
data modify entity @s equipment merge value {head:{id:"minecraft:diamond_helmet"}}
```
This one is **right**. The wrong one — which silently destroys sibling keys — is:
```mcfunction
data modify entity @s equipment set value {head:{id:"minecraft:diamond_helmet"}}
```
Why: `set` 将指定NBT标签覆盖为新的值; `merge` 若存在同名标签，则后者覆盖前者 but keeps the other keys. Source: https://zh.minecraft.wiki/w/命令/data

**F5. `set value` with a mismatched type.**
```mcfunction
data modify entity @s MyIntTag set value "5"
```
```mcfunction
data modify entity @s MyIntTag set value 5
```
Why: a modification that changes nothing (type mismatch) makes the command fail (未能成功更改任何NBT). Source: https://zh.minecraft.wiki/w/命令/data

**F6. Writing to the root tag.**
```mcfunction
data modify entity @s set value {}
```
```mcfunction
data modify entity @s CustomName set value "Bob"
```
Why: `<path>指定的是根标签` is a failure case for `/data remove` and `/data modify … set …`. Source: https://zh.minecraft.wiki/w/命令/data

**F7. `data get` on a path that matches several tags.**
```mcfunction
data get entity @s Inventory[].id
```
```mcfunction
data get entity @s Inventory[0].id
```
Why: `/data get` requires the path to select exactly one tag (标签集大小为1); `/data modify` and `/data remove` may select many. Source: https://zh.minecraft.wiki/w/NBT路径

**F8. Modifying a player's NBT.**
```mcfunction
data modify entity @s Health set value 20
```
```mcfunction
effect give @s instant_health 1 10
item replace entity @s hotbar.0 with minecraft:diamond
```
Why: `/data` 无法修改（包括设置和删除）玩家的NBT数据; use `/item`, `/effect`, `/attribute` etc. (Note `execute store … entity` also cannot modify a player.) Sources: https://zh.minecraft.wiki/w/命令/data, https://zh.minecraft.wiki/w/命令/execute

**F9. `string` slice end index treated as inclusive.**
```mcfunction
data modify storage a:b out set string storage a:b src 0 0
```
```mcfunction
data modify storage a:b out set string storage a:b src 0 1
```
Why: `<end>` 要从源字符串中排除的首个字符的索引值 — it is exclusive, so `0 1` extracts the first character. Source: https://zh.minecraft.wiki/w/命令/data

**F10. Unquoted NBT path keys.**
```mcfunction
data get entity @s foo.a b
data get entity @s foo.bar.0
```
```mcfunction
data get entity @s "foo"."a b"
data get entity @s foo.bar[0]
```
Why: a node must be quoted when the tag name contains a dot, whitespace, or a quote; and list elements are addressed with `[index]`, never with a dotted number. Source: https://zh.minecraft.wiki/w/NBT路径

**F11. Assuming `foo.bar` and `foo.bar[]` are interchangeable.**
```mcfunction
data get entity @e[type=item,limit=1] Motion[0]
```
```mcfunction
data get entity @e[type=item,limit=1] Motion[]
```
Why: `Motion[0]` selects one element, `Motion[]` selects every element — with a multi-entity source the counts differ (the wiki works through exactly this: 2 results versus 6 results for `Motion` and `Motion[]`). Source: https://zh.minecraft.wiki/w/文本组件 (NBT component) and https://zh.minecraft.wiki/w/NBT路径

**F12. A namespaced key written without quotes in a path.**
```mcfunction
data get entity @s SelectedItem.components.minecraft:custom_data.id
```
```mcfunction
data get entity @s SelectedItem.components."minecraft:custom_data".id
```
Why: a key containing `:` is safer quoted (dot/space/quote make quoting mandatory; the wiki's own book example writes `components.minecraft:written_book_content` unquoted, and `/execute`'s example writes it quoted). Prefer the quoted form. Sources: https://zh.minecraft.wiki/w/NBT路径, https://zh.minecraft.wiki/w/命令/execute

**F13. Empty-string child node (1.21.5+).**
```mcfunction
data get entity @s ""
```
```mcfunction
data get entity @s SomeKey
```
Why: since 1.21.5 (25w09a) 子标签节点不再接受空字符串. Source: https://zh.minecraft.wiki/w/NBT路径

**F14. Storing into a non-existent NBT path.**
```mcfunction
execute store result block ~ ~ ~ mytag.nested int 1 run data get entity @s Pos[0]
```
```mcfunction
data modify block ~ ~ ~ mytag set value {nested:0}
execute store result block ~ ~ ~ mytag.nested int 1 run data get entity @s Pos[0]
```
Why: for `store … block|entity`, 路径不存在时不进行操作 — nothing is stored and the command still reports success. Source: https://zh.minecraft.wiki/w/命令/execute

**F15. Missing the type keyword or scale in `store`.** (parse error)
```mcfunction
execute store result block ~ ~ ~ mytag run data get entity @s Pos[0]
execute store result score #n obj int 1 run data get entity @s Pos[0]
```
```mcfunction
execute store result block ~ ~ ~ mytag int 1 run data get entity @s Pos[0]
execute store result score #n obj run data get entity @s Pos[0]
```
Why: `store … block|entity|storage` requires `(int|float|short|long|double|byte) <scale>`; `store … score` takes neither. Source: https://zh.minecraft.wiki/w/命令/execute

---

## G. Items, components, and version traps

**G1. Old item NBT on 1.20.5+.**
```mcfunction
give @s minecraft:diamond_sword{Unbreakable:1b}
```
```mcfunction
give @s diamond_sword[unbreakable={}]
```
Why: 1.20.5 (24w09a) 更改了语法，现在不再使用物品 `NBT标签`，而是 `物品堆叠组件` — the old form no longer parses. Source: https://zh.minecraft.wiki/w/命令/give

**G2. 1.20.5–1.21.4 component wrappers vs 1.21.5+ plain components.**
```mcfunction
give @s minecraft:diamond_block[minecraft:can_place_on={blocks:"minecraft:dirt"}] 1
```
That is correct on **1.21.5+**; on **1.20.5–1.21.4** the same intent is:
```mcfunction
give @s minecraft:diamond_block[minecraft:can_place_on={predicates:[{blocks:"minecraft:dirt"}]}] 1
```
Why: the wiki keeps an explicit old-format box showing the two spellings. Source: https://zh.minecraft.wiki/w/命令/give

**G3. JSON-in-a-string text components in NBT (1.21.5+).**
```mcfunction
summon pig ~ ~ ~ {CustomName:'{"text":"Bob"}'}
```
```mcfunction
summon pig ~ ~ ~ {CustomName:{text:"Bob"}}
```
Why: since 1.21.5 (25w02a) 文本组件现在以NBT形式存储，不再存储为JSON字符串. A string is still a valid component — but it is the **pure-text shorthand**, so the JSON would be rendered literally on screen instead of being parsed. Source: https://zh.minecraft.wiki/w/文本组件

**G4. `/summon` with NBT but no position.** (parse error)
```mcfunction
summon pig {NoAI:1b}
```
```mcfunction
summon pig ~ ~ ~ {NoAI:1b}
```
Why: the grammar is `summon <entity> [<pos>]` / `summon <entity> <pos> [<nbt>]` — NBT only follows an explicit position. Source: https://zh.minecraft.wiki/w/命令/summon

**G5. Summoning things that cannot be summoned.**
```mcfunction
summon minecraft:player
summon minecraft:fishing_bobber
```
```mcfunction
summon armor_stand ~ ~ ~ {ShowArms:1b}
```
Why: 玩家（minecraft:player）和浮漂（minecraft:fishing_bobber）实体无法被召唤, and the attempt fails the command. Source: https://zh.minecraft.wiki/w/命令/summon

**G6. `/give` count out of range.**
```mcfunction
give @s minecraft:stone 0
give @s minecraft:stone 6401
```
```mcfunction
give @s minecraft:stone 64
```
Why: count must be between 1 and 100 stacks (normally 6400); more than 100 stacks fails. Source: https://zh.minecraft.wiki/w/命令/give

**G7. Old dungeon-loot syntax.**
```mcfunction
give @s chest{BlockEntityTag:{LootTable:"chests/village/village_armorer"}} 1
```
```mcfunction
give @s chest[container_loot={loot_table:"chests/village/village_armorer"}] 1
```
Why: block-entity data became the `block_entity_data` component and loot the `container_loot` component. Source: https://zh.minecraft.wiki/w/命令/give

**G8. Datapack item markers.**
```mcfunction
give @s stick{myid:"test:bar"}
execute if data entity @s SelectedItem.tag.myid run say hi
```
```mcfunction
give @s stick[minecraft:custom_data={id:"test:bar"}]
execute if items entity @s weapon.mainhand *[minecraft:custom_data~{id:"test:bar"}] run say hi
```
Why: the modern marker is the `custom_data` component, tested with the item-predicate `~` (contains) operator. Source: https://zh.minecraft.wiki/w/命令/execute (the `items` condition example)

---

## H. Blocks

**H1. `setblock` given a `fill` mode.** (parse error)
```mcfunction
setblock ~ ~ ~ minecraft:stone outline
```
```mcfunction
setblock ~ ~ ~ minecraft:stone replace
```
Why: `setblock` modes are `destroy|keep|replace|strict`; `outline`/`hollow` are `fill`-only. Sources: https://zh.minecraft.wiki/w/命令/setblock, https://zh.minecraft.wiki/w/命令/fill

**H2. Filter not directly after `replace`.** (parse error)
```mcfunction
fill ~ ~ ~ ~4 ~4 ~4 minecraft:stone outline replace minecraft:dirt
```
```mcfunction
fill ~ ~ ~ ~4 ~4 ~4 minecraft:stone replace minecraft:dirt outline
```
Why: the second grammar form is `fill <from> <to> <block> replace <filter> [outline|hollow|destroy|strict]`. Source: https://zh.minecraft.wiki/w/命令/fill

**H3. `keep` on a non-air block.**
```mcfunction
setblock ~ ~ ~ minecraft:stone keep
```
```mcfunction
setblock ~ ~ ~ minecraft:stone replace
```
Why: `keep` — 仅当原方块是空气类方块时才进行更改 — otherwise the command fails. Source: https://zh.minecraft.wiki/w/命令/setblock

**H4. Setting a block to itself.**
```mcfunction
setblock ~ ~ ~ minecraft:stone replace
```
```mcfunction
setblock ~ ~-1 ~ minecraft:diamond_block replace
```
Why: for `keep`/`replace`/`strict`, if 原方块与新方块完全相同（不考虑方块实体） the command fails. Source: https://zh.minecraft.wiki/w/命令/setblock

**H5. Sign text with fewer than four lines.** (parse error)
```mcfunction
setblock ~ ~ ~ birch_sign{front_text:{messages:["Line 1"]}}
```
```mcfunction
setblock ~ ~ ~ birch_sign{front_text:{messages:["Line 1","","",""]}}
```
Why: 告示牌即使有几行空着也要把总共四行写全，否则无法正确解析. Source: https://zh.minecraft.wiki/w/命令/setblock

**H6. `fill` above the modification limit.**
```mcfunction
fill ~-100 ~-100 ~-100 ~100 ~100 ~100 minecraft:stone
```
```mcfunction
# a region ≤ max_block_modifications (default 32768) for the target world
fill ~-8 ~-8 ~-8 ~8 ~8 ~8 minecraft:stone
```
Why: the command fails when the region exceeds the game rule limit. Source: https://zh.minecraft.wiki/w/命令/fill

**H7. Modes that fail when nothing changes.**
```mcfunction
fill ~ ~ ~ ~3 ~3 ~3 minecraft:glass outline
```
```mcfunction
fill ~ ~ ~ ~3 ~3 ~3 minecraft:glass
```
Why: `hollow`, `keep`, `outline`, `replace …` and `strict` fail if no block was changed, and `destroy` fails when filling air into an all-air region. Source: https://zh.minecraft.wiki/w/命令/fill

**H8. Forgetting block states are `[key=value]`, not `{…}`.**
```mcfunction
setblock ~ ~ ~ minecraft:oak_stairs{facing:"north"}
```
```mcfunction
setblock ~ ~ ~ minecraft:oak_stairs[facing=north]
setblock ~ ~ ~ minecraft:birch_sign{front_text:{messages:["","","",""]}}
```
Why: block **states** go in `[…]`; block **NBT** (block-entity data) goes in `{…}`. Source: https://zh.minecraft.wiki/w/命令/setblock

---

## I. Scoreboard command mechanics

**I1. `objectives add` in `#tick`.**
```mcfunction
# in the #tick function
scoreboard objectives add myobj dummy
scoreboard players add @a myobj 1
```
```mcfunction
# in the #load function
scoreboard objectives add myobj dummy
# in the #tick function
scoreboard players add @a myobj 1
```
Why: `objectives add` fails when the objective already exists, so it will fail on every tick after the first; and 记分项不存在 makes every `players …` command fail. Put creation in `#load` (which runs on world load, server start and every `/reload`). Sources: https://zh.minecraft.wiki/w/命令/scoreboard, https://zh.minecraft.wiki/w/Java版函数

**I2. Objective names containing `:`.**
```mcfunction
scoreboard objectives add mypack:points dummy
```
```mcfunction
scoreboard objectives add mypack.points dummy
```
Why: since 1.13 记分板名称不再能包含 `:` 等字符; Java objective names allow letters, digits, `_`, `.`, `-`, `+`. Source: https://zh.minecraft.wiki/w/记分板

**I3. Bare-word display names.** (parse error)
```mcfunction
scoreboard objectives add bar dummy Scoreboard
```
```mcfunction
scoreboard objectives add bar dummy "Scoreboard"
scoreboard objectives add bar dummy {"text":"Scoreboard","color":"gold"}
```
Why: in Java the display name 必须为一个文本组件 — the wiki's own commentary: 必须符合JSON语法…所以应该写为 `"Scoreboard"` 而非 `Scoreboard`. Source: https://zh.minecraft.wiki/w/命令/scoreboard

**I4. Reading a score that was never set.**
```mcfunction
execute store result score #n var run scoreboard players get #temp var
```
```mcfunction
scoreboard players add #temp var 0
execute store result score #n var run scoreboard players get #temp var
```
Why: `players get` fails when 指定分数持有者在指定记分项中没有分数, and a failed command stores 0. Adding 0 performs 隐式初始化 and guarantees the score exists. Source: https://zh.minecraft.wiki/w/命令/scoreboard

**I5. Division by a zero source.**
```mcfunction
scoreboard players operation Steve A /= Steve B
```
```mcfunction
execute unless score Steve B matches 0 run scoreboard players operation Steve A /= Steve B
```
Why: 对于 `/=` 和 `%=`，如果来源分数为0（即除数为0）…命令将执行失败 (in Java). Source: https://zh.minecraft.wiki/w/命令/scoreboard

**I6. Forgetting that `%=` follows the divisor's sign (1.13.1+).**
```mcfunction
scoreboard players operation #a var %= #b var
# then assuming the result has the sign of #a
```
```mcfunction
# since 1.13.1 the result is Math.floorMod(x, y): the sign follows the DIVISOR (#b)
```
Why: 1.13.1 (18w31a) 现在计算 `%=` 的方式由 `x % y` 改为 `Math.floorMod(x, y)`. Source: https://zh.minecraft.wiki/w/记分板

**I7. `*` in the wrong score-holder slot.**
```mcfunction
scoreboard players get * obj
```
```mcfunction
scoreboard players operation Steve A < * A
```
Why: `*` works in `players operation` (iterate all tracked holders) but not in `players get/set/…`, where in Java `*` 将失效. Source: https://zh.minecraft.wiki/w/命令/scoreboard

**I8. Virtual player names without `#`.**
```mcfunction
scoreboard players set temp_const var 100
scoreboard objectives setdisplay sidebar var
```
```mcfunction
scoreboard players set #temp_const var 100
scoreboard objectives setdisplay sidebar var
```
Why: 以 `#` 开头的伪造的玩家名称在任何情况下都不会在侧边栏可见 — `#` is the convention for scratch constants so they never pollute a display. Source: https://zh.minecraft.wiki/w/记分板

---

## J. Text components and quoting

**J1. Unquoted JSON values in `tellraw`.**
```mcfunction
tellraw @a {"text":Hello}
tellraw @a {text:Hello}
```
```mcfunction
tellraw @a {"text":"Hello"}
```
Why: in JSON a string value must be double-quoted. Source: https://zh.minecraft.wiki/w/命令/scoreboard (the display-name commentary applies to all component arguments)

**J2. Quotes nested inside a component string.**
```mcfunction
tellraw @a {"text":"say "hi""}
```
```mcfunction
tellraw @a {"text":"say \"hi\""}
```
Why: `\"` is the escape for a double quote **inside** a JSON string; the outer quotes delimit the JSON string itself. Source: https://zh.minecraft.wiki/w/文本组件 (the allowed-escape table lists `\"` → `"`)

**J3. Newlines.**
```mcfunction
tellraw @a {"text":"line1
line2"}
```
```mcfunction
tellraw @a {"text":"line1\nline2"}
```
Why: `\n` is the newline escape (`\u000A`). A literal newline inside a command argument is not the same thing. Source: https://zh.minecraft.wiki/w/文本组件

**J4. List-form style pollution.**
```mcfunction
title @a title [{"color":"red","text":"A"},{"text":"B"}]
```
```mcfunction
title @a title ["",{"color":"red","text":"A"},{"text":"B"}]
```
Why: 第一个列表元素将成为根组件…其样式会继承到所有后续组件. Inserting an empty component first prevents the pollution. Source: https://zh.minecraft.wiki/w/文本组件

**J5. `clickEvent` / `hoverEvent` on 1.21.5+.**
```mcfunction
tellraw @a {"text":"click","clickEvent":{"action":"run_command","value":"/say hi"}}
```
```mcfunction
tellraw @a {"text":"click","click_event":{"action":"run_command","command":"say hi"}}
```
Why: 1.21.5 (25w02a) renamed `clickEvent`→`click_event` and `hoverEvent`→`hover_event`, and renamed the payload keys (`value`→`command`/`url`/`page`/`path`), moving `contents` to the root. The leading `/` in `run_command` is 不再必须. Source: https://zh.minecraft.wiki/w/文本组件

**J6. `null` and `[]` text expressions (1.20.3+).**
```mcfunction
title @a title null
title @a title []
```
```mcfunction
title @a title ""
title @a title [""]
```
Why: 1.20.3 (23w40a) 不再支持 `null` 和 `[]` JSON文本表达式; and 若 `color`、`clickEvent` 和 `hoverEvent` 类型字段中出现错误，现在将不再被静默忽略. Source: https://zh.minecraft.wiki/w/文本组件

**J7. Expecting a `score` component to survive with no objective.**
```mcfunction
title @a title {"score":{"name":"*","objective":"does_not_exist"}}
```
```mcfunction
scoreboard objectives add myobj dummy
title @a title {"score":{"name":"*","objective":"myobj"}}
```
Why: 如果分数持有者为空，或分数持有者的对应记分项信息不存在，则游戏预解析后此项直接转变为空纯文本组件 (renders as nothing). Source: https://zh.minecraft.wiki/w/文本组件

**J8. Expecting `selector`/`score` inside `title` to resolve once.**
```mcfunction
title @a title {"selector":"@s"}
```
```mcfunction
title @a title {"selector":"@s"}
```
Why this is worth knowing rather than "wrong": for `tellraw`/`title` the component is pre-resolved **per receiving client**, with 触发预解析的实体是将要发送到的客户端的玩家 — so `@s` is each viewer. In every other command the trigger entity is the command's executor. Source: https://zh.minecraft.wiki/w/文本组件

---

## K. Load / tick / schedule context

**K1. Reaching players from `#load`.**
```mcfunction
# in a #load function
tellraw @a {"text":"Datapack loaded!"}
give @a minecraft:stone
```
```mcfunction
# in a #load function
scoreboard objectives add mypack.timer dummy
data modify storage mypack:config version set value 1
# in a #tick function
execute as @a run tellraw @s {"text":"Datapack active"}
```
Why: `#load` functions execute before players enter the world, 因此无法使用目标选择器来找到玩家，诸如 `tellraw` 和 `title` 命令将不会为任何玩家显示消息. Source: https://zh.minecraft.wiki/w/Java版函数

**K2. `schedule` with a zero delay.**
```mcfunction
schedule function mypack:later 0
schedule function mypack:later 0t
```
```mcfunction
schedule function mypack:later 1s
```
Why: `<time>` 为0时执行失败 (and the page's examples use `3s` and `5d`). Source: https://zh.minecraft.wiki/w/命令/schedule

**K3. `schedule clear` without a namespace, or clearing nothing.**
```mcfunction
schedule clear mypack:later
schedule clear later
```
```mcfunction
schedule clear mypack:later
```
Why: the first form is correct; the second fails because 应为一个函数或函数标签的命名空间ID（都必须写明前缀 `minecraft:`）. Also `schedule clear` fails if 指定函数或函数标签目前没有计划. Source: https://zh.minecraft.wiki/w/命令/schedule

**K4. Assuming `append` is the default.**
```mcfunction
schedule function mypack:later 5s append
schedule function mypack:later 5s
```
```mcfunction
# replace is the default; these are the same thing
schedule function mypack:later 5s replace
```
Why: 默认使用 `replace` 模式，即在一个函数或函数标签已有未执行的计划时，直接覆盖此计划. Source: https://zh.minecraft.wiki/w/命令/schedule

**K5. Tags in a `#tick` function scoped to the wrong entity.**
```mcfunction
# in a #tick function
tag @s add ticked
```
```mcfunction
# in a #tick function
execute as @a at @s run tag @s add ticked
```
Why: never rely on an implicit executor in load/tick/scheduled functions — re-establish the context with `execute as … at …` first. Sources: https://zh.minecraft.wiki/w/Java版函数, https://zh.minecraft.wiki/w/命令/schedule

---

## L. `/tag`, `/effect`, `/attribute`, `/teleport`

**L1. Tag names with spaces.** (parse error)
```mcfunction
tag @s add my tag
@e[tag=my tag]
```
```mcfunction
tag @s add my_tag
@e[tag=my_tag]
```
Why: `<name>` is a `string` argument of type `word` in Java, and the selector's `tag=` can only match names made of `- + . _ A-Z a-z 0-9`. Sources: https://zh.minecraft.wiki/w/命令/tag, https://zh.minecraft.wiki/w/目标选择器

**L2. Relying on tags for persistence.**
```mcfunction
# in a #load function
tag @a remove mypack.ready
```
```mcfunction
# in a #tick function
execute as @a[tag=!mypack.init] run function mypack:init_player
```
Why: `#load` cannot see players, so a load-time cleanup does nothing; tags also cannot be used to build persistent per-player state across the world being closed — use scoreboard or advancement data. Source: https://zh.minecraft.wiki/w/Java版函数

**L3. Bedrock effect syntax in Java.** (parse error)
```mcfunction
effect @s speed 60 1
```
```mcfunction
effect give @s speed 60 1
```
Why: since 1.13 (17w45a) the Java syntax is `effect give …` / `effect clear …`; the single-word form is Bedrock. Source: https://zh.minecraft.wiki/w/命令/effect

**L4. Amplifier mistaken for level.**
```mcfunction
effect give @s speed 60 2
# comment says "speed II"
```
```mcfunction
effect give @s speed 60 1   # speed II (level = amplifier + 1)
effect give @s speed 60 2   # speed III
```
Why: 状态效果的第1级（如生命恢复I）对应为0倍率，因此第2级状态效果（如生命恢复II）应指定倍率为1. Source: https://zh.minecraft.wiki/w/命令/effect

**L5. Instant effects given in seconds.**
```mcfunction
effect give @s instant_health 30
```
```mcfunction
effect give @s instant_health 1
```
Why: `instant_damage`, `instant_health` and `saturation` are the only exceptions — 其单位是游戏刻, and the default for them is 1 tick. Source: https://zh.minecraft.wiki/w/命令/effect

**L6. Old attribute operation names (1.20.5+).** (parse error)
```mcfunction
attribute @p minecraft:gravity modifier add test:antigravity -0.16 multiply
attribute @p minecraft:gravity modifier add test:antigravity uuid 00000000-0000-0000-0000-000000000001 name "x" value -0.16 add
```
```mcfunction
attribute @p minecraft:gravity modifier add test:antigravity -0.16 add_value
attribute @p minecraft:gravity modifier add test:antigravity -0.16 add_multiplied_total
```
Why: 1.20.5 (24w09a) renamed `add`→`add_value`, `multiply_base`→`add_multiplied_base`, `multiply`→`add_multiplied_total`; 1.21 (24w21a) removed the `uuid` and `name` parameters in favour of a namespaced `id`. Source: https://zh.minecraft.wiki/w/命令/attribute

**L7. Attribute names with the old `generic.` prefix.**
```mcfunction
attribute @s minecraft:generic.max_health base set 20
```
```mcfunction
attribute @s minecraft:max_health base set 20
```
Why: every current example on the attribute page uses the unprefixed ID. The exact version of the rename is **not** stated on that page — see §M. Source: https://zh.minecraft.wiki/w/命令/attribute

**L8. `/tp` destination given a multi-entity selector.** (parse error)
```mcfunction
tp @a @e[type=pig]
```
```mcfunction
tp @a @n[type=pig]
tp @a @e[type=pig,limit=1]
```
Why: `<destination>` is `amount=single`; only `<targets>` is multi. Source: https://zh.minecraft.wiki/w/命令/teleport

**L9. Expecting `/tp ~ ~ ~` to work with no executor.**
```mcfunction
tp ~ ~ ~
```
```mcfunction
execute as @p run tp @s ~ ~ ~
```
Why: with `<targets>` omitted 默认为命令执行者; if the executor is a command block/console there is no entity to teleport and the command fails. Source: https://zh.minecraft.wiki/w/命令/teleport

**L10. Teleporting a vehicle to move its rider — or the reverse.**
```mcfunction
tp @e[type=minecart] ~ ~10 ~
# assuming the rider comes along
```
```mcfunction
tp @e[type=minecart] ~ ~10 ~
# the rider DOES follow a teleported vehicle; but teleporting the RIDER dismounts it:
tp @e[type=pig] ~ ~10 ~   # any passengers are left behind
```
Why: 若一个骑乘着矿车、船或其他生物的生物被传送，则骑乘者会从其载具上脱离，并被单独传送至目标位置，而原有的载具会留在原地. 反之…骑乘在载具上的生物会跟随载具一同被传送. Source: https://zh.minecraft.wiki/w/命令/teleport

**L11. Out-of-range teleport coordinates.**
```mcfunction
tp @s 99999999 100 0
```
```mcfunction
tp @s 100 100 0
```
Why: if `x`/`z` exceed [-30000000, 30000000) or `y` exceeds (-20000000, 20000000], the command 会报告 success 但不会传送. Source: https://zh.minecraft.wiki/w/命令/teleport

---

## M. Traps I could not verify from the pages read for this task

These are widely-repeated rules that I could **not** confirm from the pages cited above. Treat them as needing a check against the named page before relying on them.

1. **Mixing `~` and `^` in one coordinate triple is invalid.** Every example on the pages I read uses a homogeneous triple (`~ ~ ~`, `^ ^ ^1`, `^5 ^ ^`), but the pages never state the prohibition. Verify at https://zh.minecraft.wiki/w/坐标.
2. **The `time` argument's unit suffixes.** `3s` and `5d` appear in the `/schedule` examples and a bare `0` is documented as failing, but whether a bare number means ticks and whether `t` is accepted is on the argument-type page. Verify at https://zh.minecraft.wiki/w/命令/schedule and the `time` argument type page.
3. **`#` comments with leading indentation.** The function page says per-line leading/trailing whitespace is ignored, and that `#` at 行首 comments a line; the macro rule explicitly says "first non-whitespace character" but the comment rule does not. Verify at https://zh.minecraft.wiki/w/Java版函数.
4. **Whether the executor of a `#tick` function has a position/entity.** The pages explicitly document this for `/schedule`d functions (服务端为执行者，执行位置为世界出生点) and the player-blindness of `#load`, and state that 若为执行者为服务端…执行位置为世界出生点 — but the `#tick` executor is not spelled out. Verify at https://zh.minecraft.wiki/w/Java版函数.
5. **`nbt` subset-match details for lists** (whether a list must match exactly in length and order). The selector page defers to NBT格式#测试NBT标签, which I did not read.
6. **The `generic.` prefix removal version for attribute IDs.** Not stated on the attribute page's history.
7. **Whether unquoted SNBT keys parse in a command's text-component argument** (`tellraw @a {text:"hi"}`). The wiki's command examples use double-quoted JSON; the text-component page presents SNBT structures. Verify at https://zh.minecraft.wiki/w/文本组件 and https://zh.minecraft.wiki/w/命令/tellraw.
8. **`§` in Java text.** Only Bedrock examples were found on the pages read.
9. **`schedule`/`teleport`/`fill` specifics** listed in §13 of the accompanying reference (`research/mcfunction-reference.md`).

---

## N. Things that look like errors but are not

Each of these is explicitly permitted by the cited page, so a generator should not "fix" them.

1. **Trailing whitespace on a line** — 每行首尾的空白字符都会被忽略. (https://zh.minecraft.wiki/w/Java版函数)
2. **Indentation / tabs before a command** — same rule.
3. **Very long single commands** — a function command is not subject to the command block's 32,500-character limit (only the 2,000,000-character function limit since 1.20.5). (https://zh.minecraft.wiki/w/Java版函数)
4. **Line continuation with `\`** — legal since 1.20.2. (https://zh.minecraft.wiki/w/Java版函数)
5. **Spaces around `[`, `=`, `,` inside a selector** — 括号、等号和逗号旁可以有空格 (but not between the variable and the first `[`). (https://zh.minecraft.wiki/w/目标选择器)
6. **Repeated selector arguments** — `@e[tag=a,tag=b,tag=!c]` is legal and means AND. (https://zh.minecraft.wiki/w/目标选择器)
7. **An `execute` chain with a condition but no `run`** — legal, it just outputs a result. (https://zh.minecraft.wiki/w/命令/execute)
8. **`count` omitted in `/give`** — defaults to 1. (https://zh.minecraft.wiki/w/命令/give)
9. **`hideParticles` omitted in `/effect give`** — defaults to `false`; `seconds` defaults to 30 s (1 tick for instant effects). (https://zh.minecraft.wiki/w/命令/effect)
10. **`sort` without `limit`** — parseable; it only matters together with `limit`. (https://zh.minecraft.wiki/w/目标选择器)

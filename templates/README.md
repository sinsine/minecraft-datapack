# Templates

Copy-ready skeletons. Nothing here is a finished datapack — these are the shapes
that save you from re-deriving syntax and from the errors the validator reports.

Every template uses the placeholder namespace `mypack`. Replace it with the
namespace you chose, in the file contents **and** in the folder names.

## Destination map

| Template | Copy to |
|---|---|
| `pack.mcmeta` | `<pack>/pack.mcmeta` — current era (1.21.9 and later: `min_format`/`max_format`) |
| `pack.mcmeta.legacy-1.21.8` | `<pack>/pack.mcmeta` — 1.21.8 and earlier (`pack_format`). Pick exactly one of the two. |
| `function/load.mcfunction` | `<pack>/data/mypack/function/load.mcfunction` |
| `function/tick.mcfunction` | `<pack>/data/mypack/function/tick.mcfunction` |
| `function/on_join.mcfunction` | `<pack>/data/mypack/function/on_join.mcfunction` |
| `function/macro_announce.mcfunction` | `<pack>/data/mypack/function/announce.mcfunction` |
| `tags/function/load.json` | `<pack>/data/minecraft/tags/function/load.json` (the namespace must be `minecraft` for it to run on load) |
| `tags/function/tick.json` | `<pack>/data/minecraft/tags/function/tick.json` |
| `recipe/crafting_shaped.json` | `<pack>/data/mypack/recipe/<name>.json` |
| `recipe/crafting_shapeless.json` | `<pack>/data/mypack/recipe/<name>.json` |
| `recipe/smelting.json` | `<pack>/data/mypack/recipe/<name>.json` |
| `recipe/smithing_transform.json` | `<pack>/data/mypack/recipe/<name>.json` |
| `advancement/shown.json` | `<pack>/data/mypack/advancement/<name>.json` |
| `advancement/manual_only.json` | `<pack>/data/mypack/advancement/<name>.json` |
| `loot_table/block.json` | `<pack>/data/mypack/loot_table/<name>.json` |
| `loot_table/entity.json` | `<pack>/data/mypack/loot_table/<name>.json` |
| `predicate/sneaking.json` | `<pack>/data/mypack/predicate/<name>.json` |
| `item_modifier/set_count.json` | `<pack>/data/mypack/item_modifier/<name>.json` |
| `tags/item/example.json` | `<pack>/data/mypack/tags/item/<name>.json` |
| `damage_type/example.json` | `<pack>/data/mypack/damage_type/<name>.json` |

## Before 1.21

Folder names are plural on 1.20.x and earlier: `functions/`, `advancements/`,
`recipes/`, `loot_tables/`, `predicates/`, `item_modifiers/`, `structures/`, and
the tag folders `tags/functions/`, `tags/items/`, `tags/blocks/`,
`tags/entity_types/`. See [../reference/version-gates.md](../reference/version-gates.md).

## Item stacks by era

An item stack is the one thing whose syntax changed shape. Entity NBT, block NBT
and `data` paths are unaffected.

```mcfunction
# 1.20.4 and earlier — unstructured NBT tags
give @s minecraft:diamond_sword{display:{Name:'"Excalibur"'},Unbreakable:1b}

# 1.20.5 and later — components in square brackets
give @s minecraft:diamond_sword[minecraft:custom_name='"Excalibur"',minecraft:unbreakable={}]
```

The 1.20.5 → 1.21.5 step is smaller but real: inside a command argument, a
component that is itself a predicate (such as `minecraft:can_place_on`) was
written `{predicates:[{blocks:"minecraft:dirt"}]}` in 1.20.5–1.21.4 and
`{blocks:"minecraft:dirt"}` from 1.21.5. The same split applies to a recipe
`result`: `{ "item": "..." }` up to 1.20.4, `{ "id": "..." }` from 1.20.5.

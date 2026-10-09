# Pack structure

Everything the game loads from a datapack lives under one predictable layout. A
file in the wrong place is not an error the game reports: the pack simply does
nothing, which is the most expensive kind of mistake because it looks like it
worked.

```
<pack folder>/
├─ pack.mcmeta                       required, exactly this name, at the root
├─ pack.png                          optional icon, 64x64 PNG
└─ data/
   └─ <namespace>/                   lowercase a-z 0-9 _ . - only
      ├─ function/<path>.mcfunction  commands
      ├─ advancement/<path>.json
      ├─ recipe/<path>.json
      ├─ loot_table/<path>.json
      ├─ predicate/<path>.json
      ├─ item_modifier/<path>.json
      ├─ damage_type/<path>.json
      ├─ structure/<path>.nbt
      ├─ tags/
      │  ├─ function/<path>.json     tags of functions, including minecraft:load / minecraft:tick
      │  ├─ item/<path>.json
      │  ├─ block/<path>.json
      │  └─ entity_type/<path>.json  ...one folder per registry
      └─ worldgen/<kind>/<path>.json biome, feature, placed_feature, structure, ...
```

The folder that matters for auto-running code is `data/minecraft/tags/function/`:

```json
// data/minecraft/tags/function/load.json — runs once when the pack loads
{ "values": ["mypack:load"] }

// data/minecraft/tags/function/tick.json — runs at the start of every tick
{ "values": ["mypack:tick"] }
```

Both files must live in the **`minecraft`** namespace. The same file under your
own namespace is a normal tag that nothing ever runs. The validator reports this
as `MC-REF-011`.

## Naming rules

| Thing | Rule | Example |
|---|---|---|
| Namespace | `^[a-z0-9_.-]+$`, lowercase | `my_pack`, `sky.blocks` |
| Path segments | `^[a-z0-9/._-]+$`, lowercase, `/` between segments | `events/on_join` |
| Folder under `data/<namespace>/` | a registry name, **singular** from 1.21 on | `function`, not `functions` |
| Function file | `.mcfunction`, never `.json` | `tick.mcfunction` |
| Structure template | `.nbt` | `house.nbt` |
| Everything else | `.json` | `diamond.json` |
| Resource id | `<namespace>:<path>` without extension | `mypack:events/on_join` |

Capitals, spaces, and non-ASCII characters in a path produce a file the game
never loads. `MC-STRUCT-005` and `MC-STRUCT-004` catch these.

## Before 1.21

The registry folders were **plural** up to and including 1.20.6, and singular
from 1.21. Using the wrong one for the era means nothing loads.

| Up to 1.20.6 | 1.21 and later |
|---|---|
| `functions/` | `function/` |
| `advancements/` | `advancement/` |
| `recipes/` | `recipe/` |
| `loot_tables/` | `loot_table/` |
| `predicates/` | `predicate/` |
| `item_modifiers/` | `item_modifier/` |
| `structures/` | `structure/` |
| `tags/functions/` | `tags/function/` |
| `tags/items/`, `tags/blocks/`, `tags/entity_types/`, `tags/fluids/`, `tags/game_events/` | `tags/item/`, `tags/block/`, `tags/entity_type/`, `tags/fluid/`, `tags/game_event/` |

## pack.mcmeta

The only file the game requires. Field by field:

| Field | Required | Notes |
|---|---|---|
| `pack.description` | yes | A string or a text component. Shown in the pack list. |
| `pack.pack_format` | see below | The format number, for packs targeting 1.21.8 or earlier (format 81). |
| `pack.supported_formats` | no | `[low, high]` range, also only read up to 1.21.8. Must contain `pack_format`. |
| `pack.min_format` / `pack.max_format` | see below | Required from 1.21.9 (format 82). Each is an integer or `[major, minor]`. |
| `overlays.entries[].directory` | no | A sub-folder that overrides files for a version range. Also needs `min_format`/`max_format` (or `formats` for the old era). |
| `filter.block[]` | no | `namespace` / `path` regexes for files to ignore from lower packs. |
| `features.enabled[]` | no | Experimental feature flags. Adding this forces the pack to be added at world creation. |

A format number identifies a **range**, not a release: format 81 is both 1.21.7
and 1.21.8, and format 26 is both 1.20.3 and 1.20.4. `pack.mcmeta` has no field
for "this pack is for 1.21.8 exactly", so the only thing the metadata decides is
which era's rules apply. If the exact release matters, say it in the description
or keep it in a README next to the pack.

Which version fields to write depends on the target version, and getting it wrong
makes the pack show as incompatible in the world-creation screen:

```json
// target 1.21.8 or earlier
{ "pack": { "description": "...", "pack_format": 81 } }

// target 1.21.9 or later
{ "pack": { "description": "...", "min_format": [121, 0], "max_format": [121, 0] } }

// supporting both eras
{ "pack": { "description": "...", "pack_format": 121, "supported_formats": [48, 81],
            "min_format": [48, 0], "max_format": [121, 0] } }
```

Look the number up in [data/versions.json](data/versions.json) — never write one
from memory. The full era rules are in
[version-gates.md](version-gates.md#era-boundary-1218-vs-1219).

## Loading order and overrides

Files from a pack higher in the pack list replace files from lower packs with the
same id. Within one pack, an `overlays` entry replaces the body files entirely
for the versions it covers. That is the supported way to ship one pack for
several game versions: one directory per era, selected by `min_format`/`max_format`.

## Installing and testing

The pack folder goes into `<world>/datapacks/`, then in game:

```
/reload
/datapack list
/function mypack:load      ← run it by hand to see its errors immediately
```

`/reload` re-reads functions, advancements, recipes, loot tables, predicates,
tags and item modifiers. It does **not** re-read world generation, enchantments,
armor trims or jukebox songs; those need a world reload. A JSON file with a
syntax error blocks the whole reload, which is why the JSON checks run first.

# Registry files

Every JSON file under `data/<namespace>/<registry>/` defines one entry, addressed
as `<namespace>:<path>` without the extension. Names and required keys below are
what the validator checks; the traps are what it cannot check.

## Contents

- [Recipe](#recipe)
- [Advancement](#advancement)
- [Loot table](#loot-table)
- [Predicate](#predicate)
- [Item modifier](#item-modifier)
- [Damage type](#damage-type)
- [Tags](#tags)
- [World generation](#world-generation)

## Recipe

`data/<ns>/recipe/<name>.json`. `type` is required and names one of the recipe
types; the rest of the file depends on it.

```json
{
  "type": "minecraft:crafting_shaped",
  "pattern": ["DD", "DD"],
  "key": { "D": { "item": "minecraft:diamond" } },
  "result": { "id": "minecraft:diamond_block", "count": 1 }
}
```

| Type | Required keys |
|---|---|
| `crafting_shaped` | `pattern`, `key`, `result` |
| `crafting_shapeless` | `ingredients`, `result` |
| `crafting_transmute` (1.21.2+) | `input`, `result` |
| `smelting`, `blasting`, `smoking`, `campfire_cooking` | `ingredient`, `result` (+ `experience`, `cookingtime`) |
| `stonecutting` | `ingredient`, `result` |
| `smithing_transform` (1.20+) | `template`, `base`, `addition`, `result` |
| `smithing_trim` | `template`, `base`, `addition` |
| `crafting_special_*` | nothing; these are fixed vanilla behaviours |

- **Ingredient**: `{ "item": "minecraft:diamond" }` or `{ "tag": "minecraft:planks" }`.
  `crafting_shapeless.ingredients` and `smelting.ingredient` may also be an array
  of these, meaning "any of".
- **Result**: `{ "id": "minecraft:...", "count": 1 }` from 1.20.5; before that
  `{ "item": "minecraft:...", "count": 1 }`. See `MC-VERSION-005`.
- `pattern` rows must all be the same length and every symbol in them must exist
  in `key` (a space means "empty slot"). `MC-REG-033`, `MC-REG-034`.
- A recipe that outputs an item id that already has a recipe is silently ignored
  in favour of the lower pack. Namespace your file, not the item, unless you mean
  to override.

## Advancement

`data/<ns>/advancement/<name>.json`.

```json
{
  "display": {
    "icon": { "id": "minecraft:diamond" },
    "title": "First Diamond",
    "description": "Pick up a diamond",
    "frame": "task",
    "show_toast": true,
    "announce_to_chat": true,
    "hidden": false
  },
  "criteria": {
    "pickup": {
      "trigger": "minecraft:inventory_changed",
      "conditions": { "items": [ { "items": "minecraft:diamond" } ] }
    }
  },
  "rewards": { "function": "mypack:on_first_diamond" }
}
```

| Key | Notes |
|---|---|
| `criteria` | Required, and must not be empty. Each entry needs a `trigger`. `MC-REG-051`, `MC-REG-011`. |
| `display` | Optional. Written as an object, all three of `icon`, `title`, `description` are required. Omitting `display` makes the advancement invisible and ungrantable except by command. `MC-REG-053`. |
| `display.background` | A texture path like `minecraft:textures/block/stone.png`. Needed on a **root** advancement (one with no `parent`) if you want its tab to look right. |
| `parent` | Another advancement id, `mypack:parent` or `minecraft:story/root`. |
| `requirements` | Array of arrays of criterion names; every inner array needs at least one satisfied. |
| `rewards` | `function`, `loot`, `recipes`, `experience`. The ids are resolved by the validator (`MC-REF-007`). |

Triggers you are most likely to need: `minecraft:impossible` (grant it yourself
with `/advancement grant`), `minecraft:tick`, `minecraft:inventory_changed`,
`minecraft:player_killed_entity`, `minecraft:entity_hurt_player`,
`minecraft:enter_block`, `minecraft:location`, `minecraft:consume_item`,
`minecraft:recipe_unlocked`. The full list is in
[data/registries.json](data/registries.json) under `advancementTriggers`; an
unknown trigger is `MC-REG-052`.

**Each trigger has its own `conditions` schema, and this skill does not reproduce
them.** `inventory_changed` takes `items`, `player_killed_entity` takes `entity`
and `killing_blow`, `location` takes `position`/`biome`/`dimension`, and so on;
the validator cannot check them and a wrong key means the criterion never fires.
Before writing a trigger with conditions, either read the trigger's entry on the
wiki's 进度定义格式 page, or sidestep the schema entirely:

- `"trigger": "minecraft:impossible"` plus a pack-side `advancement grant` when
  your own logic decides the condition, or
- a predicate plus `execute if predicate` in a tick function.

A `rewards.function` runs **as the player who earned it**, with the advancement's
position. `@s` works there; `@a` refers to all players.

## Loot table

`data/<ns>/loot_table/<name>.json`.

```json
{
  "type": "minecraft:block",
  "pools": [
    {
      "rolls": 1,
      "conditions": [ { "condition": "minecraft:survives_explosion" } ],
      "entries": [
        { "type": "minecraft:item", "name": "minecraft:diamond",
          "functions": [ { "function": "minecraft:set_count", "count": 1 } ] }
      ]
    }
  ]
}
```

| Key | Notes |
|---|---|
| `type` | Required. `generic`, `block`, `entity`, `chest`, `fishing`, `gift`, `advancement_reward`, `advancement_entity`, `archaeology`, `barter`, `command`, `selector`, `shearing`, `equipment`. The authoritative list is `lootTableTypes` in [data/registries.json](data/registries.json). `MC-REG-041`. |
| `pools[]` | Required for the rollable types. Each pool needs a non-empty `entries`. `MC-REG-042`. |
| `pools[].rolls` | A number or a number provider, e.g. `{ "type": "minecraft:uniform", "min": 1, "max": 3 }`. |
| `entries[].type` | `item` (needs `name`), `tag` (needs `name`), `loot_table` (needs `value`), `group`/`alternatives`/`sequence` (need `children`), `dynamic` (needs `name`). |
| `conditions` | Any predicate condition, e.g. `minecraft:random_chance`, `minecraft:survives_explosion`, `minecraft:entity_properties`. |

### Making a vanilla mob drop something extra

A pack file whose id matches a vanilla loot table **replaces** it, and the vanilla
pools are not copied for you — so overriding `minecraft:entities/zombie` will
silently delete rotten flesh and the rare iron ingot unless you reproduce the
whole table. The file for that id is:

```
data/minecraft/loot_table/entities/zombie.json      # 1.21 and later
data/minecraft/loot_tables/entities/zombie.json     # 1.20.6 and earlier
```

Two ways to get extra drops without that risk, both of which work with a normal
custom table (like `templates/loot_table/entity.json`):

1. **Grant it yourself.** Detect the kill in tick with a scoreboard or a
   predicate, then `loot give @s loot mypack:entities/zombie`. You keep full
   control and never touch the vanilla file. A kill-detection advancement
   (`minecraft:player_killed_entity` with a reward function) does the same with
   no per-tick cost.
2. **Override deliberately.** Copy the current vanilla pools from the wiki's
   战利品表 page or from the vanilla data pack inside the game jar, then add your
   entry. Do this only when the user asked to change the vanilla drop table, and
   say in the hand-off that vanilla drops were replaced.

## Predicate

`data/<ns>/predicate/<name>.json`. A single condition object; the useful thing to
know is that conditions nest:

```json
{
  "condition": "minecraft:all_of",
  "terms": [
    { "condition": "minecraft:entity_properties", "entity": "this",
      "predicate": { "flags": { "is_sneaking": true } } },
    { "condition": "minecraft:location_check",
      "predicate": { "biome": "minecraft:plains" } }
  ]
}
```

Common conditions: `minecraft:all_of`, `any_of`, `inverted`, `random_chance`,
`random_chance_with_looting`, `entity_properties`, `location_check`,
`match_tool`, `inventory_changed`, `damage_source_properties`,
`time_check`, `weather_check`, `value_check`, `reference`.

Use a predicate instead of `nbt=` in a selector whenever you test something every
tick: the predicate is compiled, the NBT match is not.

## Item modifier

`data/<ns>/item_modifier/<name>.json`. One item function, or an array of them,
applied with `/item modify`.

```json
{ "function": "minecraft:set_count", "count": 3, "add": false }
```

Common functions: `set_count`, `set_damage`, `set_name`, `set_lore`,
`set_components`, `enchant_randomly`, `enchant_with_levels`, `set_enchantments`,
`limit_count`, `furnace_smelt`, `copy_components`, `copy_custom_data`.
`MC-REG-060` catches a file that has no `function` key.

## Damage type

`data/<ns>/damage_type/<name>.json`.

```json
{
  "message_id": "mypack.custom",
  "exhaustion": 0.1,
  "scaling": "when_caused_by_living_non_player"
}
```

`message_id`, `exhaustion` and `scaling` are required; `scaling` is one of
`never`, `when_caused_by_living_non_player`, `always`. `effects` (1.19.4+) and
`death_message_type` are optional. Applied through `/damage <target> <amount>
<type>` or by referencing the id from entity data.

## Tags

`data/<ns>/tags/<registry>/<name>.json`. Tags group registry entries; they are
addressed as `#<namespace>:<path>`.

```json
{
  "replace": false,
  "values": [
    "minecraft:diamond",
    "minecraft:emerald",
    { "id": "minecraft:netherite_ingot", "required": false },
    "#minecraft:coals"
  ]
}
```

| Key | Notes |
|---|---|
| `values` | Required array. A plain id, a `#tag` to include another tag, or `{ "id": ..., "required": false }` to tolerate a missing entry from another pack. |
| `replace` | `false` (default) merges with lower packs; `true` discards their entries for this tag. |

- An entry with **no namespace** resolves to `minecraft:` — writing `"tick"`
  means `minecraft:tick`, not your own function. `MC-TAG-004`.
- `item`, `block`, `entity_type`, `fluid`, `game_event`, `function`,
  `damage_type`, `enchantment`, `painting_variant` and the other registries all
  take tags. Recipes, advancements and structures do **not**. `MC-TAG-007`.
- A tag that includes itself recurses forever. `MC-TAG-005`.
- Only `tags/function/load` and `tags/function/tick` inside the `minecraft`
  namespace run on their own.

## World generation

`data/<ns>/worldgen/<kind>/<name>.json` — `biome`, `feature`, `placed_feature`,
`structure`, `structure_set`, `template_pool`, `processor_list`, `noise`,
`noise_settings`, `density_function`, `carver`, `flat_level_generator_preset`,
`world_preset`. These are large formats with many required cross-references, and
they are **not reloadable** with `/reload`: a mistake means reloading the world.

If the task needs custom world generation, say so and work from the wiki's
`自定义世界生成` pages rather than from memory. Everything else in this file is
reloadable and cheap to iterate on.

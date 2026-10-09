# Minecraft Java data pack directory renames (version-gated)

Research deliverable for a datapack validator. Scope: the data pack registry directory names a
validator must accept/expect depending on the target game version.

**Headline result:** the plural → singular rename landed across **two snapshots of the 1.21
development cycle**, both shipping in the full release **1.21** (pack format `48`, released
2024-06-13):

| pack format | snapshot(s) | what was renamed |
| --- | --- | --- |
| `43` | 24w19a / 24w19b | tag directories: `tags/items`, `tags/blocks`, `tags/entity_types`, `tags/fluids`, `tags/game_events` |
| `45` | 24w21a / 24w21b | root registries: `structures`, `advancements`, `recipes`, `loot_tables`, `predicates`, `item_modifiers`, `functions`; plus `tags/functions` |

So **a pack targeting 1.20.6 (pack format 41) must use the plural names; a pack targeting 1.21
(pack format 48) must use the singular names.** Note that the split means the 1.21 *pre-release*
window (24w19a–24w20a) had a mixed state — 5 tag dirs singular, root dirs still plural — which a
strict validator may want to treat as "1.21 snapshots only".

Source for the split: <https://zh.minecraft.wiki/w/%E6%95%B0%E6%8D%AE%E5%8C%85?action=raw>
(pack format table, entries 43 and 45) and
<https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw> / `Java版24w21a`.

---

## 1. Confirmed renames

### 1a. Top-level registries under `data/<namespace>/` — all in **24w21a** (1.21, pack format 45)

| old directory | new directory | changed in | source URL |
| --- | --- | --- | --- |
| `structures` | `structure` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `advancements` | `advancement` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `recipes` | `recipe` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `loot_tables` | `loot_table` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `predicates` | `predicate` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `item_modifiers` | `item_modifier` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `functions` | `function` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |

### 1b. Tag directories under `data/<namespace>/tags/`

| old directory | new directory | changed in | source URL |
| --- | --- | --- | --- |
| `tags/items` | `tags/item` | 1.21 / 24w19a (pack format 43) | <https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw> |
| `tags/blocks` | `tags/block` | 1.21 / 24w19a (pack format 43) | <https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw> |
| `tags/entity_types` | `tags/entity_type` | 1.21 / 24w19a (pack format 43) | <https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw> |
| `tags/fluids` | `tags/fluid` | 1.21 / 24w19a (pack format 43) | <https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw> |
| `tags/game_events` | `tags/game_event` | 1.21 / 24w19a (pack format 43) | <https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw> |
| `tags/functions` | `tags/function` | 1.21 / 24w21a (pack format 45) | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |

Corroborating (English wiki, which folds both snapshots into one 24w21a bullet):
<https://minecraft.wiki/w/Data_pack?action=raw>. Per-tag history confirming the split and
`tags/functions` moving separately: <https://zh.minecraft.wiki/w/Java%E7%89%88%E6%A0%87%E7%AD%BE?action=raw>.

> `tags/function` is namespaced under `tags/` rather than being the plural of a registry path:
> functions are not a registry, so `function` is the canonical directory name and
> `tags/functions` is the legacy spelling. Which snapshot moved it is source-dependent — see
> *Uncertainties*.

### 1c. World generation directories under `data/<namespace>/worldgen/`

| old directory | new directory | changed in | source URL |
| --- | --- | --- | --- |
| `worldgen/configured_feature` | `worldgen/feature` | 26.3 / 26.3-snapshot-1 | <https://zh.minecraft.wiki/w/%E6%95%B0%E6%8D%AE%E5%8C%85?action=raw> |
| `worldgen/configured_carver` | `worldgen/carver` | 26.3 / 26.3-snapshot-2 | <https://zh.minecraft.wiki/w/%E6%95%B0%E6%8D%AE%E5%8C%85?action=raw> |

**Not renamed in 1.21:** other `worldgen/` subdirectories (`biome`, `density_function`,
`noise`, `noise_settings`, `placed_feature`, `processor_list`, `structure`, `structure_set`,
`template_pool`, `world_preset`, `flat_level_generator_preset`,
`multi_noise_biome_source_parameter_list`) were **already singular** and are not part of the
1.21 rename. No source found any rename of `damage_types`, `configured_features`,
`placed_features`, or `biomes` — they were introduced singular or never existed in plural form.

---

## 2. Introduction versions for the "newer than 1.21" directories

"Introduced in" = the snapshot that first allowed the directory in a data pack, with the release
that shipped it. Every row below was confirmed against a per-registry definition page or the
data pack history; **every one of the 37 listed directories was found.**

| directory | introduced in | source URL |
| --- | --- | --- |
| `banner_pattern` | 1.20.5 / 24w10a | <https://zh.minecraft.wiki/w/%E6%97%97%E5%B8%9C%E5%9B%BE%E6%A1%88%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `block_sound_set` | 26.4 / 26.4-snapshot-3 (unreleased) | <https://zh.minecraft.wiki/w/%E6%96%B9%E5%9D%97%E9%9F%B3%E6%95%88%E9%9B%86%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `block_transformer` | 26.3 / 26.3-snapshot-10 (directory); format 26.3-snapshot-2 | <https://zh.minecraft.wiki/w/%E6%96%B9%E5%9D%97%E5%8F%98%E6%8D%A2%E6%95%88%E6%9E%9C%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `cat_sound_variant` | 26.1 / 26.1-snapshot-7 | <https://zh.minecraft.wiki/w/%E7%8C%AB%E9%9F%B3%E6%95%88%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `cat_variant` | 1.21.5 / 25w04a | <https://zh.minecraft.wiki/w/%E7%8C%AB%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `chat_type` | 1.19 / 22w18a (dir); "1.19.3 / 22w42a" per en wiki | <https://zh.minecraft.wiki/w/%E6%95%B0%E6%8D%AE%E5%8C%85?action=raw> |
| `chicken_sound_variant` | 26.1 / 26.1-snapshot-7 | <https://zh.minecraft.wiki/w/Java%E7%89%8826.1?action=raw> |
| `chicken_variant` | 1.21.5 / 25w06a | <https://zh.minecraft.wiki/w/%E9%B8%A1%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `context_float_provider` | 26.3 / 26.3-pre-1 (split out of `number_provider`) | <https://zh.minecraft.wiki/w/%E6%95%B0%E5%80%BC%E6%8F%90%E4%BE%9B%E5%99%A8?action=raw> |
| `context_int_provider` | 26.3 / 26.3-pre-1 (split out of `number_provider`) | <https://zh.minecraft.wiki/w/%E6%95%B0%E5%80%BC%E6%8F%90%E4%BE%9B%E5%99%A8?action=raw> |
| `cow_sound_variant` | 26.1 / 26.1-snapshot-7 | <https://zh.minecraft.wiki/w/Java%E7%89%8826.1?action=raw> |
| `cow_variant` | 1.21.5 / 25w05a | <https://zh.minecraft.wiki/w/%E7%89%9B%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `damage_type` | 1.19.4 / 23w06a (pack format 12) | <https://zh.minecraft.wiki/w/%E4%BC%A4%E5%AE%B3%E7%B1%BB%E5%9E%8B%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `decorated_pot_pattern` | 26.3 / 26.3-snapshot-1 (as a definable directory) | <https://zh.minecraft.wiki/w/%E9%A5%B0%E7%BA%B9%E9%99%B6%E7%BD%90%E5%9B%BE%E6%A1%88%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `dialog` | 1.21.6 / 25w20a | <https://zh.minecraft.wiki/w/%E5%AF%B9%E8%AF%9D%E6%A1%86%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `enchantment` | 1.21 / 24w18a | <https://zh.minecraft.wiki/w/%E9%AD%94%E5%92%92%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `enchantment_provider` | 1.21 / 24w18a | <https://zh.minecraft.wiki/w/%E9%AD%94%E5%92%92%E6%8F%90%E4%BE%9B%E5%99%A8%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `instrument` | 1.21.2 / 24w33a | <https://zh.minecraft.wiki/w/%E5%B1%B1%E7%BE%8A%E8%A7%92%E4%B9%90%E5%99%A8%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `jukebox_song` | 1.21 / 24w21a | <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw> |
| `painting_variant` | 1.21 / 24w18a | <https://zh.minecraft.wiki/w/Java%E7%89%881.21?action=raw> |
| `pig_sound_variant` | 26.1 / 26.1-snapshot-7 | <https://zh.minecraft.wiki/w/%E7%8C%AA%E9%9F%B3%E6%95%88%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `pig_variant` | 1.21.5 / 25w02a | <https://zh.minecraft.wiki/w/%E7%8C%AA%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `slot_source` | 26.3 / 26.3-snapshot-1 (as a definable directory; feature 1.21.11 / 25w44a) | <https://zh.minecraft.wiki/w/%E6%A7%BD%E4%BD%8D%E6%BA%90?action=raw> |
| `sulfur_cube_archetype` | 26.2 / 26.2-snapshot-1 | <https://zh.minecraft.wiki/w/%E7%A1%AB%E6%96%B9%E6%80%AA%E5%8E%9F%E5%9E%8B%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `test_environment` | 1.21.5 / 25w03a | <https://zh.minecraft.wiki/w/%E6%B5%8B%E8%AF%95%E7%8E%AF%E5%A2%83%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `test_instance` | 1.21.5 / 25w03a | <https://zh.minecraft.wiki/w/%E6%B5%8B%E8%AF%95%E5%AE%9E%E4%BE%8B%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `timeline` | 1.21.11 / 25w45a | <https://zh.minecraft.wiki/w/%E6%97%B6%E9%97%B4%E7%BA%BF%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `trade_set` | 26.1 / 26.1-snapshot-1 | <https://zh.minecraft.wiki/w/%E4%BA%A4%E6%98%93%E9%9B%86%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `trial_spawner` | 1.21.2 / 24w35a | <https://zh.minecraft.wiki/w/%E8%AF%95%E7%82%BC%E5%88%B7%E6%80%AA%E7%AC%BC%E9%85%8D%E7%BD%AE%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `villager_trade` | 26.1 / 26.1-snapshot-1 | <https://zh.minecraft.wiki/w/%E6%9D%91%E6%B0%91%E4%BA%A4%E6%98%93%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `wolf_sound_variant` | 1.21.5 / 25w08a | <https://zh.minecraft.wiki/w/%E7%8B%BC%E9%9F%B3%E6%95%88%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `wolf_variant` | 1.20.5 / 24w10a | <https://zh.minecraft.wiki/w/%E7%8B%BC%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `world_clock` | 26.1 / 26.1-snapshot-3 | <https://zh.minecraft.wiki/w/Java%E7%89%8826.1?action=raw> |
| `zombie_nautilus_variant` | 1.21.11 / 25w45a | <https://zh.minecraft.wiki/w/%E5%83%B5%E5%B0%B8%E9%B9%A6%E9%B9%89%E8%9E%BA%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `trim_material` | 1.19.4 / 23w04a (experimental "Update 1.20" pack); non-experimental in 1.20 / 23w06a | <https://zh.minecraft.wiki/w/%E7%9B%94%E7%94%B2%E7%BA%B9%E9%A5%B0%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `trim_pattern` | 1.19.4 / 23w04a (experimental "Update 1.20" pack); non-experimental in 1.20 / 23w06a | <https://zh.minecraft.wiki/w/%E7%9B%94%E7%94%B2%E7%BA%B9%E9%A5%B0%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |
| `frog_variant` | 1.21.5 / 25w04a | <https://zh.minecraft.wiki/w/%E9%9D%92%E8%9B%99%E5%8F%98%E7%A7%8D%E5%AE%9A%E4%B9%89%E6%A0%BC%E5%BC%8F?action=raw> |

### Version numbering note for the validator

The `26.x` names are **real released Minecraft Java versions**, not future placeholders, under
Mojang's post-1.21.11 version scheme (announced 2025-12-02; see
<https://zh.minecraft.wiki/w/Java%E7%89%8826.1?action=raw> which states this update "首次采用新版本格式").
Anchor points confirmed from the version pages:

* 1.21.11 — pack format `94.1`
* 26.1 — released 2026-03-24, pack format `101.1`
* 26.2 — pack format `107.1`
* 26.3 — released 2026-09-15, pack format `121.0`
* 26.4 — pack format `123.0` at 26.4-snapshot-3; **26.4 is not yet released**, which is why
  `block_sound_set` is a development-only directory.

Source: <https://zh.minecraft.wiki/w/Template:Data_pack_format?action=raw>.

---

## 3. Uncertainties

1. **Which snapshot moved `tags/functions` → `tags/function`.** The Chinese `Java版24w21a` page
   and the per-tag history (`Java版标签`) both say **24w21a**. The Chinese `Java版1.21` summary
   page lumps `tags/functions` in with the 24w19a tag renames, and the English
   [`Data_pack`](https://minecraft.wiki/w/Data_pack?action=raw) history puts *all six* tag
   renames in 24w21a instead of splitting them. The pack-format table is the tiebreaker I trusted
   (`43` = "…除 `tags/functions` 外", format `45` = "`tags/functions` 为 `tags/function`"), and the
   per-tag history agrees. Treat 24w21a as correct but note the conflicting sources.
2. **Whether `tags/damage_types` (or other plural tag paths) ever existed.** The 24w19a note says
   legacy tag folder names were renamed to match registry names, and `22w06a` made tagging possible
   for *any* registry. No source I found lists a rename for `tags/damage_types`, `tags/structures`,
   `tags/worldgen/*`, etc. If they were plural at any point they would have been covered by the
   22w06a "all registries" change rather than a listed rename. **"not found"** — I could not
   confirm or deny their existence before 24w19a.
3. **`decorated_pot_pattern` vs. the old `decorated_pot_patterns`.** The registry (id) rename
   `decorated_pot_patterns` → `decorated_pot_pattern` is documented in 24w19a
   (<https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw>), but the *data pack directory*
   `decorated_pot_pattern` is documented as newly added in 26.3-snapshot-1. Whether a usable
   data pack directory named `decorated_pot_patterns` existed in 1.20.x–26.2 I could **not
   confirm**; I therefore did not add it to the rename table.
4. **`block_transformer`: two different versions.** The *format/component* was added in
   26.3-snapshot-2, but the *standalone file directory* only in 26.3-snapshot-10
   (per `方块变换效果定义格式` history). Before snapshot-10 it existed only as an inline component.
5. **`slot_source`: same pattern.** The slot-source concept shipped in 1.21.11 / 25w44a, but the
   `slot_source` data pack directory only allowed standalone files from 26.3-snapshot-1.
6. **`number_provider` lifecycle.** A `number_provider` directory was added in 26.3-snapshot-3 and
   then split into `context_float_provider` + `context_int_provider` in 26.3-pre-1. The pages that
   document `context_*_provider` do not say whether `number_provider` still works as an alias, so
   the exact 26.3-pre-1 behaviour is unverified.
7. **`pig_variant` snapshot: 25w02a vs 25w03a.** The zh data pack history and the zh
   `猪变种定义格式` page say **25w02a**; the English `Data_pack` history says **25w03a**. Both agree
   the release is **1.21.5**. I reported 25w02a (the page dedicated to the registry).
8. **`chat_type` snapshot: 22w18a vs 22w42a.** The zh data pack history says `chat_type` was added
   in **22w18a**; the English `Data_pack` history says **22w42a**. Release is 1.19 either way.
9. **`damage_type` "changed in" attribution.** Both the zh 24w19a/24w21a pages and the English
   history list only the five tag dirs plus `tags/functions` — none list `damage_types`. I recorded
   `damage_type` in the introduction table only (23w06a / 1.19.4), not as a rename.
10. **Release-date/format coverage beyond 26.3.** The 26.4 entries come from the snapshot-3 pages
    and the pack-format template; 26.4 has not shipped, so its final pack format is provisional.

### Sources consulted (all raw wikitext)

* <https://zh.minecraft.wiki/w/Java%E7%89%8824w19a?action=raw>
* <https://zh.minecraft.wiki/w/Java%E7%89%8824w21a?action=raw>
* <https://zh.minecraft.wiki/w/Java%E7%89%881.21?action=raw>
* <https://zh.minecraft.wiki/w/%E6%95%B0%E6%8D%AE%E5%8C%85?action=raw>
* <https://zh.minecraft.wiki/w/%E6%95%B0%E6%8D%AE%E5%8C%85/%E7%89%88%E6%9C%AC?action=raw>
* <https://zh.minecraft.wiki/w/Template:Data_pack_format?action=raw>
* <https://zh.minecraft.wiki/w/Java%E7%89%88%E6%A0%87%E7%AD%BE?action=raw>
* <https://zh.minecraft.wiki/w/Java%E7%89%8826.1?action=raw>
* <https://zh.minecraft.wiki/w/Java%E7%89%8826.3?action=raw>
* <https://minecraft.wiki/w/Data_pack?action=raw>
* <https://minecraft.wiki/w/Pack_format?action=raw>
* Per-registry definition pages, linked row-by-row in the tables above.

# examples/

Two complete packs. Both validate with zero diagnostics, and `--self-test`
re-validates them on every run, so a change to the validator that breaks either
one fails the test.

| Pack | What it shows |
|---|---|
| `starter-pack` | The smallest complete pack: load/tick tags, a once-per-player tag guard, a macro function driven from storage, a shaped recipe, a shown advancement with a reward function, a block loot table, a predicate used from tick. Read this one first. |
| `harvest-pack` | A larger pack with a real feature set: a kill-detection advancement whose reward function grants loot, an entity loot table called through `loot give`, a `location_check` predicate for "standing on farmland", and a scoreboard threshold that grants an advancement. |

Both are written for a 1.21.8 target (`pack_format: 81`), so they use the
singular folder names and item components rather than NBT tags.

## How to use them

Copy the shape, not the content. The useful parts are the wiring — which file
lives where, what the load function declares, how a function gets called once per
player, and how a reward function is reached from an advancement. Rename the
namespace rather than editing it in place.

## A note on `harvest-pack`

It was written by an agent that had only the skill's own instructions, wrote the
whole tree in one pass, and ran the validator twice (once, then a confirming
re-run) with zero diagnostics on both. It is kept as evidence that the reference
material is sufficient on its own, and as a second regression fixture.

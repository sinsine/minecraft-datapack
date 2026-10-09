# Runs at the start of every tick. It has no player executor, so every
# player-scoped line re-establishes one with `execute as ... at ...`.

# First join, exactly once per player: the tag is added inside on_join, so the
# selector stops matching that player from the next tick on.
execute as @a[tag=!harvest.joined] run function harvest:on_join

# Farmland standing bonus: give regeneration, count a point, and grant the
# advancement on the tenth point. `execute at @s` puts the position on the
# player so the predicate's location_check sees the block under their feet.
execute as @a at @s if predicate harvest:on_farmland run function harvest:harvest_moment

# Zombie kills, detected by the advancement harvest:mechanisms/zombie_kill.
# Runs after the check above, and resets the counter it reads.
function harvest:zombie_kill

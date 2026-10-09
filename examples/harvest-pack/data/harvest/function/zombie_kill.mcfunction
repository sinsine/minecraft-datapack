# One zombie was killed since the last tick (scored by the advancement
# harvest:mechanisms/zombie_kill). Hand out the loot table, then clear the
# counter so the next kill scores 1 again.
execute as @a[scores={harvest.zombie_kills=1..}] run function harvest:give_zombie_drop
scoreboard players reset @a harvest.zombie_kills

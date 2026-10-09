# Reward function of the hidden advancement harvest:mechanisms/zombie_kill.
# Runs as the player who killed the zombie, with that player as @s.
# It only records the event; harvest:zombie_kill reads and clears it next tick.
scoreboard players add @s harvest.zombie_kills 1

# Runs for one player who is standing on farmland (see harvest:tick).
# The executor and position are already the player.
effect give @s minecraft:regeneration 3 0 true
scoreboard players add @s harvest.points 1

# Grant the advancement at 10 points; its reward function resets the counter.
execute if score @s harvest.points matches 10.. run advancement grant @s only harvest:initiate

# Runs once per player, on the tick they are first seen, as that player.
tag @s add harvest.joined
scoreboard players set @s harvest.points 0

tellraw @s [{"text":"[Harvest] ","color":"gold"},{"text":"Welcome, farmer! Stand on farmland to harvest points.","color":"yellow"}]

# A custom-named golden hoe and a bread.
give @s minecraft:golden_hoe[minecraft:custom_name='"Harvest Hoe"',minecraft:lore=['"Awarded on first join"']] 1
give @s minecraft:bread 1

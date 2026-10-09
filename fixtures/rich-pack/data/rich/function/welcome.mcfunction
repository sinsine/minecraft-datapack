# Greets a player once and hands out a starter item.
tag @s add rich.welcomed
scoreboard players set @s rich.points 0
give @s minecraft:wooden_hoe[minecraft:custom_name='"Festival Hoe"',minecraft:unbreakable={}]
tellraw @s [{"text":"Festival! ","color":"gold"},{"score":{"name":"@s","objective":"rich.points"}},{"text":" points"}]

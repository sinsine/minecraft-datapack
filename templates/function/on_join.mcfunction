# Runs for a player the first time they are seen.
tag @s add mypack.ready
scoreboard players set @s mypack.points 0
tellraw @s [{"text":"Welcome!","color":"gold"}]

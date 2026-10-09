# Greets a player exactly once. The tag is what makes it once.
tag @s add starter.greeted
scoreboard players set @s starter.joined 1
tellraw @s [{"text":"Welcome! ","color":"gold"},{"text":"Sneak on grass for a speed boost.","color":"gray"}]

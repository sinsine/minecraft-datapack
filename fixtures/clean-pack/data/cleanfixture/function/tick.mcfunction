# Runs every tick.
execute as @a[tag=!cleanfixture.ready] at @s run function cleanfixture:greet
execute as @a at @s if block ~ ~-0.1 ~ minecraft:grass_block run scoreboard players add @s cleanfixture.timer 1

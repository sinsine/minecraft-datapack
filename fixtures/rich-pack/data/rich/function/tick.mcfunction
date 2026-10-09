# Runs every tick.
execute as @a[tag=!rich.welcomed] at @s run function rich:welcome
execute as @a at @s if predicate rich:on_farmland if biome ~ ~ ~ minecraft:plains run function rich:reward
execute as @a at @s if loaded ~ ~ ~ if dimension minecraft:overworld run scoreboard players add @s rich.timer 1
execute as @a at @s run function #rich:handlers

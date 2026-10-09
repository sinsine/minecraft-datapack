# Runs every tick. Keep it cheap: select first, then act.
execute as @a[tag=!starter.greeted] run function starter:greet
execute as @a at @s if predicate starter:sneaking if block ~ ~-0.1 ~ minecraft:grass_block run effect give @s minecraft:speed 2 0 true

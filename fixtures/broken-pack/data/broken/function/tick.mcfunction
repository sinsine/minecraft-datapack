heal @s
execute as @a at @s
execute as @a at @s if score @s broken.timer matches 1..
give @s minecraft:diamond_sword{display:{Name:"Hi"}}
summon pig {NoAI:1b}
function broken:macro_user

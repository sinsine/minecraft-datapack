# Greets a player exactly once.
tag @s add cleanfixture.ready
tellraw @s {"text":"Welcome to the fixture!","color":"gold"}
tellraw @s {"text":"Payload: {\"nested\":true}"}

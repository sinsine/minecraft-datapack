# Rewards a player standing on farmland in the plains.
scoreboard players add @s rich.points 1
execute if score @s rich.points matches 10.. run function rich:milestone

# Runs once every ten points.
scoreboard players set @s rich.points 0
loot give @s loot rich:rewards/milestone
advancement grant @s only rich:first_points

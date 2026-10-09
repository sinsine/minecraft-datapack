# Reward function of the advancement harvest:initiate.
# It runs as the player who earned the advancement, so @s is that player.
scoreboard players set @s harvest.points 0
tellraw @s [{"text":"[Harvest] ","color":"gold"},{"text":"Initiate! Your harvest points were reset.","color":"green"}]

# A guarded self-call is legal: the recursion always terminates.
execute if score @s rich.timer matches 1.. run function rich:guard_demo
execute if score @s rich.timer matches 1.. run scoreboard players remove @s rich.timer 1

# Sets up everything this pack needs.
scoreboard objectives add rich.points dummy
scoreboard objectives add rich.timer dummy
data modify storage rich:state greeting set value "Hello"
function rich:announce with storage rich:state greeting

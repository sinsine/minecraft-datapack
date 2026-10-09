# Runs once when the world loads. Declare state here, never in tick.
scoreboard objectives add starter.joined dummy
scoreboard objectives add starter.kills dummy
data modify storage starter:config message set value "Starter pack loaded."
function starter:announce with storage starter:config message

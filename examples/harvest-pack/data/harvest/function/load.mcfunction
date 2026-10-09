# Runs on world load, server start, and every /reload.
# Create every objective the pack uses, then seed the storage defaults.
scoreboard objectives add harvest.points dummy
scoreboard objectives add harvest.ready dummy

# Written by the advancement harvest:mechanisms/zombie_kill, read (and reset)
# by harvest:zombie_kill. One point = one zombie killed since the last check.
scoreboard objectives add harvest.zombie_kills dummy

# The default welcome message, kept in command storage so the macro can read it.
data modify storage harvest:config message set value "Welcome to the harvest!"

# Announce the pack using the macro function (reads the message from storage).
function harvest:broadcast with storage harvest:config message

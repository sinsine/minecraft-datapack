# Macro function: the message text comes from the caller.
# Call it as:
#   function harvest:broadcast with storage harvest:config message
# Every line that uses $(message) must start with $.
$tellraw @a [{"text":"[Harvest] ","color":"gold"},{"text":"$(message)","color":"yellow"}]

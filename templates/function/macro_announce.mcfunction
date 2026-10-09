# A macro function: every line that uses $(name) must start with $.
# Call it as:  function mypack:announce with storage mypack:config message
$tellraw @a {"text":"$(message)","color":"yellow"}

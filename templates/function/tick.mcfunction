# Runs every tick. Keep it cheap: select the few entities you need, then act.
# Guard anything that should happen once with a tag, never with a score you never reset.
execute as @a[tag=!mypack.ready] run function mypack:on_join

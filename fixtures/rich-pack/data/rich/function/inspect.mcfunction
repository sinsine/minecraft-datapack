# Inspects the executor's held item and round-trips some storage.
execute if items entity @s container.* minecraft:diamond run say has a diamond
data modify storage rich:state copy set from entity @s SelectedItem.count
data modify storage rich:state list append from storage rich:state greeting
data modify storage rich:state list insert 0 from storage rich:state greeting
data remove storage rich:state list
data modify storage rich:state text set string storage rich:state greeting

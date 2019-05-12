var monkey_nani_maps_hasSameMods = hasSameMods; 

hasSameMods = function(modsA, modsB)
{	
	let mods1 = modsB.filter(mod =>!(mod[0].startsWith("nani_maps") ) );
	let mods2 = modsB.filter(mod =>!(mod[0].startsWith("nani_maps") ) );
	return monkey_nani_maps_hasSameMods(mods1,mods2);
}


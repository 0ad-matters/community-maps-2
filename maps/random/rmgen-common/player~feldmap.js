/**
 * Returns a random location for each player that meets the given constraints and
 * orders the playerIDs so that players become grouped by team.
 */
function playerPlacementRandom(playerIDs, constraints = undefined)
{
	let locations = [];
	let attempts = 0;
	let resets = 0;

	let mapCenter = g_Map.getCenter();
	let playerMinDistSquared = Math.square(fractionToTiles(0.25));
	let borderDistance = fractionToTiles(0.08);

	let area = createArea(new MapBoundsPlacer(), undefined, new AndConstraint(constraints));
	
	// Return if constraints return an empty area
	if (!area.getPoints().length)
		return undefined;

	for (let i = 0; i < getNumPlayers(); ++i)
	{
		const position = pickRandom(area.getPoints());
		if (!position)
			return undefined;

		// Minimum distance between initial bases must be a quarter of the map diameter
		if (locations.some(loc => loc.distanceToSquared(position) < playerMinDistSquared) ||
		    position.distanceToSquared(mapCenter) > Math.square(mapCenter.x - borderDistance))
		{
			--i;
			++attempts;

			// Reset if we're in what looks like an infinite loop
			if (attempts > 500)
			{
				locations = [];
				i = -1;
				attempts = 0;
				++resets;

				// Reduce minimum player distance progressively
				if (resets % 25 == 0)
					playerMinDistSquared *= 0.95;

				// If we only pick bad locations, stop trying to place randomly
				if (resets == 500)
					return undefined;
			}
			continue;
		}

		locations[i] = position;
	}
	return groupPlayersByArea(playerIDs, locations);
}
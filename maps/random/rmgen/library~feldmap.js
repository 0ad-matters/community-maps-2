function getSurroundingAreas(positions, radius = 35)
{
	return positions.map(pos => createArea(new DiskPlacer(radius, pos), null, null));
}
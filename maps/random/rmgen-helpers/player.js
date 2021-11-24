/**
 * Place on an arc on a circle, 1 arc per team. Each team member is on the same arc.
 * @param {Array[int]} playerIDs
 * @param {float} radius
 * @param {float} mapAngle
 */
function playerPlacementMultiArcs(playerIDs, radius, mapAngle)
{
	const teamIDs = playerIDs.map(function(playerID, i) {
		const teamID = getPlayerTeam(playerID);
		// If teamID is -1 (which is None), set to any unique number.
		// This can be any number above 3. (The max 0ad teamID is 3.)
		return teamID === -1 ? 1000+i : teamID;
	});
	const uniqueTeams = new Set(teamIDs);
	const nTeams = uniqueTeams.size;

	const teamIntMap = {};
	const teamFreqPlayers = {};
	const teamPlayersIntMap = {};

	// Shuffle team order.
	let i = 0;
	const teamShuffle = Array.from(Array(nTeams), () => i++);
	for(i = teamShuffle.length - 1; i > 0; i--)
	{
		const j = Math.round(Math.random() * (teamShuffle.length-1));
		const temp = teamShuffle[i];
		teamShuffle[i] = teamShuffle[j];
		teamShuffle[j] = temp;
	}

	// Team to array (random) index map + team player int map.
	// This is used when positioning players on a team.
	Array.from(uniqueTeams).forEach(function(val, idx) {
		teamIntMap[val] = teamShuffle[idx];
		teamPlayersIntMap[val] = 0;
	});

	// teamPlayersIntMap and teamIntMap is used to calculate how much angle to
	// add to a player, based on what order in the circle they're placed.

	// Player frequency in teams.
	teamIDs.forEach(function(v) { teamFreqPlayers[v] = (teamFreqPlayers[v] || 0) + 1; });

	// teamPlayersIntMap gives the number of ally gaps between players
	// placed at an earlier point around the circle.
	for (const key in teamPlayersIntMap)
	{
		if (teamPlayersIntMap.hasOwnProperty(key))
		{
			for (const key2 in teamPlayersIntMap)
			{
				if (teamPlayersIntMap.hasOwnProperty(key))
				{
					if (teamIntMap[key2] > teamIntMap[key])
					{
						// -1 because e.g. if there's 3 allies, there's only 2 gaps between them.
						teamPlayersIntMap[key2] += teamFreqPlayers[key]-1;
					}
				}
			}
		}
	}

	// The gap is dependent on the value of radius(g_PlayerbaseTypes[pattern].distance)
	const allyGapAngle = 0.6303860648814489;
	const teamGapAngle = (2 * Math.PI - allyGapAngle * (playerIDs.length-nTeams)) / nTeams;

	const playerAngleFunc = function(idx)
	{
		return mapAngle + teamGapAngle*teamIntMap[teamIDs[idx]] + allyGapAngle*((teamPlayersIntMap[teamIDs[idx]]++));
	};

	const [playerPosition, playerAngle] = playerPlacementCustomAngle(radius, g_Map.getCenter(), playerAngleFunc);
	return [playerIDs, playerPosition.map(p => p.round()), playerAngle, mapAngle];
}

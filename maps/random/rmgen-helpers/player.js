/**
 * Place on an arc on a circle, 1 arc per team. Each team member is on the same arc.
 * @param {Array[int]} playerIDs
 * @param {float} center
 * @param {float} radius
 * @param {float} mapAngle
 * @param {float} teamGapRatio Ratio difference between team gap and players on the same team Should be 0 to 1.
 * e.g. 0.8 means the ratio team gap:team player gap is 8:2. n.b. < 0.5 means enemies are closer
 * than team members are to each other
 */
function playerPlacementMultiArcs(playerIDs, center, radius, mapAngle, teamGapFrac) {
	let playerTeams = playerIDs.map(getPlayerTeam);
	let uniqueTeams = new Set(playerTeams);
	let nTeams = uniqueTeams.size;
	let nPlayers = playerIDs.length;

	let teamIntMap = {};
	let teamFreqPlayers = {};
	let teamPlayersIntMap = {};

	// Shuffle team order.
	let teamShuffle = function(length) {
		let i = 0;
		let array = Array.from(Array(length), () => i++);
			for(let i = array.length - 1; i > 0; i--){
		  	const j = Math.round(Math.random() * (array.length-1))
		  	const temp = array[i]
		  	array[i] = array[j]
		  	array[j] = temp
		}
		return array;
	}(nTeams);

	// Team to array (random) index map.
	Array.from(uniqueTeams).map((val, i) => {teamIntMap[val] = teamShuffle[i];});
	// Player frequency in teams.
	playerTeams.map((v) => teamFreqPlayers[v] ? teamFreqPlayers[v] += 1 : teamFreqPlayers[v] = 1);
	// Team player int map. This is useful when positioning players on a team.
	Array.from(uniqueTeams).map((val) => {teamPlayersIntMap[val] = 0;});

	// I don't know at this point. Trust my brain. It's smarter than my brain.
	// Something-something add the previous team player combos.
	// It's some kind of "cumulative frequency" of player teams idk.
	for (let key in teamPlayersIntMap) {
		if (teamPlayersIntMap.hasOwnProperty(key)) {
			for (let key2 in teamPlayersIntMap) {
				if (teamPlayersIntMap.hasOwnProperty(key)) {
					if (teamIntMap[key2] > teamIntMap[key]) {
						teamPlayersIntMap[key2] += teamFreqPlayers[key]-1;
					}
				}
			}
		}
	}

	const teamPlayerGapFrac = 1 - teamGapFrac;

	const totalGapCount = teamGapFrac*nTeams + teamPlayerGapFrac*(nPlayers-nTeams);

	const teamGapAngle = 2*Math.PI*teamGapFrac/totalGapCount;
	const teamPlayerGapAngle = 2*Math.PI*teamPlayerGapFrac/totalGapCount;


	function playerAngle(i) {

		return mapAngle + teamGapAngle*teamIntMap[playerTeams[i]] + teamPlayerGapAngle*((teamPlayersIntMap[playerTeams[i]]++));
	}

	return playerPlacementCustomAngle(
		radius,
		center,
		playerAngle);
}

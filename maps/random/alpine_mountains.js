// This map was originally part of the feldmap mod and authored by
// Feldfeld <https://wildfiregames.com/forum/profile/22154-feldfeld/>

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

if (g_MapSettings.Biome)
	setSelectedBiome();
else
	setBiome("alpine_mountains/summer");

const tForestfloor = g_Terrains.forestFloor;
const tForestfloorSnow = "alpine_forrestfloor_snow";
const tGrassA = g_Terrains.grassA;
const tGrassB = g_Terrains.grassB;
const tGrassC = g_Terrains.grassC;
const tRoad = "alpine_dirt";
const tCliff = "alpine_rock_01";
const tMontainTop = "alpine_rock_01_snow";
const tMontainPeak = "alpine_snow_03";
const tRocks = "alpine_rocks_dirt_01";
const tIce = "alpine_ice_01";

const oPine = g_Gaia.pine;
const oFirA = g_Gaia.firA;
const oFirB = g_Gaia.firB;
const oPineSnow = "gaia/tree/pine_w";
const oBerryBush = "gaia/fruit/berry_02";
const oAdditionnalBerry = g_Gaia.berry;
const oDeer = "gaia/fauna_deer";
const oGoat = "gaia/fauna_goat";
const oWolf = "gaia/fauna_wolf";
const oStoneLarge = "gaia/rock/alpine_large";
const oStoneSmallA = "gaia/rock/alpine_small";
const oStoneSmallB = "gaia/rock/temperate_small";
const oMetalLarge = "gaia/ore/temperate_02";
const oMetalSmall = "gaia/ore/temperate_small";

const aPineSnow = "actor|flora/trees/pine_w.xml"; // Unused for now
const aDryGrass = "actor|props/flora/grass_soft_dry_small_tall.xml";
const aGrassFieldDry = "actor|props/flora/grass_temp_field_dry.xml";
const aStoneSnow1 = "actor|geology/snow1.xml";
const aStoneSnow2 = "actor|geology/snow2.xml";
const aStoneDecoratives = g_Decoratives.rocks;
const aBlowingSnow = "actor|particle/blowing_snow.xml";
const aSnowMist = "actor|particle/snow_mist.xml";
const aSnowStorm = "actor|particle/snow_storm.xml";

const pForestPine = [tForestfloor + TERRAIN_SEPARATOR + oPine, tForestfloor];
const pForestMixed = [tForestfloor + TERRAIN_SEPARATOR + oPine, tForestfloor + TERRAIN_SEPARATOR + oFirA, tForestfloor];
const pForestFir = [tForestfloor + TERRAIN_SEPARATOR + oFirA, tForestfloor + TERRAIN_SEPARATOR + oFirB ,tForestfloor];
const pForestPineSnow = [tForestfloorSnow + TERRAIN_SEPARATOR + oPineSnow, tForestfloorSnow];


const heightLand = 30;
const heightOffsetBump = 2;
const snowSlopeThreshold = currentBiome() == "alpine_mountains/summer" ? 1.7 : 2.3;
const winterEnvironment = pickRandom(["sunny", "snowy", "night"]);
const winterMistAmounts = {
	"sunny": {
		"base": 0.6,
		"maxObj": 1
	},
	"snowy": {
		"base": 0.8,
		"maxObj": 2
	},
	"night": {
		"base": 1,
		"maxObj": 2
	}
};
const winterStormAmounts = {
	"sunny": {
		"base": 0,
		"maxObj": 1
	},
	"snowy": {
		"base": 1,
		"maxObj": 3
	},
	"night": {
		"base": 0.5,
		"maxObj": 2
	}
}

const surroundingPlayerAreaMin = 20;
const surroundingPlayerAreaMax = 50;
const neighbouringPlayerTiles = 50;

const nomadPlayableAreaFractionMin = 0.22;

var g_Map = new RandomMap(heightLand, tGrassA);

const numPlayers = getNumPlayers();
const mapSize = g_Map.getSize();
const mapCenter = g_Map.getCenter();
const mapBounds = g_Map.getBounds();

var clPlayer;
var clMountain;
var clForest;
var clBaseResource;
var clHill = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clGrass = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clWolf = g_Map.createTileClass();
var clIce = g_Map.createTileClass();
var clNonBordering = g_Map.createTileClass();

createArea(new DiskPlacer(mapSize/2 - 8, new Vector2D(mapSize/2, mapSize/2)), new TileClassPainter(clNonBordering), new NullConstraint());

var surroundingPlayersAreas;
var mountainBorderArea;

var startAngle = randomAngle();

var playerIDs = sortAllPlayers();
var playerPosition;
var nomadConnectedArea;

Engine.SetProgress(5);

while(true) {
	g_Map = new RandomMap(heightLand, tGrassA);

	clMountain = g_Map.createTileClass();
	clForest = g_Map.createTileClass();
	clPlayer = g_Map.createTileClass();
	clBaseResource = g_Map.createTileClass();
	surroundingPlayersAreas = [];

	// Perlin/simplex noise is used to create the mountains.
	// Multiple layers of noise are stacked, each new ones with smaller amplitude but greater scale.

	g_Map.log("Generating terrain height");

	// -------------------------------------------------------------------------------------

	var noise = new Noise2D(8);
	let scaleArray = [0.3, 0.5, 0.8, 1, 1, 1, 1];
	let scale = scaleArray[scaleByMapSize(0, 6)];
	for (let x = 0; x < mapSize; ++x)
	{
		for (let y = 0; y < mapSize; ++y) {
			let value = noise.get(x * scale / (mapSize + 1.0), y * scale / (mapSize + 1.0)) - 0.54;

			if (value > 0) {
				let position = new Vector2D(x, y);
				clMountain.add(position);
				g_Map.height[x][y] = (value) * 275 + heightLand;
			}
			else {
				g_Map.height[x][y] = heightLand;
			}
		}
	}

	noise = new Noise2D(8);
	for (let x = 0; x < mapSize; ++x)
	{
		for (let y = 0; y < mapSize; ++y) {
			let value = noise.get(x * scale / (mapSize + 1.0), y * scale / (mapSize + 1.0)) - 0.565;
			let position = new Vector2D(x, y);
			g_Map.height[x][y] += (value) * 52;
		}
	}

	noise = new Noise2D(50);
	for (let x = 0; x < mapSize; ++x)
	{
		for (let y = 0; y < mapSize; ++y) {
			let value = noise.get(x * scale / (mapSize + 1.0), y * scale / (mapSize + 1.0));
			let position = new Vector2D(x, y);
			if (clMountain.has(position)) {
				g_Map.height[x][y] += (value) * 12;
			}
		}
	}

	noise = new Noise2D(100);
	for (let x = 0; x < mapSize; ++x)
	{
		for (let y = 0; y < mapSize; ++y) {
			let value = noise.get(x * scale / (mapSize + 1.0), y * scale / (mapSize + 1.0));
			let position = new Vector2D(x, y);
			if (clMountain.has(position)) {
				g_Map.height[x][y] += (value) * 12;
			}
		}
	}

	mountainBorderArea = createArea(new MapBoundsPlacer(), null, borderClasses(clMountain, 0, 8));

	createArea(
		new MapBoundsPlacer(),
		new SmoothingPainter(1, 0.5, 2),
		borderClasses(clMountain, 1, 1)
		);

	createArea(
		new MapBoundsPlacer(),
		new SmoothingPainter(3, 0.5, 1),
		stayClasses(clMountain, 7)
		);

	if (!isNomad())
	{
		g_Map.log("Finding player locations");
		let players = playerPlacementRandomScaled(
			playerIDs,
			avoidClasses(clMountain, 20)
			);

		if (!players) {
			g_Map.log("Too few player locations, starting over");
			continue;
		}
		[playerIDs, playerPosition] = players;
	}

	if (!isNomad())
	{
		g_Map.log("Flattening initial CC area");
		let playerRadius = defaultPlayerBaseRadius() * 0.8;
		for (let position of playerPosition)
			createArea(
				new ClumpPlacer(diskArea(playerRadius), 0.95, 0.6, Infinity, position),
				new SmoothElevationPainter(ELEVATION_SET, g_Map.getHeight(position), playerRadius / 2));
		Engine.SetProgress(38);
	}

	for (let i = 0; i < numPlayers; ++i)
	{
		if (isNomad())
			break;

		placePlayerBase({
			"playerID": playerIDs[i],
			"playerPosition": playerPosition[i],
			"PlayerTileClass": clPlayer,
			"Walls": "towers",
			"BaseResourceClass": clBaseResource,
			"StartingAnimal": {
			},
			"Berries": {
				"template": oBerryBush
			},
			"Mines": {
				"types": [
					{ "template": oMetalLarge },
					{ "template": oStoneLarge }
				]
			},
			"Trees": {
				"template": oPine,
				"count": 30
			}
		});
	}

	if (!isNomad()) {
		for (let i = 0; i < numPlayers; ++i) {
			surroundingPlayersAreas[i] = createArea(new DiskPlacer(surroundingPlayerAreaMax, playerPosition[i]), null, avoidClasses(clPlayer, surroundingPlayerAreaMin));
		}
	}

	g_Map.log("Creating forests");
	const treesPerForests = scaleByMapSize(20, 30);
	const forestVariants = [pForestFir, pForestMixed, pForestPine];
	for (const forestVariant of forestVariants)
		createAreasInAreas(
			new ChainPlacer(1, 3, treesPerForests, 0.5),
			[
				new LayeredPainter([tForestfloor, forestVariant], [1]),
				new TileClassPainter(clForest)
			],
			new AndConstraint([avoidClasses(clPlayer, 15), borderClasses(clMountain, 2, 30), new SlopeConstraint(0, 2.2)]),
			scaleByMapAreaAndPlayers(2, !isNomad()),
			0.5,
			[mountainBorderArea]);

	if (isNomad())
		for (const forestVariant of forestVariants)
		createAreas(
			new ChainPlacer(1, 3, treesPerForests, 0.5),
			[
				new LayeredPainter([tForestfloor, forestVariant], [1]),
				new TileClassPainter(clForest)
			],
			avoidClasses(clPlayer, 15, clMountain, 5),
			scaleByMapAreaAndPlayers(2, !isNomad()),
			0.5,);

	if (!isNomad()) {
		g_Map.log("Creating player owned forest");
		for (let i = 0; i < numPlayers; ++i)
			createAreasInAreas(
			new ChainPlacer(3, 3, 30, 0.15),
			[
				new LayeredPainter([tForestfloor, pForestMixed], [2]),
				new TileClassPainter(clForest)
			],
			[new AndConstraint([avoidClasses(clPlayer, 12, clMountain, 3), borderClasses(clPlayer, 0, 37)]), new PassableMapAreaConstraint()],
			1,
			100,
			[surroundingPlayersAreas[i]]);
	}


	if (isNomad()) {
		g_Map.log("Looking for good nomad playable area");
		// Nomad players can only be placed at the end of the generation, but we would like to retry generation earlier
		// if there is not a suitable connected playing area.

		let initialConstraint = avoidClasses(clMountain, 3, clForest, 2);
		let floodFillTriedTiles = [];
		while (floodFillTriedTiles.length < 20) {
			let position = g_Map.randomCoordinate();
			if (initialConstraint.allows(position))
				floodFillTriedTiles.push(position);
		}

		let largestAreaSize = 0;
		for (let position of floodFillTriedTiles) {
			let connectedArea = floodFill(position, [avoidClasses(clMountain, 5, clForest, 0), stayClasses(clNonBordering, 0)]);
			if (connectedArea.getPoints().length > largestAreaSize) {
				largestAreaSize = connectedArea.getPoints().length;
				nomadConnectedArea = connectedArea;
			}
		}
		let nomadAreaFraction = largestAreaSize / diskArea(mapSize / 2);
		if (nomadAreaFraction > nomadPlayableAreaFractionMin) {
			break;
		}
		g_Map.log("There is not an area large enough to play, starting over");
	}

	else {
		g_Map.log("Checking if players are connected");
		let connectedArea = floodFill(pickRandom(playerPosition), [avoidClasses(clMountain, 5, clForest, 0), stayClasses(clNonBordering, 0)]);
		if (playerPosition.every(position => connectedArea.contains(position))) {
			break;
		}
		g_Map.log("Players are not connected, starting over");
	}

}

Engine.SetProgress(55);

g_Map.log("Creating primary grass patches");
createAreas(
	new ChainPlacer(1, 2, randIntInclusive(10, 80), 0.6),
	[new TerrainPainter(tGrassB), new TileClassPainter(clGrass)],
	avoidClasses(clMountain, 0, clForest, 0, clPlayer, 6),
	scaleByMapSize(40, 250)
);

g_Map.log("Creating secondary grass patches");
createAreas(
	new ChainPlacer(1, 2, randIntInclusive(2, 15), 0.6),
	[new TerrainPainter(tGrassC), new TileClassPainter(clGrass)],
	avoidClasses(clMountain, 0, clForest, 0, clPlayer, 6),
	scaleByMapSize(80, 300)
);

createAreas(new ChainPlacer(1, 10, randIntInclusive(1, 5), 1),
	new SmoothElevationPainter(ELEVATION_MODIFY, 0, 100),
	new AndConstraint([stayClasses(clMountain, 2), new SlopeConstraint(0.5, 1.7), new HeightConstraint(heightLand, heightLand + 60)]),
	scaleByMapSize(7, 35),
	20
	);

g_Map.log("Painting mountains");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tCliff),
	[
		stayClasses(clMountain, 0),
		new SlopeConstraint(snowSlopeThreshold, Infinity)
	]);

createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tCliff),
	[
		borderClasses(clMountain, 0, 2),
		new SlopeConstraint(0.5, Infinity)
	]);

createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tMontainTop),
	[
		stayClasses(clMountain, 0),
		new SlopeConstraint(0.7, snowSlopeThreshold)
	]);

createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tMontainPeak),
	[
		stayClasses(clMountain, 0),
		new SlopeConstraint(0, 0.7)
	]);

createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tMontainPeak),
	[
		new HeightConstraint(heightLand + 60, Infinity)
	]);


createAreas(
	new ChainPlacer(1, 3, randIntInclusive(1, 10), 1),
	[
		new TerrainPainter(pForestPineSnow[0]),
		new TileClassPainter(clForest)
	],
	new AndConstraint([stayClasses(clMountain, 2), new SlopeConstraint(0, 1.7), new HeightConstraint(heightLand, heightLand + 40)]),
	scaleByMapSize(3, 15),
	20
	);

Engine.SetProgress(65);

var group;

if (currentBiome() == "alpine_mountains/winter") {
	g_Map.log("Creating ice");
	createAreas(
		new ChainPlacer(1, Math.floor(scaleByMapSize(6, 10)), Math.floor(scaleByMapSize(15, 30)), 0.8),
		[
			new LayeredPainter([tRocks, tIce], [2]),
			new SmoothElevationPainter(ELEVATION_MODIFY, -5, 5),
			new TileClassPainter(clIce)
		],
		[avoidClasses(clPlayer, 30, clMountain, 2, clForest, 1), new HeightConstraint(0, heightLand + 7), new SlopeConstraint(0, 0.5)],
		scaleByMapAreaAndPlayers(randFloat(0.3, 1.5), true));

	g_Map.log("Creating snow particles");
	group = new SimpleGroup(
		[new SimpleObject(aSnowMist, 1, winterMistAmounts[winterEnvironment].maxObj, 0.5,1.8, -Math.PI / 8, Math.PI / 8)]
	);
	createObjectGroups(group, 0,
		null,
		scaleByMapAreaAndPlayers(winterMistAmounts[winterEnvironment].base * randFloat(0.5, 1.5)),
		1
	);

	group = new SimpleGroup(
		[new SimpleObject(aSnowStorm, 1, winterStormAmounts[winterEnvironment].maxObj, 0.5,1.8, -Math.PI / 8, Math.PI / 8)]
	);
	createObjectGroups(group, 0,
		null,
		scaleByMapAreaAndPlayers(winterStormAmounts[winterEnvironment].base * randFloat(0.5, 1.5)),
		1
	);

	if (winterEnvironment == "snowy") {
		group = new SimpleGroup(
			[new SimpleObject(aBlowingSnow, 1, 1, 0,1.8, -Math.PI / 8, Math.PI / 8)]
		);
		createObjectGroups(group, 0,
			avoidClasses(clMountain, 1, clPlayer, 10, clForest, 1, clIce, 2),
			scaleByMapAreaAndPlayers(randFloat(5, 15)),
			5
		);
	}
}

g_Map.log("Creating minerals");
group = new SimpleGroup([new SimpleObject(oMetalSmall, 1, 4, 0, 1.5)], true, clMetal);
createObjectGroupsByAreas(group, 0,
	[avoidClasses(clPlayer, 15, clForest, 1, clMetal, 8, clMountain, 1), borderClasses(clMountain, 0, 3), new SlopeConstraint(0, 1.2)],
	Math.floor(scaleByMapSize(8, 55) * randFloat(1, 1.5)), 100, [mountainBorderArea]);

group = new SimpleGroup([new SimpleObject(oStoneLarge, 1, 1, 0, 1.5)], true, clRock);
createObjectGroupsByAreas(group, 0,
	[avoidClasses(clPlayer, 15, clForest, 1, clMetal, 12, clRock, 12), borderClasses(clMountain, 0, 3)],
	Math.floor(scaleByMapSize(2, 10) * randFloat(1, 1.5)), 100, [mountainBorderArea]);

group = new SimpleGroup([new SimpleObject(oStoneSmallA, 1, 4, 0, 1.5)], true, clRock);
createObjectGroupsByAreas(group, 0,
	[avoidClasses(clPlayer, 15, clForest, 1, clMetal, 8, clRock, 2, clMountain, 1), borderClasses(clMountain, 0, 3), new SlopeConstraint(0, 1.2)],
	Math.floor(scaleByMapSize(4, 20) * randFloat(1, 1.5)), 100, [mountainBorderArea]);

group = new SimpleGroup([new SimpleObject(oStoneSmallA, 1, 4, 0, 3)], true, clRock);
createObjectGroups(group, 0,
	[avoidClasses(clPlayer, 25, clForest, 1, clMetal, 8, clRock, 2, clMountain, 5, clIce, 1)],
	Math.floor(scaleByMapSize(1, 8) * randFloat(1, 2)), 100);

group = new SimpleGroup([new SimpleObject(oStoneSmallB, 1, 4, 0, 3)], true, clRock);
createObjectGroups(group, 0,
	[avoidClasses(clPlayer, 25, clForest, 1, clMetal, 8, clRock, 6, clMountain, 8, clIce, 1)],
	Math.floor(scaleByMapSize(1, 8) * randFloat(1, 2)), 100);

Engine.SetProgress(75);

if (!isNomad()) {
	g_Map.log("Creating additionnal food for players (balance)");
	// Player ressource balance calculation
	var initialFoodAmount = randIntInclusive(0, 25);// 1 unit = 100 food

	// I want it likely that there is no additionnal food for the player.
	if (initialFoodAmount < 6)
		initialFoodAmount = 0;

	for (let i = 0; i < numPlayers; ++i) {
		let remainingFood = initialFoodAmount;
		while (remainingFood > 0) {
			if (remainingFood <= 2) {
				remainingFood = 0;
			}
			else if (remainingFood <= 4) {
				placeFoodForPlayer(oGoat, remainingFood, remainingFood, remainingFood, i);
				remainingFood = 0;
			}
			else if (remainingFood <= 10) {
				remainingFood -= placeFoodForPlayer(pickRandom([oDeer, oGoat]), 5, 8, remainingFood, i);
			}
			else {
				if (randBool(0.5)) {
					remainingFood -= 2 * placeFoodForPlayer(oBerryBush, 5, 7, Math.floor(remainingFood/2), i);
				}
				else {
					remainingFood -= placeFoodForPlayer(pickRandom([oDeer, oGoat]), 5, 8, remainingFood, i);
				}
			}
		}
	}
}

Engine.SetProgress(85);

g_Map.log("Creating berries");
group = new SimpleGroup(
	[new SimpleObject(oAdditionnalBerry, 4,6, 0,4)],
	true, clFood
);
createObjectGroups(group, 0,
	[avoidClasses(clPlayer, neighbouringPlayerTiles, clMountain, 3, clMetal, 4, clRock, 4, clFood, 10), borderClasses(clForest, 1, 1)],
	randFloat(0.5, 1) * scaleByMapSize(6, 30), 20
);

g_Map.log("Creating deer");
group = new SimpleGroup(
	[new SimpleObject(oDeer, 5,7, 0,4)],
	true, clFood
);
createObjectGroups(group, 0,
	avoidClasses(clForest, 0, clPlayer, neighbouringPlayerTiles, clMountain, 3, clMetal, 4, clRock, 4, clFood, 10),
	randFloat(0.2, 1) * scaleByMapSize(2, 10), 5
);

g_Map.log("Creating goats");
group = new SimpleGroup(
	[new SimpleObject(oGoat, 5,7, 0,4)],
	true, clFood
);
createObjectGroups(group, 0,
	avoidClasses(clForest, 0, clPlayer, neighbouringPlayerTiles, clMountain, 3, clMetal, 4, clRock, 4, clFood, 10),
	randFloat(0.2, 1) * scaleByMapSize(3, 15), 5
);

g_Map.log("Creating wolves");
group = new SimpleGroup(
	[new SimpleObject(oWolf, 1,3, 0,4)],
	true, clWolf
);
createObjectGroups(group, 0,
	avoidClasses(clForest, 0, clPlayer, neighbouringPlayerTiles, clMountain, 3, clMetal, 4, clRock, 4, clFood, 1),
	randFloat(0.2, 1) * scaleByMapSize(2, 10), 5
);

Engine.SetProgress(90);

g_Map.log("Creating straggler trees");
createStragglerTrees([oPine, oFirA, oFirB],
	avoidClasses(clMountain, 3, clPlayer, 15, clMetal, 4, clRock, 4, clFood, 1, clWolf, 1, clForest, 3, clIce, 1),
	clForest,
	scaleByMapAreaAndPlayers(40, false),
	100);

g_Map.log("Creating straggler trees on mountains");
createStragglerTrees([oPineSnow],
	new AndConstraint([stayClasses(clMountain, 1), new HeightConstraint(heightLand + 5, heightLand + 40), new SlopeConstraint(0, 1)]),
	clForest,
	scaleByMapSize(200, 1900),
	50);

if (currentBiome() == "alpine_mountains/summer") {

	g_Map.log("Creating grass");
	group = new SimpleGroup(
		[new SimpleObject(aGrassFieldDry, 1, 4, 0,1.8, -Math.PI / 8, Math.PI / 8)]
	);
	createObjectGroups(group, 0,
		avoidClasses(clMountain, 6, clPlayer, 2, clForest, 0),
		scaleByMapSize(24, 200),
		1
	);

	group = new SimpleGroup(
		[new SimpleObject(aDryGrass, 1, 3, 0,1.8, -Math.PI / 8, Math.PI / 8)]
	);
	createObjectGroups(group, 0,
		avoidClasses(clMountain, 6, clPlayer, 2, clForest, 0),
		scaleByMapSize(24, 200),
		1
	);

}

g_Map.log("Creating decorative rocks");
group = new SimpleGroup(
	[new RandomObject(aStoneDecoratives, 1, 3, 0,1.8, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroups(group, 0,
	avoidClasses(clMountain, 0, clPlayer, 2, clForest, 0, clIce, 0),
	scaleByMapSize(12, 100),
	1
);

group = new SimpleGroup(
	[new RandomObject([aStoneSnow1, aStoneSnow2], 1, 1, 0,1.8, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroups(group, 0,
	new AndConstraint([stayClasses(clMountain, 2), new SlopeConstraint(0, 1.7), new HeightConstraint(heightLand, heightLand + 60)]),
	scaleByMapSize(72, 600),
	1
);

g_Map.log("Creating blowing snow");
group = new SimpleGroup(
	[new SimpleObject(aBlowingSnow, 1, 1, 0,1.8, -Math.PI / 8, Math.PI / 8)]
);
createObjectGroups(group, 0,
	new AndConstraint([stayClasses(clMountain, 2), new SlopeConstraint(0, 1.7), new HeightConstraint(heightLand + 30, Infinity)]),
	scaleByMapSize(18, 150),
	1
);

placePlayersNomad(clPlayer,
	[avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clMountain, 4, clFood, 2, clWolf, 25),
	new StayAreasConstraint([nomadConnectedArea])]);



setSunElevation(0.524621);
setSunRotation(-0.785396);
if (currentBiome() == "alpine_mountains/summer") {
	setSkySet("sunset");
	setSunColor(1, 0.87451, 0.611765);
	setAmbientColor(0.501961, 0.501961, 0.501961);
	setFogFactor(0.00046875);
	setFogThickness(0.14);
	setFogColor(0.8, 0.8, 0.8);
} else {
	if (winterEnvironment == "snowy") {
		setSkySet("stormy");
		setSunColor(0.525429, 0.788143, 0.788143);
		setAmbientColor(0.501961, 0.501961, 0.501961);
	} else if (winterEnvironment == "night") {
		setSkySet("dark2");
		setSunColor(0.246998, 0.715441, 0.826164);
		const scale = 0.1;
		setAmbientColor(scale * 0.25, scale * 0.31, scale * 0.45);
		setFogFactor(0.00396484);
		setFogThickness(0.25);
		setFogColor(0.33, 0.42, 0.5);
	}
}

g_Map.ExportMap();

function scaleByMapAreaAndPlayers(base, countPlayers = false, minMapSize = 128)
{
	let playerFactor = countPlayers ? numPlayers : 0;
	return base * ((diskArea(mapSize/2) - playerFactor * diskArea(20)) / (diskArea(minMapSize/2)));
}

// Places a bounded amount of corresponding type food to the specified player and returns the amount placed.
function placeFoodForPlayer(type, min, max, remainingFood, areaId) {
	// Since the placing function doesn't specify (i think ?) the number of objects placed, randomization is done there.
	max = max < remainingFood ? max : remainingFood;
	let amountPlaced = randIntInclusive(min, max);

	// Hunt should spawn farther from the CC in general.
	let minTileBound = 20;
	let maxTileBound = 30;
	if (type != oBerryBush) {
		minTileBound += 5;
		maxTileBound += 5;
	}

	let food = new SimpleGroup(
		[new SimpleObject(type, amountPlaced, amountPlaced, 0,4)],
		true, clFood
	);
	createObjectGroupsByAreas(food, 0,
		new AndConstraint([avoidClasses(clForest, 0, clPlayer, minTileBound, clMountain, 1, clMetal, 4, clRock, 4, clFood, 10), borderClasses(clPlayer, 0, maxTileBound)]),
		1, 400, [surroundingPlayersAreas[areaId]]
	);

	return amountPlaced;
}

// The original function doesn't take into account the number of players for its initial estimation of playerMinDistSquared
// which I think is a problem at least for this map (typically 25% is too low in 1v1s for generations which could offer better placements)
function playerPlacementRandomScaled(playerIDs, constraints = undefined)
{
	let locations = [];
	let attempts = 0;
	let resets = 0;

	let mapCenter = g_Map.getCenter();
	let minDistArray = [1, 1, 0.55, 0.35, 0.3, 0.25, 0.25, 0.25, 0.25];
	let playerMinDistFraction = minDistArray[getNumPlayers()];
	let playerMinDistSquared = Math.square(fractionToTiles(playerMinDistFraction));
	let borderDistance = fractionToTiles(0.08);

	let area = createArea(new MapBoundsPlacer(), undefined, new AndConstraint(constraints));

	// Return if constraints return an empty area
	if (!area.getPoints().length)
		return undefined;

	for (let i = 0; i < getNumPlayers(); ++i)
	{
		let position = pickRandom(area.getPoints());

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

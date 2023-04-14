// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("rmgen-helpers");

// What does this do? I've seen it used on other maps
// that import a heightmap...
// TILE_CENTERED_HEIGHT_MAP = true;

setSelectedBiome();
const bSahara = (currentBiome() == "generic/sahara");
const bArctic = (currentBiome() == "generic/arctic");

if (bSahara)
	setWaterHeight(-Infinity);

const tMainTerrain = g_Terrains.mainTerrain;
const tForestFloor1 = g_Terrains.forestFloor1;
const tForestFloor2 = g_Terrains.forestFloor2;
const tCliff = g_Terrains.cliff;
const tTier1Terrain = g_Terrains.tier1Terrain;
const tTier2Terrain = g_Terrains.tier2Terrain;
const tTier3Terrain = g_Terrains.tier3Terrain;
const tHill = g_Terrains.hill;
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;
const tTier4Terrain = g_Terrains.tier4Terrain;
const tDirt = g_Terrains.dirt;
const tShoreBlend = g_Terrains.shoreBlend;
const tWater = g_Terrains.water;

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
const oStoneLarge = g_Gaia.stoneLarge;
const oStoneSmall = g_Gaia.stoneSmall;
const oMetalLarge = g_Gaia.metalLarge;
const oMetalSmall = g_Gaia.metalSmall;

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;
const aReeds = g_Decoratives.reeds;
const aLillies = g_Decoratives.lillies;

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const heightScale = num => num * g_MapSettings.Size / 320;

const heightSeaGround = heightScale(0.05);
const heightShore = heightScale(0.4);
const heightLand = heightScale(0.6);

var g_Map = new RandomMap(heightLand, tMainTerrain);
var mapCenter = g_Map.getCenter();
const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clBlood = g_Map.createTileClass();
var clLake = g_Map.createTileClass();

initTileClasses(["shoreline", "path"]);
var clPath = g_TileClasses.path;
var clShoreline = g_TileClasses.shoreline;

g_Map.log("Importing heightmap");
g_Map.LoadHeightmapImage("jammys_despair.png", heightScale(1), 50);
Engine.SetProgress(15);

const heightMapCenter = g_Map.getHeight(mapCenter);

if (!isNomad())
{
	var [playerIDs, playerPosition] = createBasesByPattern(
		"besideAllies",
		fractionToTiles(0.35),
		g_PlayerbaseTypes.besideAllies.groupedDistance,
		randomAngle());

	clPlayer = g_TileClasses.player;

	g_Map.log("Flatten the initial CC area");
	for (const position of playerPosition)
		createArea(
			new ClumpPlacer(diskArea(defaultPlayerBaseRadius() * 1.6), 0.95, 0.6, Infinity, position),
			new SmoothElevationPainter(ELEVATION_SET, heightLand, 6));

	for (const position of playerPosition)
	{
		let relPos = Vector2D.sub(position, mapCenter);
		relPos = relPos.normalize().mult(scaleByMapSize(4, 8));
		// Path from player to neighbor
		const area = createArea(
			new PathPlacer(
				Vector2D.sub(position, relPos),
				mapCenter,
				6, // width
				0, // waviness - 0 is a straight line, higher numbers are.
				20, // smoothness
				30, // offset - Maximum amplitude of waves along the path. 0 is straight line.
				-0.6,
				0),
			[
				new SmoothElevationPainter(ELEVATION_SET, heightLand, 0),
				new SmoothElevationPainter(ELEVATION_MODIFY, heightScale(heightMapCenter), 50),
				new TileClassPainter(clPath),
				new TerrainPainter(tRoad)
			]);
	}
}

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(tCliff),
		new TileClassPainter(clHill)
	],
	[
		new SlopeConstraint(3, Infinity)
	]);

if (!bSahara)
	g_Map.log("Creating blood pools");
else
	g_Map.log("Creating sand pits");

var numLakes = Math.round(scaleByMapSize(1, 4) * numPlayers);
var lakeSize;
const lakeCoherence = 0.1;
const lakeBorderSmoothness = 0.2; // smoothness - How smooth the border of the clump is (1 = few "peaks", 0 = very jagged).

/* These lakes aren't very deep; units can walk over them,
/* so they don't have to avoid clPath */
for (let passes = 0; passes < 6; passes++)
{
	lakeSize = scaleByMapSize(randIntInclusive(40, 70), randIntInclusive(180, 280));
	createAreas(
		new ClumpPlacer(
			lakeSize,
			lakeCoherence,
			lakeBorderSmoothness,
			Infinity
		),
		[
			new SmoothElevationPainter(
				ELEVATION_SET,
				!bArctic ? heightSeaGround - 1 : heightSeaGround - 0.1, // elevation - target height.
				3 // blendRadius - How steep the elevation change is.
			),
			new TileClassPainter(clLake)
		],
		[
			avoidClasses(clPlayer, 24, clLake, 12),
			new HeightConstraint(heightLand, heightLand + 2)
		],
		2
	);
}

/* These may be a little deeper, so they won't be placed on any marked Paths */
for (let passes = 0; passes < numLakes; passes++)
{
	lakeSize = scaleByMapSize(randIntInclusive(40, 70), randIntInclusive(180, 280));
	createAreas(
		new ClumpPlacer(
			lakeSize,
			lakeCoherence,
			lakeBorderSmoothness,
			Infinity
		),
		[
			new SmoothElevationPainter(
				ELEVATION_SET,
				!bArctic ? heightSeaGround - randIntInclusive(2, 6) : heightSeaGround - 0.1,
				2
			),
			new TileClassPainter(clLake)
		],
		[
			avoidClasses(clPath, 0, clPlayer, 24, clLake, 12),
			new HeightConstraint(heightLand, heightLand + 2)
		],
		1
	);
}

if (bArctic)
{
	// Adapted from the Frozen Lakes biome of Gulf of Bothnia
	g_Map.log("Painting ice");

	createAreas(
		/**
 * Generates a more random clump of points. It randomly creates circles around the edges of the current clump.s
 *
 * @param {number} minRadius - minimum radius of the circles.
 * @param {number} maxRadius - maximum radius of the circles.
 * @param {number} numCircles - number of circles.
 * @param {number} [failFraction] - Percentage of place attempts allowed to fail.
 * @param {Vector2D} [centerPosition]
 * @param {number} [maxDistance] - Farthest distance from the center.
 * @param {number[]} [queue] - When given, uses these radiuses for the first circles.
 */
		new ChainPlacer(
			1,
			4,
			scaleByMapSize(16, 40),
			0.3),
		[
			new SmoothElevationPainter(
				ELEVATION_SET,
				-6,
				1
			),
			new TileClassPainter(clBlood)
		],
		stayClasses(clLake, 2),
		scaleByMapSize(10, 40)
	);
}
else
{
	clBlood = clLake;
}

createBumps(
	avoidClasses(
		clHill, 2,
		clPlayer, 20
	),
	scaleByMapSize(20, 40),
	1,
	4,
	Math.floor(scaleByMapSize(2, 5)) // spread
);

createBumps(
	stayClasses(
		clLake, 0
	),
	scaleByMapSize(40, 60),
	1,
	4,
	Math.floor(scaleByMapSize(2, 5)) // spread
);

if (!bArctic)
{
	g_Map.log("Painting shoreline");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter(g_Terrains.water),
			new TileClassPainter(clShoreline)
		],
		new HeightConstraint(-Infinity, heightShore));
}
else
{
	paintTerrainBasedOnHeight(
		heightSeaGround,
		heightShore + 0.1,
		Elevation_ExcludeMin_IncludeMax,
		"alpine_snow_02"
	);
	paintTerrainBasedOnHeight(
		-Infinity,
		heightShore,
		Elevation_ExcludeMin_ExcludeMax,
		"alpine_red_ice_01"
	);
	createArea(
		new MapBoundsPlacer(),
		[
			new TileClassPainter(clShoreline)
		],
		new HeightConstraint(-Infinity, heightShore));
}

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
	[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
	[[tMainTerrain, tTier1Terrain], [tTier1Terrain, tTier2Terrain], [tTier2Terrain, tTier3Terrain]],
	[1, 1],
	avoidClasses(
		clLake, 1,
		clForest, 0,
		clHill, 0,
		clDirt, 5,
		clPlayer, 12,
		clPath, 0
	),
	scaleByMapSize(15, 45),
	clDirt);

g_Map.log("Creating grass patches");
createPatches(
	[scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
	tTier4Terrain,
	avoidClasses(
		clLake, 1,
		clForest, 0,
		clHill, 0,
		clDirt, 5,
		clPlayer, 12,
		clPath, 0
	),
	scaleByMapSize(15, 45),
	clDirt);
Engine.SetProgress(55);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clPath, 0, clLake, 3, clPlayer, scaleByMapSize(20, 35), clHill, 4)
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clPath, 0, clLake, 3, clPlayer, scaleByMapSize(20, 35), clHill, 4, clMetal, 10)
);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createDefaultForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	avoidClasses(clHill, 6, clPath, 0, clMetal, 2, clRock, 2, clLake, 10, clPlayer, 20, clForest, 10),
	clForest,
	forestTrees);

Engine.SetProgress(65);

var planetm = 1;

if (currentBiome() == "generic/india")
	planetm = 8;

createDecoration(
	[
		[new SimpleObject(aRockMedium, 1, 3, 0, 1)],
		[new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
		[new SimpleObject(aGrassShort, 1, 2, 0, 1)],
		[new SimpleObject(aGrass, 2, 4, 0, 1.8), new SimpleObject(aGrassShort, 3, 6, 1.2, 2.5)],
		[new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
	],
	[
		scaleByMapSize(16, 262),
		scaleByMapSize(8, 131),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200)
	],
	avoidClasses(
		clForest, 0,
		clPlayer, 0,
		clHill, 0,
		clLake, 1,
		clPath, 0
	)
);

Engine.SetProgress(70);

createFood(
	[
		[new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)],
		[new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)]
	],
	[
		3 * numPlayers,
		3 * numPlayers
	],
	avoidClasses(clLake, 2, clForest, 0, clPlayer, 10, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	avoidClasses(clPath, 2, clLake, 1, clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(
		clLake, 2,
		clForest, 8,
		clHill, 4,
		clPlayer, 12,
		clMetal, 1,
		clRock, 1,
		clFood, 1,
		clPath, 0
	),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clLake, 2, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

if (!bSahara)
{
	g_Map.log("Boiling the blood");
	const clBubbles = g_Map.createTileClass();
	const bubblesGroup = new SimpleGroup(
		[new SimpleObject("actor|particle/jammys_despair_bubbles.xml", 1, 1, 0, 7)], false, clBubbles);
	createObjectGroups(bubblesGroup, 0,
		[
			new HeightConstraint(-Infinity, heightSeaGround - 2)
		],
		scaleByMapSize(10, 90), // amount
		10 // retry factor
	);
}
else if (!bArctic)
{
	g_Map.log("Swirling the dust");
	const clSand = g_Map.createTileClass();
	const sandGroup = new SimpleGroup([new SimpleObject("actor|particle/blowing_sand.xml", 1, 1, 0, 7)], false, clSand);
	createObjectGroups(sandGroup, 0,
		[
			new HeightConstraint(-Infinity, heightSeaGround)
		],
		scaleByMapSize(20, 180), // amount
		5 // retry factor
	);
}

setWaterColor(0.541, 0.012, 0.012);
if (bArctic)
{
	setWaterWaviness(8);
	setWaterTint(0.471, 0.75, 0.501961);
}
else
{
	setWaterWaviness(3);
	setWaterTint(0.541, 0.012, 0.012);
}

setWaterMurkiness(1); // 0 - 1
setWaterType("lake");

g_Map.ExportMap();

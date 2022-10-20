// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("rmgen-helpers");

// TILE_CENTERED_HEIGHT_MAP = true;

setSelectedBiome();
const bSahara = (currentBiome() == "generic/sahara");
const bArctic = (currentBiome() == "generic/arctic");

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
const tShore = g_Terrains.shore;
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

const heightSeaGround = 0.05;
const heightShore = 0.4;
const heightLand = 0.6;
const heightWaterLevel = -Infinity;

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
var clLand = g_Map.createTileClass();

initTileClasses(["shoreline", "path"]);
var clPath = g_TileClasses.path;
var clShoreline = g_TileClasses.shoreline;

g_Map.log("Creating mountains");
g_Map.LoadHeightmapImage("jammys_despair.png", heightLand, 50);
Engine.SetProgress(15);

createBumps(avoidClasses(clHill, 2, clPlayer, 20), scaleByMapSize(20, 40), 1, 4, Math.floor(scaleByMapSize(2, 5))); // spread)

const heightMapCenter = g_Map.getHeight(mapCenter);

if (!isNomad())
{
	var [playerIDs, playerPosition] = createBasesByPattern(
		"besideAllies",
		fractionToTiles(0.35),
		g_PlayerbaseTypes["besideAllies"].groupedDistance,
		randomAngle());

	clPlayer = g_TileClasses.player;

	g_Map.log("Flatten the initial CC area");
	for (let position of playerPosition)
		createArea(
			new ClumpPlacer(diskArea(defaultPlayerBaseRadius() * 1.6), 0.95, 0.6, Infinity, position),
			new SmoothElevationPainter(ELEVATION_SET, heightLand, 6));

	for (let position of playerPosition)
	{
		let relPos = Vector2D.sub(position, mapCenter);
		relPos = relPos.normalize().mult(scaleByMapSize(4,8));
		// Path from player to neighbor
		let area = createArea(
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
				// new LayeredPainter([tRoad, tDirt, tRoad], [3, 6]),
				new SmoothElevationPainter(ELEVATION_SET, heightLand, 0),
				new SmoothElevationPainter(ELEVATION_MODIFY, heightScale(heightMapCenter), 50),
				new TileClassPainter(clPath)
			]);
	}
}

if (!bSahara)
	g_Map.log("Creating blood pools");
else
	g_Map.log("Creating sand pits");

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(tCliff),
		new TileClassPainter(clHill),
	],
	[
		new SlopeConstraint(3, Infinity)
	]);

var bloodAreas = [];
var numLakes = Math.round(scaleByMapSize(1,4) * numPlayers);
var lakeSize;
const lakeCoherence = 0.1 // coherence - How much the radius of the clump varies (1 = circle, 0 = very random).
const lakeBorderSmoothness = 0.2; // smoothness - How smooth the border of the clump is (1 = few "peaks", 0 = very jagged).

/* These lakes aren't very deep; units can walk over them, so it doesn't have to avoid clPath */
for (let passes = 0; passes < 6; passes++)
{
	lakeSize = scaleByMapSize(randIntInclusive(40, 70), randIntInclusive(180, 280));

	bloodAreas = createAreas(
		new ClumpPlacer(
			lakeSize,
			lakeCoherence,
			lakeBorderSmoothness,
			Infinity
			),
		[
			// new LayeredPainter([tShoreBlend, tShore, tWater], [1, 1]),
			new SmoothElevationPainter(
				ELEVATION_SET,
				!bArctic ? heightSeaGround - 1 : heightSeaGround, // elevation - target height.
				3 // blendRadius - How steep the elevation change is.
				),
			new TileClassPainter(clBlood)
		],
		[
			avoidClasses(clPlayer, 24, clBlood, 12),
			new SlopeConstraint(-Infinity, heightLand)
		],
		2
	).concat(bloodAreas);
}

/* These may be a little deeper, so they won't be placed on any marked Paths */
for (let passes = 0; passes < numLakes; passes++)
{
	lakeSize = scaleByMapSize(randIntInclusive(40, 70), randIntInclusive(180, 280));
	bloodAreas = createAreas(
		new ClumpPlacer(lakeSize, lakeCoherence, lakeBorderSmoothness, Infinity),
		[
			// new LayeredPainter([tShoreBlend, tShore, tWater], [1, 1]),
			new SmoothElevationPainter(
				ELEVATION_SET,
				!bArctic ? heightSeaGround - randIntInclusive(2, 6) : heightSeaGround,
				2
				),
			new TileClassPainter(clBlood)
		],
		[
			avoidClasses(clPath, 0, clPlayer, 24, clBlood, 12),
			new SlopeConstraint(-Infinity, heightLand)
		],
		1
	).concat(bloodAreas);
}

//if (!bSahara)
	//g_Map.log("Marking blood");
//else
	//g_Map.log("Marking sand pits");

//createArea(
	//new MapBoundsPlacer(),
	//new TileClassPainter(clBlood),
	//new HeightConstraint(-Infinity, heightSeaGround));
//Engine.SetProgress(30);

if (bArctic) {
	// Adapted from the Frozen Lakes biome of Gulf of Bothnia
	g_Map.log("Painting ice");
	createAreas(
		new ChainPlacer(
			1,
			4,
			scaleByMapSize(4, 10),
			0.3),
		[
			new ElevationPainter(-6),
		],
		stayClasses(clBlood, 2),
		scaleByMapSize(10, 40)
	);
}

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(clLand),
	avoidClasses(clBlood, 0));

///* creating bumps may change the blood or land, so re-mark them */
//if (!bSahara)
	//g_Map.log("Marking blood");
//else
	//g_Map.log("Marking sand pits");

//createArea(
	//new MapBoundsPlacer(),
	//new TileClassPainter(clBlood),
	//new HeightConstraint(-Infinity, heightWaterLevel - 1));

//g_Map.log("Marking land");
//createArea(
	//new DiskPlacer(fractionToTiles(0.5), mapCenter),
	//new TileClassPainter(clLand),
	//avoidClasses(clBlood, 0));
//Engine.SetProgress(35);

if (!bArctic) {
g_Map.log("Painting shoreline");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.water),
		new TileClassPainter(clShoreline)
	],
	new HeightConstraint(-Infinity, heightSeaGround));
}
else {
	paintTerrainBasedOnHeight(heightShore, heightSeaGround, Elevation_ExcludeMin_ExcludeMax, g_Terrains.water);
	paintTerrainBasedOnHeight(-Infinity, heightShore, Elevation_ExcludeMin_IncludeMax, "alpine_red_ice_01");
}

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clBlood, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clBlood, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clPath, 0, clBlood, 3, clPlayer, scaleByMapSize(20, 35), clHill, 4)
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clPath, 0, clBlood, 3, clPlayer, scaleByMapSize(20, 35), clHill, 4, clMetal, 10)
);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createDefaultForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	avoidClasses(clHill, 6, clPath, 0, clMetal, 2, clRock, 2, clBlood, 10, clPlayer, 20, clForest, 10),
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
		[new SimpleObject(aGrass, 2, 4, 0, 1.8), new SimpleObject(aGrassShort, 3,6, 1.2, 2.5)],
		[new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
	],
	[
		scaleByMapSize(16, 262),
		scaleByMapSize(8, 131),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200)
	],
	avoidClasses(clForest, 0, clPlayer, 0, clHill, 0, clBlood, 1));

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
	avoidClasses(clBlood, 2, clForest, 0, clPlayer, 10, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	avoidClasses(clPath, 2, clBlood, 1, clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(clBlood, 2, clForest, 8, clHill, 4, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clBlood, 2, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

if (!bSahara && !bArctic)
{
	g_Map.log("Boiling the blood");
	const clBubbles = g_Map.createTileClass();
	const bubblesGroup = new SimpleGroup(
		[new SimpleObject("actor|particle/jammys_despair_bubbles.xml", 1, 1, 0, 7)], false, clBubbles);
	createObjectGroupsByAreas(bubblesGroup, 0,
		[stayClasses(clBlood, 1), avoidClasses(clShoreline, 2, clBubbles, 4, clHill, 3)],
		scaleByMapSize(10, 90), // amount
		50, // retry factor
		bloodAreas
		);
}
else if (!bArctic)
{
	g_Map.log("Swirling the dust");
	const clSand = g_Map.createTileClass();
	const sandGroup = new SimpleGroup([new SimpleObject("actor|particle/blowing_sand.xml", 1, 1, 0, 7)], false, clSand);
	createObjectGroupsByAreas(sandGroup, 0,
		[stayClasses(clBlood, 3), avoidClasses(clLand, 2)],
		scaleByMapSize(4, 32), // amount
		30, // retry factor
		bloodAreas
		);

	setWaterHeight(-Infinity);
}

setWaterTint(0.541, 0.012, 0.012);
setWaterColor(0.541, 0.012, 0.012);
setWaterWaviness(8);
setWaterMurkiness(1); // 0 - 1
setWaterType("lake");

g_Map.ExportMap();

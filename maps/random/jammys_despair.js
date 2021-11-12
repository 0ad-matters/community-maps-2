// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("rmgen-helpers");

TILE_CENTERED_HEIGHT_MAP = true;

setSelectedBiome();

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

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const heightScale = num => num * g_MapSettings.Size / 320;

const heightSeaGround = heightScale(-4);
const heightReedsMin = heightScale(-2);
const heightReedsMax = heightScale(-0.5);
const heightWaterLevel = heightScale(0);
const heightShoreline = heightScale(0.8);
const heightHills = heightScale(16);
const heightLand = heightScale(1);

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
var clWater = g_Map.createTileClass();
var clLand = g_Map.createTileClass();

/**
 * Mainland style with some small random lakes.
 * code pinched and adapted from unknownLakes() in unknown.js
 */
function createLakes()
{
	g_Map.log("Creating lakes");
	createAreas(
		new ClumpPlacer(
			scaleByMapSize(60, 240),
			0.5, // coherence - How much the radius of the clump varies (1 = circle, 0 = very random).
			0.5, // smoothness - How smooth the border of the clump is (1 = few "peaks", 0 = very jagged).
			Infinity),
		[
			new SmoothElevationPainter(ELEVATION_SET, heightWaterLevel - heightScale(3), 5),
			new TileClassPainter(clWater)
		],
		[avoidClasses(clPlayer, 15, clWater, 12, clPath, 0)],
		scaleByMapSize(5, 16));
}

initTileClasses(["shoreline", "path"]);
var clPath = g_TileClasses.path;

g_Map.log("Creating mountains");
g_Map.LoadHeightmapImage("jammys_despair.png", heightLand, 50);
Engine.SetProgress(15);

//g_Map.log("Smoothing heightmap");
//createArea(
	//new MapBoundsPlacer(),
	//new SmoothingPainter(1, scaleByMapSize(1.0, .5), 1));
//Engine.SetProgress(25);

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
				new SmoothElevationPainter(ELEVATION_MODIFY, heightMapCenter, 50),
				new TileClassPainter(clPath)
			]);
	}
}

createLakes();

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(tCliff),
		new TileClassPainter(clHill),
	],
	[
		avoidClasses(clWater, 2),
		new SlopeConstraint(2, Infinity)
	]);

///* These bumps go down not up */
//createBumps(
	//avoidClasses(clPlayer, 20, clHill, 5),
	//scaleByMapSize(20, 40), // count
	//1, // minSize
	//4, // maxSize
	////Math.floor(scaleByMapSize(2, 5)), // spread
	//Math.floor(scaleByMapSize(2, 5)), // spread
	//0, //failFraction
	//-1.0 // elevation
//);

g_Map.log("Marking water");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(clWater),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(30);

createBumps(avoidClasses(clPlayer, 20, clHill, 2, clWater, 2));

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(clLand),
	avoidClasses(clWater, 0));
Engine.SetProgress(35);

g_Map.log("Painting shoreline");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.water),
		new TileClassPainter(g_TileClasses.shoreline)
	],
	new HeightConstraint(-Infinity, heightShoreline));

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clPath, 0, clWater, 3, clPlayer, scaleByMapSize(20, 35), clHill, 4)
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clPath, 0, clWater, 3, clPlayer, scaleByMapSize(20, 35), clHill, 4, clMetal, 10)
);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createDefaultForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	avoidClasses(clHill, 2, clPath, 0, clMetal, 2, clRock, 2, clWater, 10, clPlayer, 20, clForest, 10),
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
	avoidClasses(clPath, 2, clWater, 1, clForest, 0, clPlayer, 0, clHill, 0));

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
	avoidClasses(clWater, 2, clForest, 0, clPlayer, 10, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	avoidClasses(clPath, 2, clWater, 1, clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(clPath, 2, clWater, 2, clForest, 8, clHill, 4, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clWater, 2, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setWaterHeight(heightWaterLevel + SEA_LEVEL);
setWaterTint(0.161, 0.286, 0.353);
setWaterColor(0.129, 0.176, 0.259);
//setWaterWaviness(1);
//setWaterMurkiness(0.05);
//setWaterType("ocean");

g_Map.ExportMap();

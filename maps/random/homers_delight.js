// modified Continent random map
// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

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
const tShore = g_Terrains.shore;
const tWater = !bArctic ? g_Terrains.water : "alpine_ice_01";

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
const oFish = g_Gaia.fish;
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
const heightLand = heightScale(3);
const heightShore = heightScale(2);
var heightSeaGround = bArctic ? heightScale(.05) : heightScale(-5);

var g_Map = new RandomMap(heightSeaGround, tWater);

var numPlayers = getNumPlayers();
var mapSize = g_Map.getSize();
var mapCenter = g_Map.getCenter();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clLand = g_Map.createTileClass();

g_Map.log("Creating continent");
createArea(
	new ChainPlacer(
		2,
		Math.floor(scaleByMapSize(5, 12)),
		Math.floor(scaleByMapSize(60, 700)),
		Infinity,
		mapCenter,
		0,
		[Math.floor(fractionToTiles(0.33))]),
	[
		new SmoothElevationPainter(ELEVATION_SET, heightLand, 4),
		// new TileClassPainter(clLand)
	]);

/**
 * function ClumpPlacer(size, coherence, smoothness, failFraction = 0, centerPosition = undefined)
 * Generates a roughly circular clump of points.
 *
 * @param {number} size - The average number of points in the clump. Correlates to the area of the circle.
 * @param {number} coherence - How much the radius of the clump varies (1 = circle, 0 = very random).
 * @param {number} smoothness - How smooth the border of the clump is (1 = few "peaks", 0 = very jagged).
 * @param {number} [failfraction] - Percentage of place attempts allowed to fail.
 * @param {Vector2D} [centerPosition] - Tile coordinates of placer center.
 */
// This doesn't actually mark the entire isthmus, but enough that we
// can have trees and rocks avoid it, thereby preventing a bottleneck.
createArea(
	new ClumpPlacer(diskArea(scaleByMapSize(6,56)), 0.5, 0.6, Infinity, mapCenter),
	[
		new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 10),
		new TerrainPainter(tWater)
	]);

g_Map.log("Marking land");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(clLand),
	new HeightConstraint(heightShore, Infinity));

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
		new ElevationPainter(-6)
	],
	avoidClasses(clLand, 0),
	scaleByMapSize(6, 24)
);

var [playerIDs, playerPosition] = playerPlacementCircle(fractionToTiles(0.25));

g_Map.log("Ensuring initial player land");
for (let i = 0; i < numPlayers; ++i)
	createArea(
		new ChainPlacer(
			2,
			Math.floor(scaleByMapSize(5, 9)),
			Math.floor(scaleByMapSize(5, 20)),
			Infinity,
			playerPosition[i],
			0,
			[Math.floor(scaleByMapSize(23, 50))]),
		[
			new SmoothElevationPainter(ELEVATION_SET, heightLand, 4),
			new TileClassPainter(clLand)
		]);

Engine.SetProgress(20);

paintTerrainBasedOnHeight(3, 4, 3, tMainTerrain);
paintTerrainBasedOnHeight(1, 3, 0, tShore);
paintTerrainBasedOnHeight(
	-Infinity,
	heightShore,
	Elevation_ExcludeMin_ExcludeMax,
	tWater
	)

placePlayerBases({
	"PlayerPlacement": [playerIDs, playerPosition],
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"StartingAnimal": {
	},
	"Berries": {
		"template": oFruitBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge }
		]
	},
	"Trees": {
		"template": oTree1,
		"count": 2
	},
	"Decoratives": {
		"template": aGrassShort
	}
});
Engine.SetProgress(30);

createBumps([avoidClasses(clPlayer, 10), stayClasses(clLand, 5)]);

if (randBool())
	createHills([tMainTerrain, tCliff, tHill], [avoidClasses(clPlayer, 20, clHill, 15, clBaseResource, 3), stayClasses(clLand, 5)], clHill, scaleByMapSize(1, 4) * numPlayers);
else
	createMountains(tCliff, [avoidClasses(clPlayer, 20, clHill, 15, clBaseResource, 3), stayClasses(clLand, 5)], clHill, scaleByMapSize(1, 4) * numPlayers);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createDefaultForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	[avoidClasses(clPlayer, 20, clForest, 17, clHill, 0, clBaseResource,2), stayClasses(clLand, 4)],
	clForest,
	forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1,1],
 [avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12), stayClasses(clLand, 5)],
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 [avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12), stayClasses(clLand, 5)],
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	[stayClasses(clLand, 6), avoidClasses(clForest, 1, clPlayer, scaleByMapSize(20, 35), clHill, 1)],
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	[stayClasses(clLand, 6), avoidClasses(clForest, 1, clPlayer, scaleByMapSize(20, 35), clHill, 1, clMetal, 10)]
);

Engine.SetProgress(65);

// create decoration
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
		scaleByMapAreaAbsolute(16),
		scaleByMapAreaAbsolute(8),
		planetm * scaleByMapAreaAbsolute(13),
		planetm * scaleByMapAreaAbsolute(13),
		planetm * scaleByMapAreaAbsolute(13)
	],
	[avoidClasses(clForest, 0, clPlayer, 0, clHill, 0), stayClasses(clLand, 5)]);

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
	[avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clFood, 20), stayClasses(clLand, 5)],
	clFood);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	[avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clFood, 10), stayClasses(clLand, 5)],
	clFood);

createFood(
	[
		[new SimpleObject(oFish, 2, 3, 0, 2)]
	],
	[
		25 * numPlayers
	],
	avoidClasses(clLand, 2, clFood, 20),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	[avoidClasses(clForest, 7, clHill, 1, clPlayer, 9, clMetal, 6, clRock, 6), stayClasses(clLand, 7)],
	clForest,
	stragglerTrees);

placePlayersNomad(
	clPlayer,
	[stayClasses(clLand, 4), avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2)]);

setWaterWaviness(1.0);
setWaterType("ocean");

g_Map.ExportMap();

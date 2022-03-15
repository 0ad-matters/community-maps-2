// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");

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

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oSheep = "gaia/fauna_sheep";
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

const heightLand = 10;
var g_Map = new RandomMap(heightLand, tMainTerrain);

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

warn(uneval(g_Map.size));
const mapBounds = g_Map.getBounds();
var startAngle = 0;
const mapCenter = g_Map.getCenter();
var WATER_WIDTH = .38;
const heightSeaGround = 120;
const heightWaterLevel = 1;
const heightHill = 12;

for (let x of [mapBounds.left, mapBounds.right])
	paintRiver({
		"parallel": true,
		"start": new Vector2D(x, mapBounds.top).rotateAround(startAngle, mapCenter),
		"end": new Vector2D(x, mapBounds.bottom).rotateAround(startAngle, mapCenter),
		"width": 2 * fractionToTiles(WATER_WIDTH),
		"fadeDist": 5,
		"deviation": .08,
		"heightRiverbed": heightSeaGround,
		"heightLand": heightLand,
		"meanderShort": 5,
		"meanderLong": 0,
		//"waterFunc": (position, height, z) => {
		// clWater.add(position);
		// }
	});

var playerIDs = sortAllPlayers();
var playerPosition = playerPlacementArcs(
	playerIDs,
	mapCenter,
	fractionToTiles(0.35),
	startAngle,
	0.1 * Math.PI,
	0.9 * Math.PI);

var playerBaseRadius = defaultPlayerBaseRadius() / (isNomad() ? 1.5 : 1) * 1.2;

if(!isNomad())
{
	let left = new Vector2D(mapCenter.x - mapCenter.x * 0.7, mapCenter.y).round();
	let right = new Vector2D(mapCenter.x + mapCenter.x * 0.7, mapCenter.y).round();
	createPassage({
		"start": left,
		"end": new Vector2D(mapCenter.x - 20, mapCenter.y),
		"startWidth": playerBaseRadius,
		"endWidth": playerBaseRadius,
		"smoothWidth": 2,
		});

	createPassage({
		"start": right,
		"end": new Vector2D(mapCenter.x + 20, mapCenter.y),
		"startWidth": playerBaseRadius,
		"endWidth": playerBaseRadius,
		"smoothWidth": 2,
		});
}

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.cliff),
		new TileClassPainter(clHill),
	],
	[
		new SlopeConstraint(1, Infinity)
	]);

placePlayerBases({
	"PlayerPlacement": [playerIDs, playerPosition],
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"baseResourceConstraint": avoidClasses(clHill, 1),
	"Walls": false,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"Chicken": {
		"template": oSheep
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
		"count": 5
	},
	"Decoratives": {
		"template": aGrassShort
	}
});
Engine.SetProgress(20);

createBumps(avoidClasses(clPlayer, 20));

createHillsAndMountains(
	scaleByMapSize(3 * randFloat(1, 3), 15 * randFloat(1, 2)), // hillCount
	scaleByMapSize(3 * randFloat(1, 3), 15 * randFloat(1, 2))); // mountainCount

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clWater, 1, clPlayer, 20, clForest, 18, clHill, 5),
 clForest,
 forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clWater, 2, clForest, 1, clPlayer, 20, clHill, 5, clMetal, 10),
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clWater, 2, clForest, 1, clPlayer, 20, clMetal, 10, clHill, 3, clRock, 10),
);

Engine.SetProgress(65);

var planetm = 1;

if (currentBiome() == "generic/tropic")
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
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0));

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
	avoidClasses(clWater, 1, clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	avoidClasses(clWater, 1, clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(clWater, 1, clForest, 8, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clWater, 5, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

//g_Map.log("Creating smoke");
//let clSmoke = g_Map.createTileClass();
//var aSmoke = "actor|particle/smoke.xml";
//let smokeGroup = new SimpleGroup([new SimpleObject(aSmoke, 3, 3, 0, 7)], false, clSmoke);
//createObjectGroups(smokeGroup, 0,
	//avoidClasses(clHill, 0),
	//100,
	//scaleByMapSize(80, 250));

//g_Map.log("Creating dust storm");
//let clDustStorm = g_Map.createTileClass();
//var aDustStorm = "actor|particle/dust_storm.xml";
//let dustStormGroup = new SimpleGroup([new SimpleObject(aDustStorm, 1, 1, 0, 7)], false, clDustStorm);
//createObjectGroups(dustStormGroup, 0,
	//avoidClasses(clForest, 1, clHill, 0),
	//100,
	//scaleByMapSize(80, 250));

//g_Map.log("Clouding the issue");
//let clCloud = g_Map.createTileClass();
//let cloudGroup = new SimpleGroup([new SimpleObject("actor|particle/cloud.xml", 1, 1, 0, 7)], false, clCloud);
//createObjectGroups(cloudGroup, 0,
	//avoidClasses(clForest, 1),
	//100,
	//scaleByMapSize(80, 250));

//g_Map.log("Clouding the issue");
//let clDestructionDust = g_Map.createTileClass();
//let destructionDustGroup = new SimpleGroup([new SimpleObject("actor|particle/destruction_dust_med_gray.xml", 10, 12, 0, 7)], false, clDestructionDust);
//createObjectGroups(destructionDustGroup, 0,
	//avoidClasses(clForest, 1),
	//20,
	//scaleByMapSize(80, 250));

g_Map.log("Creating rain drops");
var clRain = g_Map.createTileClass();
var aRain = "actor|particle/rain_shower.xml";
createObjectGroups(
	new SimpleGroup([new SimpleObject(aRain, 1, 1, 1, 4)], true, clRain),
	0,
	avoidClasses(clRain, 5),
	scaleByMapSize(160, 500));

setWaterHeight(heightWaterLevel);
setWaterColor(0.024,0.262,0.224);
setWaterTint(0.133, 0.325,0.255);

// setSunColor(0.733, 0.746, 0.574);
// setSunRotation(Math.PI / 2 * randFloat(-1, 1));
// setSunElevation(Math.PI / 7);

setSkySet("sunset");

//setFogFactor(90);
//setFogThickness(50);
//setFogColor(0.69, 0.616, 0.541);

g_Map.ExportMap();

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("heightmap");

setSelectedBiome();

const tMainTerrain = g_Terrains.mainTerrain;
const tForestFloor1 = g_Terrains.forestFloor1;
const tForestFloor2 = g_Terrains.forestFloor2;
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;
const tDesertSandWet = "sand_wet_a.xml";
const tSand = "sand";

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oCamel = "gaia/fauna_camel";
const oFox = "gaia/fauna_fox_red";
const oStoneLarge = g_Gaia.stoneLarge;
const oStoneSmall = g_Gaia.stoneSmall;
const oMetalLarge = g_Gaia.metalLarge;
const oTreasure = ["food_barrel", "food_bin", "wood", "metal", "stone"].map(v => "gaia/treasure/" + v);

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aDust = "actor|particle/dust_storm_reddish.xml";
const aLilliesLarge = "actor|props/flora/pond_lillies_large.xml";
const aLillies = "actor|props/flora/water_lillies.xml";
const aSkeleton1 = "actor|props/special/eyecandy/skeleton.xml";
const aSkeleton2 = "actor|props/special/eyecandy/skeleton_propped.xml";
const aDeadTree = "gaia/tree/dead";

Engine.SetProgress(10);

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const heightLand = 0;
var g_Map = new RandomMap(heightLand, tSand);
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
var clDust = g_Map.createTileClass();
var clTreasure = g_Map.createTileClass();

const centerPos = g_Map.getCenter();
const avoidCollisions = avoidClasses(clPlayer, 35, clWater, 1, clForest, 1, clRock, 4, clMetal, 4, clFood, 6, clTreasure, 1);

function linearInterpolation(min, max, t)
{
	return min + (max - min) * t;
}
var size = g_Map.size;

Engine.SetProgress(20);

createArea(
	new MapBoundsPlacer(), [
		new DunePainter()
	],
	null
);

Engine.SetProgress(30);

var p1a = new createArea(
	new ClumpPlacer(diskArea(50) * scaleByMapSize(1, 2), 0.8, 0.06, Infinity, centerPos), [
		new SmoothElevationPainter(ELEVATION_SET, 1, 16)
	],
	null
);
var p2a = new createArea(
	new ClumpPlacer(diskArea(30) * scaleByMapSize(1, 2), 0.8, 0.06, Infinity, centerPos), [
		new SmoothElevationPainter(ELEVATION_SET, 0, 16)
	],
	null
);
var pw1a = new createArea(
	new ClumpPlacer(diskArea(8) * scaleByMapSize(1, 2), 0.1, 0.1, Infinity, centerPos), [
		new SmoothElevationPainter(ELEVATION_SET, -15, 6),
		new TileClassPainter(clWater)
	],
	null
);
var pw2a = new createArea(
	new ClumpPlacer(diskArea(8) * scaleByMapSize(1, 2), 0.1, 0.3, Infinity, new Vector2D(centerPos.x, centerPos.y + getRandomDeviation(10, 5))), [
		new SmoothElevationPainter(ELEVATION_SET, -10, 5),
		new TileClassPainter(clWater)
	],
	null
);

var playerPlacement = playerPlacementCircle(fractionToTiles(0.35));

var playersPos = playerPlacement[1];
Engine.SetProgress(50);

placePlayerBases(
	{
		"PlayerPlacement": playerPlacement,
		"PlayerTileClass": clPlayer,
		"BaseResourceClass": clBaseResource,
		"CityPatch":
	{
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
		"Berries":
	{
		"template": oFruitBush
	},
		"Mines":
	{
		"types": [
			{
				"template": oMetalLarge
			},
			{
				"template": oStoneLarge
			}]
	},
		"Walls": false,
		"Trees":
	{
		"template": oTree1,
		"count": 15
	}
	});

Engine.SetProgress(60);
var pwb1a = new createArea(
	new MapBoundsPlacer(), [
		new SmoothElevationPainter(ELEVATION_SET, -1, 2),
		new TileClassPainter(clWater),
		new TerrainPainter(tDesertSandWet)
	], [
		new borderClasses(clWater, 2, 4)
	]
);

Engine.SetProgress(65);
g_Map.log("Creating metal mines");
createObjectGroupsByAreas(
	new SimpleGroup([
		new SimpleObject(oMetalLarge, 1, 1, 5, 7)
	], true, clMetal),
	0, [
		new AvoidTileClassConstraint(clMetal, 1, clWater, 1, clRock, 1),
		new HeightConstraint(-1, Infinity)
	],
	Math.max(1, numPlayers * scaleByMapSize(1, 2)),
	400, [p1a]
);

Engine.SetProgress(70);
g_Map.log("Creating stone mines");
createObjectGroupsByAreas(
	new SimpleGroup([
		new SimpleObject(oStoneLarge, 1, 1, 5, 7),
		new SimpleObject(oStoneSmall, 1, 2, 2, 3)
	], true, clRock),
	0, [
		new AvoidTileClassConstraint(clMetal, 1, clWater, 1, clRock, 1),
		new HeightConstraint(-1, Infinity)
	],
	Math.max(1, numPlayers * scaleByMapSize(1, 2)),
	400, [p2a]
);

Engine.SetProgress(75);
g_Map.log("Creating fields and coold deco");
createObjectGroupsByAreas(
	new SimpleGroup([
		new SimpleObject(aGrass, 1, 1, 2, 5),
		new SimpleObject(aGrassShort, 1, 2, 2, 3)
	], false),
	0, [
		new HeightConstraint(-1, Infinity)
	],
	Math.max(1, scaleByMapSize(90, 170)),
	400, [pwb1a]
);

Engine.SetProgress(80);
g_Map.log("Creating water lillies");
createObjectGroupsByAreas(
	new SimpleGroup([new SimpleObject(aLilliesLarge, 1, 1, 5, 7), new SimpleObject(aLillies, 1, 2, 1, 3)], true), 0, [new HeightConstraint(-Infinity, -3)],
	Math.max(1, scaleByMapSize(10, 30)), 300, [pw1a, pw2a]);

Engine.SetProgress(90);

g_Map.log("Creating forest");
var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));

createForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2], [
		avoidClasses(clPlayer, 20, clForest, 0, clMetal, 1, clRock, 1),
		new AvoidTileClassConstraint(clWater, 0),
		new StayAreasConstraint([p2a])
	],
	clForest,
	forestTrees * 2
);

g_Map.log("Creating treasures");
createObjectGroups(
	new SimpleGroup([
		new SimpleObject(oTreasure[0], 0, 1, 1, 2),
		new SimpleObject(oTreasure[1], 0, 1, 1, 7),
		new SimpleObject(oTreasure[2], 0, 1, 1, 2),
		new SimpleObject(oTreasure[3], 0, 1, 1, 4),
		new SimpleObject(oTreasure[4], 0, 1, 1, 2),
		new SimpleObject(aSkeleton1, 1, 1, 0, 3),
		new SimpleObject(aSkeleton2, 0, 2, 0, 4),
		new SimpleObject(aDeadTree, 0, 1, 1, 7)
	], true, clTreasure),
	0, [
		avoidCollisions
	],
	Math.max(1, numPlayers * scaleByMapSize(1, 3)),
	500
);

Engine.SetProgress(95);

var minMaxHeight = getMinAndMaxHeight();

g_Map.log("Adding dust");
createObjectGroups(
	new SimpleGroup([
		new SimpleObject(aDust, 1, 1, 15, 40)
	],
	false
	),
	0, [
		new HeightConstraint(minMaxHeight.min, linearInterpolation(minMaxHeight.min, minMaxHeight.max, 0.8)),
		new AvoidAreasConstraint([p1a, p2a])
	],
	scaleByMapSize(20, 20), scaleByMapSize(20, 30)
);

g_Map.log("Creating camels");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oCamel, 3, 6, 2, 3)], true, clFood),
	0, [
		avoidCollisions,
		new HeightConstraint(linearInterpolation(minMaxHeight.min, minMaxHeight.max, 0.9), minMaxHeight.max)
	],
	Math.max(1, numPlayers * scaleByMapSize(2, 3)),
	500
);

g_Map.log("Creating foxes");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oFox, 1, 2, 1, 8)], true, clFood),
	0, [
		avoidCollisions
	],
	Math.max(1, numPlayers * scaleByMapSize(1, 3) * 2),
	500
);

Engine.SetProgress(98);
setSunElevation(2 * Math.PI * 0.25 / 10.0);
setAmbientColor(0.8, 0.55, 0.55);
setFogThickness(0.3);
setSkySet("sunset 2");
setSunColor(0.7, 0.55, 0.55);
setWaterWaviness(0.1);
setWaterMurkiness(0.9);
setWaterTint(0.9, 0.5, 0.5);
setWaterColor(0.6, 0.5, 0.7);
setFogThickness(0.1);
setFogFactor(0.1);

Engine.SetProgress(100);
placePlayersNomad(clPlayer, [avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2), new HeightConstraint(2, Infinity)]);

g_Map.ExportMap();

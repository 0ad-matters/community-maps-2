Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");

var tPrimary = ["tropic_plants_c", "temp_mud_a"];
var tGrass = ["tropic_swamp_a", "tropic_grass_c", "tropic_grass_plants"];
var tForestFloor = "temp_plants_bog";
var tForestFloor2 = "tropic_swamp_a";
var tGrassA = "temp_grass_plants";
var tGrassB = "temp_plants_bog";
var tMud = ["temp_mud_a", "tropic_mud_a", "tropic_swamp_a"];
var tRoad = "temp_road";
var tRoadWild = "temp_road_overgrown";
var tShoreBlend = "tropic_grass_plants";
var tShore = "temp_plants_bog";
var tWater = "tropic_swamp_a";

var oTree1 = "gaia/tree/dead";
var oTree2 = "gaia/tree/toona";
var oBush = "gaia/tree/bush_badlands";
var oCrocodile = "gaia/fauna_crocodile_nile";
var oDeer = "gaia/fauna_deer";
var oRabbit = "gaia/fauna_rabbit";
var oSwarm = "undeletable|trigger/fauna_insect_swarm";
var oStoneLarge = "gaia/rock/temperate_large";
var oStoneSmall = "gaia/rock/temperate_small";
var oMetalLarge = "gaia/ore/temperate_large";

var aGrass = "actor|props/flora/grass_soft_small_tall.xml";
var aGrassShort = "actor|props/flora/grass_soft_large.xml";
var aRockLarge = "actor|geology/stone_granite_med.xml";
var aRockMedium = "actor|geology/stone_granite_med.xml";
var aReeds = "actor|props/flora/reeds_pond_lush_a.xml";
var aLillies = "actor|props/flora/water_lillies.xml";
var aBushMedium = "actor|props/flora/bush_tropic_a.xml";
var aBushSmall = "actor|props/flora/bush_tropic_b.xml";
var aPlant = "actor|props/flora/plant_tropic_large.xml";
var aRain = "actor|particle/rain_shower.xml";

var pForest1 = [tForestFloor + TERRAIN_SEPARATOR + oTree1, tForestFloor];
var pForest2 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];

var baseHeight = 3;
var swampBed = -2;

var g_Map = new RandomMap(baseHeight, tPrimary);

var numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clWater = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clRain = g_Map.createTileClass();
var clTrigger = g_Map.createTileClass();

var [playerIDs, playerPosition] = playerPlacementCircle(fractionToTiles(0.39));

placePlayerBases({
	"PlayerPlacement": [playerIDs, playerPosition],
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad,
		"radius": 10,
		"width": 3,
	}});

// Elevating the land around the player slightly, as they would have settled on high-ground. And it would look better when water rises.
for (let position of playerPosition)
	createArea(
		new ClumpPlacer(10, 0.1, 0.6, 0.8, position),
		[
			new SmoothElevationPainter(ELEVATION_MODIFY, 1, scaleByMapSize(10, 20)),
			new TileClassPainter(clPlayer),
			new TerrainPainter("red")
		]);

Engine.SetProgress(15);

g_Map.log("Creating marshes");
createAreas(
	new ChainPlacer(2, Math.floor(scaleByMapSize(10, 25)), Math.floor(scaleByMapSize(20, 60)), 0.8),
	[
		new LayeredPainter([tShoreBlend, tShore, tWater],[1, 1]),
		new SmoothElevationPainter(ELEVATION_SET, swampBed, 3),
		new TileClassPainter(clWater)
	],
	avoidClasses(clPlayer, 20, clWater, Math.round(scaleByMapSize(7, 16) * randFloat(0.8, 1.35))),
	scaleByMapSize(5, 30));

g_Map.log("Creating reeds");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aReeds, 5,10, 0,4), new SimpleObject(aLillies, 5, 10, 0,4)], true),
	0,
	stayClasses(clWater, 1),
	scaleByMapSize(400,2000), 100);

Engine.SetProgress(40);

g_Map.log("Creating bumps");
createAreas(
	new ClumpPlacer(scaleByMapSize(20, 50), 0.3, 0.06, 1),
	new SmoothElevationPainter(ELEVATION_MODIFY, 2, 2),
	avoidClasses(clPlayer, 13),
	scaleByMapSize(300, 800));

var [forestTrees, stragglerTrees] = getTreeCounts(400, 2000, 0.7);
createForests(
	[tPrimary, tForestFloor, tForestFloor, pForest1, pForest2],
	avoidClasses(clPlayer, 20, clForest, 10, clHill, 1),
	clForest,
	forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating mud patches");
for (let size of [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)])
	createAreas(
		new ChainPlacer(1, Math.floor(scaleByMapSize(3, 5)), size, 1),
		[
			new LayeredPainter([tGrassA, tGrassB, tMud], [1, 1]),
			new TileClassPainter(clDirt)
		],
		avoidClasses(clWater, 1, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 8),
		scaleByMapSize(15, 45));

Engine.SetProgress(55);

g_Map.log("Creating stone mines");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oStoneSmall, 0,2, 0,4), new SimpleObject(oStoneLarge, 1,1, 0,4)], true, clRock),
	0,
	[avoidClasses(clWater, 0, clForest, 1, clPlayer, 20, clRock, 10, clHill, 1)],
	scaleByMapSize(4,16), 100);

createObjectGroups(
	new SimpleGroup([new SimpleObject(oStoneSmall, 2,5, 1,3)], true, clRock),
	0,
	[avoidClasses(clForest, 1, clPlayer, 20, clRock, 10, clHill, 1)],
	scaleByMapSize(4,16), 100);

g_Map.log("Creating metal mines");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oMetalLarge, 1,1, 0,4)], true, clMetal),
	0,
	[avoidClasses(clWater, 0, clForest, 1, clPlayer, 20, clMetal, 10, clRock, 5, clHill, 1)],
	scaleByMapSize(4,16), 100);

Engine.SetProgress(70);

g_Map.log("Creating decorative plants");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aPlant, 1,2, 0,1)],true),
	0,
	avoidClasses(clPlayer, 1, clHill, 2),
	scaleByMapSize(16, 262), 50);

g_Map.log("Creating insect swarms");
for (let i = 0; i < numPlayers; ++i)
	g_Map.placeEntityPassable(
		oSwarm,
		0,
		new Vector2D((g_Map.getSize()/2) + randIntInclusive(-15, 15), (g_Map.getSize()/2) + randIntInclusive(-15, 15)));

g_Map.log("Creating small decorative rocks");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aRockMedium, 1,3, 0,1)],true),
	0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0),
	scaleByMapSize(16, 262), 50);

g_Map.log("Creating large decorative rocks");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aRockLarge, 1,2, 0,1), new SimpleObject(aRockMedium, 1,3, 0,2)],true),
	0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 0, clHill, 0),
	scaleByMapSize(8, 131), 50);

Engine.SetProgress(80);

g_Map.log("Creating deer");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oDeer, 5,7, 0,4)],true, clFood),
	0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 20, clHill, 1, clFood, 13),
	6 * numPlayers, 50);

g_Map.log("Creating rabbit");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oRabbit, 5,7, 0,2)],true, clFood),
	0,
	avoidClasses(clWater, 0, clForest, 0, clPlayer, 20, clHill, 1, clFood, 13),
	6 * numPlayers, 50);

g_Map.log("Creating crocodiles");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oCrocodile, 1,3, 0,4)],true, clFood),
	0,
	avoidClasses(clPlayer, 10),
	6 * numPlayers, 50);

createStragglerTrees(
	[oTree1, oTree2, oBush],
	avoidClasses(clForest, 1, clHill, 1, clPlayer, 13, clMetal, 6, clRock, 6),
	clForest,
	stragglerTrees);

Engine.SetProgress(90);

g_Map.log("Creating rain drops");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aRain, 1, 1, 1, 4)], true, clRain),
	0,
	avoidClasses(clRain, 5),
	scaleByMapSize(80, 250));

g_Map.log("Creating small grass tufts");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aGrassShort, 1,2, 0,1, -Math.PI/8,Math.PI/8)]),
	0,
	avoidClasses(clWater, 2, clHill, 2, clPlayer, 13, clDirt, 0),
	scaleByMapSize(13, 200));

g_Map.log("Creating large grass tufts");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aGrass, 2,4, 0,1.8, -Math.PI/8,Math.PI/8), new SimpleObject(aGrassShort, 3,6, 1.2,2.5, -Math.PI/8,Math.PI/8)]),
	0,
	avoidClasses(clWater, 3, clHill, 2, clPlayer, 13, clDirt, 1, clForest, 0),
	scaleByMapSize(13, 200));

Engine.SetProgress(95);


g_Map.log("Creating bushes");
createObjectGroups(
	new SimpleGroup([new SimpleObject(aBushMedium, 1,2, 0,2), new SimpleObject(aBushSmall, 2,4, 0,2)]),
	0,
	avoidClasses(clWater, 1, clHill, 1, clPlayer, 13, clDirt, 1),
	scaleByMapSize(13, 200), 50);
	
g_Map.log("Creating trigger points \"A\"");
for (let position of playerPosition)
	g_Map.placeEntityPassable("trigger/trigger_point_A", 0, position);

setSkySet("dark");
setWaterColor(0.243,0.533,0.270);
setWaterTint(0.161,0.514,0.635);
setWaterMurkiness(0.8);
setWaterWaviness(1.0);
setWaterType("clap");

setFogThickness(2.65);
setFogFactor(1.7);

setPPEffect("hdr");
setPPSaturation(0.44);
setPPBloom(0.3);

g_Map.ExportMap();

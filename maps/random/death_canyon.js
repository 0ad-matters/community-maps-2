// modified from the Death Canyon skirmish map and Red Sea random map
// License: GPL2
// Authors: Andy Alt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("heightmap");

TILE_CENTERED_HEIGHT_MAP = true;

setBiome("generic/sahara");

g_Terrains.mainTerrain = new Array(4).fill("desert_sand_dunes_50").concat(["desert_sand_dunes_rocks", "desert_dirt_rough_2"]);
g_Terrains.forestFloor1 = "desert_grass_a_sand";
g_Terrains.cliff = "desert_cliff_3_dirty";
g_Terrains.forestFloor2 = "desert_grass_a_sand";
g_Terrains.tier1Terrain = "desert_dirt_rocks_2";
g_Terrains.tier2Terrain = "desert_dirt_rough";
g_Terrains.tier3Terrain = "desert_dirt_rough";
g_Terrains.tier4Terrain = "desert_sand_stones";
g_Terrains.roadWild = "road2";
g_Terrains.road = "road2";
g_Terrains.additionalDirt1 = "desert_plants_b";
g_Terrains.additionalDirt2 = "desert_sand_scrub";
g_Gaia.tree1 = "gaia/tree/date_palm";
g_Gaia.tree2 = "gaia/tree/senegal_date_palm";
g_Gaia.tree3 = "gaia/fruit/date";
g_Gaia.tree4 = "gaia/tree/cretan_date_palm_tall";
g_Gaia.tree5 = "gaia/tree/cretan_date_palm_short";
g_Gaia.fruitBush = "gaia/fruit/berry_05";
g_Decoratives.grass = "actor|props/flora/grass_field_dry_tall_b.xml";
g_Decoratives.grassShort = "actor|props/flora/grass_field_parched_short.xml";
g_Decoratives.rockLarge = "actor|geology/stone_desert_med.xml";
g_Decoratives.rockMedium = "actor|geology/stone_savanna_med.xml";
g_Decoratives.bushMedium = "actor|props/flora/bush_desert_dry_a.xml";
g_Decoratives.bushSmall = "actor|props/flora/bush_medit_sm_dry.xml";

const heightScale = num => num * g_MapSettings.Size / 320;

const heightSeaGround = heightScale(-4);
const heightReedsMin = heightScale(-2);
const heightReedsMax = heightScale(-0.5);
const heightWaterLevel = heightScale(0);
const heightShoreline = heightScale(0.5);
const heightHills = heightScale(16);

var g_Map = new RandomMap(0, g_Terrains.mainTerrain);
var mapCenter = g_Map.getCenter();

initTileClasses(["shoreline"]);
var clBaseResource = g_Map.createTileClass();

const minHeightSource = -18;
const maxHeightSource = 750;

g_Map.log("Loading hill heightmap");
createArea(
	new MapBoundsPlacer(),
	new HeightmapPainter(
		translateHeightmap(
			new Vector2D(0, scaleByMapSize(0, 0)),
			// new Vector2D(-12, scaleByMapSize(-12, -25)),
			undefined,
			convertHeightmap1Dto2D(Engine.LoadMapTerrain("maps/skirmishes/death_canyon_2p.pmp").height)),
		minHeightSource,
		maxHeightSource));

Engine.SetProgress(15);

g_Map.log("Marking water");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(g_TileClasses.water),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(30);

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(g_TileClasses.land),
	avoidClasses(g_TileClasses.water, 0));
Engine.SetProgress(35);

g_Map.log("Painting shoreline");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.water),
		new TileClassPainter(g_TileClasses.shoreline)
	],
	new HeightConstraint(-Infinity, heightShoreline));
Engine.SetProgress(40);

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.cliff),
		new TileClassPainter(g_TileClasses.mountain),
	],
	[
		avoidClasses(g_TileClasses.water, 2),
		new SlopeConstraint(2, Infinity)
	]);
Engine.SetProgress(45);

if (!isNomad())
{
	g_Map.log("Placing players");
	let [playerIDs, playerPosition] = createBases(
		...playerPlacementRandom(
			sortAllPlayers(),
			[
				avoidClasses(g_TileClasses.mountain, 10),
				stayClasses(g_TileClasses.land, defaultPlayerBaseRadius())
			]),
		false);
}

addElements(shuffleArray([
	{
		"func": addMetal,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 3,
			g_TileClasses.mountain, 6,
			g_TileClasses.player, 30,
			g_TileClasses.rock, 10,
			g_TileClasses.metal, 20,
			g_TileClasses.water, 3
		],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": ["normal"]
	},
	{
		"func": addStone,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 3,
			g_TileClasses.mountain, 6,
			g_TileClasses.player, 30,
			g_TileClasses.rock, 20,
			g_TileClasses.metal, 10,
			g_TileClasses.water, 3
		],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": ["normal"]
	},
	{
		"func": addForests,
		"avoid": [
			g_TileClasses.berries, 3,
			g_TileClasses.forest, 20,
			g_TileClasses.metal, 4,
			g_TileClasses.mountain, 5,
			g_TileClasses.shoreline, 8,
			g_TileClasses.player, 20,
			g_TileClasses.rock, 4,
			g_TileClasses.water, 4
		],
		"sizes": ["big"],
		"mixes": ["similar"],
		"amounts": ["few"]
	}
]));
Engine.SetProgress(60);

// Ensure initial forests
addElements([{
	"func": addForests,
	"avoid": [
		g_TileClasses.berries, 2,
		g_TileClasses.forest, 25,
		g_TileClasses.metal, 4,
		g_TileClasses.mountain, 5,
		g_TileClasses.shoreline, 8,
		g_TileClasses.player, 15,
		g_TileClasses.rock, 4,
		g_TileClasses.water, 2
	],
	"sizes": ["small"],
	"mixes": ["similar"],
	"amounts": ["tons"]
}]);
Engine.SetProgress(65);

addElements(shuffleArray([
	{
		"func": addBerries,
		"avoid": [
			g_TileClasses.berries, 30,
			g_TileClasses.forest, 5,
			g_TileClasses.metal, 10,
			g_TileClasses.mountain, 8,
			g_TileClasses.player, 20,
			g_TileClasses.rock, 10,
			g_TileClasses.water, 3
		],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": ["normal", "many"]
	},
	{
		"func": addAnimals,
		"avoid": [
			g_TileClasses.animals, 20,
			g_TileClasses.forest, 2,
			g_TileClasses.metal, 2,
			g_TileClasses.mountain, 1,
			g_TileClasses.player, 20,
			g_TileClasses.rock, 4,
			g_TileClasses.water, 3
		],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": ["many"]
	},
	{
		"func": addStragglerTrees,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 15,
			g_TileClasses.metal, 2,
			g_TileClasses.mountain, 1,
			g_TileClasses.player, 20,
			g_TileClasses.rock, 4,
			g_TileClasses.water, 5
		],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": ["many"]
	}
]));
Engine.SetProgress(70);

addElements([
	{
		"func": addLayeredPatches,
		"avoid": [
			g_TileClasses.dirt, 5,
			g_TileClasses.forest, 2,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 12,
			g_TileClasses.water, 3,
			g_TileClasses.shoreline, 2
		],
		"sizes": ["normal"],
		"mixes": ["normal"],
		"amounts": ["tons"]
	},
	{
		"func": addDecoration,
		"avoid": [
			g_TileClasses.forest, 2,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 12,
			g_TileClasses.water, 3
		],
		"sizes": ["normal"],
		"mixes": ["similar"],
		"amounts": ["many"]
	}
]);
Engine.SetProgress(80);

g_Map.log("Painting dirt patches");
var dirtPatches = [
	{
		"sizes": [2, 4],
		"count": scaleByMapSize(2, 5),
		"terrain": g_Terrains.additionalDirt1
	},
	{
		"sizes": [4, 6, 8],
		"count": scaleByMapSize(4, 8),
		"terrain": g_Terrains.additionalDirt2
	}
];
for (let dirtPatch of dirtPatches)
	createPatches(
		dirtPatch.sizes,
		dirtPatch.terrain,
		[
			stayClasses(g_TileClasses.land, 6),
			avoidClasses(
				g_TileClasses.mountain, 4,
				g_TileClasses.forest, 2,
				g_TileClasses.shoreline, 2,
				g_TileClasses.player, 12)
		],
		dirtPatch.count,
		g_TileClasses.dirt,
		0.5);
Engine.SetProgress(85);

g_Map.log("Adding reeds");
createObjectGroups(
	new SimpleGroup(
		[
			new SimpleObject(g_Decoratives.reeds, 5, 12, 1, 4),
			new SimpleObject(g_Decoratives.rockMedium, 1, 2, 1, 5)
		],
		false,
		g_TileClasses.dirt),
	0,
	new HeightConstraint(heightReedsMin, heightReedsMax),
	scaleByMapSize(10, 25),
	5);
Engine.SetProgress(90);

placePlayersNomad(
	g_Map.createTileClass(),
	[
		stayClasses(g_TileClasses.land, 5),
		avoidClasses(
			g_TileClasses.forest, 2,
			g_TileClasses.rock, 4,
			g_TileClasses.metal, 4,
			g_TileClasses.berries, 2,
			g_TileClasses.animals, 2,
			g_TileClasses.mountain, 2)
	]);

setWindAngle(-0.43);
setWaterTint(0.161, 0.286, 0.353);
setWaterColor(0.129, 0.176, 0.259);
setWaterWaviness(8);
setWaterMurkiness(0.87);
setWaterType("lake");

setAmbientColor(0.58, 0.443, 0.353);

setSkySet("cumulus");
setSunColor(0.733, 0.746, 0.574);
setSunRotation(Math.PI * 1.1);
setSunElevation(Math.PI / 7);

setFogFactor(0);
setFogThickness(0);
setFogColor(0.69, 0.616, 0.541);

//setPPEffect("hdr");
//setPPContrast(0.67);
//setPPSaturation(0.42);
//setPPBloom(0.23);

g_Map.ExportMap();

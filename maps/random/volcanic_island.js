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
var tCliffVolcanic = ["cliff volcanic coarse", "cave_walls"];

// From Volcanic Lands map
var tLava1 = "LavaTest05";
var tLava2 = "LavaTest04";
var tLava3 = "LavaTest03";

// From Corsica map
var tShoreBlend = ["medit_sand_wet", "medit_rocks_wet"];
var tShore = ["medit_rocks", "medit_sand", "medit_sand"];
var tSandTransition = ["medit_sand", "medit_rocks_grass", "medit_rocks_grass", "medit_rocks_grass"];
var tVeryDeepWater = ["medit_sea_depths", "medit_sea_coral_deep"];
var tDeepWater = ["medit_sea_coral_deep", "tropic_ocean_coral"];
var tCreekWater = "medit_sea_coral_plants";

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
const oFish = g_Gaia.fish;

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;
const aStandingStone = "actor|props/special/eyecandy/standing_stones.xml";
const aRock = "actor|geology/stone_granite_med.xml";
const aLargeRock = "actor|geology/stone_granite_large.xml";

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

var g_Map = new RandomMap(0, tMainTerrain);
initTileClasses();

const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clWater = g_Map.createTileClass();
var clLava = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

function weierstrassVolcano(a, r)
{
	const q = 0.6;
	const w = 4.5 - r * 0.01

	let sum = 0;
	for (let n = 0; n < 20; ++n)
		sum += Math.pow(q, n) * Math.cos(Math.pow(w, n) * Math.PI * a);
	return sum;
}

var volcano = {
	"maxRadius": () => fractionToTiles(0.5 * 0.65),
	"minRadius": function ()
	{
		return this.maxRadius * 0.1
	},
	"height": function ()
	{
		return 150 * this.maxRadius / 100;
	},
	"craterDepth": function ()
	{
		return 30 * this.height / 100;
	},
	"position": () => g_Map.getCenter(),
};

for (let key in volcano)
	volcano[key] = volcano[key]();


var coneShaper = (a, r) =>
{
	return Math.max(
		volcano.height * Math.pow(r, 3) +
		weierstrassVolcano(1 * (a - 0.5), r) * 8 * r +
		Math.pow(r, 4) * Math.cos(a * Math.PI * 2) * 15
		, 0);
};
arcRast(volcano.position, volcano.maxRadius, volcano.minRadius,
	0, 2 * Math.PI, coneShaper);

var craterShaper = (a, r) =>
{
	return volcano.height - volcano.craterDepth * (1 - Math.pow(r, 4));
};
arcRast(volcano.position, 0, volcano.minRadius, 0, 2 * Math.PI, craterShaper)

let num = Math.floor(diskArea(scaleByMapSize(3, 5)));
createObjectGroup(
	new SimpleGroup(
		[new SimpleObject("actor|particle/smoke.xml", num, num, 0, 12)],
		false,
		clLava,
		volcano.position),
	0,
	[]
);

var g_IslandArea1 = new createArea(
	new ClumpPlacer(diskArea(volcano.maxRadius), 0.95, 0.008, Infinity, volcano.position),
	[new TerrainPainter(g_Terrains.tier1Terrain)]
);

var g_WaterArea = new createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.water),
		new SmoothElevationPainter(ELEVATION_MODIFY, -30, 60, 1),
		new TileClassPainter(clWater)
	],
	[new AvoidAreasConstraint([g_IslandArea1])]
);

var numReefs = scaleByMapSize(2, 5) * 20;
for (let nReef = 0; nReef < numReefs; ++nReef)
{
	let rad = 2 * Math.PI * nReef / numReefs + (Math.random() - 0.5);
	let dist = volcano.maxRadius + (fractionToTiles(0.5) - volcano.maxRadius) * Math.random();
	let pos = new Vector2D(1, 0).rotate(rad).mult(dist).add(g_Map.getCenter());

	createArea(
		// new ClumpPlacer(diskArea(15), 0.98, 0.04, Infinity, pos),
		new ChainPlacer(3, 9, 4, Infinity, pos, 4),
		[
			new SmoothElevationPainter(ELEVATION_MODIFY, -4, 3)
		],
		[
			new HeightConstraint(-Infinity, 0.1)
		]
	);
}

createArea(
	new MapBoundsPlacer(), [new TerrainPainter(tDeepWater)], [new HeightConstraint(-10, -6)]
);
createArea(
	new MapBoundsPlacer(), [new TerrainPainter(tCreekWater)], [new HeightConstraint(-6, -3)]
);
createArea(
	new MapBoundsPlacer(), [new TerrainPainter(tShoreBlend)], [new HeightConstraint(-3, -0.75)]
);
createArea(
	new MapBoundsPlacer(), [new TerrainPainter(tShore)], [new HeightConstraint(-0.75, 5)]
);

var g_IslandArea2 = new createArea(
	new ClumpPlacer(diskArea(volcano.maxRadius * 0.7), 0.90, 0.009, Infinity, volcano.position),
	[new TerrainPainter(g_Terrains.tier4Terrain)]
);

var g_IslandArea3 = new createArea(
	new ClumpPlacer(diskArea(volcano.maxRadius * 0.3), 0.10, 0.005, Infinity, volcano.position),
	[new TerrainPainter(g_Terrains.mainTerrain)]
);

var g_IslandArea4 = new createArea(
	new ClumpPlacer(diskArea(volcano.maxRadius * 0.2), 0.10, 0, Infinity, volcano.position),
	[new TerrainPainter(g_Terrains.forestFloor2)]
);

var g_IslandArea5 = new createArea(
	new ClumpPlacer(diskArea(volcano.maxRadius * 0.15), 0.10, 0, Infinity, volcano.position),
	[new TerrainPainter(g_Terrains.cliff)]
);

var g_IslandArea6 = new createArea(
	new ClumpPlacer(diskArea(volcano.maxRadius * 0.1), 0.3, 0.001, Infinity, volcano.position),
	[new TerrainPainter(tCliffVolcanic)]
);

var g_IslandArea7 = new createArea(
	new ClumpPlacer(diskArea(volcano.minRadius * 0.7), 0.1, 0.001, Infinity, volcano.position),
	[new TerrainPainter(tLava1)]
);

var g_IslandArea8 = new createArea(
	new ClumpPlacer(diskArea(volcano.minRadius * 0.6), 0.8, 0.005, Infinity, volcano.position),
	[new TerrainPainter(tLava2)]
);

var g_IslandArea9 = new createArea(
	new ClumpPlacer(diskArea(volcano.minRadius * 0.45), 0.8, 0.005, Infinity, volcano.position),
	[new TerrainPainter(tLava3)]
);

placePlayerBases({
	"PlayerPlacement": playerPlacementCircle(volcano.maxRadius * 0.80),
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"CityPatch": {
		"outerTerrain": tRoadWild
	},
	"Chicken": {
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

for (let n = 0; n < 2; ++n)
	createBumps(avoidClasses(clPlayer, 20));


var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));

createForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	[
		new avoidClasses(clPlayer, 10, clForest, 1),
		new HeightConstraint(5, volcano.height * 0.65),
		new AvoidAreasConstraint([g_IslandArea5])
	],
	clForest,
	forestTrees * 5);

// Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
	[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
	[[tMainTerrain, tTier1Terrain], [tTier1Terrain, tTier2Terrain], [tTier2Terrain, tTier3Terrain]],
	[1, 1],
	[
		new avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
		new HeightConstraint(3, volcano.height * 0.65),
	],
	scaleByMapSize(15, 45),
	clDirt);

g_Map.log("Creating grass patches");
createPatches(
	[scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
	tTier4Terrain,
	[
		new avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
		new HeightConstraint(3, volcano.height * 0.65),
	],
	scaleByMapSize(15, 45),
	clDirt);
Engine.SetProgress(55);

g_Map.log("Creating stone mines");
createMines(
	[
		[new SimpleObject(oStoneSmall, 0, 2, 0, 4, 0, 2 * Math.PI, 1), new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)],
		[new SimpleObject(oStoneSmall, 2, 5, 1, 3, 0, 2 * Math.PI, 1)]
	],
	[
		new avoidClasses(clForest, 1, clPlayer, 15, clRock, 5, clHill, 1),
		new HeightConstraint(-1, volcano.height * 0.65)
	],
	clRock);

g_Map.log("Creating metal mines");
createMines(
	[
		[new SimpleObject(oMetalLarge, 1, 1, 0, 4)]
	],
	[
		new avoidClasses(clForest, 1, clPlayer, 15, clMetal, 5, clRock, 5, clHill, 1),
		new HeightConstraint(-1, volcano.height * 0.65)
	],
	clMetal
);

Engine.SetProgress(65);

var planetm = 1;

if (currentBiome() == "generic/tropic")
	planetm = 3;

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
	[
		new avoidClasses(clForest, 0, clPlayer, 0, clHill, 0),
		new HeightConstraint(-1, volcano.height * 0.65)
	]
);

Engine.SetProgress(70);

createFood(
	[
		[new SimpleObject(oFish, 2, 3, 0, 2)]
	],
	[
		30 * numPlayers
	],
	[
		new avoidClasses(clFood, 20),
		new HeightConstraint(-Infinity, -1.5)
	],
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	[
		new avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
		new HeightConstraint(0, volcano.height * 0.65)
	],
	clFood);

Engine.SetProgress(85);


g_Map.log("Creating decorative rocks");
createObjectGroupsDeprecated(
	new SimpleGroup(
		[
			new SimpleObject(aRock, 1, 3, 1, 5),
			new SimpleObject(aLargeRock, 1, 3, 0.5, 3),
		],
		true
	),
	0,
	[
		new HeightConstraint(-Infinity, -1),
	],
	scaleByMapSize(1, 10) * 100,
	Infinity
);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	[
		new avoidClasses(clForest, 8, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
		new HeightConstraint(2, volcano.height * 0.65)
	],
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

g_Map.ExportMap();

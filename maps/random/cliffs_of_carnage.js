// Cliffs of Carnage
// License: GPL2, Copyright 2022
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("heightmap");

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
const tTier4Terrain = g_Terrains.tier4Terrain;
const tDirt = g_Terrains.dirt;
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;

const oTree1 = g_Gaia.tree1;
const oTree2 = g_Gaia.tree2;
const oTree3 = g_Gaia.tree3;
const oTree4 = g_Gaia.tree4;
const oTree5 = g_Gaia.tree5;
const oFruitBush = g_Gaia.fruitBush;
const oPig = "gaia/fauna_pig";
const oSheep = "gaia/fauna_sheep";
const oGrapes = "gaia/fruit/grapes";
const oApples = "gaia/fruit/apple";
const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
const oStoneLarge = g_Gaia.stoneLarge;
const oStoneSmall = g_Gaia.stoneSmall;
const oMetalLarge = g_Gaia.metalLarge;
const oMetalSmall = g_Gaia.metalSmall;
const oFish = g_Gaia.fish;

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const g_Map = new RandomMap(0, tMainTerrain);

const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clLand = g_Map.createTileClass();
var clWater = g_Map.createTileClass();

const mapBounds = g_Map.getBounds();
const mapSize = g_Map.getSize();
const mapCenter = g_Map.getCenter();
const heightScale = num => num * g_MapSettings.Size / 320;
const minHeightSource = -16;
const maxHeightSource = 600;
var heightBase;

function placeMine(position, centerEntity,
	decorativeActors = [
		g_Decoratives.grass, g_Decoratives.grassShort,
		g_Decoratives.rockLarge, g_Decoratives.rockMedium,
		g_Decoratives.bushMedium, g_Decoratives.bushSmall
	]
)
{
	g_Map.placeEntityPassable(centerEntity, 0, position, randomAngle());

	let quantity = randIntInclusive(11, 23);
	let dAngle = 2 * Math.PI / quantity;
	for (let i = 0; i < quantity; ++i)
		g_Map.placeEntityPassable(
			pickRandom(decorativeActors),
			0,
			Vector2D.add(position, new Vector2D(randFloat(2, 5), 0).rotate(-dAngle * randFloat(i, i + 1))),
			randomAngle());
}

initTileClasses("shoreline");
var clShoreline = g_TileClasses.shoreline;

g_Map.log("Loading hill heightmap");
createArea(
	new MapBoundsPlacer(),
	new HeightmapPainter(
		translateHeightmap(
			new Vector2D(0, scaleByMapSize(0, 0)),
			// new Vector2D(-12, scaleByMapSize(-12, -25)),
			undefined,
			convertHeightmap1Dto2D(Engine.LoadMapTerrain("maps/skirmishes/cliffs_of_carnage_6p.pmp").height)),
		minHeightSource,
		maxHeightSource));

const heightSeaGround = heightScale(-4);
const heightReedsMin = heightScale(-2);
const heightReedsMax = heightScale(-0.5);
const heightWaterLevel = heightScale(0);
const heightShoreline = heightScale(0.5);

const fruit = [oFruitBush, oGrapes, oApples];

g_Map.log("Marking water");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(clWater),
	new HeightConstraint(-Infinity, heightWaterLevel));

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(clLand),
	avoidClasses(clWater, 0));

g_Map.log("Painting shoreline");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.water),
		new TileClassPainter(clShoreline)
	],
	new HeightConstraint(-Infinity, heightShoreline));
Engine.SetProgress(30);

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.cliff),
		new TileClassPainter(clHill),
	],
	[
		avoidClasses(clShoreline, 0),
		new SlopeConstraint(2, Infinity)
	]);

Engine.SetProgress(35);

g_Map.log("Placing players");
placePlayerBases({
	"PlayerPlacement": playerPlacementRiver(Math.PI/2, fractionToTiles(.75)),
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"Walls": false,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"StartingAnimal": {
			"template": randBool() ? oPig : oSheep,
			"count": randIntInclusive(5,20)
	},
	"Berries": {
		"template": fruit[randIntInclusive(0, fruit.length - 1)], "count": randIntInclusive(1,4)
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
Engine.SetProgress(40);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clWater, 5, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clWater, 5, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(45);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(
		clPlayer, scaleByMapSize(18, 32),
		clMetal, randIntInclusive(8,12),
		clHill, 1,
		clWater, 12, // This is what's used to keep the resources off the ramps near the corner lakes
		clShoreline, 6,
		// count (multiplier; default is 1)
		)
	);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clPlayer, scaleByMapSize(18, 32),
		clHill, 1,
		clRock, randIntInclusive(8,12),
		clMetal, randIntInclusive(4,8),
		clWater, 12,
		clShoreline, 6,
		// count (multiplier)
		)
	);
Engine.SetProgress(50);

g_Map.log("Establishing forests");
var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clWater, 5, clPlayer, scaleByMapSize(20, 35), clForest, randIntInclusive(10,14), clHill, 5,
	clRock, 1,
	clMetal, 1
	),
 clForest,
 forestTrees);
Engine.SetProgress(60);

var planetm = 1;

if (currentBiome() == "generic/tropic")
	planetm = 8;

g_Map.log("Creating adornments");
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
	avoidClasses(clWater, 5, clForest, 0, clPlayer, 0, clHill, 0));

Engine.SetProgress(70);

g_Map.log("Populating with food");
createFood(
	[
		[new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)],
		[new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)],
		[new SimpleObject(fruit[randIntInclusive(0, fruit.length - 1)], 5, 7, 0, 4)]
	],
	[
		3 * numPlayers,
		3 * numPlayers,
		randIntInclusive(1,4) * numPlayers,
	],
	avoidClasses(clWater, 6, clForest, 0, clPlayer, scaleByMapSize(23, 38), clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);
Engine.SetProgress(75);

g_Map.log("Creating stragglers (trees)");
createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(
		clWater, 5,
		clForest, 8,
		clHill, 5,
		clPlayer, 12,
		clMetal, 1,
		clRock, 1,
		clFood, 1),
	clForest,
	stragglerTrees
	);

g_Map.log("Creating fish");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oFish, 1, 1, 0, 1)], true, clFood),
	0,
	[
		avoidClasses(clFood, 2),
		stayClasses(clWater, 2),
		new HeightConstraint(-Infinity, heightWaterLevel)
	],
	scaleByMapSize(8, 32));

// slightly modified from the function in maps/random/rmgen-common/player.js
function placePlayersNomad_cm2(playerClass, constraints)
{
	if (!isNomad())
		return undefined;

	g_Map.log("Placing nomad starting units");

	let distance = scaleByMapSize(60, 240);
	let constraint = new StaticConstraint(constraints);

	let numPlayers = getNumPlayers();
	let playerIDs = shuffleArray(sortAllPlayers());
	let playerPosition = [];

	for (let i = 0; i < numPlayers; ++i)
	{
		let objects = getStartingEntities(playerIDs[i]).filter(ents => ents.Template.startsWith("units/")).map(
			ents => new SimpleObject(ents.Template, ents.Count || 1, ents.Count || 1, 1, 4));

		// This works, but what's the *correct* way?
		objects.push(new SimpleObject("skirmish/units/default_support_female_citizen", 16, 16, 1, 5));

		// warn(uneval(objects));

		// Add treasure if too few resources for a civic center
		let ccCost = Engine.GetTemplate("structures/" + getCivCode(playerIDs[i]) + "/civil_centre").Cost.Resources;
		for (let resourceType in ccCost)
		{
			let treasureTemplate = g_NomadTreasureTemplates[resourceType];

			let count = Math.max(0, Math.ceil(
				(ccCost[resourceType] - (g_MapSettings.StartingResources || 0)) /
				Engine.GetTemplate(treasureTemplate).Treasure.Resources[resourceType]));

			objects.push(new SimpleObject(treasureTemplate, count, count, 3, 5));
		}

		// Try place these entities at a random location
		let group = new SimpleGroup(objects, true, playerClass);
		let success = false;
		for (let distanceFactor of [1, 1/2, 1/4, 0])
			if (createObjectGroups(group, playerIDs[i], new AndConstraint([constraint, avoidClasses(playerClass, distance * distanceFactor)]), 1, 200, false).length)
			{
				success = true;
				playerPosition[i] = group.centerPosition;
				break;
			}

		if (!success)
			throw new Error("Could not place starting units for player " + playerIDs[i] + "!");
	}

	return [playerIDs, playerPosition];
}

heightBase = heightScale(48);

g_Map.log("Forming waterfall");
const clWaterfall = g_Map.createTileClass();
const waterfallGroup = new SimpleGroup(
	[new SimpleObject("actor|particle/waterfall_top.xml", 5, 12, 0, 1)], false, clWaterfall);
		createObjectGroups(waterfallGroup, 0,
	[
		avoidClasses(clWaterfall, 0),
		new HeightConstraint(heightBase, Infinity),
	],
	scaleByMapSize(30, 270), // amount
	Infinity, // retry factor
	);

placePlayersNomad_cm2(clPlayer, avoidClasses(clWater, 5, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setWaterHeight(heightWaterLevel + SEA_LEVEL);
setWaterColor(0.089,0.157,0.212);
setWaterTint(0.089, 0.157,0.212);
setWaterWaviness(randIntInclusive(2, 8));
setWaterMurkiness(0.90);
setWaterType("lake");

g_Map.ExportMap();

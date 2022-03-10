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
			convertHeightmap1Dto2D(Engine.LoadMapTerrain("maps/skirmishes/Cliffs_of_Carnage_4v4_8p.pmp").height)),
		minHeightSource,
		maxHeightSource));

const heightSeaGround = heightScale(-4);
const heightReedsMin = heightScale(-2);
const heightReedsMax = heightScale(-0.5);
const heightWaterLevel = heightScale(0);
const heightShoreline = heightScale(0.5);

g_Map.log("Lowering sea ground");
createArea(
	new MapBoundsPlacer(),
	new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 2),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(20);

g_Map.log("Smoothing heightmap");
createArea(
	new MapBoundsPlacer(),
	new SmoothingPainter(1, scaleByMapSize(0.1, 0.5), 1));
Engine.SetProgress(25);

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
		avoidClasses(clWater, 2),
		new SlopeConstraint(2, Infinity)
	]);

Engine.SetProgress(35);

placePlayerBases({
	"PlayerPlacement": playerPlacementRiver(Math.PI/2, fractionToTiles(.75)),
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"Walls": false,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"Chicken": {
			"template": oPig
	},
	"Berries": {
		"template": oFruitBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge },
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

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clWater, 5, clPlayer, scaleByMapSize(20, 35), clForest, randIntInclusive(10,14), clHill, 5),
 clForest,
 forestTrees);
Engine.SetProgress(50);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clMetal, randIntInclusive(8,12), clPlayer, scaleByMapSize(23, 38), clHill, 2, clWater, 4),
	scaleByMapSize(1, 3), // counts, // counts (multiplier)
	randFloat(0.05, 0.15) // randomness
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clPlayer, scaleByMapSize(23, 38), clHill, 2, clRock, randIntInclusive(8,12), clMetal, randIntInclusive(4,8), clWater, 4),
	scaleByMapSize(1, 3), // counts
	randFloat(0.05, 0.15) // randomness
);

Engine.SetProgress(60);

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
	avoidClasses(clWater, 5, clForest, 0, clPlayer, 0, clHill, 0));

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
	avoidClasses(clWater, 20, clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);
Engine.SetProgress(75);

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
	stragglerTrees);

g_Map.log("Creating fish");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oFish, 1, 1, 0, 1)], true, clFood),
	0,
	[
		avoidClasses(clFood, 10),
		stayClasses(clWater, 4),
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


placePlayersNomad_cm2(clPlayer, avoidClasses(clWater, 5, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setWaterHeight(heightWaterLevel + SEA_LEVEL);
setWaterColor(0.100,0.149,0.237);
setWaterTint(0.100, 0.149,0.237);
setWaterWaviness(randIntInclusive(2, 8));
setWaterMurkiness(.67);
setWaterType("lake");

g_Map.ExportMap();

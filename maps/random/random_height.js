// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("rmgen-helpers");

setSelectedBiome();

const heightScale = num => num * g_MapSettings.Size / 320;
const heightLand =  heightScale(0);
const heightRavineValley = heightScale(heightLand - 28);
const heightRavineHill = heightScale(heightLand + 10);

function createBasesMainland(playerIDs, playerPosition, walls)
{
	for (let i = 0; i < getNumPlayers(); ++i)
	{
		placePlayerBase({
			"playerID": playerIDs[i],
			"playerPosition": playerPosition[i],
			"PlayerTileClass": clPlayer,
			"BaseResourceClass": clBaseResource,
			"Walls": false,
			"CityPatch": {
				"outerTerrain": tRoadWild,
				"innerTerrain": tRoad
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
	}

	return [playerIDs, playerPosition];
}

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
const aCeltHomestead = "actor|structures/celts/homestead.xml";
const aCeltHouse = "actor|structures/celts/house.xml";
const aCeltLongHouse = "actor|structures/celts/longhouse.xml";

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

var g_Map = new RandomMap(heightLand, tMainTerrain);
var mapBounds = g_Map.getBounds();
var mapCenter = g_Map.getCenter();
const playerBaseRadius = defaultPlayerBaseRadius() / (isNomad() ? 1.5 : 1);
const numPlayers = getNumPlayers();

var clPlayer = g_Map.createTileClass();
var clPlayerTerritory = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clHillDeco = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

var playerPosition = [];
if (!isNomad())
{
	let pattern = g_MapSettings.TeamPlacement || pickRandom(Object.keys(g_PlayerbaseTypes));
	var [playerIDs, playerPosition] = createBasesByPattern(
		pattern,
		g_PlayerbaseTypes[pattern].distance,
		g_PlayerbaseTypes[pattern].groupedDistance,
		randomAngle(),
		createBasesMainland);
}

Engine.SetProgress(20);

g_Map.log("Generating random heights");
for (let i = 0; i < 100; i++)
{
	let centerPosition = new Vector2D(
		randIntInclusive (mapBounds.left, mapBounds.right),
		randIntInclusive (mapBounds.top, mapBounds.bottom)
		);
	let size = randFloat(1, scaleByMapSize(10, 30));
	let coherence = randFloat(0.35, 0.85); // How much the radius of the clump varies (1 = circle, 0 = very random).
	let smoothness = randFloat(0.1, 1); // How smooth the border of the clump is (1 = few "peaks", 0 = very jagged).
	let height = randFloat(heightScale(-15), heightScale(40));
	let blendRadius = randFloat(size * 1.5, size * 2);

	createArea(
		new ClumpPlacer(diskArea(size), coherence, smoothness , Infinity, centerPosition),
		new SmoothElevationPainter(ELEVATION_MODIFY, height , blendRadius),
		avoidClasses(clPlayer, playerBaseRadius * 1.2));
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

g_Map.log("Creating ravines");
var loop_num = 0;
for (let size of [scaleByMapSize(50, 800), scaleByMapSize(50, 400), scaleByMapSize(10, 30), scaleByMapSize(10, 30)])
{
	warn(uneval(loop_num));
	loop_num++;
	let ravine = createAreas(
		new ClumpPlacer(size, 0.1, 0.2, 0.1),
		[
			new LayeredPainter([tCliff, tForestFloor1], [2]),
			new SmoothElevationPainter(ELEVATION_SET, heightRavineValley, 2),
			new TileClassPainter(clHill)
		],
		avoidClasses(clPlayer, playerBaseRadius * 2),
		scaleByMapSize(1, 3));

	if (size > 150 && ravine.length)
	{
		g_Map.log("Placing huts in ravines");
		createObjectGroupsByAreasDeprecated(
			new RandomGroup(
				[
					new SimpleObject(aCeltHouse, 0, 1, 4, 5),
					new SimpleObject(aCeltLongHouse, 1, 1, 4, 5)
				],
				true,
				clHillDeco),
			0,
			[avoidClasses(clHillDeco, 3), stayClasses(clHill, 3)],
			ravine.length * 5, 20,
			ravine);

		createObjectGroupsByAreasDeprecated(
			new RandomGroup([new SimpleObject(aCeltHomestead, 1, 1, 1, 1)], true, clHillDeco),
			0,
			[avoidClasses(clHillDeco, 5), stayClasses(clHill, 4)],
			ravine.length * 2, 100,
			ravine);

		// Place noise
		createAreasInAreas(
			new ClumpPlacer(size * 0.3, 0.94, 0.05, 0.1),
			[
				new LayeredPainter([tCliff, tForestFloor1], [2]),
				new SmoothElevationPainter(ELEVATION_SET, heightRavineValley, 2)
			],
			[avoidClasses(clHillDeco, 2), stayClasses(clHill, 0)],
			ravine.length * 2,
			20,
			ravine);

		createAreasInAreas(
			new ClumpPlacer(size * 0.1, 0.3, 0.05, 0.1),
			[
				new LayeredPainter([tCliff, tForestFloor1], [2]),
				new SmoothElevationPainter(ELEVATION_SET, heightRavineHill, 2),
				new TileClassPainter(clHill)
			],
			[avoidClasses(clHillDeco, 2), borderClasses(clHill, 15, 1)],
			ravine.length * 2,
			50,
			ravine);
	}
}

//g_Map.log("Flatten the initial CC area");
//for (let i = 0; i < 4; i++)
//{
	//for (let position of playerPosition)
	//{
		//let size = playerBaseRadius * 1.6;
		//createArea(
			//new ClumpPlacer(diskArea(size), 1, 1, Infinity, position),
			//new SmoothElevationPainter(ELEVATION_SET, heightLand, size * 1.5)
			//);
	//}
//}

//g_Map.log("Painting cliffs");
//createArea(
	//new MapBoundsPlacer(),
	//[
		//new TerrainPainter(g_Terrains.cliff),
		//new TileClassPainter(clHill),
	//],
	//[
		//new SlopeConstraint(1, Infinity)
	//]);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createDefaultForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	avoidClasses(clPlayer, playerBaseRadius * 1.5, clForest, 18, clHill, 5),
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
	avoidClasses(clForest, 1, clPlayer, playerBaseRadius * 1.5, clHill, 6)
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clForest, 1, clPlayer, playerBaseRadius * 1.5, clHill, 6, clMetal, 10)
);

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
	avoidClasses(clForest, 0, clPlayer, 0, clHill, 0));

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
	avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(clForest, 8, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
	clForest,
	stragglerTrees);

placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setWaterHeight(heightLand - 20);

g_Map.ExportMap();

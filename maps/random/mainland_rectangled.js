// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");

setSelectedBiome();
const bArctic = (currentBiome() == "generic/arctic");

// replaces code on Mainland-type maps to generate both hills and mountains,
// rather than what's used on vanilla mainland (using randbool to decide
// one or the other)
function createHillsAndMountains (hillCount, mountainCount, constraint)
{
	createHills([tCliff, tCliff, tHill],
			constraint,
			clHill,
			hillCount / 2),
	createMountains(tCliff,
		constraint,
		clHill,
		//scaleByMapSize(3, 15)); // count
		mountainCount / 2)
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
const oSheep = "gaia/fauna_sheep";
const oFish = g_Gaia.fish;
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

const heightSeaGround = 0.05;
const heightShore = 0.4;
const heightLand = 0.6;

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
var clRavine = g_Map.createTileClass();
var clShoreline = g_Map.createTileClass();

const mapBounds = g_Map.getBounds();
var startAngle = 0;
const mapCenter = g_Map.getCenter();
const RAVINE_WIDTH = 0.15;

const isWaterMap = (g_MapSettings.mapName === "Yekaterinaville");
const heightRavine = heightLand - 20;
const heightRidge = heightLand + 8;

for (let x of [mapBounds.left, mapBounds.right])
	paintRiver({
		"parallel": true,
		"start": new Vector2D(x, mapBounds.top).rotateAround(startAngle, mapCenter),
		"end": new Vector2D(x, mapBounds.bottom).rotateAround(startAngle, mapCenter),
		"width": 2 * fractionToTiles(RAVINE_WIDTH),
		"fadeDist": 5,
		"deviation": 0,
		"heightRiverbed": (bArctic && isWaterMap) ? heightSeaGround + 0.1 : heightRavine,
		"heightLand": isWaterMap ? heightLand : heightRidge,
		"meanderShort": 8,
		"meanderLong": 10,
		"waterFunc": (position, height, z) => {
			clRavine.add(position);
		}
	});

var playerIDs = sortAllPlayers();
var playerPosition = playerPlacementArcs(
	playerIDs,
	mapCenter,
	fractionToTiles(0.35),
	startAngle,
	0.1 * Math.PI,
	0.9 * Math.PI);

placePlayerBases({
	"PlayerPlacement": [playerIDs, playerPosition],
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"Walls": g_Map.getSize() > 320,
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"StartingAnimal": {
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

if (isWaterMap && bArctic) {
	// Adapted from the Frozen Lakes biome of Gulf of Bothnia

	g_Map.log("Painting ice");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter("alpine_snow_01"),
		],
		[
			stayClasses(clRavine, 0),
		],
	);

	createAreas(
		new ChainPlacer(
			1,
			4,
			scaleByMapSize(16, 40),
			0.3),
		[
			new ElevationPainter(-6),
		],
		stayClasses(clRavine, 2),
		scaleByMapSize(10, 40)
	);

paintTerrainBasedOnHeight(heightShore, heightSeaGround, Elevation_ExcludeMin_ExcludeMax, "alpine_snow_02");
paintTerrainBasedOnHeight(-Infinity, heightShore, Elevation_ExcludeMin_IncludeMax, "alpine_ice_01");
}

if (isWaterMap) {
	const heightShore = heightLand - 0.5;
	g_Map.log("Painting shoreline");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter(g_Terrains.water),
			new TileClassPainter(clShoreline)
		],
		new HeightConstraint(-Infinity, heightShore));
}
else {
	g_Map.log("Smoothing ridge");
	createArea(
		new MapBoundsPlacer(),
		new SmoothingPainter(1, 0.2, 5),
		[
			new HeightConstraint(heightRidge * 0.4, heightRidge * 1.6)
		]);
}

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.cliff),
		new TileClassPainter(clHill),
	],
	[
		new SlopeConstraint(3, Infinity)
	],
	);


Engine.SetProgress(30);

createHillsAndMountains(
	scaleByMapSize(3 * randFloat(1, 3), 15 * randFloat(1, 2)),
	scaleByMapSize(3 * randFloat(1, 3), 15 * randFloat(1, 2)),
	avoidClasses(
		clPlayer, 20,
		clHill, 15,
		clRavine, 0
		)
	);

//if (bArctic && isWaterMap) {
	//const areas = createAreas(
		//new ChainPlacer(
			//1,
			//4,
			//scaleByMapSize(16, 40),
			//0.3),
		//[
			//new ElevationPainter(-6),
		//],
		//stayClasses(clRavine, 2),
		//scaleByMapSize(10, 40));

	//paintTerrainBasedOnHeight(heightShore, heightLand, Elevation_ExcludeMin_ExcludeMax, tShore);
	//paintTerrainBasedOnHeight(-Infinity, heightShore, Elevation_ExcludeMin_IncludeMax, tWater);
//}

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
	avoidClasses(
		clRavine, 2,
		clPlayer, 20,
		clForest, 18,
		clHill, 2,
		),
	clForest,
	forestTrees);

Engine.SetProgress(50);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
avoidClasses(
	clForest, 0,
	clHill, 1,
	clDirt, 5,
	clPlayer, 12
	),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(
	clForest, 0,
	clHill, 1,
	clDirt, 5,
	clPlayer, 12,
	),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(55);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clRavine, 2, clForest, 1, clPlayer, 20, clHill, 2),
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(
		clRavine, 2,
		clForest, 1,
		clPlayer, 20,
		clMetal, 10,
		clHill, 2,
		),
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
	avoidClasses(
		clForest, 0,
		clPlayer, 0,
		clHill, 3,
		)
	);

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
	avoidClasses(
		clRavine, 2,
		clForest, 0,
		clPlayer, 20,
		clHill, 2,
		clMetal, 4,
		clRock, 4,
		clFood, 20,
		),
	clFood);

Engine.SetProgress(75);

createFood(
	[
		[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
	],
	[
		3 * numPlayers
	],
	avoidClasses(
		clRavine, 2,
		clForest, 0,
		clPlayer, 20,
		clHill, 2,
		clMetal, 4,
		clRock, 4,
		clFood, 10,
		),
	clFood);

Engine.SetProgress(85);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(
		clForest, 8,
		clHill, 1,
		clPlayer, 12,
		clMetal, 6,
		clRock, 6,
		clFood, 1,
		clRavine, 2,
		),
	clForest,
	stragglerTrees);

if (isWaterMap && ! bArctic) {
	g_Map.log("Creating fish");
	createObjectGroups(
		new SimpleGroup([new SimpleObject(oFish, 1, 1, 0, 1)], true, clFood),
		0,
		[
			avoidClasses(clFood, 10),
			stayClasses(clRavine, 4),
			new HeightConstraint(-Infinity, heightLand)
		],
		scaleByMapSize(8, 32));
}

placePlayersNomad(
	clPlayer, avoidClasses(
		clForest, 1,
		clMetal, 4,
		clRock, 4,
		clHill, 4,
		clFood, 2,
		)
	);

if (!isWaterMap)
	setWaterHeight(-Infinity);

setWaterType("lake");
if (!bArctic) {
	setWaterColor(0.024,0.262,0.224)
	setWaterTint(0.133, 0.325,0.255)
	setWaterMurkiness(.93);
	setWaterWaviness(randIntInclusive(2, 8));
}
else {
	setWaterColor(1, 1, 1)
	setWaterWaviness(2);
	setWaterTint(0.471, 0.75, 0.501961)
	setWaterMurkiness(.97);
}

g_Map.ExportMap();

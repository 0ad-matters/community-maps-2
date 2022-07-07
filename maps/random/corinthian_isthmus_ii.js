// modified Corinthian Isthmus skirmish map
// License: GPL2
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
const startAngle = 0.05 * Math.PI;
const mapSize = g_Map.getSize();
const mapCenter = g_Map.getCenter();
const heightScale = num => num * g_MapSettings.Size / 320;
const minHeightSource = -15;
const maxHeightSource = 400;
const mineDistToCC = scaleByMapSize(22, 35);
const mediumMapSize = 320;

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

initTileClasses(["shoreline", "isthmus"]);
var clShoreline = g_TileClasses.shoreline;
var clIsthmus = g_TileClasses.isthmus;

g_Map.log("Loading hill heightmap");
createArea(
	new MapBoundsPlacer(),
	new HeightmapPainter(
		translateHeightmap(
			new Vector2D(0, scaleByMapSize(0, 0)),
			// new Vector2D(-12, scaleByMapSize(-12, -25)),
			undefined,
			convertHeightmap1Dto2D(Engine.LoadMapTerrain("maps/skirmishes/corinthian_isthmus_4p.pmp").height)),
		minHeightSource,
		maxHeightSource));

const heightSeaGround = heightScale(-4);
const heightReedsMin = heightScale(-2);
const heightReedsMax = heightScale(-0.5);
const heightWaterLevel = heightScale(0);
const heightShoreline = 0.5;

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


g_Map.log("Widening and marking the Isthmus");
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
	new ClumpPlacer(diskArea(scaleByMapSize(6, 20)), 0.6, 0.6, Infinity, mapCenter),
	[
		new TileClassPainter(clIsthmus),
		new SmoothElevationPainter(ELEVATION_SET, heightWaterLevel + 5, 10)
	]);

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

var playerIDs = sortAllPlayers();
var playerPosition = playerPlacementArcs(
	playerIDs,
	mapCenter,
	fractionToTiles(0.30),
	startAngle - 0.75 * Math.PI,
	0.2 * Math.PI,
	0.9 * Math.PI);

const initBaseHeight = heightWaterLevel;
const heightHill = 25;
var playerHillRadius = defaultPlayerBaseRadius() / (isNomad() ? 1.5 : 1) * 1.2;
g_Map.log("Flatten the initial CC area");
for (let position of playerPosition)
{
	createArea(
		new ClumpPlacer(diskArea(playerHillRadius * 2), 0.85, 0.45, Infinity, position),
		new SmoothElevationPainter(ELEVATION_SET, initBaseHeight, 12));
}

// If the map is smaller than Medium size, don't place the large
// mines near the player's territory border. On maps that small, the
// chance of mines already being nearby is pretty high.
if (g_Map.size >= mediumMapSize)
{
	g_Map.log("Placing large mines for each player");
	for (let position of playerPosition)
	{
		placeMine(
			Vector2D.add(
				position,
				new Vector2D(mineDistToCC, 0)).rotateAround(position.angleTo(mapCenter)-Math.PI*0.44,
				position),
			oMetalLarge);
		placeMine(
			Vector2D.add(
				position,
				new Vector2D(mineDistToCC, 0)).rotateAround(position.angleTo(mapCenter)-Math.PI*0.56,
				position),
			oStoneLarge);
	}
}

g_Map.log("Creating player hills and ramps");
for (let position of playerPosition)
{
	createArea(
		// new ClumpPlacer(diskArea(playerHillRadius), 0.95, 0.6, Infinity, position),
		new ClumpPlacer(diskArea(playerHillRadius), 0.95, 0.1, Infinity, position),
		[
			new SmoothElevationPainter(ELEVATION_SET, heightHill, 2),
		]);

	let angle = position.angleTo(mapCenter) - Math.PI * 0.5;
	let distanceFromCC = playerHillRadius * 0.80;
	let distanceFromEdge = playerHillRadius / 8;
	createPassage({
		"start": Vector2D.add(position, new Vector2D(playerHillRadius + distanceFromEdge, 0).rotate(angle)),
		"end": Vector2D.add(position, new Vector2D(playerHillRadius - distanceFromCC, 0).rotate(angle)),
		"startWidth": 12,
		"endWidth": 20,
		"smoothWidth": 4,
	});

	createPassage({
		"start": Vector2D.add(position, new Vector2D(playerHillRadius + distanceFromEdge, 0).rotate(angle + Math.PI)),
		"end": Vector2D.add(position, new Vector2D(playerHillRadius - distanceFromCC, 0).rotate(angle + Math.PI)),
		"startWidth": 12,
		"endWidth": 20,
		"smoothWidth": 4,
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
		avoidClasses(clWater, 2),
		new SlopeConstraint(2, Infinity)
	]);

placePlayerBases({
	"PlayerPlacement": [playerIDs, playerPosition],
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"Walls": false,
	"CityPatch": {
	},
	"StartingAnimal": {
		"template": oPig
	},
	"Berries": {
		"template": oFruitBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalSmall },
			{ "template": oStoneSmall },
			// distance value is completely ignored
			// https://wildfiregames.com/forum/topic/60993-suggestion-players-should-not-start-with-5000-stone-and-5000-metal-right-next-to-their-cc/?do=findComment&comment=462533
			// { "template": oMetalLarge, "distance": defaultPlayerBaseRadius() * 1.5 },
			// { "template": oStoneLarge, "distance": defaultPlayerBaseRadius() * 1.5 }
		],
	},
	"Trees": {
		"template": oTree1,
		"count": 5
	},
	"Decoratives": {
		"template": aGrassShort
	}
});
Engine.SetProgress(35);

g_Map.log("Bumpifying");
createBumps(avoidClasses(clPlayer, 20, clWater, 1));

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

g_Map.log("Establishing forests");
var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clIsthmus, 2, clRock, 1, clMetal, 1, clWater, 2, clPlayer, scaleByMapSize(18, 30), clForest, 12, clHill, 3),
 clForest,
 forestTrees);
Engine.SetProgress(50);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clIsthmus, 1, clRock, 5, clMetal, 10, clPlayer, scaleByMapSize(23, 38), clHill, 1, clWater, 4)
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clIsthmus, 1, clPlayer, scaleByMapSize(23, 38), clHill, 2, clRock, 10, clMetal, 5, clWater, 5)
);
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
		clHill, 1,
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

placePlayersNomad(clPlayer, avoidClasses(clWater, 5, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

setWaterHeight(heightWaterLevel + SEA_LEVEL);
setWaterColor(0.120,0.125,0.221);
setWaterTint(0.120, 0.125,0.221);
setWaterWaviness(randIntInclusive(2, 8));
setWaterMurkiness(.93);
setWaterType("ocean");

g_Map.ExportMap();

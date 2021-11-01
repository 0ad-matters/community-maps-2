// modified Corinthian Isthmus skirmish map

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
const tRoad = g_Terrains.road;
const tRoadWild = g_Terrains.roadWild;
const tTier4Terrain = g_Terrains.tier4Terrain;
const tDirt = g_Terrains.dirt;

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

// var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clRoad = g_Map.createTileClass();

const mapBounds = g_Map.getBounds();
var startAngle = randBool() ? 0 : Math.PI / 2;
const mapCenter = g_Map.getCenter();
const heightScale = num => num * g_MapSettings.Size / 320;
const minHeightSource = -15;
const maxHeightSource = 400;
const mineDistToCC = defaultPlayerBaseRadius() * 1.8;

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

//function scaleByMapSize(min, max, minMapSize = 128, maxMapSize = 512)
	//{
		//return min + (max - min) * (g_MapSettings.Size - minMapSize) / (maxMapSize - minMapSize);
	//}

initTileClasses(["shoreline", "step"]);

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


g_Map.log("Widening the Isthmus");
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
createArea(
	new ClumpPlacer(diskArea(6), 0.0, 0.6, Infinity, mapCenter),
	new SmoothElevationPainter(ELEVATION_SET, heightWaterLevel + heightScale(8), 0));

g_Map.log("Marking water");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(g_TileClasses.water),
	new HeightConstraint(-Infinity, heightWaterLevel));

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(g_TileClasses.land),
	avoidClasses(g_TileClasses.water, 0));

g_Map.log("Painting shoreline");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.water),
		new TileClassPainter(g_TileClasses.shoreline)
	],
	new HeightConstraint(-Infinity, heightShoreline));
Engine.SetProgress(30);

	var baseRadius = 15;
	const heightOffsetPath = -0.1;
	const heightPath = -2.5;

if (!isNomad())
{
	g_Map.log("Placing players");
	//let [playerIDs, playerPosition] = createBases(
		//...playerPlacementRandom(
			//sortAllPlayers(),
			//[
				//avoidClasses(g_TileClasses.mountain, scaleByMapSize(5, 10)),
				//stayClasses(g_TileClasses.land, defaultPlayerBaseRadius())
			//]),
		//true);

// function playerPlacementArcs(playerIDs, center, radius, mapAngle, startAngle, endAngle)
// function playerPlacementMultiArcs(playerIDs, radius, mapAngle, teamGapFrac)
	var playerIDs = sortAllPlayers();
	var playerPosition = playerPlacementArcs(
	playerIDs,
	mapCenter,
	fractionToTiles(0.35),
	0.25 * Math.PI,
	0.2 * Math.PI,
	0.8 * Math.PI);

	const initBaseHeight = heightWaterLevel;
	const baseHeight = initBaseHeight + 24;
	const cliffEdgeRadius = defaultPlayerBaseRadius() * 1.2
	g_Map.log("Flatten the initial CC area");
	for (let position of playerPosition)
	{
		createArea(
			new ClumpPlacer(diskArea(defaultPlayerBaseRadius() * 2.2), 0.95, 0.6, Infinity, position),
			// new SmoothElevationPainter(ELEVATION_SET, g_Map.getHeight(position), 6));
			new SmoothElevationPainter(ELEVATION_SET, initBaseHeight, 12));

		placeMine(Vector2D.add(position, new Vector2D(defaultPlayerBaseRadius() * 1.7, 0)).rotateAround(position.angleTo(mapCenter)-Math.PI*0.45, position), oMetalLarge);
		placeMine(Vector2D.add(position, new Vector2D(mineDistToCC, 0)).rotateAround(position.angleTo(mapCenter)-Math.PI*0.55, position), oStoneLarge);
	}

	g_Map.log("Now raise the initial CC area");
	for (let position of playerPosition)
		createArea(
			new ClumpPlacer(diskArea(cliffEdgeRadius), 0.95, 0.6, Infinity, position),
			new SmoothElevationPainter(ELEVATION_SET, baseHeight, 2));

	const passageBlendRadius = 8;
	const passageHeight = baseHeight/2.0
	g_Map.log("Lower part of the cliff in front of each base to make a passage");
	for (let position of playerPosition)
	{
		createArea(
			new ClumpPlacer(diskArea(
				defaultPlayerBaseRadius() * 0.7),
				0.95, 0.6,
				Infinity,
				Vector2D.add(position,
				new Vector2D(cliffEdgeRadius,0)).rotateAround(position.angleTo(mapCenter)-Math.PI*0.5,
				position)),
			new SmoothElevationPainter(
				ELEVATION_SET,
				g_Map.getHeight(position) - passageHeight,
				passageBlendRadius));
	}

	g_Map.log("Lower part of the cliff in back of each base to make a passage");
	for (let position of playerPosition)
	{
		createArea(
			new ClumpPlacer(diskArea(
				defaultPlayerBaseRadius() * 0.7),
				0.95, 0.6,
				Infinity,
				Vector2D.add(position,
				new Vector2D(cliffEdgeRadius,0)).rotateAround(position.angleTo(mapCenter)+Math.PI*0.5,
				position)),
			new SmoothElevationPainter(
				ELEVATION_SET,
				g_Map.getHeight(position) - passageHeight,
				passageBlendRadius));
	}

	g_Map.log("Painting cliffs");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter(g_Terrains.cliff),
			new TileClassPainter(clHill),
		],
		[
			avoidClasses(g_TileClasses.water, 2),
			new SlopeConstraint(2, Infinity)
		]);

/**
 * function PathPlacer(start, end, width, waviness, smoothness, offset, tapering, failFraction = 0)
 * Creates a winding path between two points.
 *
 * @param {Vector2D} start - Starting position of the path.
 * @param {Vector2D} end - Endposition of the path.
 * @param {number} width - Number of tiles between two sides of the path.
 * @param {number} waviness - 0 is a straight line, higher numbers are.
 * @param {number} smoothness - the higher the number, the smoother the path.
 * @param {number} offset - Maximum amplitude of waves along the path. 0 is straight line.
 * @param {number} tapering - How much the width of the path changes from start to end.
 *   If positive, the width will decrease by that factor.
 *   If negative the width will increase by that factor.
 */

/**
 * function SmoothElevationPainter(type, elevation, blendRadius, randomElevation = 0)
 * Sets the elevation of the Area in dependence to the given blendRadius and
 * interpolates it with the existing elevation.
 *
 * @param type - ELEVATION_MODIFY or ELEVATION_SET.
 * @param elevation - target height.
 * @param blendRadius - How steep the elevation change is.
 * @param randomElevation - maximum random elevation difference added to each vertex.
 */

/**
 * function LayeredPainter(terrainArray, widths)
 * The LayeredPainter sets different Terrains within the Area.
 * It choses the Terrain depending on the distance to the border of the Area.
 *
 * The Terrains given in the first array are painted from the border of the area towards the center (outermost first).
 * The widths array has one item less than the Terrains array.
 * Each width specifies how many tiles the corresponding Terrain should be wide (distance to the prior Terrain border).
 * The remaining area is filled with the last terrain.
 */
	for (let position of playerPosition)
	{
		let relPos = Vector2D.sub(position, mapCenter);
		relPos = relPos.normalize().mult(scaleByMapSize(4,8));
		// Path from player to neighbor
		createArea(
			new PathPlacer(
				Vector2D.sub(position, relPos),
				mapCenter,
				1, // width // should we be using scaleByMapSize(?, ?) here?,
				0, // waviness
				20,
				0.1,
				-0.6),
			[
				new LayeredPainter([tRoad, tDirt, tRoad], [1, 3]),
				new SmoothElevationPainter(ELEVATION_MODIFY, heightPath, 4),
				new TileClassPainter(clRoad)
			],
			[
				// new NearTileClassConstraint(g_TileClasses.water, 0),
				// avoidClasses(g_TileClasses.water, 0)
				// stayClasses(g_TileClasses.land, 2)
			]);
	}

	placePlayerBases({
		"PlayerPlacement": [playerIDs, playerPosition],
		"PlayerTileClass": g_TileClasses.player,
		"BaseResourceClass": clBaseResource,
		"baseResourceConstraint": avoidClasses(clRoad, 0),
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
}

createBumps(avoidClasses(g_TileClasses.player, 20));

// Paint the cliffs again, overwriting any road paintings
	g_Map.log("Painting cliffs");
	createArea(
		new MapBoundsPlacer(),
		[
			new TerrainPainter(g_Terrains.cliff),
			new TileClassPainter(clHill),
		],
		[
			avoidClasses(g_TileClasses.water, 2),
			new SlopeConstraint(2, Infinity)
		]);

Engine.SetProgress(35);

g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[tMainTerrain,tTier1Terrain],[tTier1Terrain,tTier2Terrain], [tTier2Terrain,tTier3Terrain]],
 [1, 1],
 avoidClasses(clRoad, 0, g_TileClasses.water, 5, clForest, 0, clHill, 0, clDirt, 5, g_TileClasses.player, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 tTier4Terrain,
 avoidClasses(clRoad, 0, g_TileClasses.water, 5, clHill, 0, clDirt, 5, g_TileClasses.player, 12),
 scaleByMapSize(15, 45),
 clDirt);
Engine.SetProgress(45);

g_Map.log("Creating metal mines");
createBalancedMetalMines(
	oMetalSmall,
	oMetalLarge,
	clMetal,
	avoidClasses(clRoad, 1, g_TileClasses.player, scaleByMapSize(20, 35), clHill, 1, g_TileClasses.water, 4)
);

g_Map.log("Creating stone mines");
createBalancedStoneMines(
	oStoneSmall,
	oStoneLarge,
	clRock,
	avoidClasses(clRoad, 1, g_TileClasses.player, scaleByMapSize(20, 35), clHill, 2, clMetal, 0, g_TileClasses.water, 5)
);

Engine.SetProgress(50);

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
createForests(
 [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
 avoidClasses(clRock, 1, clMetal, 1, clRoad, 1, g_TileClasses.water, 5, g_TileClasses.player, 20, clForest, 18, clHill, 2),
 clForest,
 forestTrees);
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
	avoidClasses(clRoad, 1, g_TileClasses.water, 5, clForest, 0, g_TileClasses.player, 0, clHill, 0));

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
	avoidClasses(clRoad, 1, g_TileClasses.water, 20, clForest, 0, g_TileClasses.player, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
	clFood);
Engine.SetProgress(75);

createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3],
	avoidClasses(
		clRoad, 1,
		g_TileClasses.water, 5,
		clForest, 8,
		clHill, 1,
		g_TileClasses.player, 12,
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
		stayClasses(g_TileClasses.water, 4),
		new HeightConstraint(-Infinity, heightWaterLevel)
	],
	scaleByMapSize(8, 32));

placePlayersNomad(g_TileClasses.player, avoidClasses(g_TileClasses.water, 5, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

// setWaterHeight(heightWaterLevel);
setWaterHeight(heightWaterLevel + SEA_LEVEL);
setWaterColor(0.100,0.149,0.237);
setWaterTint(0.100, 0.149,0.237);

g_Map.ExportMap();

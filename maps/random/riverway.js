Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("heightmap");

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
const tShore = g_Terrains.shore;
const tWater = g_Terrains.water;

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
const oTreasure = ["food_barrel", "food_bin", "wood", "metal", "stone"].map(v => tWater + TERRAIN_SEPARATOR + "gaia/treasure/" + v);
const oFemale = "units/gaul/support_female_citizen";
const oHealer = "units/gaul/support_healer_b";
const oSkirmisher = "units/gaul/infantry_javelineer_b";
const oNakedFanatic = "units/gaul/champion_fanatic";
const oGoat = "gaia/fauna_goat";

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;
const aBench = "actor|props/special/eyecandy/bench_1";
const aRug = "actor|props/special/eyecandy/rug_stand_iber";
const aCampfire = "actor|props/special/eyecandy/campfire";

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

const heightLand = 0;
var g_Map = new RandomMap(heightLand, tMainTerrain);

initTileClasses(["bluffsPassage"]);

const centerPos = g_Map.getCenter();
const mapSize = g_Map.size;

var clPlayer = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clRiver = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clTreasure = g_Map.createTileClass();

var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));

function linearInterpolation(min, max, t)
{
	return min + (max - min) * t;
}

function bezier_quadratic(p0, p1, p2, t)
{
	const t1 = 1.0 - t;
	return p0 * t1 * t1 + p1 * 2 * t1 * t + p2 * t * t;
}

function valueRanges(t, values, ranges)
{
	for (let i = 0; i < ranges.length; i++)
	{
		if(t < ranges[i]) return values[i];
	}
	return values[values.length - 1];
}

var ritualParticipants = [
	{
		"radius": 0.6,
		"templates": [oFemale],
		"count": 9,
		"angle": Math.PI
	},
	{
		"radius": 0.95,
		"templates": [oSkirmisher, oNakedFanatic],
		"count": 25,
		"angle": Math.PI
	},	{
		"radius": 0.7,
		"templates": [oHealer],
		"count": 6,
		"angle": Math.PI
	},
	{
		"radius": 1,
		"templates": [aBench],
		"count": 10,
		"angle": Math.PI / 2
	},
	{
		"radius": 1.1,
		"templates": [oGoat],
		"count": 7,
		"angle": 0
	},
	{
		"radius": 1.2,
		"templates": [aRug],
		"count": 8,
		"angle": Math.PI
	}
];

function addGaiaRitual(center, radius)
{

	new createArea(
		new DiskPlacer(10, center), [
			new TerrainPainter(oTreasure),
			new TileClassPainter(clForest)

		], [
			new DensityConstraint(new DensityRadius(
				center,
				radius,
				(t, h) => valueRanges(t, [0, 0.9, 0, 0.15, 0], [0.3, 0.4, 0.8, 0.9])
			))
		]
	);

	g_Map.placeEntityAnywhere(aCampfire, 0, center, randomAngle());

	for (const participants of ritualParticipants)
	{
		const [positions, angles] = distributePointsOnCircle(participants.count, 0, participants.radius * radius, center);
		for (let i = 0; i < positions.length; ++i)
			g_Map.placeEntityPassable(pickRandom(participants.templates), 0, positions[i], angles[i] + participants.angle);
	}
}

function playerPlacementCircleCustom(radius, startingAngle = undefined, center = undefined)
{
	const numPlayers = getNumPlayers();
	const numPlayersEachSide = Math.ceil(numPlayers / 2);
	const angleEachSide = Math.PI * 0.6;
	const angleStep = angleEachSide / (numPlayersEachSide + 1);
	const playerPosition = [];
	const playerAngle = [];
	for (let i = 1; i < numPlayersEachSide + 1; i++)
	{
		const angle = (Math.PI - angleEachSide) / 2 + angleEachSide * i / (numPlayersEachSide + 1);
		playerPosition.push(new Vector2D(0, radius).rotate(angle).add(centerPos));
		playerAngle.push(angle);

	}
	for (let i = 1; i < numPlayersEachSide + 1; i++)
	{
		const angle = (Math.PI - angleEachSide) / 2 + angleEachSide * i / (numPlayersEachSide + 1);
		playerPosition.push(new Vector2D(0, radius).rotate(-angle).add(centerPos));
		playerAngle.push(-angle);

	}

	return [sortAllPlayers(), playerPosition.map(p => p.round()), playerAngle, 0];
}

placePlayerBases(
	{
		"PlayerPlacement": playerPlacementCircleCustom(fractionToTiles(0.35)),
		"PlayerTileClass": clPlayer,
		"BaseResourceClass": clBaseResource,
		"CityPatch":
	{
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
		"StartingAnimal":
	{},
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
		"Trees":
	{
		"template": oTree1,
		"count": 5
	},
		"Decoratives":
	{
		"template": aGrassShort
	}
	});

var stonesGroup = new SimpleGroup([
	new SimpleObject("actor|geology/gray1.xml", 1, 2, 1, 4),
	new SimpleObject("actor|geology/gray_rock1.xml", 1, 2, 1, 4),
	new SimpleObject("actor|geology/highland1.xml", 1, 2, 1, 4),
	new SimpleObject("actor|geology/highland1_moss.xml", 1, 2, 1, 4),
	new SimpleObject("actor|geology/highland2.xml", 1, 2, 1, 5),
	new SimpleObject("actor|geology/highland2_moss.xml", 1, 2, 1, 5),
	new SimpleObject("actor|geology/highland3.xml", 1, 2, 1, 4),
	new SimpleObject("actor|geology/highland_c.xml", 1, 2, 1, 4),
	new SimpleObject("actor|geology/highland_d.xml", 1, 2, 1, 5),
	new SimpleObject("actor|geology/highland_e.xml", 1, 2, 1, 4)
]);

var stoneMineral = new SimpleGroup([
	new SimpleObject(oStoneLarge, 1, 1, 3, 6),
	new SimpleObject(oStoneSmall, 2, 4, 1, 3)
]);

var metalMineral = new SimpleGroup([
	new SimpleObject(oMetalLarge, 1, 1, 3, 6),
	new SimpleObject(oMetalSmall, 2, 4, 1, 3)
]);

Engine.SetProgress(10);
g_Map.log("Making river");
const river = {};
river.width = 26;
river.startPos = new Vector2D(mapSize / 2, -10);
river.endPos = new Vector2D(mapSize / 2, mapSize + 10);
river.depth = -1;
river.smoothing = 4;

const riverArea = createArea(
	new PathPlacer(river.startPos, river.endPos, river.width, 0.15, 0.8, 0.1, 0), [
		new SmoothElevationPainter(ELEVATION_SET, river.depth, river.depth),
		new TileClassPainter(clRiver)
	]
);

Engine.SetProgress(15);
g_Map.log("Making bumps");
createBumps(new HeightConstraint(-Infinity, 0), 100, undefined, undefined, undefined, 0, -river.depth);

Engine.SetProgress(20);
g_Map.log("Making passage");
const riverDis = new Vector2D(river.width / 2, 0).mult(0.6);
const passageArea = new createArea(
	new PathPlacer(new Vector2D(0, mapSize / 2), new Vector2D(mapSize, mapSize / 2), 7, 0.4, 1.0, 0.1, 0, Infinity), [
		new SmoothElevationPainter(ELEVATION_SET, 0, 1),
		new TerrainPainter(tRoadWild),
		new TileClassPainter(g_TileClasses.forest)

	], [
		new HeightConstraint(-0.2, Infinity)
	]);

Engine.SetProgress(25);
g_Map.log("Making bluffs");
const bluffs = {};
bluffs.constraints = [
	new HeightConstraint(0, Infinity),
	new BorderTileClassConstraint(clRiver, 5, 35),
	new AvoidAreasConstraint([passageArea])
];
bluffs.size = 0.6;
bluffs.sizeDeviation = 0.2;
bluffs.areaFill = 4;
bluffs.baseHeight = 0;

addBluffs(bluffs.constraints, bluffs.size, bluffs.sizeDeviation, bluffs.areaFill, bluffs.baseHeight);

Engine.SetProgress(40);
g_Map.log("Making bluffs");
const riverTrees = {};
riverTrees.width = 40 * scaleByMapSize(1, 3);
riverTrees.density = (t, h) => linearInterpolation(bezier_quadratic(0.0, 1.3, 0.05, (1 - t) * (1 - t) * (1 - t)), 0, h / 15) * 0.6;
riverTrees.placerLeft = new RectPlacer(new Vector2D(mapSize / 2, mapSize).add(riverDis), new Vector2D(mapSize / 2, 0).add(riverDis).add(new Vector2D(riverTrees.width, 0)));
riverTrees.placerRight = new RectPlacer(new Vector2D(mapSize / 2, mapSize).sub(riverDis), new Vector2D(mapSize / 2, 0).sub(riverDis).sub(new Vector2D(riverTrees.width, 0)));
riverTrees.painters = [
	new TerrainPainter(pForest1),
	new TileClassPainter(clForest)
];
riverTrees.constraints = [
	new avoidClasses(clForest, 1),
	new HeightConstraint(-0.1, Infinity),
	new SlopeConstraint(0, 1.5),
	new AvoidAreasConstraint([passageArea])
];

Engine.SetProgress(45);
g_Map.log("Making trees left side");
const treesLeftArea = new createArea(
	riverTrees.placerLeft,
	riverTrees.painters, [
		...riverTrees.constraints,
		new DensityConstraint(new DensityDirection(
			centerPos.clone().add(riverDis),
			new Vector2D(-1, 0),
			riverTrees.width,
			riverTrees.density
		))
	]
);

Engine.SetProgress(50);
g_Map.log("Making trees right side");
const treesRightArea = new createArea(
	riverTrees.placerRight,
	riverTrees.painters, [
		...riverTrees.constraints,
		new DensityConstraint(new DensityDirection(
			centerPos.clone().sub(riverDis),
			new Vector2D(1, 0),
			riverTrees.width,
			riverTrees.density
		))
	]
);

const treesAreas = [treesLeftArea, treesRightArea];

Engine.SetProgress(55);
g_Map.log("Painting water and shoreline");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tShore), [
		new HeightConstraint(-0.6, -0.01),
		new SlopeConstraint(0, 1)
	]);

createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tWater), [
		new HeightConstraint(-Infinity, -0.5),
		new SlopeConstraint(0, 1)
	]);

Engine.SetProgress(60);
g_Map.log("Placing minerals");

createObjectGroupsByAreas(stonesGroup, 0, [], 40, 20, [riverArea]);

createObjectGroupsByAreas(stoneMineral, 0, [
	new HeightConstraint(-0.5, Infinity),
	new SlopeConstraint(0, 2)
], scaleByMapSize(10, 35), 200, [riverArea]);

createObjectGroupsByAreas(metalMineral, 0, [
	new HeightConstraint(-0.1, Infinity),
	new SlopeConstraint(0, 2)
], scaleByMapSize(5, 35), 200, treesAreas);

Engine.SetProgress(70);
g_Map.log("Calculating areas");
const noRiverForestArea = new createArea(
	new MapBoundsPlacer(), [], [
		new AvoidTileClassConstraint(clRiver, riverTrees.width * 0.7)
	]
);

const gaia = {};
gaia.constraints = [
	new StayAreasConstraint([noRiverForestArea]),
	new AvoidTileClassConstraint(clPlayer, 5)
];

gaia.settings = [
	2 * scaleByMapSize(1, 1.4),
	1 * scaleByMapSize(0.1, 0.4),
	0.4 * scaleByMapSize(1, 1.4)
];

Engine.SetProgress(70);
g_Map.log("Adding addHills");
addHills(gaia.constraints, ...gaia.settings);

Engine.SetProgress(73);
g_Map.log("Adding addLayeredPatches");
addLayeredPatches(gaia.constraints, 1.3, 0.15, 0.4);

Engine.SetProgress(76);
g_Map.log("Adding addDecoration");
addDecoration(gaia.constraints, ...gaia.settings);

Engine.SetProgress(79);
g_Map.log("Adding addProps");
addProps(gaia.constraints, 0.2, 0.05, 0.1);

Engine.SetProgress(82);
g_Map.log("Adding addPlateaus");
addPlateaus(gaia.constraints, 0.6, 0.05, 0.4);

Engine.SetProgress(85);
g_Map.log("Adding addStragglerTrees");
addStragglerTrees(gaia.constraints, ...gaia.settings);

Engine.SetProgress(89);
g_Map.log("Adding addAnimals");
addAnimals(gaia.constraints, 1, 0.2, 0.3);

Engine.SetProgress(92);
g_Map.log("Adding addBerries");
addBerries(gaia.constraints, 1, 0, 0.2);

Engine.SetProgress(95);
g_Map.log("Adding treasures and gaia rituals");
const treasuresSettings = {};
treasuresSettings.radius = 10;
treasuresSettings.posTop = new Vector2D(mapSize / 2, treasuresSettings.radius + 4);
treasuresSettings.posBottom = new Vector2D(mapSize / 2, mapSize - treasuresSettings.radius - 4);

addGaiaRitual(treasuresSettings.posTop, treasuresSettings.radius);
addGaiaRitual(treasuresSettings.posBottom, treasuresSettings.radius);

Engine.SetProgress(98);
g_Map.log("Finishing");
placePlayersNomad(g_Map.createTileClass());

setWaterWaviness(5);
setWindAngle(Math.PI / 2);

g_Camera = {
	"Position":
	{
		"x": g_Map.size / 0.523599,
		"y": 0,
		"z": g_Map.size / 0.523599
	},
	"Rotation": 0,
	"Declination": 0.523599
};
Engine.SetProgress(100);
g_Map.ExportMap();

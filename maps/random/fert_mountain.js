Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

const isMountain = true;

setSelectedBiome();

const tMainTerrain = g_Terrains.mainTerrain;
const tForestFloor1 = g_Terrains.forestFloor1;
const tForestFloor2 = g_Terrains.forestFloor2;
const tTier1Terrain = g_Terrains.tier1Terrain;
const tTier2Terrain = g_Terrains.tier2Terrain;
const tTier3Terrain = g_Terrains.tier3Terrain;
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
const oFish = g_Gaia.fish;
const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
const oStoneLarge = g_Gaia.stoneLarge;
const oStoneSmall = g_Gaia.stoneSmall;
const oMetalLarge = g_Gaia.metalLarge;

const aGrass = g_Decoratives.grass;
const aGrassShort = g_Decoratives.grassShort;
const aRockLarge = g_Decoratives.rockLarge;
const aRockMedium = g_Decoratives.rockMedium;
const aBushMedium = g_Decoratives.bushMedium;
const aBushSmall = g_Decoratives.bushSmall;
const aWaterDecoratives = ["props/flora/reeds_pond_lush_a"].map(actorTemplate);

Engine.SetProgress(10);

const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

var stonesGroup = new SimpleGroup([
	new SimpleObject("actor|geology/gray1.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/gray_rock1.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/highland1.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/highland1_moss.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/highland2.xml", 1, 2, 1, 3),
	new SimpleObject("actor|geology/highland2_moss.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/highland3.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/highland_c.xml", 1, 2, 1, 2),
	new SimpleObject("actor|geology/highland_d.xml", 1, 2, 1, 3),
	new SimpleObject("actor|geology/highland_e.xml", 1, 2, 1, 2)
]);

const heightLand = 0;
var g_Map = new RandomMap(heightLand, tMainTerrain);

function truncate(val, min, max)
{
	return Math.min(Math.max(val, min), max);
}

function linearInterpolation(min, max, t)
{
	return min + (max - min) * t;
}

function bezier_quadratic(p0, p1, p2, t)
{
	const t1 = 1.0 - t;
	return p0.clone().mult(t1 * t1).add(p1.clone().mult(2 * t1 * t)).add(p2.clone().mult(t * t));
}

const centerPos = g_Map.getCenter();
const numPlayers = getNumPlayers();

function scaleByNumberOfPlayers(a, b)
{
	return linearInterpolation(a, b, numPlayers / 8.0);
}

var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();

//rasters triangles and gives interpolated heights 
function triRast(v0, v1, v2, h0, h1, h2)
{
	const miny = Math.floor(Math.min(v0.y, v1.y, v2.y));
	const minx = Math.floor(Math.min(v0.x, v1.x, v2.x));
	const maxx = Math.ceil(Math.max(v0.x, v1.x, v2.x));
	const maxy = Math.ceil(Math.max(v0.y, v1.y, v2.y));
	const t0 = v1.clone().sub(v0);
	const t1 = v2.clone().sub(v0);
	const d00 = t0.dot(t0);
	const d01 = t0.dot(t1);
	const d11 = t1.dot(t1);
	const invdenom = 1 / (d00 * d11 - d01 * d01);
	let plist = [];
	let hlist = [];
	for (let py = miny; py <= maxy; ++py)
	{
		for (let px = minx; px <= maxx; ++px)
		{
			const p = new Vector2D(px, py);
			const t2 = p.clone().sub(v0);
			const d20 = t2.dot(t0);
			const d21 = t2.dot(t1);
			const w1 = (d11 * d20 - d01 * d21) * invdenom;
			const w2 = (d00 * d21 - d01 * d20) * invdenom;
			const w0 = 1.0 - w2 - w1;
			if (w0 >= 0 && w1 >= 0 && w2 >= 0)
			{
				const dw = (w0 * h0 + w1 * h1 + w2 * h2);
				//check needed to hlist and plist
				if (g_Map.validHeight(p))
				{
					g_Map.setHeight(p, dw)
					hlist.push(dw)
					plist.push(p)
				}
			}
		}
	}
	return [plist, hlist];
}
//two tris together
function quadRast(v0, v1, v2, v3, h0, h1, h2, h3)
{
	let hp_data1 = triRast(v0, v1, v2, h0, h1, h2);
	let hp_data2 = triRast(v2, v3, v0, h2, h3, h0);
	let plist = [...hp_data1[0], ...hp_data2[0]];
	let hlist = [...hp_data1[1], ...hp_data2[1]];
	return [plist, hlist]
}
Engine.SetProgress(20);

g_Map.placeEntityPassable("undeletable|disableGarrisonHolder|structures/brit_wonder", 0, new Vector2D(g_Map.size / 2, g_Map.size / 2), 0.0);

//map main geometry
var mountain_height = isMountain ? 100.0 * numPlayers / 8.0 : 0;
var mountain_height_base = 24;
var r = 18;
var start = 0.0;
var end = Math.PI * scaleByMapSize(1.0, 2.0);
var m = numPlayers;
var maxRad = (r + m * end);

var plist = [];
var hlist = [];

const spiralWidth = 10;
var passageAreas = [];
const R = g_Map.size / 2.0 - (r + m * end + spiralWidth);

const stepFun = function()
{
	return 2 / R;
}

const qrStepFun = function()
{
	return 2.0;
}

const qsStepFun = function()
{
	return 2.0;
}

g_Map.log("Ground geometry of bases");
const i_max = 2 * Math.PI / 4.0;
const littlePassageRadPod = i_max * 0.7 * linearInterpolation(1, 0.7, 1 - numPlayers / 8.0);
for (let t = 0; t < numPlayers; t++)
{
	const offset = 2 * Math.PI * t / numPlayers;
	const c = new Vector2D(1, 0).rotate(-(end + offset)).mult(g_Map.size / 2).add(centerPos);
	let point = (a, d) => new Vector2D(1, 0).rotate(a).mult(d).add(c);
	let points_rect = (a0, a1, b0, b1) => [point(a0, b0), point(a0, b1), point(a1, b1), point(a1, b0)];
	let littlePassage = true;
	for (let i = 0; i <= i_max; i += stepFun())
	{
		const i_next = i + stepFun();
		// tangent circle ring
		const angle = i - Math.PI - end - offset;
		const angle_next = i_next - Math.PI - end - offset;
		const dim = R;
		const dim_next = R + spiralWidth;
		const points = points_rect(angle, angle_next, dim, dim_next);
		quadRast(...points, mountain_height_base, mountain_height_base, mountain_height_base, mountain_height_base);
		// circle outward
		const qs_len = 20.0;
		const qs_min = spiralWidth;
		const qs_max = qs_len + qs_min;
		for (let qs = qs_min; qs <= qs_max; qs += qsStepFun())
		{
			const angle_next = i + stepFun() - Math.PI - end - offset;
			const qs_next = qs + qsStepFun();
			const dim = R + qs;
			const dim_next = R + qs_next;
			const points = points_rect(angle, angle_next, dim, dim_next);
			let h = (a) => mountain_height_base * easeCurve(truncate(1 - (a - qs_min) / qs_len, 0, 1));
			const h0 = h(qs);
			const h1 = h(qs_next);
			quadRast(...points, h0, h1, h1, h0);
		}
		// circle inward
		const qr_max = 20.0
		for (let qr = 0; qr <= qr_max; qr += qrStepFun())
		{
			const angle_next = i + stepFun() - Math.PI - end - offset;
			const qr_next = qr + qrStepFun();
			const dim = R - qr;
			const dim_next = R - qr_next;
			const points = points_rect(angle, angle_next, dim, dim_next);
			let h = (a, b) => -40 * easeCurve(truncate(1 - a / qr_max, 0, 1)) * Math.pow(b / i_max, 1.3);
			const h0 = h(qr, i);
			const h1 = h(qr_next, i);
			const h2 = h(qr_next, i_next);
			const h3 = h(qr, i_next);
			quadRast(...points, h0, h1, h2, h3);
		}
		// passage between  players
		if (i >= littlePassageRadPod && littlePassage)
		{
			const dim = R - qr_max;
			const dim_next = R + spiralWidth;
			const p0 = point(angle, dim + 2);
			const p1 = point(angle, dim_next);
			const passageArea = new createArea(
				new PathPlacer(p0, p1, 2, 0.1, 1.0, 0.1, 0), [new SmoothElevationPainter(ELEVATION_SET, -1, 0)], [])
			createArea(
				new ClumpPlacer(diskArea(35), 1, 1, Infinity, p1), [new SmoothElevationPainter(ELEVATION_SET, 0, 24)], [])
			passageAreas.push(passageArea);
			littlePassage = false;
		}
	}
}
Engine.SetProgress(30);

g_Map.log("Mountain or hill spiral");
var spiralEndPos = [];

function spiralStepFunc(i)
{
	return 2.0 / (r + i);
}
for (let t = 0; t < numPlayers; t++)
{
	let offset = 2 * Math.PI * t / numPlayers;
	if (isMountain)
	{
		let point = (a, b) => new Vector2D(1, 0).rotate(-(a + offset)).mult(r + m * a + b).add(centerPos);
		let zheight = (a) => truncate(mountain_height * (1.0 - a / end), 0, mountain_height) + mountain_height_base;
		for (let i = -2 * Math.PI / numPlayers * 0.5; i <= end; i += spiralStepFunc(i))
		{
			let inext = i + spiralStepFunc(i);
			const p0 = point(i, 0);
			const p1 = point(i, spiralWidth);
			const p2 = point(inext, spiralWidth);
			const p3 = point(inext, 0);
			let z = zheight(i);
			let znext = zheight(inext);
			let hp_data = quadRast(p0, p1, p2, p3, z, z, znext, znext);
			plist.push(...hp_data[0]);
			hlist.push(...hp_data[1]);
		}
	}
	let tempPos = new Vector2D(1, 0).rotate(-(end + offset)).mult(r + m * end + spiralWidth * 0.7).add(centerPos);
	spiralEndPos.push(tempPos);
}

Engine.SetProgress(40);
//some paths might overlap, set highest height from coicident points
for (var i = 0; i < plist.length; i++)
{
	const mountain_height = g_Map.getHeight(plist[i]);
	if (mountain_height <= hlist[i])
	{
		g_Map.setHeight(plist[i], hlist[i]);
	}
}

g_Map.log("Center disk place height");
if (isMountain)
{
	createArea(
		new ClumpPlacer(diskArea(r + spiralWidth * 0.7), 1, 0, Infinity, centerPos), [new SmoothElevationPainter(ELEVATION_SET, mountain_height + mountain_height_base, 3)],
		null);
}
else
{
	createArea(
		new ClumpPlacer(diskArea(r + m * end + spiralWidth * 1.3), 1, 0, Infinity, centerPos), [new SmoothElevationPainter(ELEVATION_SET, mountain_height + mountain_height_base, 3)],
		null);
}

//smoothers whole map edges
createArea(
	new MapBoundsPlacer(), [new SmoothElevationPainter(ELEVATION_MODIFY, 0, 1)], [new SlopeConstraint(2, Infinity), new HeightConstraint(0, Infinity)]
);

//some bumps
createBumps(avoidClasses(clPlayer, 20), 100);
Engine.SetProgress(50);

//custom placement for this map
function playerPlacementCircleCustom(radius, startingAngle = undefined, center = undefined)
{
	let startAngle = end - 2 * Math.PI / getNumPlayers() * scaleByMapSize(0.3, -0.3)
	let [playerPosition, playerAngle] = distributePointsOnCircle(getNumPlayers(), startAngle, radius * scaleByMapSize(1, 1.4), center || g_Map.getCenter());
	return [sortAllPlayers(), playerPosition.map(p => p.round()), playerAngle, startAngle];
}
Engine.SetProgress(55);

// players placement
var civsPlacement = playerPlacementCircleCustom(fractionToTiles(0.37) * scaleByMapSize(1.2, 0.6))
var civsPos = civsPlacement[1];
placePlayerBases(
{
	"PlayerPlacement": civsPlacement,
	"PlayerTileClass": clPlayer,
	"Walls": false,
	"BaseResourceClass": clBaseResource,
	"CityPatch":
	{
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"Chicken":
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
		"count": 25
	},
	"Decoratives":
	{
		"template": aGrassShort
	}
});

Engine.SetProgress(60);
//get slopped areas
var pathAreas = []
var slopeSpiralArea = new createArea(
	new MapBoundsPlacer(), [], [new SlopeConstraint(2.7, Infinity)]
);
pathAreas.push(slopeSpiralArea)
	/* 
	Make paths from civic center to spiral entrance smooth with bezier curve of 3 points
	Middle point controls curve survature in this case so it create a nice realistic road	
	*/
g_Map.log("Making roads");
for (var i = 0; i < getNumPlayers(); i++)
{
	var i2 = (i == 0) ? getNumPlayers() - 1 : i - 1;
	let ofletan = spiralEndPos[i2].clone().sub(centerPos).rotate(-Math.PI / 2.0).mult(3 * scaleByNumberOfPlayers(2.3, 0.6) * scaleByMapSize(0.8, 1.2)).add(spiralEndPos[i2])
	const p0 = spiralEndPos[i2];
	const p1 = ofletan;
	const p2 = civsPos[i];
	const pmax = 10;
	for (var p = 0; p < pmax; p++)
	{
		const t = parseFloat(p) / pmax;
		const t1 = parseFloat(p + 1) / pmax;
		const pb0 = bezier_quadratic(p0, p1, p2, t)
		const pb1 = bezier_quadratic(p0, p1, p2, t1)
		var pathArea = new createArea(
			new PathPlacer(pb0, pb1, 4, 3, 10, 0.2, 1), [new TerrainPainter(tRoadWild)], []);
		pathAreas.push(pathArea)
	}
}

var areaInCircle = new createArea(
	new ClumpPlacer(diskArea(r - 9), 1, 0, Infinity, centerPos), [],
	null);

g_Map.log("Creating random forest");
var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));

//add rough terrain in all the map with perlin noise
g_Map.log("Adding rough terrain");
createArea(
	new MapBoundsPlacer(), [new PerlinPainter(ELEVATION_MODIFY)], []);

g_Map.log("Creating more random trees");
createStragglerTrees(
	[oTree1, oTree2, oTree4, oTree3], [avoidClasses(clForest, 8, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1), new HeightConstraint(2, mountain_height_base * 0.7), new SlopeConstraint(0, 1.5), new AvoidAreasConstraint([areaInCircle])],
	clForest,
	stragglerTrees);


g_Map.log("Creating forest");
createForests(
	[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2], [avoidClasses(clPlayer, 15, clForest, 1), new HeightConstraint(0, mountain_height_base * 0.9), new AvoidAreasConstraint(pathAreas), new AvoidAreasConstraint([areaInCircle])],
	clForest,
	forestTrees);

Engine.SetProgress(65);
g_Map.log("Creating dirt patches");
createLayeredPatches(
	[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)], [
		[tMainTerrain, tTier1Terrain],
		[tTier1Terrain, tTier2Terrain],
		[tTier2Terrain, tTier3Terrain]
	], [1, 1], [avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12), new HeightConstraint(-2, 25), new AvoidAreasConstraint(pathAreas)],
	scaleByMapSize(15, 45),
	clDirt);

Engine.SetProgress(70);
g_Map.log("Creating grass patches");
createPatches(
	[scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
	tTier4Terrain, [avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12), new HeightConstraint(-2, 85), new AvoidAreasConstraint(pathAreas)],
	scaleByMapSize(15, 45),
	clDirt);
g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(g_Terrains.cliff), [new SlopeConstraint(2, Infinity)]);
//add little sotnes in slopes
createObjectGroupsByAreas(stonesGroup, 0, [], 150, 10, [slopeSpiralArea]);

const constraintHeightBase = isMountain ? new HeightConstraint(1, 17) : new HeightConstraint(1, Infinity);

Engine.SetProgress(75);
g_Map.log("Creating stone mines");
createMines(
	[
		[new SimpleObject(oStoneSmall, 0, 1, 0, 4, 0, 2 * Math.PI, 1), new SimpleObject(oStoneLarge, 0, 1, 4, 8, 0, 2 * Math.PI, 4)],
		[new SimpleObject(oStoneSmall, 1, 2, 4, 7, 0, 2 * Math.PI, 1)]
	], [avoidClasses(clForest, 1, clPlayer, 15, clRock, 3, clHill, 1), constraintHeightBase, new AvoidAreasConstraint(pathAreas)],
	clRock,
	10);

Engine.SetProgress(77);
g_Map.log("Creating metal mines");
createMines(
	[
		[new SimpleObject(oMetalLarge, 0, 1, 4, 7)]
	], [avoidClasses(clForest, 1, clPlayer, 15, clMetal, 5, clRock, 3, clHill, 1), constraintHeightBase, new AvoidAreasConstraint(pathAreas)],
	clMetal,
	10);
Engine.SetProgress(80);

var planetm = 1;

if (currentBiome() == "generic/tropic")
	planetm = 8;

g_Map.log("Creating stones deco");
createDecoration(
	[
		[new SimpleObject(aRockMedium, 1, 3, 0, 1)],
		[new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
		[new SimpleObject(aGrassShort, 4, 8, 1, 6)],
		[new SimpleObject(aGrass, 2, 15, 0, 6), new SimpleObject(aGrassShort, 3, 20, 1.2, 8)],
		[new SimpleObject(aBushMedium, 2, 8, 1, 6), new SimpleObject(aBushSmall, 2, 8, 1, 6)]
	], [
		scaleByMapSize(16, 262),
		scaleByMapSize(8, 131),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200),
		planetm * scaleByMapSize(13, 200)
	], [
		avoidClasses(clForest, 0, clPlayer, 0, clHill, 0),
		new HeightConstraint(1, Infinity)
	]);

g_Map.log("Creating reeds");
createObjectGroups(
	new SimpleGroup([new RandomObject(aWaterDecoratives, 2, 4, 1, 2)], true),
	0, [new HeightConstraint(-Infinity, 0)],
	scaleByMapSize(200, 500),
	100);
g_Map.log("Creating reeds' passage");
createObjectGroupsByAreas(
	new SimpleGroup([new RandomObject(aWaterDecoratives, 2, 4, 1, 2)], true),
	0, [],
	scaleByNumberOfPlayers(70, 300),
	100,
	passageAreas);
g_Map.log("Painting water and shoreline");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tShore), [
		new HeightConstraint(-Infinity, -0.2),
		new SlopeConstraint(0, 1)
	]);
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tWater), [
		new HeightConstraint(-Infinity, -1.5),
		new SlopeConstraint(0, 1)
	]);

Engine.SetProgress(85);
g_Map.log("Creating hunt");
createFood(
	[
		[new SimpleObject(oMainHuntableAnimal, 3, 4, 0, 25)],
		[new SimpleObject(oSecondaryHuntableAnimal, 3, 5, 0, 25)]
	], [50 * numPlayers,
		50 * numPlayers
	], [
		avoidClasses(clForest, 0, clPlayer, 10, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
		new HeightConstraint(1, 15)
	],
	clFood);

Engine.SetProgress(90);
g_Map.log("Creating fruit bush");
createFood(
	[
		[new SimpleObject(oFruitBush, 3, 4, 0, 4)]
	], [3 * numPlayers], [
		avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
		new HeightConstraint(1, 15)
	],
	clFood);

Engine.SetProgress(95);
g_Map.log("Creating even more random trees");
if (isMountain)
{
	createStragglerTrees(
		[oTree1, oTree2, oTree4, oTree3], [
			avoidClasses(clForest, 5, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
			new HeightConstraint(1, Infinity),
			new AvoidAreasConstraint(pathAreas),
			new SlopeConstraint(1, Infinity),
			new AvoidAreasConstraint([areaInCircle])
		],
		clForest,
		stragglerTrees);
}
else
{
	createStragglerTrees(
		[oTree1, oTree2, oTree4, oTree3], [
			avoidClasses(clForest, 5, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
			new HeightConstraint(1, Infinity),
			new AvoidAreasConstraint(pathAreas),
			new AvoidAreasConstraint([areaInCircle])
		],
		clForest,
		stragglerTrees);
}

var areaWater = new createArea(
	new MapBoundsPlacer(), [], [new HeightConstraint(-Infinity, -1)]);

g_Map.log("Creating fish");
createObjectGroups(
	new SimpleGroup([new SimpleObject(oFish, 3, 4, 2, 3)], true, clFood),
	0, [
		new HeightConstraint(-Infinity, -1),
		new AvoidAreasConstraint([slopeSpiralArea])
	],
	scaleByMapSize(3, 10) * numPlayers,
	50);

placePlayersNomad(clPlayer, [avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2), new HeightConstraint(1, 17)]);


setSunElevation(getRandomDeviation(Math.PI / 2, Math.PI / 2 * 0.7))

Engine.SetProgress(100);

g_Map.ExportMap();
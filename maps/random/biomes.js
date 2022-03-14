Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("heightmap");

const biomes = Engine.ReadJSONFile("maps/random/biomes_biomes.json");
const heightScale = num => num * g_MapSettings.Size / 320;

// TEMPORARY: EVERYTHING HERE GOES IN biomes_biomes.json, DELETE ONCE TRANSFER IS READY
const tRoad = "new_alpine_citytile";
const tRoadWild = "alpine_snow_rocky";

const tMainTerrain = "medit_grass_field";
const tTier1Terrain = "snow rough";
const tTier2Terrain = "snow_01";
const tTier3Terrain = "snow rocks";

const tCity = "medit_city_pavement";
const tCityPlaza = "medit_city_pavement";
const tHill = ["medit_grass_shrubs", "medit_rocks_grass_shrubs", "medit_rocks_shrubs", "medit_rocks_grass", "medit_shrubs"];
const tMainDirt = "medit_dirt";
const tCliff = "medit_cliff_aegean";
const tForestFloor = "medit_grass_shrubs";
const tGrass = "medit_grass_field";
const tGrassSand50 = "medit_grass_field_a";
const tGrassSand25 = "medit_grass_field_b";
const tDirt = "medit_dirt_b";
const tDirt2 = "medit_rocks_grass";
const tDirt3 = "medit_rocks_shrubs";
const tDirtCracks = "medit_dirt_c";
const tShoreUpper = "medit_sand";
const tShoreLower = "medit_sand_wet";
const tCoralsUpper = "medit_sea_coral_plants";
const tCoralsLower = "medit_sea_coral_deep";
const tSeaDepths = "medit_sea_depths";

const oBeech = "gaia/tree/euro_beech_aut";
const oOak = "gaia/tree/oak_aut";
const oPine = "gaia/tree/pine";
const oDatePalm = "gaia/tree/cretan_date_palm_short";
const oSDatePalm = "gaia/tree/cretan_date_palm_tall";
const oCarob = "gaia/tree/carob";
const oFanPalm = "gaia/tree/medit_fan_palm";
const oPoplar = "gaia/tree/poplar_lombardy";
const oCypress = "gaia/tree/cypress";

const oDeer = "gaia/fauna_deer";
const oFish = "gaia/fish/generic";
const oSheep = "gaia/fauna_rabbit";
const oGoat = "gaia/fauna_goat";
const oBerryBush = "gaia/fruit/berry_01";
const oStoneLarge = "gaia/rock/temperate_large";
const oStoneSmall = "gaia/rock/temperate_small";
const oMetalLarge = "gaia/ore/temperate_large";
const oFoodTreasure = "gaia/treasure/food_bin";
const oWoodTreasure = "gaia/treasure/wood";
const oStoneTreasure = "gaia/treasure/stone";
const oMetalTreasure = "gaia/treasure/metal";

const aSand = "actor|particle/blowing_sand.xml";
const aRain = "actor|particle/rain_shower.xml";
const aSnow = "actor|particle/snow_mist.xml";
const aBush1 = "actor|props/flora/bush_medit_sm.xml";
const aBush2 = "actor|props/flora/bush_medit_me.xml";
const aBush3 = "actor|props/flora/bush_medit_la.xml";
const aBush4 = "actor|props/flora/bush_medit_me.xml";
const aDecorativeRock = "actor|geology/stone_granite_med.xml";

const aRockLarge = "actor|geology/stone_granite_large.xml";
const aRockMedium = "actor|geology/stone_granite_med.xml";
const aBushMedium = "actor|props/flora/plant_desert_a.xml";
const aBushSmall = "actor|props/flora/bush_desert_a.xml";
const aReeds = "actor|props/flora/reeds_pond_lush_a.xml";
const aOutpostPalisade = "actor|props/structures/britons/outpost_palisade.xml";
const aWorkshopChariot= "actor|props/structures/britons/workshop_chariot_01.xml";

const pForest1 = [tDirt2 + TERRAIN_SEPARATOR + oBeech, tDirt2];
const pForest2 = [tDirt2 + TERRAIN_SEPARATOR + oOak, tDirt2];
const pForest3 = [tDirt2 + TERRAIN_SEPARATOR + oPine, tDirt2];
// END OF TEMPORARY

var g_Map = new RandomMap(0, tMainTerrain);

var clPlayer = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();
var clWeather = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clWater = g_Map.createTileClass();
var clShallow = g_Map.createTileClass();
var clRoad = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clGrass = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clMountain = g_Map.createTileClass();
var clTerrain = g_Map.createTileClass();
var clTerrainLowest = g_Map.createTileClass();
var clTerrainLow = g_Map.createTileClass();
var clTerrainMedium = g_Map.createTileClass();
var clTerrainHigh = g_Map.createTileClass();
var clTerrainHighest = g_Map.createTileClass();

const numPlayers = getNumPlayers();
const mapCenter = g_Map.getCenter();
const mapBounds = g_Map.getBounds();

var [forestTrees1, stragglerTrees] = getTreeCounts(500, 3000, 0.7);
var [forestTrees2, stragglerTrees2] = getTreeCounts(250, 5000, 0.5);

var teams = getTeamsArray();
var [playerIDs, playerPosition] = playerPlacementRandom(sortAllPlayers());

Engine.SetProgress(10);
g_Map.log("Generating base elevations");

const eScale = scaleByMapSize(5, 15);
const eHeight = scaleByMapSize(5, 10);
const riverLow = -5;
const riverHigh = -10;

createBumps(avoidClasses(clTerrain, 50), eScale, 0, 50, 25, 0, eHeight);

Engine.SetProgress(20);
g_Map.log("Generating biomes from elevation");

var h1 = 12.5;
var h2 = 20.0;
var h3 = 37.5;
var h4 = 50.0;

paintTerrainBasedOnHeight(-Infinity, h1, Elevation_ExcludeMin_ExcludeMax, biomes.lowest.terrains.base);
paintTerrainBasedOnHeight(h1, h2, Elevation_ExcludeMin_ExcludeMax, biomes.low.terrains.base);
paintTerrainBasedOnHeight(h2, h3, Elevation_ExcludeMin_ExcludeMax, biomes.medium.terrains.base);
paintTerrainBasedOnHeight(h3, h4, Elevation_ExcludeMin_ExcludeMax, biomes.high.terrains.base);
paintTerrainBasedOnHeight(h4, Infinity, Elevation_ExcludeMin_ExcludeMax, biomes.highest.terrains.base);

paintTileClassBasedOnHeight(-Infinity, h1, Elevation_ExcludeMin_ExcludeMax, clTerrainLowest);
paintTileClassBasedOnHeight(h1, h2, Elevation_ExcludeMin_ExcludeMax, clTerrainLow);
paintTileClassBasedOnHeight(h2, h3, Elevation_ExcludeMin_ExcludeMax, clTerrainMedium);
paintTileClassBasedOnHeight(h3, h4, Elevation_ExcludeMin_ExcludeMax, clTerrainHigh);
paintTileClassBasedOnHeight(h4, Infinity, Elevation_ExcludeMin_ExcludeMax, clTerrainHighest);

placePlayerBases({
	"PlayerPlacement": [playerIDs, playerPosition],
	"PlayerTileClass": clPlayer,
	"BaseResourceClass": clBaseResource,
	"baseResourceConstraint": avoidClasses(clWater, 4),
	"CityPatch": {
		"outerTerrain": tRoadWild,
		"innerTerrain": tRoad
	},
	"Chicken": {
	},
	"Berries": {
		"template": oBerryBush
	},
	"Mines": {
		"types": [
			{ "template": oMetalLarge },
			{ "template": oStoneLarge }
		]
	},
	"Trees": {
		"template": oCarob,
		"count": 2
	},
	"Decoratives": {
		"template": aBush1
	}
});

var playerHillRadius = defaultPlayerBaseRadius() / (isNomad() ? 1.5 : 1) * 1.2;
g_Map.log("Flatten the initial CC area");
for (let position of playerPosition)
{
	createArea(
		new ClumpPlacer(diskArea(playerHillRadius * 1.2), 0.85, 0.45, Infinity, position),
		new SmoothElevationPainter(ELEVATION_SET, g_Map.getHeight(position), 6));
}

// Player roads
// warn(uneval(teams)); // for debugging
if(!isNomad())
{
	for (let i_t = 0; i_t < teams.length; i_t++)
	{
		for (let i = 0; i < teams[i_t].length - 1; i++)
		{
			for (let j = i + 1; j < teams[i_t].length ; j++)
			{
				warn(uneval(i));
				warn(uneval(j));
				// const rWidth = randFloat(8, 5.0);
				createPassage({
					"start": playerPosition[i],
					"end": playerPosition[j],
					"startWidth": 8,
					"endWidth": 8,
					"smoothWidth": 0,
					"tileClass": clRoad,
					"terrain": tRoadWild,
					"edgeTerrain": tRoad
					});
			}
		}
	}
}

Engine.SetProgress(30);
g_Map.log("Generating lakes and rivers");

// Large river
createTributaryRivers(
	randomAngle() + Math.PI / 2,
	scaleByMapSize(5, randIntInclusive(50, 100)),
	randIntInclusive(20, 25),
	riverHigh,
	[-Infinity, h2],
	Math.PI / 5,
	clWater,
	clShallow,
	avoidClasses(clPlayer, 5, clWater, 10, clShallow, 10, clRoad, 0, clTerrainHigh, 0, clTerrainHighest, 0));

// Small river
createTributaryRivers(
	randomAngle() + Math.PI / 2,
	scaleByMapSize(5, randIntInclusive(100, 250)),
	randIntInclusive(10, 15),
	riverLow,
	[-Infinity, h3],
	Math.PI / 5,
	clWater,
	clShallow,
	avoidClasses(clPlayer, 5, clWater, 10, clShallow, 10, clRoad, 0, clTerrainHighest, 0));

// Ocean
createBumps(avoidClasses(clPlayer, 5, clWater, 10, clShallow, 10, clRoad, 0, clTerrainMedium, 0, clTerrainHigh, 0, clTerrainHighest, 0), scaleByMapSize(5, randIntInclusive(50, 100)), 0, 10, 5, 0, riverHigh);

// Lake
createBumps(avoidClasses(clPlayer, 5, clWater, 10, clShallow, 10, clRoad, 0, clTerrainHigh, 0, clTerrainHighest, 0), scaleByMapSize(5, randIntInclusive(25, 50)), 0, 25, 10, 0, riverLow);

// Paint patches
createLayeredPatches(
	[scaleByMapSize(5, 25), scaleByMapSize(5, 50), scaleByMapSize(5, 100)],
	[[tDirt, tDirt2], [tDirt2, tDirt3], [tDirt3, tDirtCracks]],
	[1, 1],
	avoidClasses(clTerrainLowest, 0, clTerrainLow, 0, clTerrainHigh, 0, clTerrainHighest, 0),
	scaleByMapSize(5, 50),
	clDirt);

// Paint water textures
paintTerrainBasedOnHeight(riverLow, 0, Elevation_ExcludeMin_ExcludeMax, biomes.all.terrains.shallow);
paintTerrainBasedOnHeight(riverHigh, riverLow, Elevation_ExcludeMin_ExcludeMax, biomes.all.terrains.water);

Engine.SetProgress(40);
g_Map.log("Generating hills and mountains");

//createHills(biomes.highest.terrains.hill, avoidClasses(clPlayer, 20, clTerrainLowest, 0, clTerrainLow, 0, clTerrainMedium, 0, clTerrainHigh, 0), clHill, scaleByMapSize(10, 250), 0, 10, 5, 0, 50);
//createMountains(biomes.highest.terrains.mountain, avoidClasses(clPlayer, 20, clTerrainLowest, 0, clTerrainLow, 0, clTerrainMedium, 0, clTerrainHigh, 0), clMountain, scaleByMapSize(10, 100), 50, 25, 0, 100);

Engine.SetProgress(50);
g_Map.log("Generating forests");

/*
createForests(
	[tMainTerrain, tDirt, tDirt, pForest1, pForest1],
	[avoidClasses(clPlayer, 1, clMountain, 0, clTerrainLow, 0)],
	clForest,
	forestTrees1);

createForests(
	[tTier1Terrain, tDirt2, tDirt2, pForest3, pForest3],
	[avoidClasses(clPlayer, 1, clMountain, 0, clTerrainLowest, 0)],
	clForest,
	forestTrees2);
*/

Engine.SetProgress(50);
g_Map.log("Generating daytime and weather");

placePlayersNomad(clPlayer, avoidClasses(clWater, 5, clMountain, 5));

if(g_MapSettings.Daytime == "day")
{
	const sElevation = randFloat(0.1, 0.25);
	setSunColor(0.875, 0.875, 0.875);
	setSunRotation(randomAngle());
	setSunElevation(Math.PI * sElevation);
	setAmbientColor(0.25, 0.25, 0.25);

	setFogColor(0.750, 0.875, 1.000);
	setFogColor(0.050, 0.075, 0.100);
	setFogFactor(0.25);
	setFogThickness(0.25);

	setSkySet(pickRandom(["fog", "cumulus", "stormy", "cloudless", "mountainous", "cirrus", "sunset", "sunny"]));

	setWaterTint(0.5, 0.5, 0.5);
	setWaterColor(0.25, 0.25, 0.25);
	setWaterWaviness(5);
	setWaterMurkiness(0.75);
	setWaterType(pickRandom(["clap", "lake", "ocean"]));
}
else if(g_MapSettings.Daytime == "dawn")
{
	const sElevation = randFloat(0.025, 0.1);
	const sElevationColor = Math.min(1, sElevation * 10);
	setSunColor(sElevationColor * 0.875, Math.pow(sElevationColor, 1.5) * 0.875, Math.pow(sElevationColor, 3.0) * 0.875);
	setSunRotation(randomAngle());
	setSunElevation(Math.PI * sElevation);
	setAmbientColor(0.1, 0.1, 0.1);

	setFogColor(0.625, 0.750, 0.875);
	setFogFactor(0.25);
	setFogThickness(0.25);

	setSkySet(pickRandom(["dark"]));

	setWaterTint(0.5, 0.5, 0.5);
	setWaterColor(0.25, 0.25, 0.25);
	setWaterWaviness(5);
	setWaterMurkiness(0.75);
	setWaterType(pickRandom(["clap", "lake", "ocean"]));
}
else if(g_MapSettings.Daytime == "night")
{
	const sElevation = randFloat(0.1, 0.25);
	setSunColor(0.125, 0.125, 0.125);
	setSunRotation(randomAngle());
	setSunElevation(Math.PI * sElevation);
	setAmbientColor(0.050, 0.050, 0.100);

	setFogColor(0.050, 0.075, 0.100);
	setFogFactor(0.25);
	setFogThickness(0.25);

	setSkySet(pickRandom(["dark"]));

	setWaterTint(0.5, 0.5, 0.5);
	setWaterColor(0.25, 0.25, 0.25);
	setWaterWaviness(5);
	setWaterMurkiness(0.75);
	setWaterType(pickRandom(["clap", "lake", "ocean"]));
}
else
{
	const sBrightness = randFloat(0.25, 0.75);
	const sElevation = randFloat(0.1, 0.25);
	setSunColor(sBrightness * 0.25, sBrightness * 0.25, sBrightness * 0.25);
	setSunRotation(randomAngle());
	setSunElevation(Math.PI * sElevation);
	setAmbientColor(sBrightness, sBrightness, sBrightness);

	setFogColor(sBrightness, sBrightness, sBrightness);
	setFogFactor(0.5);
	setFogThickness(0.25);

	setSkySet(pickRandom(["rain"]));

	setWaterTint(0.5, 0.5, 0.5);
	setWaterColor(0.25, 0.25, 0.25);
	setWaterWaviness(10);
	setWaterMurkiness(1.0);
	setWaterType(pickRandom(["clap", "lake", "ocean"]));

	if(randBool(0.5))
	{
		const sWeather = Math.floor(randIntInclusive(5, 10) * (1 - sBrightness));

		createObjectGroups(
			new SimpleGroup([new SimpleObject(aSand, 1, 1, 0, 5)], true, clWeather),
			0,
			avoidClasses(clWater, 0, clShallow, 0, clTerrainMedium, 5, clTerrainHigh, 5, clTerrainHighest, 5),
			scaleByMapSize(25, sWeather * 5));

		createObjectGroups(
			new SimpleGroup([new SimpleObject(aRain, 1, 1, 0, 5)], true, clWeather),
			0,
			avoidClasses(clTerrainLowest, 5, clTerrainHighest, 5),
			scaleByMapSize(25, sWeather * 25));

		createObjectGroups(
			new SimpleGroup([new SimpleObject(aSnow, 1, 1, 0, 5)], true, clWeather),
			0,
			avoidClasses(clTerrainLowest, 5, clTerrainLow, 5, clTerrainMedium, 5),
			scaleByMapSize(25, sWeather * 10));
	}
}

setPPEffect("hdr");
setPPContrast(0.5);
setPPSaturation(0.5);
setPPBloom(0.5);

g_Map.ExportMap();

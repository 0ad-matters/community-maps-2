Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");

TILE_CENTERED_HEIGHT_MAP = true;
const enabled = true;

// testMap
//	0	playing  not Testing
//	1	no random, all topo low level, all elements, all textures, good for topographic structure
//	2	no random, no topo, pyramids as cell-markers, all elements, all textures
//	3	no random, no topos, no trees, all elements from the map (mines, towncenters), fields outside of the map - good for resources
//	4	no random, all topo low level, no trees, basic texture (like 1 but without trees and decorative texture)
//	5	random, topo, no trees, all elements, basic texture, good for ramps, good for object testing, use it with testColoring = 4
//	6	no Random, no topo, no trees, show markers for active
var testMap = 0;

// testColoring
//	0	none (take the textures for the game)
//	1	angle (basic math)
//	2	distance (basic math, shows the areas)
//	3	difference (shows where the interim levels can be)
//	4	difference (show the areas, where ramps are created), the most helpful coloring to get the ramps right
//	5	distance base to hills (white areas for random hills, red for mapped hills with slope, purple for mapped hills without slope)
//	6	ramps
var testColoring = 0;

// voronoi-width
// determines the size of the intermediate height between low and high terrain
// bigger numbers prefer more medium terrain and less low and high terrain
// value should be more than 6, otherwise there are to few ramps to access high or low terrain.
var vorWidth = 6;
var cliffHeight = 20;
// ramp base
var rampSize = 4;

// define the position of the coordinates on the map
// the meaning of the areaMapTyp - look at the code
var areaMapTyp = 45;
// fieldSize = distance between two coordinates
// this is not the distance between two hills, these are determined by the combination of the map-type and the fieldsize
var fieldSize = 7;
var defaultRandom = 4;
// test and move random hills, if they are to close to base-fields
// prevent mines from being to close to walls,
// but also takes out a little bit of the randomness
// loops several times through all hills and measure their distance to each other,
// and than moves them a little bit away from each other
var saveDistanceLoop = 2;

// trees are grouped in forests
//	forests are just denser
// 	outside forest there still can be trees
// 	forest are evenly distributed over the map with a certain random displacement
//	there is a superstructure, that regulates the distribution of forests, outside this superstructure forest become less dense
// densityForestMin is the density of forests
// densityForestMax is the density elsewhere
// 0.0	no trees, landscape is barren
// 1.0	normal, troops normally don't get stuck
// 5.0	insane dense
var densityForestMin = 1;
var densityForestMax = 2;
// distance between forest-centers (in fields)
var margin_trees1 = 30;
// size_trees1 = diameter of a forest
// 	this number should be smaller than margin_trees1
var size_trees1 = 10;
// the forests are slightly elevated
var height_trees1 = 0;

/*
 * creating the Map-Layout
 *
 * the difference between active and not active is, that active elements assure their own cell
 * so not active elements  must be close to an assured cell, or they could end up on a cliff
 * cells of the type "base" are special - they have always altitude low, and two bordering cells are joined. Thus cells can get expanded by all other cells of the type base
 * cells of the type hill are active cells with
	<space>	do nothing
	@	do nothing
	.	passive, removes natural hills
	!	active basefield
	?	active basefield, no slopes
	f	food/wildbeast, 4 units, no random
	F	food/wildbeast, 8 units, no random
	g	predator, 2 units, no random
	G	predator, 8 units, no random
	w	cityHall
	W	cityHall with 1 Mine (of each type) and Forest
	u	metalMine + stoneMine, no Random
	x	hill, no Random
	X	hill, small Random
	y	hill, no Random, forest
	Y	hill, small Random, forest
	o	hill, medium Random, forest
	O	hill, big Random, forest

	free:
		bBcCdDeEhHiIjJkKlLmMnNpPqQrRsStTuUvVzZ
*/

var emptyRow = "..........................";

// map with default-hills and no base (not playable)
var emptyMap0 = [];
// complete empty map (tiny, small, medium) (not playable)
var emptyMap1 = [emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow];

var tinyMap1 = [
	"        .@.        ",
	"     .........     ",
	"     ..........     ",
	"    .....W......    ",
	"   .............   ",
	"  ...............  ",
	" ................. ",
	" ................. ",
	" .................. ",
	"...................",
	"...................",
	"..................."];

var tinyMap2 = [
	"        .@.        ",
	"     .........     ",
	"     ....x.....     ",
	"    .....W......    ",
	"   .............   ",
	"  ...............  ",
	" ................. ",
	" ................. ",
	" .................. ",
	"...................",
	"...................",
	"..................."];

var mediumMap1 = [
	"                  ...                  ",
	"               .........               ",
	"            ........x.....            ",
	"            ........u......            ",
	"          ..................          ",
	"         ....F................         ",
	"        .......................        ",
	"       ......!..................       ",
	"      .............w.............      ",
	"     ..............?......!......     ",
	"     .....X.......................     ",
	"    ....u..................F.......    ",
	"   .................................   ",
	"   .................................   ",
	"  ...................................  ",
	"  .................o.................  ",
	" ...........o....G........o.......... ",
	" ..................................... ",
	" ................................O.... ",
	" ..................................... ",
	"......................................",
	"......................................",
	"......................................"];

var mediumLarge1 = [
	"                           .@.                           ",
	"                        .........                        ",
	"                     ...............                     ",
	"                    .................                    ",
	"                   ...........x........                   ",
	"                 .....F......u..........                 ",
	"                .........................                ",
	"               ........!...................               ",
	"             .o.............................             ",
	"            ........................!........            ",
	"           .................w.................           ",
	"          ...................?.................          ",
	"         .........Y.............................         ",
	"        ............................F............        ",
	"       ...............?...........................       ",
	"       .Y.........................................o       ",
	"      ....................YG........o..............      ",
	"     ............?u.................................     ",
	"   .......................................O...........    ",
	"   ...................!...............................   ",
	"   ...................................................   ",
	"   ...................................................   ",
	"  .....Y.........................................o.....  ",
	"  .....................................................  ",
	"  ...........................o..........................  ",
	" ....................................................... ",
	" ....................................................... ",
	" ......O................................................. ",
	".........................................................",
	"O.............O....................O.............O......O",
	"..................@@@@@@@@@@@@@@@@@@@@@..................",
	"..............@@@@@@@@@@@@@@@@@@@@@@@@@@@@@..............",
	"..........@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@..........",
	"......@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@......",
	"...@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@..."];

var mapLayout = {};
var mapAssign = {};

mapLayout[0] = emptyMap0;
mapLayout[1] = tinyMap1;
mapLayout[2] = tinyMap2;
mapLayout[3] = mediumMap1;
mapLayout[4] = mediumLarge1;
mapLayout[5] = emptyMap0;
mapLayout[6] = emptyMap0;
mapLayout[7] = emptyMap0;

if (enabled)
{
	mapLayout[0] = emptyMap0;
	mapAssign[128] = [0, 0, 2, 2, 2, 2, 2, 1, 1];
	mapAssign[192] = [0, 0, 3, 3, 3, 3, 3, 2, 2];
	mapAssign[256] = [0, 0, 3, 3, 3, 3, 3, 3, 2];
	mapAssign[320] = [0, 0, 4, 4, 4, 3, 3, 3, 3];
	mapAssign[384] = [0, 0, 4, 4, 4, 4, 4, 4, 4];
	mapAssign[448] = [0, 0, 4, 4, 4, 4, 4, 4, 4];
	mapAssign[512] = [0, 0, 4, 4, 4, 4, 4, 4, 4];
}

/** ******************************************************************
 * Texture Section
 ********************************************************************/

// textures and elements for visualisation / map creation / debugging
// is not used in the game-play
var color_1 = "red";
var color_2 = "yellow";
var color_3 = "whiteness";
var color_4 = "neon green";
var color_5 = "green";
var color_6 = "blue";
var color_7 = "purple";
var develop_mapHill = "gaia/ruins/pyramid_great";
var develop_mapLand = "other/obelisk";

// most of the following textures (and values) are defaults, which should help when making a new biome
// if a texture should appear more often, make several entries of it
// if the original-texture should be used, drop some empty string into the collection
var texture_default = ["grid_subdiv"];
var texture_default_medium = ["grid_subdiv"];
var texture_default_high = ["grid_subdiv"];
var texture_base_inner = ["grid_subdiv"];
var texture_base_outer = ["grid_subdiv"];
var texture_depression_inner = ["grid_subdiv"];
var texture_depression_outer = ["grid_subdiv"];
var objects_depression_inner = [];
var margin_depression = 50;
var size_depression = 15;
var height_depression = 0;
var texture_trees1_inner = ["grid_subdiv"];
var texture_trees1_outer = ["grid_subdiv"];
var texture_trees1_outer_high = ["grid_subdiv"];
var objects_trees1_inner = [];
var objects_trees1_inner_high = [];
// margin_trees1 = distance between forests
// higher number = less forests = less trees
var texture_cliff1_inner = ["grid_subdiv"];
var texture_cliff1_inner_high = ["grid_subdiv"];
var texture_cliff1_outer = ["grid_subdiv"];
var texture_cliff1_outer_high = ["grid_subdiv"];
var texture_path = ["grid_subdiv"];
var texture_path_high = ["grid_subdiv"];
var texture_mine = ["grid_subdiv"];
var mine_stone = "gaia/rock/savanna_large";
var mine_metal = "gaia/ore/savanna_large";
var food1 = "gaia/fruit/berry_05";
var predator1 = "gaia/fauna_wolf";

var decoFauna1 = "gaia/fauna_muskox";
var decoFauna2 = "gaia/fauna_wolf";

var civilCentre = "skirmish/structures/default_civil_centre";
var citizen_female = "skirmish/units/default_support_female_citizen";
var infantry_melee = "skirmish/units/default_infantry_melee_b";
var infantry_ranged = "skirmish/units/default_infantry_ranged_b";

// setSkySet(pickRandom(["cirrus", "cumulus", "sunny"]));
setSkySet("stratus");
setSunRotation(randomAngle());
setSunElevation(0.5 * Math.PI);
// setSunElevation(0.15 * Math.PI);

// setSkySet("cumulus");
// setSunColor(0.866667, 0.776471, 0.486275);
// setWaterColor(0, 0.501961, 1);
// setWaterTint(0.501961, 1, 1);
// setWaterWaviness(4.0);
// setWaterType("clap");
// setWaterType("ocean");
// setWaterMurkiness(0.49);

// setFogFactor(0.0);
// setFogThickness(0.0);
// setFogColor(0.90, 0.80, 0.60);

// setPPEffect("hdr");
// setPPContrast(0.62);
// setPPSaturation(0.51);
// setPPBloom(0.12);

// every hill gets an ownernumber
// the number have to be set manually, every time a hill is created
// if two hills have the same owner and are on the same level, there will be no cliff
// so these hills will merge, this should enable complex valleys

if (enabled)
{
	// taiga
	densityForestMin = 1;
	densityForestMax = 2;
	// the transition between the textures for low and medium altitude
	// is gradual with random favoring one list above the other with rising altitude
	texture_default = ["polar_tundra", "polar_tundra", "polar_tundra", "alpine_grass_d", "alpine_grass_d_wild", "alpine_grass_e", "alpine_dirt"];
	texture_default_medium = ["polar_tundra_snow", "polar_tundra_snow", "polar_snow_a", "polar_snow_b", "alpine_dirt_snow", "alpine_snow_a", "alpine_snow_b"];
	// depression, elevation of forests above the ground

	texture_depression_inner = ["polar_ice_snow", "polar_ice_b"];
	texture_depression_outer = ["polar_ice_snow", "polar_grass_snow"];
	height_depression = -2;
	// margin_depression = distance from the center of one depression to another
	margin_depression = 50;
	// size_depression = diameter of the depression
	size_depression = 10;

	// forests, elevation of forests above the ground

	texture_trees1_inner = ["alpine_forrestfloor", "aegean_dirt_rocks_01", "aegean_forestfloor_01"];
	texture_trees1_outer = ["alpine_forrestfloor"];
	texture_trees1_outer_high = ["alpine_forrestfloor_snow"];
	objects_trees1_inner = ["gaia/tree/fir", "gaia/tree/fir_sapling", "gaia/tree/fir", "gaia/tree/fir_sapling", "gaia/tree/temperate"];
	objects_trees1_inner_high = ["gaia/tree/fir_winter", "gaia/tree/fir_winter", "gaia/tree/temperate_autumn", "gaia/tree/temperate_winter"];

	height_trees1 = 2;
	margin_trees1 = 20;
	// size_trees1 = diameter of a forest
	// higher numbers = bigger forests = more trees
	size_trees1 = 10;
	// cliffs

	texture_cliff1_inner = ["polar_cliff_a", "polar_cliff_b"];
	texture_cliff1_inner_high = ["polar_cliff_b", "polar_cliff_snow"];
	texture_cliff1_outer = ["polar_snow_rocks"];
	texture_cliff1_outer_high = ["polar_snow_rocks"];

	// path

	texture_path = ["alpine_dirt", "alpine_dirt_grass_50", "alpine_dirt", "alpine_dirt_grass_50", "aegean_rocks_dirt_01", "aegean_rocks_dirt_02"];
	texture_path_high = ["alpine_dirt_grass_50", "alpine_dirt_snow", "alpine_dirt_grass_50", "alpine_dirt_snow", "aegean_rocks_dirt_01", "aegean_rocks_dirt_02"];

	// texture around the base and the mines
	texture_base_inner = ["temp_road_muddy", "tropic_citytile_a", "alpine_dirt_grass_50", "alpine_cliff_c", "alpine_grass_d"];
	texture_base_outer = ["tropic_citytile_a", "polar_tundra", "alpine_dirt", "alpine_dirt_grass_50", "alpine_cliff_c", "alpine_grass_d_wild"];
	texture_mine = ["ice_dirt"];
	// special objects
	mine_stone = "gaia/rock/alpine_large";
	mine_metal = "gaia/ore/alpine_large";

	food1 = "gaia/fauna_muskox";
	predator1 = "gaia/fauna_wolf";
	setSunElevation(0.2 * Math.PI);
	setSunColor(0.6, 0.6, 0.6);
	setSkySet("overcast");
	setFogColor(0.9, 0.85, 1);
	// setFogFactor(0.2);
	setFogThickness(0);
	setFogFactor(0);
	// setPPEffect("DOF");
}

/** ***************************************************************************
 * Main Section
 *****************************************************************************/
// basis-height
var hills = [];
var owner = 100;
var heightLand = 25;
var g_Map = new RandomMap(heightLand, texture_default);

const numPlayers = getNumPlayers();
const mapCenter = g_Map.getCenter();
var maxVoronoiDistance = 0;

var dd = g_Map.getSize();
var ddn = dd / numPlayers;

var complexityDistance = dd;
if (numPlayers > 2)
{
	complexityDistance = dd * Math.sin(Math.PI / numPlayers);
}

// g_Map.log("areaData: dd:" + dd + ", numPlayers:" + numPlayers + ", mapSize / numPlayers:" + ddn + ", complexityDistance:" + complexityDistance);

function setBase(self, value)
{
	self.base = Math.max(self.base, value);
	return self;
}

function setMine(self, value)
{
	self.mine = Math.max(self.mine, value);
	return self;
}

function setForest1(self, value)
{
	self.forest1 = Math.max(self.forest1, value);
	return self;
}

function setForest2(self, value)
{
	self.forest2 = Math.max(self.forest2, value);
	return self;
}

function setForestD(self, value)
{
	self.forestD = Math.max(self.forestD, value);
	return self;
}

function setWater1(self, value)
{
	self.water1 = Math.max(self.water1, value);
	return self;
}

function setFlatland1(self, value)
{
	self.flatland1 = Math.max(self.flatland1, value);
	return self;
}

function setPath(self, value)
{
	// brushsize for path should be at least 3
	self.path = Math.max(self.path, value);
	return self;
}

function setSlope(self, value, valueTop)
{
	self.slope = Math.max(self.slope, value);
	self.slopeTop = Math.max(self.slopeTop, valueTop);
	return self;
}

function getHeight(self)
{
	return self.height;
}

function renderCell(self, pass)
{
	// pass 0 = render height
	// pass 1 = textures and elements
	var texture, textureOverwrite;
	var element;
	var slopeMake = true;
	if (pass === undefined) pass = 0;
	var ramp_color = color_6;

	var dx = self.x - 0.5 * dd, dy = self.y - 0.5 * dd;
	var w = Math.atan2(dy, dx);
	var d = Math.sqrt(dx * dx + dy * dy);
	// parameter 1 is added to the general height and create some wavyness to the landscape
	var par1 = 0;
	// parameter 2 is added to the edges of the cliffs and make them look not that straight
	var par2 = 0, par2Raw = 0;
	if (pass == 0)
	{
		par1 = 2 * Math.cos((0.2 + 0.04 * Math.sin(5 * w)) * d) + 2 * Math.cos((0.15 + 0.035 * Math.sin(11 * w)) * d);
		par2Raw = Math.cos((0.5 + 0.07 * Math.sin(7 * w)) * d);
		par2 = 0.1 * par2Raw;
		if (self.base > 0.1)
		{
			// the surrounding of bases are flattened
			par1 *= (1 - self.base);
		}
	}

	var timberline = 0;
	// default-terrain
	if (testColoring == 0)
	{
		texture = pickRandom(texture_default);
		if (pass == 1)
		{
			if ((self.height - heightLand - cliffHeight + 5) / 25 > Math.random())
			{
				// divisor bigger, snowline more blurred
				// subtractor bigger, snowline starts later
				texture = pickRandom(texture_default_medium);
				timberline = 1;
			}
			if ((self.height - 15) / 10 > Math.random())
			{
				// texture = pickRandom(texture_default_high);
				// timberline = 2;
			}
		}
	}
	else
	{
		if (pass == 0)
		{
			textureOverwrite = "green";
		}
	}

	if (self.texture !== undefined && testColoring == 0)
	{
		texture = self.texture;
	}

	if (pass == 0 && self.d !== undefined)
	{
		// calculate the cliffs and slopes
		self.d.sort(function(a, b) { return a.d - b.d; });
		var hPlateau = 0;
		var h = 0;
		if (self.d.length > 0)
		{
			// calculate the base-elevation
			// in self.d[0] are the parameters of the cell, that owns the field
			// in self.d[0].d is the distance to the center
			// in self.d[0].w is the direction to the center
			// in self.d[0].p is the owner of the cell
			var elevationLevel = 0;
			var elevationLevelSec = -1;
			var notFoundOwner = true;
			for (const hill of hills)
			{
				// find the cell, that owns the field
				if (hill.owner == self.d[0].p)
				{
					notFoundOwner = false;
					elevationLevel = hill.elevation;
					if (hill.slope !== undefined)
					{
						slopeMake = hill.slope;
						// slopeMake = false;
						// slopeMake = true;
					}
				}
				if (self.d.length > 1 && hill.owner == self.d[1].p)
				{
					elevationLevelSec = hill.elevation;
				}
			}
			//
			if (elevationLevel == 1)
			{
				hPlateau = 2 * cliffHeight - par1;
				h = 2 * cliffHeight - par1;
			}
			else
			{
				hPlateau = -par1;
				h = -par1;
			}
			if (notFoundOwner)
			{
				g_Map.log("notFoundOwner:" + self.d[0].p);
			}
		}
		if (self.d.length > 1)
		{
			// if a field have the values of two cells, than there is a ramp
			// the first cell (self.d[0]) is the cells with the center closer field
			maxVoronoiDistance = Math.max(maxVoronoiDistance, self.d[1].d);

			// differenz between the two distances from the centerpoint of the cells
			var diff = Math.abs(self.d[0].d - self.d[1].d);
			if (self.d[0].d > 0)
			{
				// diff = diff * self.d[0].d / 30;
			}
			// differenz of the angle of the two cells, the value pi is the maximum, means the field is exactly between the two centers of the cells
			var wdiff = Math.abs(self.d[0].w - self.d[1].w);
			// self.texture = color_3;
			if (wdiff > Math.PI) wdiff = Math.abs(2 * Math.PI - wdiff);
			var relSize = Math.cos(0.5 * wdiff) * self.d[0].d;
			// while (wdiff > Math.PI) {
			// 	wdiff -= Math.PI;
			// }

			var makeRim = true;
			if (testColoring > 0)
			{
				textureOverwrite = color_5;
			}
			if (elevationLevel == elevationLevelSec)
			{
				// both cells have the same owner and are on the same level,
				// doing nothing merge both cells
				if (self.d[0].p == self.d[1].p)
				{
					makeRim = false;
					if (testColoring > 0)
					{
						// textureOverwrite = "bridge_wood_a";
						textureOverwrite = color_4;
					}
				}
				// playerIndependent Id
				var _ifp0 = self.d[0].p % 1000;
				var _ifp1 = self.d[1].p % 1000;
				var _ifplayer0 = Math.round(self.d[0].p / 1000);
				var _ifplayer1 = Math.round(self.d[1].p / 1000);
				if (_ifp0 < 50 && _ifp1 < 50 && _ifplayer0 == _ifplayer1)
				{
					// base-elements can get connected
					// base-elements are below 50
					makeRim = false;
					if (testColoring > 0)
					{
						// textureOverwrite = "bridge_wood_b";
						textureOverwrite = color_4;
						if (diff > 10) textureOverwrite = color_7;
					}
				}
			}

			if (testColoring == 1)
			{
				// angle
				if (wdiff > 1.3) textureOverwrite = color_3;
				if (wdiff > 1.8) textureOverwrite = color_1;
				if (wdiff > 2.3) textureOverwrite = color_2;
				if (wdiff > 2.8) textureOverwrite = color_6;
			}
			if (testColoring == 2)
			{
				// distance
				if (self.d[0].d > 5) textureOverwrite = color_3;
				if (self.d[0].d > 10) textureOverwrite = color_1;
				if (self.d[0].d > 20) textureOverwrite = color_2;
				if (self.d[0].d > 30) textureOverwrite = color_6;
			}

			// distance for base and random active fields the white
			if (testColoring == 5 && self.d[0].d < 10)
			{
				var indexP = self.d[0].p % 1000;
				if (indexP < 50)
				{
					textureOverwrite = slopeMake ? color_1 : color_7;
				}
				else
				{
					textureOverwrite = color_3;
				}
			}
			if (testColoring == 3)
			{
				// differenz
				if (diff < 35) textureOverwrite = color_1;
				if (diff < 25) textureOverwrite = color_6;
				if (diff < 15) textureOverwrite = color_2;
				if (diff < 5) textureOverwrite = color_3;
			}
			if (makeRim)
			{
				if (testColoring == 4)
				{
					// differenz path
					if (relSize < 10) textureOverwrite = color_3;
					if (relSize < 8) textureOverwrite = color_6;
					if (slopeMake)
					{
						if (relSize < 6) textureOverwrite = color_2;
						if (relSize < 2) textureOverwrite = color_1;
					}
					else
					{
						if (relSize < 6) textureOverwrite = color_5;
						if (relSize < 2) textureOverwrite = color_7;
					}
				}

				// g_Map.log("dSort:" + JSON.stringify(self.d) + " " + diff);

				var vorWidthV = vorWidth + par2;
				if (diff < vorWidthV)
				{
					// interim level
					h = cliffHeight + par1;
				}
				if (slopeMake)
				{
					// relSize 		is the basewidth of the ramp
					//				2 is a tiny ramp
					//				rampsize is the "broadness"
					// hPlateau 			is the height, the ramp must go up or down to
					// cliffHeight + par1		is the height of the interim level
					// slopeStart			factor, the ramp has more space than the interim height
					//				values below 1.0 make the ramp start in the interim
					// slopeAscent			the smaller, the longer will be the ramp
					var slopeStart = 1.2 + 0.05 * par2Raw;
					var slopeAscent = 0.25;
					// mathematical not totally correct
					var rampBroadFactor = Math.max(1, (rampSize - relSize - 2) / rampSize);
					var rampFactor = Math.max(0, Math.min(1, (slopeStart * vorWidthV - slopeAscent * diff) / vorWidthV));
					h = (cliffHeight + 0.05 * par1) * rampFactor + hPlateau * (1 - rampFactor);

					if (rampSize > relSize && rampFactor > 0.1)
					{
						// texture value, do not change
						var pathPar = 2;
						self.path = Math.max(1, pathPar - Math.abs(pathPar - 2 * pathPar * rampFactor));
					}
					ramp_color = color_7;
					if (rampFactor > 0.1 && rampFactor < 0.9)
					{
						ramp_color = color_5;
					}
				}
			}
		}
		// g_Map.log("height:" + h);
		if (pass == 0)
		{
			self.height += h;
		}
	}

	if (pass == 1 && testColoring == 0)
	{
		if (self.base > 0.6 || self.mine > 0)
		{
			self.allowElements = false;
		}
		if (self.base > 0.4)
		{
			// the base is always flat, and nothing but the explicit set elements should exist there
			// but the base has a margin, which belongs to the base, but can be influenced by natures
			if (0.5 * Math.random() < self.base - 0.3)
			{
				texture = pickRandom(texture_base_outer);
			}
			if (0.1 * Math.random() < self.base - 0.7)
			{
				texture = pickRandom(texture_base_inner);
			}
		}
	}
	if (self.forest1 > 0 && testColoring == 0)
	{
		// small depression with shrubs
		if (pass == 0)
		{
			self.height += height_depression * Math.sqrt(self.forest1);
		}
		if (pass == 1 && self.path < 0.5 && self.base < 0.6)
		{
			if (Math.random() < self.forest1)
			{
				texture = pickRandom(texture_depression_outer);
			}
			if (0.8 * Math.random() < self.forest1)
			{
				texture = pickRandom(texture_depression_inner);
				element = pickRandom(objects_depression_inner);
			}
		}
	}
	if (self.forest2 > 0 && testColoring == 0)
	{
		// small elevations with trees
		if (pass == 0)
		{
			self.height += height_trees1 * Math.sqrt(self.forest2);
		}
		if (pass == 1)
		{
			var density = self.forestD;
			density = densityForestMin - 1 + 2 * (densityForestMax - densityForestMin) * density;
			if (2 * Math.random() < self.forest2 + 5 * density && self.path < 0.5 && self.base < 0.6)
			{
				// the bushy outside
				var textureT = pickRandom(texture_trees1_outer);
				if (timberline > 0) textureT = pickRandom(texture_trees1_outer_high);
				if (textureT.length > 1) texture = textureT;
			}

			if (5 * Math.random() < self.forest2 + density && self.path < 0.5 && self.base < 0.6)
			{
				texture = pickRandom(texture_trees1_inner);
				element = pickRandom(objects_trees1_inner);
				if (timberline > 0)
				{
					element = pickRandom(objects_trees1_inner_high);
				}
			}
		}
	}
	if (self.mine > 0 && testColoring == 0 && Math.random() < self.mine + 0.2)
	{
		texture = pickRandom(texture_mine);
	}

	if (pass == 1 && testColoring == 0)
	{
		// textur for path
		if (self.path > 0.01)
		{
			var texturePath = "";
			if (self.path > 0.7)
			{
				element = null;
			}
			if (self.path > 0.8 && self.slope > 2)
			{
				texturePath = pickRandom(texture_path);
				if (timberline > 0)
				{
					texturePath = pickRandom(texture_path_high);
				}
			}
			if (texturePath.length > 1)
			{
				texture = texturePath;
			}
		}
		// texture for slope
		if (self.slope > 0.1 && self.path < 0.5)
		{
			if (self.slope > 1)
			{
				self.allowElements = false;
			}
			if (self.slope > 2)
			{
				element = null;
			}
			// explain slopes
			// every slope value greater zero is a slope
			// texture = texture_cliff1_inner
			if (self.slopeTop > 0.1)
			{
				// slope is going down
				// texture = "red";
			}
			if (self.slope > 3)
			{
				// very close to the ridge
				texture = pickRandom(texture_cliff1_outer);
				if (timberline > 0)
				{
					texture = pickRandom(texture_cliff1_outer_high);
				}
			}
			if (self.slope > 3.5)
			{
				// ridge itself, if no texture is set, use the texture from the near cliff
				// texture = "red";
				texture = pickRandom(texture_cliff1_inner);
				if (timberline > 0)
				{
					texture = pickRandom(texture_cliff1_inner_high);
				}
			}
		}
	}
	if (textureOverwrite !== undefined)
	{
		self.texture = textureOverwrite;
	}
	if (self.texture !== undefined)
	{
		texture = self.texture;
	}
	if (pass == 0 && testColoring == 6)
	{
		texture = ramp_color;
		self.texture = ramp_color;
	}
	if (pass == 1)
	{
		// g_Map.log("height 2:" + self.hill1 + " " + height);

		if (texture !== undefined)
		{
			g_Map.setTexture({ "x": self.x, "y": self.y }, texture);
		}
		if (self.allowElements && (element !== undefined) && element != undefined)
		{
			g_Map.placeEntityAnywhere(element, 0, { "x": self.x, "y": self.y }, randomAngle());
			self.allowElements = false;
		}
		// g_Map.log("height:" + self.height);
	}

	if (pass == 0)
	{
		g_Map.setHeight({ "x": self.x, "y": self.y }, self.height);
	}
	return this;
}

function Cell(paramx, paramy, paramheight)
{
	this.x = paramx;
	this.y = paramy;
	// elements may be banned on cliffs or close to cliffs
	this.allowElements = true;
	this.height = paramheight;
	this.owner = 0;
	this.forest1 = 0;
	this.forest2 = 0;
	// density
	this.forestD = 0;
	// this.forest3 = 0;
	// this.flatland1 = 0;
	// this.flatland2 = 0;
	// this.hill1 = 0;
	// this.hill2 = 0;
	// this.hill3 = 0;
	// this.water1 = 0;
	// this.water2 = 0;
	this.mine = 0;
	this.base = 0;
	this.path = 0;
	this.slope = 0;
	this.slopeTop = 0;
	this.texture = undefined;
	return this;
}

function AreaMap(mapTypePar, fieldSizePar)
{
	// index 0..19 are reserved for global typology
	// index 20..49 are reserved for local typology
	var index = 50;
	var mapType = mapTypePar;
	var playerIndex = 0;
	var numberPlayers = getNumPlayers();
	var mapSize = g_Map.getSize();
	var field = {};
	if (fieldSizePar !== undefined)
	{
		fieldSize = fieldSizePar;
	}
	var mapSizeDist2 = 0.5 * mapSize;
	var self = this;

	var maxh = Math.floor(0.8 * mapSize / fieldSize);
	var maxw = 40;
	var maxr = Math.PI / numberPlayers;

	// create Field
	for (let maxhi = 0; maxhi < 2 * maxh; maxhi += 1)
	{
		for (let maxwi = -maxw; maxwi < maxw + 1; maxwi += 1)
		{
			let w = 0, x = 0, y = 0;
			var legal = true;
			var mapTypeM = Math.floor(mapType / 10);
			var mapTypeR = mapType % 10;
			if (mapTypeM == 0)
			{
				// orthogonal
				x = fieldSize * maxwi;
				y = mapSizeDist2 - fieldSize * maxhi - 0.5 * fieldSize;
			}
			if (mapTypeM == 1)
			{
				// hexmuster 1
				x = fieldSize * (maxwi - 0.25 + 0.5 * (maxhi % 2));
				y = mapSizeDist2 - 0.8660255 * fieldSize * maxhi - 0.5 * fieldSize;
			}
			if (mapTypeM == 2)
			{
				// hexmuster 2
				x = 0.8660255 * fieldSize * maxwi + 0.5 * fieldSize;
				y = mapSizeDist2 - fieldSize * (maxhi + 0.25 + 0.5 * (maxwi % 2));
			}
			if (mapTypeM == 3)
			{
				// circle
				w = 0.33 * Math.PI / (maxhi + 0.5);
				if (Math.PI < Math.abs(w * maxwi)) legal = false;
				x = fieldSize * (maxhi + 0.5) * Math.sin(w * maxwi);
				y = mapSizeDist2 - fieldSize * (maxhi - 0.5) * Math.cos(w * maxwi);
			}
			if (mapTypeM == 4)
			{
				// mixcircle
				w = 0.33 * Math.PI / (maxhi + 0.5);
				if (Math.PI < Math.abs(w * maxwi)) legal = false;
				var x1 = fieldSize * (maxwi - 0.25 + 0.5 * (maxhi % 2));
				var y1 = mapSizeDist2 - 0.8660255 * fieldSize * maxhi - 0.5 * fieldSize;
				var x2 = fieldSize * (maxhi + 0.5) * Math.sin(w * maxwi);
				var y2 = mapSizeDist2 - fieldSize * (maxhi - 0.5) * Math.cos(w * maxwi);
				x = 0.5 * x1 + 0.5 * x2;
				y = 0.5 * y1 + 0.5 * y2;
			}
			var d = Math.sqrt(x * x + y * y);
			if (legal && d <= mapSizeDist2)
			{
				// var w = Math.abs(Math.atan2(x, y));
				w = Math.abs(Math.atan2(x, y));
				var wTest = Math.sin(maxr - w) * d;
				if (0.275 * fieldSize < wTest)
				{
					if (!(maxhi in field))
					{
						field[maxhi] = {};
					}
					// every field has following information
					//	id	index, normally a four digit number with first number = player
					//		the last 3 numbers are taken for identification within the map
					//	active	...
					//	type	...
					// 	x,y	Basekoordinates without Rotation
					//	rx,ry	Coordinates after Random-Displacement without Rotation
					//		the Random-Displacement changes after randomize()
					//	ra	the amount of randomize, 0 = no Random for this field
					//	height	after random [0,1]
					//	[heightFixed]	optional
					//	slope	...
					field[maxhi][maxwi] = { "id": index, "x": x, "y": y, "rx": x, "ry": y, "type": "", "active": false, "slope": true, "ra": defaultRandom, "height": 1 };
					index += 1;
					// g_Map.log("setField:" + maxhi + "," + maxwi + "<=" + (wTest / fieldSize));
				}
			}
		}
	}

	self.rotate = function(x, y)
	{
		var wOffset = -0.25 * Math.PI;
		var w = 2 * Math.PI * (playerIndex - 1) / numberPlayers + wOffset;
		var xTrans = 0.5 * mapSize + x * Math.cos(w) - y * Math.sin(w);
		var yTrans = 0.5 * mapSize + x * Math.sin(w) + y * Math.cos(w);
		return { "x": xTrans, "y": yTrans };
	};

	this.setPlayer = function(p)
	{
		playerIndex = p;
		return this;
	};

	this.getAreaSizeH = function()
	{
		// height
		return Object.keys(field).length;
	};

	this.getAreaBoundariesAt = function(h)
	{
		var l = self.getAreaSizeH();
		if (l <= Math.abs(h)) return [];
		if (h < 0) h = l + h;
		var k1 = Object.keys(field).sort(function(a, b) { return Number.parseInt(a, 10) - Number.parseInt(b, 10); });
		var k2 = Object.keys(field[k1[h]]).sort(function(a, b) { return Number.parseInt(a, 10) - Number.parseInt(b, 10); });
		var result = [Number.parseInt(k2[0], 10), Number.parseInt(k2.at(-1), 10)];
		// g_Map.log("boundaries: " + String(h) + JSON.stringify(result) + '\t' + JSON.stringify(k2));
		return result;
	};

	this.print = function()
	{
		// print the dimensions to the console
		var miniMap = new Array();
		var fieldMin = 0, fieldMax = 0;
		var k1 = Object.keys(field).map(x => Number.parseInt(x, 10)).sort(function(a, b) { return Number.parseInt(a, 10) - Number.parseInt(b, 10); });
		for (const [i, element] of k1.entries())
		{
			var k2 = Object.keys(field[element]).map(x => Number.parseInt(x, 10)).sort(function(a, b) { return Number.parseInt(a, 10) - Number.parseInt(b, 10); });
			fieldMin = Math.min(fieldMin, k2[0]);
			fieldMax = Math.max(fieldMax, k2.at(-1));
			g_Map.log("log:\t" + String(i) + ":\t" + String(k2[0]) + "\t" + String(k2.at(-1)));
		}
		g_Map.log("logMap:\t" + String(k1.length) + ":\t" + String(fieldMin) + "\t" + String(fieldMax));
	};

	this.setMap = function(mapData)
	{
		// mapData = ['', '', '', ...]
		g_Map.log("mapData:" + JSON.stringify(mapData));
		var areaDimY = self.getAreaSizeH();
		for (let iy = 0; iy < areaDimY; iy += 1)
		{
			var iyh = iy;
			var areaBoundaries = self.getAreaBoundariesAt(iy);
			if (areaBoundaries.length > 1)
			{
				for (let ix = areaBoundaries[0]; ix < areaBoundaries[1] + 1; ix += 1)
				{
					var resultType = "§1";
					if (field[iy] !== undefined)
					{
						resultType = "§2";
						if (field[iy][ix] !== undefined)
						{
							resultType = "§3";
							var testMarker = true;
							if (iyh < mapData.length)
							{
								resultType = "§4";
								var posOnMap = Math.round(mapData[iyh].length * 0.5 + ix - 1);
								if (posOnMap >= 0 && posOnMap < mapData[iyh].length)
								{
									// g_Map.log("field set:\t" + String(ix) + "\t" + String(iy) + "\t" + String(posOnMap));
									testMarker = false;
									resultType = mapData[iyh][posOnMap];

									field[iy][ix].type = resultType;
								}
								else
								{
									// field not in x dim
									// g_Map.log("field !set:\t" + String(ix) + "\t" + String(iy) + "\t" + String(posOnMap) + "\t" + String(iyh) + "\t" + mapData[iyh]);
									resultType = "§5";
								}
							}
							else
							{
								// field not in y dim
								// g_Map.log("field !!set:\t" + String(ix) + "\t" + String(iy));
							}
							if (testMarker)
							{
								field[iy][ix].type = "";
							}
						}
					}
					// g_Map.log("setMap:" + iy + "," + ix + "=" + resultType);
				}
			}
		}
	};

	this.activeAll = function()
	{
		var him = Object.keys(field);
		for (const element of him)
		{
			var wim = Object.keys(field[element]);
			for (const element_ of wim)
			{
				var f = field[element][element_];
				f.active = true;
			}
		}
	};

	this.getElement = function(x, y)
	{
		// more precisely: get field (change that name)
		var result = null;
		try
		{
			if (field[y] !== undefined && field[y][x] !== undefined)
			{
				result = field[y][x];
			}
		}
		catch {
			g_Map.log("Exception creating the map ");
		}
		if (result == undefined)
		{
			// g_Map.log("\ngetElement == null:" + y + "," + x + "\n");
		}
		return result;
	};

	this.getElementPosition = function(x, y, yOffs, xOffs)
	{
		if (xOffs === undefined) xOffs = 0;
		if (yOffs === undefined) yOffs = 0;
		var f = self.getElement(x, y);
		if (f == 0 || f == undefined) return null;
		return self.rotate(f.rx + xOffs, f.ry + yOffs);
	};

	this.setElementHome = function(x, y, entity, yOffs, xOffs)
	{
		// align the angle of the element to a multiple of 90 degrees
		var p = self.getElementPosition(x, y, yOffs, xOffs);
		if (p == undefined) return self;
		if (testMap != 6)
		{
			var angle = 0.5 * Math.PI * Math.floor(4 * (playerIndex - 1) / numberPlayers) - 0.75 * Math.PI;
			g_Map.placeEntityAnywhere(entity, playerIndex, { "x": p.x, "y": p.y }, angle);
		}
		return p;
	};

	this.setElement = function(x, y, entity, yOffs, xOffs)
	{
		// set an element for the player
		// RandomAngle
		var p = self.getElementPosition(x, y, yOffs, xOffs);
		if (p != undefined && testMap != 6) g_Map.placeEntityAnywhere(entity, playerIndex, { "x": p.x, "y": p.y }, randomAngle());
		return p;
	};

	this.setElementGaia = function(x, y, entity, yOffs, xOffs)
	{
		// set an Element for Gaia (Player 0)
		// RandomAgle and no Player
		var p = self.getElementPosition(x, y, yOffs, xOffs);
		// g_Map.log("setGaia: " + JSON.stringify([x,y,p]));
		if (p != undefined && testMap != 6) g_Map.placeEntityAnywhere(entity, 0, { "x": p.x, "y": p.y }, randomAngle());
		return p;
	};

	this.setHeight = function(x, y, height)
	{
		// terrain has two heights
		// 	0	normal
		//	1	elevated
		// if the height is not explicitly set, it is random
		var f = self.getElement(x, y);
		// g_Map.log("setHeight: " + JSON.stringify([height,x,y,f]));
		if (f != undefined) f.heightFixed = height;
		return self;
	};

	this.setId = function(x, y, _id)
	{
		var f = self.getElement(x, y);
		if (f != undefined) f.id = _id;
		return self;
	};

	this.getTopo = function()
	{
		// makes a List with all Hills
		// {'x': float, 'y': float, 'owner': [1xxx..8xxx], 'elevation': [0..1], 'slope': true/false}
		// Math.floor(Math.random() * 2)
		var result = [];
		var him = Object.keys(field);
		for (const element of him)
		{
			var wim = Object.keys(field[element]);
			for (const element_ of wim)
			{
				var f = field[element][element_];
				if (f.active)
				{
					var t = self.rotate(f.rx, f.ry);
					var globalIndex = f.id;
					if (globalIndex > 19)
					{
						globalIndex += 1000 * playerIndex;
					}
					result.push({ "x": t.x, "y": t.y, "owner": globalIndex, "elevation": f.height, "slope": f.slope });
				}
			}
		}
		return result;
	};

	this.placeObjects = function()
	{
		// place all the data, including random hills
		var _id = 50;
		var _idBase = 20;
		var stringDisplay = {};
		var areaDimY = self.getAreaSizeH();
		for (let iy = 0; iy < areaDimY; iy += 1)
		{
			var stringDisplayRow = "";
			var iyh = areaDimY - iy;
			var areaBoundaries = self.getAreaBoundariesAt(iy);
			if (areaBoundaries.length > 1)
			{
				for (let ix = areaBoundaries[0]; ix < areaBoundaries[1] + 1; ix += 1)
				{
					var stringDisplayElem = "@";
					var testMarker = true;
					var fa = self.getElement(ix, iy);
					// isMappedElement
					// 	0	no mapped Element
					//	1	mapped Element inactive
					//	2	mapped Element active
					var isMappedElement = 0;
					_id += 1;
					if (fa != undefined)
					{

						stringDisplayElem = ".";
						// set Random

						fa.ra = 2.2;
						if (fa.type.length > 0)
						{
							if ("!?".includes(fa.type))
							{
								_idBase += 1;
							}
							if ("fguwxyFGW.!?".includes(fa.type))
							{
								fa.ra = 0;
							}
							if ("XY".includes(fa.type))
							{
								fa.ra = 0.6;
							}
							if ("o".includes(fa.type))
							{
								fa.ra = 1;
							}
							if ("O".includes(fa.type))
							{
								fa.ra = defaultRandom;
							}
						}
						if ((testMap > 0 && testMap < 5) || (testMap == 6))
						{
							fa.ra = 0;
						}
						var randW = 2 * Math.PI * Math.random();
						var randD = Math.random();
						randD = (1 - randD * randD) * fieldSize * fa.ra;
						var randHeight = Math.floor(Math.random() * 2);
						if (testMap > 0 && testMap < 5)
						{
							randHeight = 0;
						}
						if (fa.heightFixed !== undefined) randHeight = fa.heightFixed;
						fa.rx = fa.x + randD * Math.cos(randW);
						fa.ry = fa.y + randD * Math.sin(randW);
						fa.height = randHeight;
						if (fa.type.length > 0)
						{
							if (!" @".includes(fa.type))
							{
								// default for all mapped Element
								// space/at takes the default structure
								testMarker = false;
								isMappedElement = 1;
								stringDisplayElem = fa.type;
							}
							// g_Map.log("field: " + ix + ', ' + iy + ' ' + JSON.stringify(fa));
							// g_Map.log("field: " + ix + ', ' + iy + ' ' + fa.type);
							if (".".includes(fa.type))
							{
								// deactivate field
								field[iy][ix].id = _id;
								field[iy][ix].active = false;
								// self.setElement(ix,iy,"other/obelisk",  0, 0);
								// self.setElementGaia(ix,iy,"other/obelisk", 0, 0);
							}
							if ("!?".includes(fa.type))
							{
								// field claimed by base
								// is not actually the base, but terrain, that is part of the base
								// these fields all connect
								field[iy][ix].id = _idBase;
								field[iy][ix].active = true;
								field[iy][ix].height = 0;
								field[iy][ix].slope = true;
								if ("?".includes(fa.type))
								{
									field[iy][ix].slope = false;
								}
								isMappedElement = 2;
							}
							if ("wW".includes(fa.type))
							{
								// civilCentre
								var base = self.setElementHome(ix, iy, civilCentre);
								setPoint(base.y, base.x, 32, setBase);
								self.setElement(ix, iy, citizen_female, 0, -6);
								self.setElement(ix, iy, citizen_female, 0, 6);
								self.setElement(ix, iy, citizen_female, -2, -6);
								self.setElement(ix, iy, citizen_female, -2, 6);
								self.setElement(ix, iy, infantry_melee, -4, -6);
								self.setElement(ix, iy, infantry_ranged, -4, 6);
								self.setElement(ix, iy, infantry_ranged, -6, -6);
								self.setElement(ix, iy, infantry_melee, -6, 6);
								field[iy][ix].id = _id;
								field[iy][ix].active = false;
								if ("W".includes(fa.type))
								{
									self.setElementGaia(ix, iy, food1, 9, -2);
									self.setElementGaia(ix, iy, food1, 9, -3);
									self.setElementGaia(ix, iy, food1, 9, 3);
									self.setElementGaia(ix, iy, food1, 9, 2);
									var ms1 = self.setElementGaia(ix, iy, mine_metal, 8, -12);
									setPoint(ms1.y, ms1.x, 5, setMine);
									setPoint(ms1.y, ms1.x, 120, setForestD);
									var ms2 = self.setElementGaia(ix, iy, mine_stone, 8, 12);
									setPoint(ms2.y, ms2.x, 5, setMine);
									setPoint(ms2.y, ms2.x, 120, setForestD);
								}
								if ("-".includes(fa.type))
								{
									// additional mines
									var ms1 = self.setElementGaia(ix, iy, mine_stone, -2, -18);
									setPoint(ms1.y, ms1.x, 5, setMine);
									var ms2 = self.setElementGaia(ix, iy, mine_metal, -2, 18);
									setPoint(ms2.y, ms2.x, 5, setMine);
								}
								isMappedElement = 1;
							}
							if ("fF".includes(fa.type))
							{
								// food
								self.setElementGaia(ix, iy, food1, 1, 0);
								self.setElementGaia(ix, iy, food1, -1, 0);
								self.setElementGaia(ix, iy, food1, 0, 1);
								self.setElementGaia(ix, iy, food1, 0, -1);
								if ("F".includes(fa.type))
								{
									self.setElementGaia(ix, iy, food1, 2, 0);
									self.setElementGaia(ix, iy, food1, -2, 0);
									self.setElementGaia(ix, iy, food1, 1, -1);
									self.setElementGaia(ix, iy, food1, -1, -1);
								}
							}
							if ("gG".includes(fa.type))
							{
								// predator
								self.setElementGaia(ix, iy, predator1, 1, 0);
								self.setElementGaia(ix, iy, predator1, -1, 0);
								if ("G".includes(fa.type))
								{
									self.setElementGaia(ix, iy, predator1, 0, -1);
									self.setElementGaia(ix, iy, predator1, 0, 1);
									self.setElementGaia(ix, iy, predator1, 1, -1);
									self.setElementGaia(ix, iy, predator1, 1, 1);
									self.setElementGaia(ix, iy, predator1, -1, -1);
									self.setElementGaia(ix, iy, predator1, -1, 1);
								}
							}
							if ("-".includes(fa.type))
							{
								// base - mine Metall
								var ms1 = self.setElementGaia(ix, iy, mine_metal);
								setPoint(ms1.y, ms1.x, 5, setMine);
								setPoint(ms1.y, ms1.x, 120, setForestD);
								field[iy][ix].id = _idBase;
								field[iy][ix].active = false;
							}
							if ("-".includes(fa.type))
							{
								// base - mine Stone
								var ms1 = self.setElementGaia(ix, iy, mine_stone);
								setPoint(ms1.y, ms1.x, 5, setMine);
								setPoint(ms1.y, ms1.x, 120, setForestD);
								field[iy][ix].id = _idBase;
								field[iy][ix].active = false;
							}
							if ("u".includes(fa.type))
							{
								// base - mine Stone
								var ms1 = self.setElementGaia(ix, iy, mine_stone, 0, -3);
								setPoint(ms1.y, ms1.x, 5, setMine);
								var ms1 = self.setElementGaia(ix, iy, mine_metal, 0, +3);
								setPoint(ms1.y, ms1.x, 5, setMine);
								setPoint(ms1.y, ms1.x, 120, setForestD);
								field[iy][ix].id = _id;
								field[iy][ix].active = false;
								isMappedElement = 2;
							}
							if ("xXyYoO".includes(fa.type))
							{
								// hills
								// g_Map.log("field: " + ix + ', ' + iy + ' ' + fa.type);
								field[iy][ix].id = _id;
								field[iy][ix].active = true;
								if ("yYoO".includes(fa.type))
								{
									var pf = self.getElementPosition(ix, iy);
									setPoint(pf.y, pf.x, 120, setForestD);
								}
								isMappedElement = 2;
							}
						}

						if (testMarker || testMap == 6)
						{
							var setHillFlag = false;
							if (mapTypeR == 1) setHillFlag = (iy % 5 == 1 && ix % 5 == 0);
							if (mapTypeR == 2) setHillFlag = (iy % 5 == 1 && (ix + iy) % 5 == 0);
							if (mapTypeR == 3) setHillFlag = (iy % 6 == 1 && ix % 6 == 0);
							if (mapTypeR == 4) setHillFlag = (iy % 6 == 1 && (ix + iy) % 6 == 0);
							if (mapTypeR == 5) setHillFlag = (iy % 7 == 1 && ix % 7 == 0);
							if (mapTypeR == 6) setHillFlag = (iy % 7 == 1 && (ix + iy) % 7 == 0);
							if (mapTypeR == 7) setHillFlag = (iy % 8 == 1 && ix % 8 == 0);
							if (mapTypeR == 8) setHillFlag = (iy % 8 == 1 && (ix + iy) % 8 == 0);
							if (mapTypeR == 9) setHillFlag = (iy % 6 == 1 && ix % 8 == 0);

							if (isMappedElement > 0)
							{
								// has the Element
								setHillFlag = false;
								if (isMappedElement > 1)
								{
									setHillFlag = true;
								}
							}
							else
							{
								if (setHillFlag) stringDisplayElem = "O";
							}

							if (setHillFlag)
							{
								if ([2, 3, 6].includes(testMap))
								{
									// self.setElement(ix,iy,"campaigns/campaign_city_test",  0, 0);
									var testMapOld = testMap;
									testMap = 0;
									self.setElement(ix, iy, develop_mapHill, 0, 0);
									testMap = testMapOld;
								}
								field[iy][ix].id = _id;
								field[iy][ix].active = true;
							}
							else
							{
								if ([2, 3, 6].includes(testMap))
								{
									var testMapOld = testMap;
									testMap = 0;
									self.setElement(ix, iy, develop_mapLand, 0, 0);
									testMap = testMapOld;
								}
							}
						}
					}
					stringDisplayRow += stringDisplayElem;
				}
			}
			stringDisplay[iy] = stringDisplayRow;
		}
		if (playerIndex == 1)
		{
			// show the map for the first player, for the other players it just repeats itself
			var mapKeys = Object.keys(stringDisplay);
			var ResultString1 = "";
			var ResultString2 = "";
			var maxLength = 0;
			for (const mapKey of mapKeys)
			{
				maxLength = Math.max(maxLength, stringDisplay[mapKey].length);
			}
			for (const mapKey of mapKeys)
			{
				var sD = stringDisplay[mapKey];
				ResultString2 += "\"" + sD + "\",";
				while (sD.length < maxLength) sD = " " + sD + " ";
				ResultString1 += "\"" + sD + "\",\n";
			}
			g_Map.log("\n" + ResultString1 + "\n");
			g_Map.log("\n" + ResultString2 + "\n");
		}
	};
}

// brush, an sorted list of all fields, sorted by distance
function Brush()
{
	var val = [];
	for (let y = 0; y < 80; y++)
	{
		for (let x = 0; x < 80; x++)
		{
			var r = Math.sqrt(x * x + y * y);
			val.push({ "r": r, "x": x, "y": y });
		}
	}
	val.sort(function(a, b) { return a.r - b.r; });

	this.get = function(maxV)
	{
		// get a list of all fields to a certain distance
		// the result is a cone, with value 1.0 at the center, and value 0.0 at the edge
		var result = [];
		var i = 0;
		while (i < val.length)
		{
			if (val[i].r < maxV)
			{
				result.push({ "x": val[i].x, "y": val[i].y, "v": 1 - val[i].r / maxV, "d": val[i].r }, { "x": -val[i].x, "y": val[i].y, "v": 1 - val[i].r / maxV, "d": val[i].r }, { "x": val[i].x, "y": -val[i].y, "v": 1 - val[i].r / maxV, "d": val[i].r }, { "x": -val[i].x, "y": -val[i].y, "v": 1 - val[i].r / maxV, "d": val[i].r });
				i++;
			}
			else i = val.length;
		}
		return result;
	};
	return this;
}

function Distance(fromCenterPar, distanceMinPar, distanceMaxPar)
{
	// distanceMinPar	fromCenterPar=True	minimumDistance from the center
	// distanceMaxPar	fromCenterPar=True	minimumDistance from the edge
	// var di = Distance(True, 20, 10)
	// var di1 = di.get(20)
	if (fromCenterPar === undefined) fromCenterPar = True;
	if (distanceMinPar === undefined) distanceMinPar = 0;
	if (distanceMaxPar === undefined) distanceMaxPar = 0;
	var fromCenter = fromCenterPar;
	var distanceMin = distanceMinPar;
	var distanceMax = distanceMaxPar;

	this.getDist = function(width)
	{
		var result = distanceMin;
		var maxDist = 0.5 * dd - distanceMax;
		if (numPlayers > 2)
		{
			result = width / Math.sin(Math.PI / numPlayers);
		}
		if (fromCenter)
		{
			if (result < distanceMin) result = distanceMin;
			if (result > 0.5 * dd - distanceMax) return -1;
			return result;
		}
		if (result > 0.5 * dd - distanceMin) return -1;
		return 0.5 * dd - distanceMin;

	};
}

function dBrush()
{
	// brush with information distance and direction
	var val = [];
	var valMax = 270;
	for (let y = -valMax; y < valMax + 1; y++)
	{
		for (let x = -valMax; x < valMax + 1; x++)
		{
			var r = Math.sqrt(x * x + y * y);
			var w = Math.atan2(y, x);
			val.push({ "w": w, "r": r, "x": x, "y": y });
		}
	}
	val.sort(function(a, b) { return a.r - b.r; });

	this.get = function(maxV)
	{
		// get a list of all fields to a certain distance
		// the result is a cone, with value 1.0 at the center, and value 0.0 at the edge
		var result = [];
		var i = 0;
		while (i < val.length)
		{
			if (val[i].r < maxV)
			{
				// "v": 1-val[i]["r"] / maxV,
				result.push({ "x": val[i].x, "y": val[i].y, "d": val[i].r, "w": val[i].w });
				i++;
			}
			else i = val.length;
		}
		return result;
	};
	return this;
}

var dbrush = new dBrush();
var dbrushB = dbrush.get(180);

if (enabled)
{
	// main - program
	var brush = new Brush();
	var citycenterXY = [];
	var mineXY = [];
	var createTopo = true;

	try
	{
		// initialize all cells
		var map = new Array();
		for (let i = 0; i < dd; i++)
		{
			var row = new Array();
			for (let j = 0; j < dd; j++)
			{
				// height is a sigmoid from the distance from the center
				// this is a multi-spiral that elevates the height a little
				const dx = j - 0.5 * dd, dy = i - 0.5 * dd;
				var d = Math.sqrt(dx * dx + dy * dy);
				var de = Math.exp(5 * (0.6 - d / dd));
				// make the height profil a spirale from the center
				var ww = Math.atan2(dy, dx);
				// raise the height to the edges by maximal 12 for very large maps
				var addHeight = 12 * Math.max(0, Math.cos(numPlayers * ww + d / 20)) / (1 + de);
				row.push(new Cell(i, j, heightLand + addHeight));
			}
			map.push(row);
		}
	}
	catch {
		g_Map.log("Exception creating the map ");
	}
	Engine.SetProgress(2);

	if (testMap < 3)
	{
		// trees on a small hill
		setPattern1(margin_trees1, size_trees1, setForest2, 0.8);
	}

	if (testMap < 3)
	{
		// depression, swamps
		setPattern2(margin_depression, size_depression, setForest1, 0.8);
	}
	Engine.SetProgress(5);

	if (enabled)
	{
		// create the topography
		const a = new AreaMap(areaMapTyp);
		var areaDimY = a.getAreaSizeH();

		a.setMap(mapLayout[mapAssign[dd][numPlayers]]);

		for (let i = 1; i < (numPlayers + 1); i++)
		{
			var aa = a.setPlayer(i);
			aa.placeObjects();

			var localHills = aa.getTopo();
			hills.push(...localHills);
		}

		for (let jj = 0; jj < saveDistanceLoop; jj += 1)
		{
			// replace hills to ensure a save distance
			var moveDistance = 0;
			var replace = {};
			for (let j1 = 0; j1 < hills.length; j1 += 1)
			{
				var ownerIndex = hills[j1].owner % 1000;
				if (ownerIndex >= 50)
				{
					replace[j1] = { "x": 0, "y": 0 };
					for (let j2 = 0; j2 < hills.length; j2 += 1)
					{
						if (j1 != j2)
						{
							var ownerIndex2 = hills[j2].owner % 1000;
							const dx = hills[j1].x - hills[j2].x;
							const dy = hills[j1].y - hills[j2].y;
							var ddist = dx * dx + dy * dy;
							var d = Math.sqrt(ddist);
							// distance between Hills
							var dfac = 2;
							var drad = 10;
							// distance from BaseObjects
							if (ownerIndex2 < 50)
							{
								dfac = 15;
								drad = 25;
							}
							if (d > 0 && d < drad)
							{
								replace[j1].x += dfac * dx / dd;
								replace[j1].y += dfac * dy / dd;
							}
							// g_Map.log("^^^" + JSON.stringify(hills[j]));
						}
					}
				}
			}
			for (const [j1, hill] of hills.entries())
			{
				if (j1 in replace)
				{
					// g_Map.log("^^^" + JSON.stringify(replace[j1]));
					var rx = replace[j1].x;
					var ry = replace[j1].y;
					moveDistance += Math.sqrt(rx * rx + ry * ry);
					hill.x += rx;
					hill.y += ry;
				}
			}
			// g_Map.log("safety: moveDistance" + moveDistance);
		}

		Engine.SetProgress(15);

		if (([0, 1, 4, 5].includes(testMap)) && createTopo)
		{
			// turn the hills-data in Topographie,
			// this takes nearly 80% of the time
			let roC = 1;
			if (dd > 384) roC = 2;
			var mcTotal = roC * hills.length * dbrushB.length;
			var mcTotali = 0, progressLastValue = 0;
			for (let ro = 0; ro < roC; ro += 1)
			{
				for (let j = 0; j < dbrushB.length; j++)
				{
					// g_Map.log("^^^" + j + "/" + dbrushB.length);
					for (const hill of hills)
					{
						// g_Map.log("generating hills: " + hills[i].owner + " " + i + "/" + hills.length);
						setHillD(ro, roC, j, hill.y, hill.x, hill.owner, hill.elevation);
						// var mcActual = ro * hills.length + i;
						// making hills is one of the most time-consuming tasks, so there are regular updates
						var progressHill = Math.round((85 - 15) * mcTotali / mcTotal + 15);
						if (progressHill > progressLastValue)
						{
							Engine.SetProgress(progressHill);
							progressLastValue = progressHill;
						}
					}
				}

				g_Map.log("generating heights");
				for (let i = 0; i < dd; i++)
				{
					for (let j = 0; j < dd; j++)
					{
						if (map[i][j] !== undefined)
						{
							// g_Map.log("rendering:" + i + " " + j);
							renderCell(map[i][j], 0);
							delete map[i][j].d;
						}
					}
				}
			}
		}
		// for (let j=0; j < hills.length; j+= 1) {
		//	g_Map.log("^^^" + JSON.stringify(hills[j]));
		// }
	}

	// render pass 2 (slopes)
	Engine.SetProgress(85);
	g_Map.log("calculating slopes");
	for (let i = 0; i < dd; i++)
	{
		for (let j = 0; j < dd; j++)
		{
			var centerH = heightLand;
			if (map[i][j] !== undefined)
			{
				centerH = getHeight(map[i][j]);
				var diffMax = 0;
				var diffMin = 0;
				for (let iDiff = -2; iDiff < 3; iDiff++)
				{
					for (let jDiff = -2; jDiff < 3; jDiff++)
					{
						var diff = iDiff * iDiff + jDiff * jDiff;
						if (diff > 0.1 && diff < 5.1)
						{
							// only take fields in the distanze of sqrt(5.1)
							var ip = i + iDiff;
							var jp = j + jDiff;
							if (ip >= 0 && ip < dd && jp >= 0 && jp < dd && map[ip][jp] !== undefined)
							{
								var diffHeight = (getHeight(map[ip][jp]) - centerH) / diff;
								diffMax = Math.max(diffMax, diffHeight);
								diffMin = Math.min(diffMin, diffHeight);
							}
						}
					}
				}
				setSlope(map[i][j], diffMax - diffMin, -diffMin);
				// if (0.0 < diffMax - diffMin) g_Map.log("cliff:" + (diffMax - diffMin) + " " + diffMax + " " + diffMin);
			}
		}
	}
	Engine.SetProgress(95);

	// rendering pass 3 (textures and objects)
	g_Map.log("generating textures and objects");
	for (let i = 0; i < dd; i++)
	{
		for (let j = 0; j < dd; j++)
		{
			if (map[i][j] !== undefined)
			{
				// g_Map.log("rendering:" + i + " " + j);
				renderCell(map[i][j], 1);
			}
		}
	}
}

function setPoint(x, y, brushSize, callback)
{
	// for one special Element (base, mines)
	var b1 = brush.get(brushSize);
	for (const element of b1)
	{
		var xmm = Math.round(x) + element.x;
		var ymm = Math.round(y) + element.y;
		if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd)
		{
			if (map[ymm][xmm] === undefined)
			{
				map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
			}
			callback(map[ymm][xmm], element.v);
		}
	}
	b1 = null;
}

function setHillD(ro, roC, index, x, y, ownerId, elevationLevel)
{
	// due to memory restriction, not all hills can be rendered at once
	// ro and roc make a selection which hills to render
	// if (typeof elevationLevel == "undefined") {
	//	elevationLevel = Math.random() < 0.5?0:1;
	// }
	// g_Map.log("setHillD: " + owner + ' ' + y + ', ' + x);
	// for (let j=0; j < dbrushB.length; j++) {
	var xmm = Math.round(x) + dbrushB[index].x;
	var ymm = Math.round(y) + dbrushB[index].y;
	if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd && (xmm + ymm) % roC == ro)
	{
		if (map[ymm][xmm].d === undefined)
		{
			// map[ymm][xmm].d = new Cell(xmm,ymm,heightLand);
			// g_Map.log("new Cell");
			// return
			map[ymm][xmm].d = new Array();
		}
		// callback(map[ymm][xmm],b1[j]['v']);
		// difference: vorWidth + 1
		// everything that is smaller is a potential slope

		// var wdiff = Math.abs(self.d[0].w - self.d[1].w);
		// if (wdiff > Math.PI) wdiff = Math.abs(2 * Math.PI - wdiff);
		// var relSize = Math.cos(0.5 * wdiff) * self.d[0].d;
		// everything for relSize < 2 is potential path

		var addElement = false;

		if (map[ymm][xmm].d.length == 0)
		{
			addElement = true;
		}
		else
		{
			var deltaD = Math.abs(dbrushB[index].d - map[ymm][xmm].d[0].d);
			var deltaW = Math.abs(dbrushB[index].w - map[ymm][xmm].d[0].w);
			if (deltaW > Math.PI) deltaW = Math.abs(2 * Math.PI - deltaW);
			var relSize = Math.cos(0.5 * deltaW) * map[ymm][xmm].d[0].d;
			if (deltaD < vorWidth + 3) addElement = true;
			if (relSize < rampSize && deltaD < vorWidth + 50) addElement = true;
		}
		if (addElement)
		{
			map[ymm][xmm].d.push({ "d": dbrushB[index].d, "w": dbrushB[index].w, "p": ownerId });
			if (map[ymm][xmm].d.length > 2)
			{
				map[ymm][xmm].d.sort(function(a, b) { return a.d - b.d; });
				map[ymm][xmm].d.pop();
				// g_Map.log("pop:" + cP);
			}
		}

		// g_Map.log("map[ymm][xmm]:" + map[ymm][xmm]["d"].join(', '));
	}
	// }
}

/*
 * create forests and all kind of decoration
 *
 * set brushes with a certain size on the map
 * 		patternnr	distance between two brushes
 * 		brushSize	amount of elements, that are effected
 * 		callback	always takes three elements, x-coordinate, y-coordinate, distance-value from center of the brush, the distance-value is 1.0 in the center of the brush, and 0.0 at the edge
 */

function setPattern1(patternr, brushSize, callback, randMax)
{
	// hexagons patterns
	if (randMax === undefined) randMax = 0;
	var b1 = brush.get(brushSize);
	for (let y = -60; y < 61; y++)
	{
		for (let x = -50; x < 51; x++)
		{
			var randx = randMax * (Math.random() - 0.5);
			var randy = randMax * (Math.random() - 0.5);
			var xm = Math.round(0.5 * dd + patternr * (randx + x + 0.5 * (y % 2)));
			var ym = Math.round(0.5 * dd + patternr * 0.8660255 * (randy + y));
			for (const element of b1)
			{
				var xmm = xm + element.x;
				var ymm = ym + element.y;
				if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd)
				{
					if (map[ymm][xmm] === undefined) map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
					callback(map[ymm][xmm], element.v);
				}
			}
		}
	}
	b1 = null;
}

function setPattern2(patternr, brushSize, callback, randMax)
{
	// circlur patterns
	if (randMax === undefined) randMax = 0;
	var b1 = brush.get(brushSize);
	for (let r = 1; r < 100; r++)
	{
		var wm = 2 * Math.PI / (6 * r);
		for (let w = 0; w < 6 * r; w++)
		{
			var randx = randMax * (Math.random() - 0.5);
			var randy = randMax * (Math.random() - 0.5);
			var xm = Math.round(0.5 * dd + patternr * (r * Math.sin(w * wm) + randx));
			var ym = Math.round(0.5 * dd + patternr * (r * Math.cos(w * wm) + randy));
			for (const element of b1)
			{
				var xmm = xm + element.x;
				var ymm = ym + element.y;
				if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd)
				{
					if (map[ymm][xmm] === undefined) map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
					callback(map[ymm][xmm], element.v);
				}
			}
		}
	}
	b1 = null;
}

// draw a line, deprecated, use fractalLine
function line(x0, y0, x1, y1, callback, parameter)
{
	if (parameter === undefined)
	{
		parameter = {};
	}
	parameter = parameter || { "brushSize": 10, "randomDisplacement": 0 };
	var brushSize = parameter.brushSize;
	var randomDisplacement = parameter.randomDisplacement;
	var b1 = brush.get(brushSize);
	// result are the points of the line
	var result = new Array();
	result.push({ "x": Math.round(x0), "y": Math.round(y0) });
	var dx = x1 - x0, dy = y1 - y0;
	var d0 = Math.sqrt(dx * dx + dy * dy);
	var dx0 = dx / d0, dy0 = dy / d0;
	var t = 0;
	var lastdd = 10000, actualdd = 9999;
	while (actualdd < lastdd)
	{
		// create a line
		lastdd = actualdd;
		actualdd = Math.abs(x1 - x0) + Math.abs(y1 - y0);
		// console.log(dd,x0,y0);
		if (actualdd > 0)
		{
			if (dy == 0)
			{
				// horizontal line
				x0 += (dx < 0) ? -1 : 1;
			}
			else
			{
				if (t < 0)
				{
					t += Math.abs(dy);
					x0 += (dx < 0) ? -1 : 1;
				}
				else
				{
					t -= Math.abs(dx);
					y0 += (dy < 0) ? -1 : 1;
				}
			}
			var r = Math.random() * 2 * randomDisplacement - randomDisplacement;
			// g_Map.log(x0 + " " + y0 + " " + r * dy0 + " " + r * dx0);
			result.push({ "x": Math.round(x0 - r * dy0), "y": Math.round(y0 + r * dx0) });
		}
	}
	// g_Map.log("line:" + result);
	for (const i of result)
	{
		for (const j of b1)
		{
			var xmm = i.x + j.x;
			var ymm = i.y + j.y;
			if (xmm >= 0 && ymm >= 0 && xmm < dd && ymm < dd)
			{
				if (map[ymm][xmm] === undefined)
				{
					map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
				}
				// g_Map.log("set:" + ymm + " " + xmm + " " + b1[j]['v']);
				callback(map[ymm][xmm], j.v);
			}
		}
	}
	return result;
}

/* draw a fractaline, draw a line with random displacements
 * the line is made up with points at a minimum distance to each
 * parameter:
 * 	addStart		internal parameter, do not set
 * 	randomDisplacement	add some zigzag, 0.0 = straight line
 * 				good value to start some randomness is 0.1
 * 	targetDist		maximum distance between two points, the algorithm ends, when the distance between two points are below this value
 *
 * result			an array with 2-typel of x,y-coordinates
 */
function fractalLine(x0, y0, x1, y1, parameter)
{
	var result = [];
	parameter = parameter || { "targetDist": 10, "randomDisplacement": 0, "addStart": true };
	// g_Map.log("fLine:" + x0 + ", " + y0 + ", " + x1 + ", " + y1 + " - " + JSON.stringify(parameter));
	if (parameter.addStart)
	{
		result.push([x0, y0]);
	}
	var targetDist = parameter.targetDist, dx = x1 - x0, dy = y1 - y0;
	var randomV = parameter.randomDisplacement;
	// g_Map.log("fLine1:" + dx + ", " + dy + ", " + targetDist);
	if (dx * dx + dy * dy < targetDist * targetDist)
	{
		result.push([x1, y1]);
		return result;
	}
	var parameterSub = Object.assign({}, parameter);
	parameterSub.addStart = false;
	var randomVa = randomV * (Math.random() - 0.5);
	var mx = 0.5 * (x1 + x0) + dy * randomVa, my = 0.5 * (y1 + y0) - dx * randomVa;
	result = result.concat(fractalLine(x0, y0, mx, my, parameterSub));
	result = result.concat(fractalLine(mx, my, x1, y1, parameterSub));
	// g_Map.log("fLineR:" + JSON.stringify(result));
	return result;
}

g_Map.log("maxVoronoiDistance:" + maxVoronoiDistance);
// g_Environment.victoryConditions="conquest";
g_Map.ExportMap();

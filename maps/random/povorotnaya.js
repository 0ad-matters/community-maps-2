Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");

TILE_CENTERED_HEIGHT_MAP = true;

// if (g_MapSettings.Biome)
//	setSelectedBiome();
// else
// 	setBiome("generic/savanna");

var texture_default = ["grid_subdiv"];
var texture_base_inner = ["grid_subdiv"];
var texture_base_outer = ["grid_subdiv"];
var texture_depression_inner = ["grid_subdiv"];
var texture_depression_outer = ["grid_subdiv"];
var objects_depression_inner = [];
var height_depression = 0;
var texture_trees1_inner = ["grid_subdiv"];
var texture_trees1_outer = ["grid_subdiv"];
var objects_trees1_inner = [];
var margin_trees1 = 20;
var size_trees1 = 7;
var height_trees1 = 0;
var texture_cliff1_inner = ["grid_subdiv"];
var texture_cliff1_outer = ["grid_subdiv"];
var texture_mine = ["grid_subdiv"];
var mine_stone = "gaia/geology_stonemine_savanna_quarry";
var mine_metal = "gaia/geology_metal_savanna_slabs";
var flora_berry = "gaia/flora_bush_berry_desert";

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

if (false)
{
	texture_default = ["savanna_grass_a", "savanna_grass_b", "savanna_shrubs_a", "savanna_shrubs_b"];
	texture_base_inner = ["savanna_tile_a"];
	texture_base_outer = ["savanna_tile_a", "savanna_dirt_a", "savanna_dirt_b"];
	texture_depression_inner = ["savanna_dirt_a", "savanna_dirt_b"];
	texture_depression_outer = ["savanna_dirt_rocks_a", "savanna_dirt_rocks_b", "savanna_dirt_rocks_c"];
	objects_depression_inner = [];
	height_depression = -4;
	texture_trees1_inner = ["savanna_forestfloor_a", "savanna_forestfloor_b"];
	texture_trees1_outer = ["savanna_grass_a_wetseason", "savanna_grass_b_wetseason"];
	objects_trees1_inner = ["gaia/flora_tree_date_palm"];
	height_trees1 = 4;
	texture_cliff1_inner = ["savanna_wash_a"];
	texture_cliff1_outer = ["savanna_wash_a"];
	texture_mine = ["savanna_dirt_rocks_a_red", "savanna_dirt_rocks_b_red", "savanna_dirt_rocks_c_red"];
	mine_stone = "gaia/geology_stonemine_savanna_quarry";
	mine_metal = "gaia/geology_metal_savanna_slabs";
	flora_berry = "gaia/flora_bush_berry_desert";
}

if (false)
{
	// savanna 2
	texture_default = ["clay_01", "clay_02", "dirt_broken_rocks", "savanna_mud_a"];
	texture_base_inner = ["savanna_grass_a"];
	texture_base_outer = ["dirt_rocks_a"];
	texture_depression_inner = ["dirt_gravel_mars"];
	texture_depression_outer = ["dirt_rocky"];
	height_depression = -4;
	texture_trees1_inner = ["savanna_forestfloor_b"];
	texture_trees1_outer = ["savanna_forestfloor_a"];
	objects_trees1_inner = ["gaia/flora_tree_date_palm"];
	height_trees1 = 4;
	texture_cliff1_inner = ["savanna_cliff_a", "savanna_cliff_b"];
	texture_cliff1_outer = ["savanna_cliff_a", "savanna_cliff_b"];
	texture_mine = ["dirt_rugged"];
	mine_stone = "gaia/geology_stonemine_savanna_quarry";
	mine_metal = "gaia/geology_metal_savanna_slabs";
	flora_berry = "gaia/flora_bush_berry_desert";
}

if (true)
{
	// sibiria
	texture_default = ["polar_snow_a", "polar_snow_b"];
	texture_base_inner = ["alpine_shore_rocks"];
	texture_base_outer = ["alpine_shore_rocks_icy"];
	texture_depression_inner = ["polar_tundra"];
	texture_depression_outer = ["polar_tundra_snow"];
	height_depression = -4;
	texture_trees1_inner = ["alpine_forrestfloor"];
	texture_trees1_outer = ["alpine_forrestfloor_snow"];
	objects_trees1_inner = ["gaia/tree/pine_w"];
	height_trees1 = 4;
	texture_cliff1_inner = ["polar_cliff_snow"];
	texture_cliff1_outer = ["polar_cliff_snow"];
	texture_mine = ["ice_dirt"];
	mine_stone = "gaia/rock/alpine_large";
	mine_metal = "gaia/ore/alpine_large";
	flora_berry = "gaia/fauna_muskox";
	setSunElevation(0.07 * Math.PI);
	// setSunColor(0.4, 0.4, 0.4);
	setSkySet("overcast");
	setFogColor(0.90, 0.85, 1.00);
	setFogFactor(0.2);
	setFogThickness(0.00);
	// setPPEffect("DOF");
}

// "grid_subdiv", "grid_white", "brown", "blue", "red", "green", "yellow", "whiteness"
// "new_alpine_citytile"
// "new_alpine_grass_mossy", "alpine_grass", "alpine_grass_a", "alpine_grass_a_fancy", "alpine_grass_b", "alpine_grass_b_fancy"
// "alpine_grass_a", "alpine_grass_a_fancy", "alpine_grass_b", "alpine_grass_b_fancy"
// "alpine_grass_b_wild", "alpine_grass_c", "alpine_grass_c_fancy", "alpine_grass_d", "alpine_grass_d_fancy"
// "alpine_grass_d_wild", "alpine_grass_e", "alpine_dirt", "alpine_dirt_grass_50"
// "savanna_dirt_a", "savanna_dirt_a_red", "savanna_dirt_rocks_a_red", "savanna_dirt_rocks_b_red", "savanna_dirt_rocks_c_red", "savanna_dirt_b", "savanna_dirt_b_red",
// "savanna_dirt_a_red", "savanna_dirt_rocks_a_red", "savanna_dirt_rocks_b_red", "savanna_dirt_rocks_c_red"
// "savanna_grass_a", "savanna_grass_b", "savanna_shrubs_a", "savanna_shrubs_b"
// "savanna_tile_a_red","savanna_tile_a_red","savanna_tile_a_dirt_red"
// "savanna_grass_a", "savanna_grass_b",  "savanna_shrubs_a", "savanna_shrubs_b",
// "bridge_wood_a"
// "farmland_a"

// "gaia/flora_tree_cretan_date_palm_short", "gaia/flora_tree_acacia", "gaia/flora_tree_aleppo_pine", "gaia/flora_tree_carob", "gaia/flora_tree_euro_beech", "gaia/flora_tree_oak", "gaia/flora_tree_oak_large", "gaia/flora_tree_oak_new"

var heightLand = 10;
var g_Map = new RandomMap(heightLand, texture_default);

const numPlayers = getNumPlayers();
const mapCenter = g_Map.getCenter();

var dd = g_Map.getSize();

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

function setHill1(self, value)
{
	self.hill1 = Math.max(self.hill1, value);
	return self;
}

function renderCell(self)
{
	var texture;
	var allowElements = true;
	var element;
	var height = 0;
	if (self.base > 0.4 || self.mine > 0.0)
	{
		allowElements = false;
	}
	if (self.base > 0.4)
	{
		// the base is always flat, and nothing but the explicit set elements should exist there
		// but the base has a margin, which belongs to the base, but can be influenced by natures
		if (Math.random() < self.base - 0.2)
		{
			texture = pickRandom(texture_base_outer);
		}
		if (0.1 * Math.random() < self.base - 0.7)
		{
			texture = pickRandom(texture_base_inner);
		}
	}
	else
	{
		if (self.forest1 > 0.0)
		{
			// small depression with shrubs
			height += height_depression * Math.sqrt(self.forest1);
			if (Math.random() < self.forest1)
			{
				texture = pickRandom(texture_depression_outer);
			}
			if (0.2 * Math.random() < self.forest1 - 0.6)
			{
				texture = pickRandom(texture_depression_inner);
				element = pickRandom(objects_depression_inner);
			}
		}
		if (self.forest2 > 0.0)
		{
			// small elevations with trees
			height += height_trees1 * Math.sqrt(self.forest2);
			if (1.5 * Math.random() < self.forest2 + 0.4)
			{
				// the bushy outside
				texture = pickRandom(texture_trees1_outer);
			}
			if (0.5 * Math.random() < self.forest2 - 0.25)
			{
				texture = pickRandom(texture_trees1_inner);
				element = pickRandom(objects_trees1_inner);
			}
		}
		if (self.flatland1 > 0.0)
		{
			if (self.flatland1 > 0)
			{
				texture = "yellow";
			}
			if (self.flatland1 > 0.5)
			{
				texture = "red";
			}
			if (self.flatland1 > 0.8)
			{
				texture = "whiteness";
			}
		}
		if (self.hill1 > 0.0 && self.base < 0.02 && self.mine < 0.02)
		{
			texture = pickRandom(texture_cliff1_inner);
			height += 20 * self.hill1 * self.hill1;
			element = null;
		}
		if (self.mine > 0.0)
		{
			if (Math.random() < self.mine + 0.2)
			{
				texture = pickRandom(texture_mine);
			}
			height = 0;
		}
	}
	// g_Map.log("height 2:" + self.hill1 + " " + height);
	if (typeof texture != "undefined")
	{
		g_Map.setTexture({ "x": self.x, "y": self.y }, texture);
	}
	if (allowElements && (typeof element != "undefined") && element != null)
	{
		g_Map.placeEntityAnywhere(element, 0, { "x": self.x, "y": self.y }, randomAngle());
	}
	g_Map.setHeight({ "x": self.x, "y": self.y }, heightLand + height);
	return this;
}

function Cell(paramx, paramy, paramheight)
{
	this.x = paramx;
	this.y = paramy;
	this.height = paramheight;
	this.owner = 0;
	this.forest1 = 0;
	this.forest2 = 0;
	this.forest3 = 0;
	this.flatland1 = 0;
	this.flatland2 = 0;
	this.hill1 = 0;
	this.water1 = 0;
	this.water2 = 0;
	this.mine = 0;
	this.base = 0;
	return this;
}

// brush
function Brush()
{
	var val = [];
	for (var y = 0; y < 40; y++)
	{
		for (var x = 0; x < 40; x++)
		{
			var r = Math.sqrt(x * x + y * y);
			val.push({ "r": r, "x": x, "y": y });
		}
	}
	val.sort(function(a, b){return a.r - b.r;});

	this.get = function(maxV) {
		var result = [];
		var i = 0;
		while (i < val.length)
		{
			if (val[i].r < maxV)
			{
				result.push({ "x": val[i].x, "y": val[i].y, "v": 1 - val[i].r / maxV });
				result.push({ "x": -val[i].x, "y": val[i].y, "v": 1 - val[i].r / maxV });
				result.push({ "x": val[i].x, "y": -val[i].y, "v": 1 - val[i].r / maxV });
				result.push({ "x": -val[i].x, "y": -val[i].y, "v": 1 - val[i].r / maxV });
				i++;
			}
			else i = val.length;
		}
		return result;
	};
	return this;
}

function setPoint(x, y, brushSize, callback)
{
	// for one special Element (base, mines)
	var b1 = brush.get(brushSize);
	for (var j = 0; j < b1.length; j++)
	{
		var xmm = Math.round(x) + b1[j].x;
		var ymm = Math.round(y) + b1[j].y;
		if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd)
		{
			if (typeof map[ymm][xmm] == "undefined")
			{
				map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
			}
			callback(map[ymm][xmm], b1[j].v);
		}
	}
}

function setPattern1(patternr, brushSize, callback, randMax)
{
	// hexagons
	if (typeof randMax == "undefined")
	{
		randMax = 0.0;
	}
	var b1 = brush.get(brushSize);
	for (var y = -60; y < 61; y++)
	{
		for (var x = -50; x < 51; x++)
		{
			var randx = randMax * (Math.random() - 0.5);
			var randy = randMax * (Math.random() - 0.5);
			var xm = Math.round(0.5 * dd + patternr * (randx + x + 0.5 * (y % 2)));
			var ym = Math.round(0.5 * dd + patternr * 0.8660255 * (randy + y));
			for (var j = 0; j < b1.length; j++)
			{
				var xmm = xm + b1[j].x;
				var ymm = ym + b1[j].y;
				if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd)
				{
					if (typeof map[ymm][xmm] == "undefined")
					{
						map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
					}
					callback(map[ymm][xmm], b1[j].v);
				}
			}
		}
	}
}

function setPattern2(patternr, brushSize, callback, randMax)
{
	// circles
	if (typeof randMax == "undefined")
	{
		randMax = 0.0;
	}
	var b1 = brush.get(brushSize);
	for (var r = 1; r < 100; r++)
	{
		var wm = 2 * Math.PI / (6 * r);
		for (var w = 0; w < 6 * r; w++)
		{
			var randx = randMax * (Math.random() - 0.5);
			var randy = randMax * (Math.random() - 0.5);
			var xm = Math.round(0.5 * dd + patternr * (r * Math.sin(w * wm) + randx));
			var ym = Math.round(0.5 * dd + patternr * (r * Math.cos(w * wm) + randy));
			for (var j = 0; j < b1.length; j++)
			{
				var xmm = xm + b1[j].x;
				var ymm = ym + b1[j].y;
				if (xmm >= 0 && xmm < dd && ymm >= 0 && ymm < dd)
				{
					if (typeof map[ymm][xmm] == "undefined")
					{
						map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
					}
					callback(map[ymm][xmm], b1[j].v);
				}
			}
		}
	}
}

// draw a line
function line(x0, y0, x1, y1, brushSize, callback)
{
	var b1 = brush.get(brushSize);
	var result = Array();
	result.push({ "x": Math.round(x0), "y": Math.round(y0) });
	var dx = x1 - x0, dy = y1 - y0;
	var d0 = Math.sqrt(dx * dx + dy * dy);
	var dx0 = dx / d0, dy0 = dy / d0;
	var t = 0;
	var lastdd = 10000, actualdd = 9999;
	while (actualdd < lastdd)
	{
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
			var r = Math.random() * 4 - 2;
			// g_Map.log(x0 + " " + y0 + " " + r * dy0 + " " + r * dx0);
			result.push({ "x": Math.round(x0 - r * dy0), "y": Math.round(y0 + r * dx0) });
		}
	}
	// g_Map.log("line:" + result);
	for (var i = 0; i < result.length; i++)
	{
		for (var j = 0; j < b1.length; j++)
		{
			var xmm = result[i].x + b1[j].x;
			var ymm = result[i].y + b1[j].y;
			if (xmm >= 0 && ymm >= 0 && xmm < dd && ymm < dd)
			{
				if (typeof map[ymm][xmm] == "undefined")
				{
					map[ymm][xmm] = new Cell(xmm, ymm, heightLand);
				}
				// g_Map.log("set:" + ymm + " " + xmm + " " + b1[j]['v']);
				callback(map[ymm][xmm], b1[j].v);
			}
		}
	}
	return result;
}

function placeBaseElement(player, angle, x, y, entity)
{
	var dd = g_Map.getSize();
	var sw = Math.sin(w), cw = Math.cos(w);
	var px = 0.5 * dd + (0.5 * dd - 40) * sw;
	var py = 0.5 * dd + (0.5 * dd - 40) * cw;
	var vx = px + x * sw + y * cw;
	var vy = py + x * cw - y * sw;
	if (entity.length > 0)
	{
		g_Map.placeEntityAnywhere(entity, player, { "x": vx, "y": vy }, randomAngle());
	}
	return { "x": vx, "y": vy };

}

if (true)
{
	var brush = new Brush();

	// create the map of Objects
	try {
		var map = Array();
		for (var i = 0; i < dd; i++)
		{
			var row = Array();
			for (var j = 0; j < dd; j++)
			{
				row.push(undefined);
			}
			map.push(row);
		}
	}
	catch (e) {
		g_Map.log("Exception creating the map ");
	}

	if (true)
	{
		setPattern1(margin_trees1, size_trees1, setForest2, 0.8);
	}

	if (true)
	{
		setPattern2(30, 10, setForest1, 0.8);
	}

	if (false)
	{
		// some ridges to deter movements for multi player to the next base
		var wStep = 2 * Math.PI / numPlayers;
		for (var i = 0; i < numPlayers; i++)
		{
			var w = (i + 0.5) * wStep;
			var sw0 = Math.sin(w), cw0 = Math.cos(w);
			var sw1 = Math.sin(w), cw1 = Math.cos(w);
			var sw2 = Math.sin(w), cw2 = Math.cos(w);
			var px0 = 0.5 * dd + (0.5 * dd - 1) * sw0;
			var py0 = 0.5 * dd + (0.5 * dd - 1) * cw0;
			var px1 = 0.5 * dd + Math.max(0.2 * dd, 0.5 * dd - 30) * sw0;
			var py1 = 0.5 * dd + Math.max(0.2 * dd, 0.5 * dd - 30) * cw0;
			// g_Map.log("line " + px0 + "," + py0 + " " + px1 + "," + py1);
			line(px0, py0, px1, py1, 3, setHill1);
		}
	}

	if (true)
	{
		// random displacement of start and end of the ridge
		// set this to zero to get a plain view on the math
		var rndP = 0;
		// inner free circle (this is already a good value)
		var ri = 10;
		while (ri < 0.55 * dd)
		{
			// amount of ridges, bigger values, less ridges, 100 is a good start
			ri += 80 / ri;
			// speed of circling, values more than 0.5 look very random
			var ris1 = 0.2 * Math.PI * ri + 1.0 * (Math.random());
			var ris2 = ris1 + 0.2 * (Math.random() - 0.0);
			var ris3 = ris2 + 0.5 * (Math.random() - 0.5);
			var rnx0 = ri * Math.sin(ris1) + 0.5 * dd;
			var rny0 = ri * Math.cos(ris1) + 0.5 * dd;
			var rnx1 = (ri + 15) * Math.sin(ris2) + 0.5 * dd;
			var rny1 = (ri + 15) * Math.cos(ris2) + 0.5 * dd;
			var rix0 = (ri + 10) * Math.sin(ris2) + 0.5 * dd;
			var riy0 = (ri + 10) * Math.cos(ris2) + 0.5 * dd;
			var rix1 = (ri + 20) * Math.sin(ris3) + 0.5 * dd;
			var riy1 = (ri + 20) * Math.cos(ris3) + 0.5 * dd;
			line(rnx0, rny0, rnx1, rny1, 2, setHill1);
			// line(rix1 + rndP*(Math.random()-0.5),riy1 + rndP*(Math.random()-0.5),rix0 + rndP*(Math.random()-0.5),riy0 + rndP*(Math.random()-0.5), 3, setHill1);
			// line(rix0 + rndP*(Math.random()-0.5),riy0 + rndP*(Math.random()-0.5),rnx0 + rndP*(Math.random()-0.5),rny0 + rndP*(Math.random()-0.5), 3, setHill1);
		}
	}

	// set the bases
	for (var i = 1; i < (numPlayers + 1); i++)
	{
		var w = 2 * Math.PI * i / numPlayers + 0.25 * Math.PI;
		var w0 = 2 * Math.PI * (i + 0.5) / numPlayers + 0.25 * Math.PI;
		var w1 = 2 * Math.PI * (i + 0.45) / numPlayers + 0.25 * Math.PI;
		var w2 = 2 * Math.PI * (i + 0.55) / numPlayers + 0.25 * Math.PI;
		var w3 = 2 * Math.PI * (i + 0.40) / numPlayers + 0.25 * Math.PI;
		var w4 = 2 * Math.PI * (i + 0.60) / numPlayers + 0.25 * Math.PI;
		var sw = Math.sin(w), cw = Math.cos(w);
		var sw0 = Math.sin(w0), cw0 = Math.cos(w0);
		var sw1 = Math.sin(w1), cw1 = Math.cos(w1);
		var sw2 = Math.sin(w2), cw2 = Math.cos(w2);
		var sw3 = Math.sin(w3), cw3 = Math.cos(w3);
		var sw4 = Math.sin(w4), cw4 = Math.cos(w4);
		var px = 0.5 * dd + (0.5 * dd - 40) * sw;
		var py = 0.5 * dd + (0.5 * dd - 40) * cw;
		g_Map.placeEntityAnywhere("skirmish/structures/default_civil_centre", i, { "x": px, "y": py }, -w + 1.5 * Math.PI);

		if (true)
		{
			setPoint(px, py, 32, setBase);

			placeBaseElement(i, w, -6, 1.2, "skirmish/units/default_support_female_citizen");
			placeBaseElement(i, w, -6, 0.4, "skirmish/units/default_support_female_citizen");
			placeBaseElement(i, w, -6, -0.4, "skirmish/units/default_support_female_citizen");
			placeBaseElement(i, w, -6, -1.4, "skirmish/units/default_support_female_citizen");

			placeBaseElement(i, w, -7, 1.2, "skirmish/units/default_infantry_melee_b");
			placeBaseElement(i, w, -7, 0.4, "skirmish/units/default_infantry_ranged_b");
			placeBaseElement(i, w, -7, -0.4, "skirmish/units/default_infantry_melee_b");
			placeBaseElement(i, w, -7, -1.4, "skirmish/units/default_infantry_ranged_b");

			for (let m = -1.5; m < 2; m++)
			{
				placeBaseElement(0, w, 9, m, flora_berry);
			}

			var mine = placeBaseElement(i, w, 8, -12, mine_stone);
			setPoint(mine.x, mine.y, 5, setMine);
			var mine = placeBaseElement(i, w, 8, 12, mine_metal);
			setPoint(mine.x, mine.y, 5, setMine);

			var mine = placeBaseElement(i, w, 5, 40, mine_stone);
			setPoint(mine.x, mine.y, 5, setMine);
			var mine = placeBaseElement(i, w, 5, -40, mine_metal);
			setPoint(mine.x, mine.y, 5, setMine);

			if (dd / numPlayers > 60)
			{
				// for big maps some extra-mines
				var px0a = 0.5 * dd + (0.5 * dd - 10) * sw0;
				var py0a = 0.5 * dd + (0.5 * dd - 10) * cw0;
				g_Map.placeEntityAnywhere(mine_stone, i, { "x": px0a, "y": py0a }, randomAngle());
				setPoint(px0a, py0a, 5, setMine);
				var px1a = 0.5 * dd + (0.5 * dd - 10) * sw1;
				var py1a = 0.5 * dd + (0.5 * dd - 10) * cw1;
				g_Map.placeEntityAnywhere(mine_metal, i, { "x": px1a, "y": py1a }, randomAngle());
				setPoint(px1a, py1a, 5, setMine);
				var px2a = 0.5 * dd + (0.5 * dd - 10) * sw2;
				var py2a = 0.5 * dd + (0.5 * dd - 10) * cw2;
				g_Map.placeEntityAnywhere(mine_metal, i, { "x": px2a, "y": py2a }, randomAngle());
				setPoint(px2a, py2a, 5, setMine);
			}

			if (dd / numPlayers > 105)
			{
				// for bigger maps more extra-mines
				var px0a = 0.5 * dd + (0.5 * dd - 70) * sw0;
				var py0a = 0.5 * dd + (0.5 * dd - 70) * cw0;
				g_Map.placeEntityAnywhere(mine_stone, i, { "x": px0a, "y": py0a }, randomAngle());
				setPoint(px0a, py0a, 5, setMine);
				var px1a = 0.5 * dd + (0.5 * dd - 70) * sw3;
				var py1a = 0.5 * dd + (0.5 * dd - 70) * cw3;
				g_Map.placeEntityAnywhere(mine_metal, i, { "x": px1a, "y": py1a }, randomAngle());
				setPoint(px1a, py1a, 5, setMine);
				var px2a = 0.5 * dd + (0.5 * dd - 70) * sw4;
				var py2a = 0.5 * dd + (0.5 * dd - 70) * cw4;
				g_Map.placeEntityAnywhere(mine_metal, i, { "x": px2a, "y": py2a }, randomAngle());
				setPoint(px2a, py2a, 5, setMine);
			}
		}
	}

	// render
	g_Map.log("start rendering");
	for (var i = 0; i < dd; i++)
	{
		for (var j = 0; j < dd; j++)
		{
			if (typeof map[i][j] != "undefined")
			{
				// g_Map.log("rendering:" + i + " " + j);
				renderCell(map[i][j]);
			}
		}
	}

}

// g_Environment.victoryConditions="conquest";
g_Map.ExportMap();

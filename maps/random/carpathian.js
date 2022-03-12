Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");

TILE_CENTERED_HEIGHT_MAP = true;

// voronoi-width
// determines the size of the intermediate height between low and high terrain
// bigger numbers prefer more medium terrain and less low and high terrain
// value should be more than 6, otherwise there are to few ramps to access high or low terrain.
var vorWidth = 10;

// random geography
//		randHillMax	= random displacement
//		distHill	= general distance between the hills
var randHillMax = 12;
var distHill = 45;

// Distance for clearing random geographic structures from certain locations
// "big" is used for Town-Centers, it's the distance where no random hills are set.
// 		Since hills have a extent, the distance does not imply, that there are no changes in the height at all
// "small" is used for Mines
var clearMountainsBig = 60;
var clearMountainsSmall = 25;

// most of the following textures are defaults, which should help when making a new biome
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
var objects_trees1_inner = [];
var objects_trees1_inner_high = [];
// margin_trees1 = distance between forests
// higher number = less forests = less trees
var margin_trees1 = 30;
// size_trees1 = diameter of a forest
// higher numbers = bigger forests = more trees
var size_trees1 = 10;
var height_trees1 = 0;
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
var hills = [];
var owner = 100;
	
if (true) {
	// taiga
	// the transition between the textures for low and medium altitude 
	// is gradual with random favoring one list above the other with rising altitude
	texture_default = ["polar_tundra", "polar_tundra", "polar_tundra", "grass_field_a", "grass_field_b", "grass_field_brown"];
	texture_default_medium = ["polar_tundra_snow", "polar_tundra_snow", "polar_snow_a", "polar_snow_b"];
	// depression, elevation of forests above the ground
	texture_depression_inner = ["polar_ice_snow"];
	texture_depression_outer = ["polar_tundra_snow"];
	height_depression = -2;
	// margin_depression = distance from the center of one depression to another
	margin_depression = 50;
	// size_depression = diameter of the depression
	size_depression = 10;
	// forests, elevation of forests above the ground
	texture_trees1_inner = ["alpine_forrestfloor"];
	texture_trees1_outer = ["alpine_forrestfloor_snow"];
	objects_trees1_inner = ["gaia/tree/pine", "gaia/tree/pine", "gaia/tree/bush_badlands"];
	objects_trees1_inner_high = ["gaia/tree/pine_w"];
	height_trees1 = 2;
	margin_trees1 = 20;
	// size_trees1 = diameter of a forest
	// higher numbers = bigger forests = more trees
	size_trees1 = 10;
	// cliffs
	texture_cliff1_inner = ["polar_cliff_a", "polar_cliff_b"];
	texture_cliff1_inner_high = ["polar_cliff_a", "polar_cliff_b", "polar_cliff_snow", "polar_cliff_snow"];
	// path
	texture_path = ["road_stones", "", ""];
	texture_path_high = ["road_stones", "", ""];
	// texture around the base and the mines
	texture_base_inner = ["alpine_shore_rocks", "alpine_shore_rocks_grass_50", "new_alpine_citytile", "new_alpine_citytile"];
	texture_base_outer = ["alpine_shore_rocks", "alpine_shore_rocks_grass_50", "alpine_shore_rocks_grass_50"];
	texture_mine = ["ice_dirt"];
	// special objects
	mine_stone = "gaia/rock/alpine_large";
	mine_metal = "gaia/ore/alpine_large";
	food1 = "gaia/fauna_muskox";
	setSunElevation(0.2 * Math.PI);
	setSunColor(0.6, 0.6, 0.6);
	setSkySet("overcast");
	setFogColor(0.90, 0.85, 1.00);
	// setFogFactor(0.2);
	setFogThickness(0.0);
	setFogFactor(0.0);
	// setPPEffect("DOF");
}

// decoration, defining groups of elements, that are distributed around the center (mostly some animals)
// decoMax		amount of groups
// clusterMax	elements in one group
// element		what element to place
// radius		distance from the center
var deco = [
	{"decoMax": 5, "clusterMax": 6, "element": decoFauna1, "radius": 0.3}, {"decoMax": 10, "clusterMax": 1, "element": decoFauna2, "radius": 0.2},
	{"decoMax": 7, "clusterMax": 10, "element": decoFauna1, "radius": 0.9}, {"decoMax": 11, "clusterMax": 2, "element": decoFauna2, "radius": 0.8}
];

var heightLand = 25;
var g_Map = new RandomMap(heightLand, texture_default);

const numPlayers = getNumPlayers();
const mapCenter = g_Map.getCenter();

var dd = g_Map.getSize();

function setBase(self, value) {
	self.base = Math.max(self.base, value);
	return self;
}

function setMine(self, value) {
	self.mine = Math.max(self.mine, value);
	return self;
}

function setForest1(self, value) {
	self.forest1 = Math.max(self.forest1, value);
	return self;
}

function setForest2(self, value) {
	self.forest2 = Math.max(self.forest2, value);
	return self;
}

function setWater1(self, value) {
	self.water1 = Math.max(self.water1, value);
	return self;
}

function setFlatland1(self, value) {
	self.flatland1 = Math.max(self.flatland1, value);
	return self;
}

function setPath(self, value) {
	// brushsize for path should be at least 3
	self.path = Math.max(self.path, value);
	return self;
}

function setSlope(self, value, valueTop) {
	self.slope = Math.max(self.slope, value);
	self.slopeTop = Math.max(self.slopeTop, valueTop);
	return self;
}

function getHeight(self) {
	return self.height;
}

function renderCell(self, pass) {
	// pass 0 = render height
	// pass 1 = textures and elements
	var texture;
	var element;
	if (typeof pass == 'undefined') pass = 0;
	
	var dx = self.x - 0.5 * dd, dy = self.y - 0.5 * dd;
	var w = Math.atan2(dy,dx);
	var d = Math.sqrt(dx*dx + dy*dy)
	// parameter 1 is added to the generell height and create some wavyness to the landscape
	var par1 = 0;
	// parameter 2 is added to the edges of the cliffs and make them look not that straight
	var par2 = 0;
	if (pass == 0) {
		par1 = 2 * Math.cos((0.2 + 0.04 * Math.sin(5*w)) * d);
		par2 = 1 * Math.cos((0.5 + 0.07 * Math.sin(7*w)) * d);
		if (0.1 < self.base) {
			// the surounding of bases are flattened
			par1 *= (1.0 - self.base);
		}
	}
		
	var timberline = 0;
	// default-terrain
	texture = pickRandom(texture_default);
	if (pass == 1) {
		if ((self.height - heightLand - 12) / 5 > Math.random()) {
			// divisor bigger, snowline more blurred
			// subtractor bigger, snowline starts later
			texture = pickRandom(texture_default_medium);
			timberline = 1;
		}
		if ((self.height - 15) / 10 > Math.random()) {
			//texture = pickRandom(texture_default_high);
			//timberline = 2;
		}
	}
	
	if (pass == 0 && typeof self.d != "undefined") {
		self.d.sort(function(a,b){return a["d"]-b["d"]});
		var hPlateau = 0;
		var h = 0;
		var wdiffMin = 1.8;
		var wdiffMax = 2.7;
		if (self.d.length > 0) {
			var elevationLevel = 0
			var elevationLevelSec = -1
			for (var hic = 0; hic < hills.length; hic += 1) {
				if (hills[hic].owner == self.d[0].p) {
					elevationLevel = hills[hic].elevation;
				}
				if (self.d.length > 1 && hills[hic].owner == self.d[1].p) {
					elevationLevelSec = hills[hic].elevation;
				}
			}
			if (elevationLevel == 1) {
				hPlateau = 24 - par1;
				h = 24 - par1;
				wdiffMin = 1.2;
				wdiffMax = 1.8;
			}
		}
		if (self.d.length > 1) {
			if (self.d[0].p == self.d[1].p && elevationLevel == elevationLevelSec) {
				// both hills have the same owner and are on the same level,
				// doing nothing merge both hills
			} else {
				var diff = Math.abs(self.d[0].d - self.d[1].d);
				var wdiff = Math.abs(self.d[0].w - self.d[1].w)
				// g_Map.log("dSort:" + JSON.stringify(self.d) + " " + diff);
				
				var vorWidthV = vorWidth + par2;
				if (diff < vorWidthV) {
					h = 12 + par1;
				}
				if (wdiff > wdiffMin && wdiff < wdiffMax && diff < 5 * vorWidthV) {
					var slope = 1.1;
					var rampFactor = Math.max(0.0, Math.min(1.0,(slope * vorWidthV - 0.5 * diff) / vorWidthV));
					h = (12 + par1) * rampFactor + hPlateau * (1 - rampFactor);
					self.path = 1;
				}
			}
		}
		// g_Map.log("height:" + h);
		self.height += h;
	}
	
	if (pass == 1) {
		if (0.4 < self.base || 0.0 < self.mine) {
			self.allowElements=false;
		}
		if (0.4 < self.base) {
			// the base is always flat, and nothing but the explicit set elements should exist there
			// but the base has a margin, which belongs to the base, but can be influenced by natures
			if (0.5 * Math.random() < self.base - 0.3) {
				texture = pickRandom(texture_base_outer);
			}
			if (0.1 * Math.random() < self.base - 0.7) {
				texture = pickRandom(texture_base_inner);
			}
		}
	}
	if (0.0 < self.forest1) {
		// small depression with shrubs
		if (pass == 0) {
			self.height += height_depression * Math.sqrt(self.forest1);
		}
		if (pass == 1) {
			if (self.path < 0.5 && self.base < 0.6) {
				if (Math.random() < self.forest1) {
					texture = pickRandom(texture_depression_outer);
				}
				if (0.8 * Math.random() < self.forest1) {
					texture = pickRandom(texture_depression_inner);
					element = pickRandom(objects_depression_inner);
				}
			}
		}
	}
	if (0.0 < self.forest2) {
		// small elevations with trees
		if (pass == 0) {
			self.height += height_trees1 * Math.sqrt(self.forest2);
		}
		if (pass == 1) {
			if (2.0 * Math.random() < self.forest2 + 5.0 && self.path < 0.5 && self.base < 0.6) {
				// the bushy outside
				texture = pickRandom(texture_trees1_outer);
			}
			if (5.0 * Math.random() < self.forest2 + 0.8 && self.path < 0.5 && self.base < 0.6) {
				texture = pickRandom(texture_trees1_inner);
				element = pickRandom(objects_trees1_inner);
				if (timberline > 0) {
					element = pickRandom(objects_trees1_inner_high);
				}
			}
		}
	}
	if (0.0 < self.mine) {
		if (Math.random() < self.mine + 0.2) {
			texture = pickRandom(texture_mine);
		}
	}
	
	if (pass == 1) {
		// textur for path
		if (0.01 < self.path) {
			// texture = "whiteness";
			var texturePath = "";
			if (0.7 < self.path) {
				element = null;
			}
			if (0.8 < self.path && 2.0 < self.slope) {
				texturePath = pickRandom(texture_path);
				if (0 < timberline) {
					texturePath = pickRandom(texture_path_high);
				}
			}
			if (1 < texturePath.length) {
				texture = texturePath;
			}
		}
		// texture for slope
		if (0.1 < self.slope && self.path < 0.5) {
			if (1.0 < self.slope) {
				self.allowElements = false;
			}
			if (2.0 < self.slope) {
				element = null;
			}
			// explain slopes
			// every slope value greater zero is a slope
			// texture = texture_cliff1_inner
			if (0.1 < self.slopeTop) {
				// slope is going down
				// texture = "red";
			}
			if (2.5 < self.slope) {
				// very close to the ridge
				texture = pickRandom(texture_cliff1_inner);
				if (0 < timberline) {
					texture = pickRandom(texture_cliff1_inner_high);
				}
			}
			if (3.5 < self.slope) {
				// ridge itself, if no texture is set, use the texture from the near cliff
				// texture = "red";
			}
		}
		// g_Map.log("height 2:" + self.hill1 + " " + height);
		if (typeof texture != "undefined") {
			g_Map.setTexture({"x":self.x, "y":self.y}, texture);
		}
		if (self.allowElements && (typeof element != "undefined") && element != null) {
			g_Map.placeEntityAnywhere(element, 0, {"x":self.x, "y":self.y}, randomAngle());
			self.allowElements = false;
		}
		// g_Map.log("height:" + self.height);

		
	}
	if (pass == 0) {
		g_Map.setHeight({"x":self.x, "y":self.y}, self.height);
	}
	return this;
}

function Cell(paramx,paramy,paramheight) {
	this.x = paramx;
	this.y = paramy;
	// elements may be banned on cliffs or close to cliffs
	this.allowElements = true;
	this.height=paramheight;
	this.owner = 0;
	this.forest1 = 0;
	this.forest2 = 0;
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
	return this;
}

// brush, an sorted list of all fields, sorted by distance
function Brush() {
	var val = [];
	for (var y=0; y < 80; y++) {
		for (var x=0; x < 80; x++) {
			var r = Math.sqrt(x*x+y*y);
			val.push({"r": r, "x":x, "y":y});
		}
	}
	val.sort(function(a,b){return a["r"]-b["r"]});
	
	this.get = function(maxV) {
		// get a list of all fields to a certain distance
		// the result is a cone, with value 1.0 at the center, and value 0.0 at the edge
		var result = [];
		var i = 0;
		while (i < val.length) {
			if (val[i]["r"] < maxV) {
				result.push({"x":val[i]["x"], "y":val[i]["y"], "v": 1-val[i]["r"] / maxV, "d":val[i]["r"] });
				result.push({"x":-val[i]["x"], "y":val[i]["y"], "v": 1-val[i]["r"] / maxV, "d":val[i]["r"]});
				result.push({"x":val[i]["x"], "y":-val[i]["y"], "v": 1-val[i]["r"] / maxV, "d":val[i]["r"]});
				result.push({"x":-val[i]["x"], "y":-val[i]["y"], "v": 1-val[i]["r"] / maxV, "d":val[i]["r"]});
				i++;
			}
			else i = val.length;
		} 
		return result;
	}
	return this;
}

function dBrush() {
	// brush with information distance and direction
	var val = [];
	var valMax = 270;
	for (var y = -valMax; y < valMax + 1; y++) {
		for (var x = -valMax; x < valMax + 1; x++) {
			var r = Math.sqrt(x*x+y*y);
			var w = Math.atan2(y, x);
			val.push({"w": w, "r": r, "x":x, "y":y});
		}
	}
	val.sort(function(a,b){return a["r"]-b["r"]});
	
	this.get = function(maxV) {
		// get a list of all fields to a certain distance
		// the result is a cone, with value 1.0 at the center, and value 0.0 at the edge
		var result = [];
		var i = 0;
		while (i < val.length) {
			if (val[i]["r"] < maxV) {
				// "v": 1-val[i]["r"] / maxV, 
				result.push({"x":val[i]["x"], "y":val[i]["y"], "d":val[i]["r"], "w":val[i]["w"] });
				i++;
			}
			else i = val.length;
		} 
		return result;
	}
	return this;
}

function setPoint(x, y , brushSize, callback) {
	// for one special Element (base, mines)
	var b1 = brush.get(brushSize);
	for (var j=0; j < b1.length; j++) {
		var xmm = Math.round(x) + b1[j]['x'];
		var ymm = Math.round(y) + b1[j]['y'];
		if (0 <= xmm && xmm < dd && 0 <= ymm && ymm < dd) {
			if (typeof map[ymm][xmm] == "undefined" ){
				map[ymm][xmm] = new Cell(xmm,ymm,heightLand);
			}
			callback(map[ymm][xmm],b1[j]['v']);
		}
	}
}

var dbrush = new dBrush();
var dbrushB = dbrush.get(250);

function setHillD(ro, roC, x, y, owner, elevationLevel) {
	// due to memory restriction, not all hills can be rendered at once
	// ro and roc make a selection which hills to render
	if (typeof elevationLevel == "undefined") {
		elevationLevel = Math.random() < 0.5?0:1;
	}
	for (var j=0; j < dbrushB.length; j++) {
		var xmm = Math.round(x) + dbrushB[j]['x'];
		var ymm = Math.round(y) + dbrushB[j]['y'];
		if (0 <= xmm && xmm < dd && 0 <= ymm && ymm < dd) {
			if ((xmm + ymm) % roC == ro) {
				if (typeof map[ymm][xmm].d == "undefined" ){
					// map[ymm][xmm].d = new Cell(xmm,ymm,heightLand);
					// g_Map.log("new Cell");
					// return
					map[ymm][xmm].d = new Array();
				}
				// callback(map[ymm][xmm],b1[j]['v']);
				map[ymm][xmm].d.push({"d":dbrushB[j]["d"], "w":dbrushB[j]["w"], "p": owner});
				if (2 < map[ymm][xmm].d.length) {
					map[ymm][xmm].d.sort(function(a,b){return a["d"]-b["d"]});
					map[ymm][xmm].d.pop();
					// g_Map.log("pop:" + cP);
				}
				// g_Map.log("map[ymm][xmm]:" + map[ymm][xmm]["d"].join(', '));
			}
		}
	}
}

/*
 * patterns set brushes with a cerain size on the map
 * 		patternnr	distance between two brushes
 * 		callback	always takes three elements, x-ccordinate, y-coordinate, distance-value from center, the distance-value is 1.0 in the center and 0.0 at the edge
 */ 

function setPattern1(patternr, brushSize, callback, randMax) {
	// hexagons 
	//		
	if (typeof randMax == "undefined") {
		randMax = 0.0;
	}
	var b1 = brush.get(brushSize);
	for (var y=-60; y < 61; y++) {
		for (var x=-50; x < 51; x++) {
			var randx = randMax * (Math.random() - 0.5);
			var randy = randMax * (Math.random() - 0.5);
			var xm = Math.round(0.5 * dd + patternr * (randx + x + 0.5 * (y % 2)));
			var ym = Math.round(0.5 * dd + patternr * 0.8660255 * (randy + y));
			for (var j=0; j < b1.length; j++) {
				var xmm = xm + b1[j]['x'];
				var ymm = ym + b1[j]['y'];
				if (0 <= xmm && xmm < dd && 0 <= ymm && ymm < dd) {
					if (typeof map[ymm][xmm] == "undefined" ){
						map[ymm][xmm] = new Cell(xmm,ymm,heightLand);
					}
					callback(map[ymm][xmm],b1[j]['v']);
				}
			}
		}
	}
}

function setPattern2(patternr, brushSize, callback, randMax) {
	// circles
	if (typeof randMax == "undefined") {
		randMax = 0.0;
	}
	var b1 = brush.get(brushSize);
	for (var r=1; r < 100; r++) {
		var wm = 2 * Math.PI / (6 * r)
		for (var w=0; w < 6*r; w++) {
			var randx = randMax * (Math.random() - 0.5);
			var randy = randMax * (Math.random() - 0.5);
			var xm = Math.round(0.5 * dd + patternr * (r * Math.sin(w * wm) + randx));
			var ym = Math.round(0.5 * dd + patternr * (r * Math.cos(w * wm) + randy));
			for (var j=0; j < b1.length; j++) {
				var xmm = xm + b1[j]['x'];
				var ymm = ym + b1[j]['y'];
				if (0 <= xmm && xmm < dd && 0 <= ymm && ymm < dd) {
					if (typeof map[ymm][xmm] == "undefined" ){
						map[ymm][xmm] = new Cell(xmm,ymm,heightLand);
					}
					callback(map[ymm][xmm],b1[j]['v']);
				}
			}
		}
	}
}

// draw a line
function line(x0,y0,x1,y1, callback, parameter) {
	if (typeof parameter == "undefined") {
		parameter = {};
	}
	parameter = parameter || {"brushSize": 10, "randomDisplacement": 0};
	var brushSize = parameter.brushSize;
	var randomDisplacement = parameter.randomDisplacement;
	var b1 = brush.get(brushSize);
	// result are the points of the line
	var result=Array();
	result.push({"x":Math.round(x0), "y":Math.round(y0)});
	var dx=x1-x0, dy=y1-y0;
	var d0 = Math.sqrt(dx*dx + dy*dy);
	var dx0 = dx / d0, dy0 = dy / d0;
	var t = 0;
	var lastdd = 10000, actualdd = 9999;
	while (actualdd < lastdd) {
		// create a line
		lastdd=actualdd;
		actualdd = Math.abs(x1-x0)+Math.abs(y1-y0);
		// console.log(dd,x0,y0);
		if (0 < actualdd) {
			if (dy == 0) {
				// horizontal line
				x0 += (dx < 0)?-1:1;
			}
			else {
				if (t < 0) {
					t += Math.abs(dy);
					x0 += (dx < 0)?-1:1;
				}
				else {
					t -= Math.abs(dx);
					y0 += (dy < 0)?-1:1;
				}
			}
			var r = Math.random() * 2 * randomDisplacement - randomDisplacement;
			// g_Map.log(x0 + " " + y0 + " " + r * dy0 + " " + r * dx0);
			result.push({"x":Math.round(x0 - r * dy0), "y":Math.round(y0 + r * dx0)});
		}
	}
	// g_Map.log("line:" + result);
	for (var i=0; i < result.length; i++) {
		for (var j=0; j < b1.length; j++) {
			var xmm = result[i]["x"] + b1[j]['x'];
			var ymm = result[i]["y"] + b1[j]['y'];
			if (0 <= xmm && 0 <= ymm && xmm < dd && ymm < dd) {
				if (typeof map[ymm][xmm] == "undefined" ){
					map[ymm][xmm] = new Cell(xmm,ymm,heightLand);
				}
				// g_Map.log("set:" + ymm + " " + xmm + " " + b1[j]['v']);
				callback(map[ymm][xmm], b1[j]['v']);
			}
		}
	}
	return result
}

/* draw a fractaline
 * addStart				internal parameter, do not set
 * randomDisplacement	add some zigzag, 0.0 = straight line
 * targetDist			maximum distance between two parameter
 * 
 * result				an array with 2-typel of x,y-coordiantes
 */ 
function fractalLine(x0,y0,x1,y1, parameter) {
	var result = [];
	parameter = parameter || {"targetDist": 10, "randomDisplacement": 0.0, "addStart": true };
	// g_Map.log("fLine:" + x0 + ", " + y0 + ", " + x1 + ", " + y1 + " - " + JSON.stringify(parameter));
	if (parameter.addStart) {
		result.push([x0,y0]);
	}
	var targetDist = parameter.targetDist, dx = x1 - x0, dy = y1 - y0;
	var randomV = parameter.randomDisplacement;
	// g_Map.log("fLine1:" + dx + ", " + dy + ", " + targetDist);
	if (dx*dx + dy*dy < targetDist*targetDist) {
		result.push([x1,y1]);
		return result;
	}
	var parameterSub = Object.assign({}, parameter); 
	parameterSub.addStart = false;
	var randomVa = randomV * (Math.random() - 0.5);
	var mx = 0.5 * (x1 + x0) + dy * randomVa, my = 0.5 * (y1 + y0) - dx * randomVa;
	result = result.concat(fractalLine(x0,y0,mx,my,parameterSub));
	result = result.concat(fractalLine(mx,my,x1,y1,parameterSub));
	// g_Map.log("fLineR:" + JSON.stringify(result));
	return result;
}

function placeBaseElement(player, w, x, y, entity, angle) {
	/*
	 * set the element relativ to the base, which is 40 fields from the 
	 */
	var dd = g_Map.getSize();
	var sw = Math.sin(w), cw = Math.cos(w);
	var distanceFromEdge = 30;
	if (dd < 193) {
		distanceFromEdge = 25;
	}
	if (dd < 129) {
		distanceFromEdge = 20;
	}
	if (typeof angle == "undefined") {
		angle = randomAngle();
	}
	var px = 0.5 * dd + (0.5 * dd - distanceFromEdge) * sw;
	var py = 0.5 * dd + (0.5 * dd - distanceFromEdge) * cw;
	var vx = px + x * sw + y * cw;
	var vy = py + x * cw - y * sw;
	if (0 < entity.length) {
		g_Map.placeEntityAnywhere(entity, player, {"x":vx, "y":vy}, angle);
	}
	return {"x": vx, "y": vy};
	
}

if (true) {
	var brush = new Brush();
	
	try {
		// initialize all cells
		var map = Array();
		for (var i=0; i<dd; i++) {
			var row = Array();
			for (var j=0; j<dd; j++) {
				// height is a sigmoid from the distance from the center
				// this is a multi-spiral that elevates the height a little
				var dx = j - 0.5 * dd, dy = i - 0.5 * dd;
				var d = Math.sqrt(dx*dx + dy*dy)
				var de = Math.exp( 5 * (0.6 - d / dd))
				// make the height profil a spirale from the center
				var ww = Math.atan2(dy, dx);
				var addHeight = 12 * Math.max(0,Math.cos(numPlayers * ww + d / 20)) / ( 1 + de);
				row.push(new Cell(i,j, heightLand + addHeight));
			}
			map.push(row);
		}
	}
	catch (e) {
		g_Map.log("Exception creating the map ");
	};
	Engine.SetProgress(5);
	
	if (true) {
		// trees on a small hill
		setPattern1(margin_trees1, size_trees1, setForest2, 0.8);
	}
	
	if (true) {
		// depression, swamps
		setPattern2(margin_depression, size_depression, setForest1, 0.8);
	}
	Engine.SetProgress(10);

	if (true) {
		// set the bases
		// numPlayers
		var citycenterXY = [];
		var mineXY = [];
		for (var i = 1; i < (numPlayers + 1); i++) {
			// koordinates are a little messed up, x and y sometimes have to be switched
			var wOffset = -0.25 * Math.PI;
			var ij = i - 1;
			var w = 2 * Math.PI * ij / numPlayers + wOffset;
			var sw = Math.sin(w), cw = Math.cos(w);
			// position for additional mines for big maps
			var w0 = 2 * Math.PI * (ij + 0.50) / numPlayers + wOffset;
			var w1 = 2 * Math.PI * (ij + 0.40) / numPlayers + wOffset;
			var w2 = 2 * Math.PI * (ij + 0.60) / numPlayers + wOffset;
			var w3 = 2 * Math.PI * (ij + 0.35) / numPlayers + wOffset;
			var w4 = 2 * Math.PI * (ij + 0.65) / numPlayers + wOffset;
			var sw0 = Math.sin(w0), cw0 = Math.cos(w0);
			var sw1 = Math.sin(w1), cw1 = Math.cos(w1);
			var sw2 = Math.sin(w2), cw2 = Math.cos(w2);
			var sw3 = Math.sin(w3), cw3 = Math.cos(w3);
			var sw4 = Math.sin(w4), cw4 = Math.cos(w4);
			var distanceFromEdge = 30;
			if (dd < 193) {
				// smaller maps with many player, put the town center closer to the edge
				distanceFromEdge = 25;
			}
			if (dd < 129) {
				// for even smaller maps
				distanceFromEdge = 20;
			}		
			// g_Map.placeEntityAnywhere(civilCentre, i, {"x":px, "y":py}, -w + 1.5 * Math.PI);
			var p = placeBaseElement(i,w,0,0, civilCentre,-w + 1.5 * Math.PI);
			citycenterXY.push({"x":p.x, "y":p.y});
			
			if (true) {
				setPoint(p.y,p.x,32,setBase);
				hills.push({'x': p.y, 'y': p.x, 'owner': owner, 'elevation': 0});
						
				placeBaseElement(i,w,-6,1.2, citizen_female);
				placeBaseElement(i,w,-6,0.4, citizen_female);
				placeBaseElement(i,w,-6,-0.4, citizen_female);
				placeBaseElement(i,w,-6,-1.4, citizen_female);
				
				placeBaseElement(i,w,-7,1.2, infantry_melee);
				placeBaseElement(i,w,-7,0.4, infantry_ranged);
				placeBaseElement(i,w,-7,-0.4, infantry_melee);
				placeBaseElement(i,w,-7,-1.4, infantry_ranged);
				
				placeBaseElement(0,w,9,1.5,food1);
				placeBaseElement(0,w,9,0.5,food1);
				placeBaseElement(0,w,9,-0.5,food1);
				placeBaseElement(0,w,9,-1.5,food1);
				
				// the standard-mines
				var mine = placeBaseElement(i,w,8,-12,mine_stone);
				setPoint(mine.y,mine.x,5,setMine);
				var mine = placeBaseElement(i,w,8,12,mine_metal);
				setPoint(mine.y,mine.x,5,setMine);
				
				// additional close Mines
				// if the maps are small these additional mines are put closer to the town-center
				var additionalMinesDistance = 50;
				var additionalMinesDistanceH = -2;
				if (dd < 193) {
					additionalMinesDistance = 40;
					additionalMinesDistanceH = -8;
				}
				if (dd < 129) {
					additionalMinesDistance = 30;
					additionalMinesDistanceH = -14;
				}
				var mine = placeBaseElement(i,	w,	additionalMinesDistanceH,	additionalMinesDistance,	mine_stone);
				setPoint(mine.y,mine.x,5,setMine);
				hills.push({'x': mine.y, 'y': mine.x, 'owner': owner, 'elevation': 0});
				mineXY.push({"x":mine.x, "y":mine.y});
				var mine = placeBaseElement(i,	w,	additionalMinesDistanceH,	-additionalMinesDistance,	mine_metal);
				setPoint(mine.y,mine.x,5,setMine);
				hills.push({'x': mine.y, 'y': mine.x, 'owner': owner, 'elevation': 0});
				mineXY.push({"x":mine.x, "y":mine.y});
				
				owner += 1;
				if (100 < dd / numPlayers) {
					// for big maps some extra-mines
					var px0a = 0.5 * dd + (0.5 * dd - 15) * sw0;
					var py0a = 0.5 * dd + (0.5 * dd - 15) * cw0;
					g_Map.placeEntityAnywhere(mine_stone, i, {"x":px0a, "y":py0a}, randomAngle());
					setPoint(py0a,px0a,5,setMine);
					mineXY.push({"x":px0a, "y":py0a});
					hills.push({'x': py0a, 'y': px0a, 'owner': owner, 'elevation': 0});
					
					var px1a = 0.5 * dd + (0.5 * dd - 22) * sw1;
					var py1a = 0.5 * dd + (0.5 * dd - 22) * cw1;
					g_Map.placeEntityAnywhere(mine_metal, i, {"x":px1a, "y":py1a}, randomAngle());
					setPoint(py1a,px1a,5,setMine);
					mineXY.push({"x":px1a, "y":py1a});
					hills.push({'x': py1a, 'y': px1a, 'owner': owner, 'elevation': 0});
					
					var px2a = 0.5 * dd + (0.5 * dd - 22) * sw2;
					var py2a = 0.5 * dd + (0.5 * dd - 22) * cw2;
					g_Map.placeEntityAnywhere(mine_metal, i, {"x":px2a, "y":py2a}, randomAngle());
					setPoint(py2a,px2a,5,setMine);
					mineXY.push({"x":px2a, "y":py2a});
					hills.push({'x': py2a, 'y': px2a, 'owner': owner, 'elevation': 0});
				}
				owner += 1;
				if (130 < dd / numPlayers) {
					// for bigger maps more extra-mines
					var px0a = 0.5 * dd + (0.5 * dd - 60) * sw0;
					var py0a = 0.5 * dd + (0.5 * dd - 60) * cw0;
					g_Map.placeEntityAnywhere(mine_stone, i, {"x":px0a, "y":py0a}, randomAngle());
					setPoint(px0a,py0a,5,setMine);
					mineXY.push({"x":px0a, "y":py0a});
					hills.push({'x': py0a, 'y': px0a, 'owner': owner, 'elevation': 0});
					
					var px1a = 0.5 * dd + (0.5 * dd - 68) * sw3;
					var py1a = 0.5 * dd + (0.5 * dd - 68) * cw3;
					g_Map.placeEntityAnywhere(mine_metal, i, {"x":px1a, "y":py1a}, randomAngle());
					setPoint(px1a,py1a,5,setMine);
					mineXY.push({"x":px1a, "y":py1a});
					hills.push({'x': py1a, 'y': px1a, 'owner': owner, 'elevation': 0});
					
					var px2a = 0.5 * dd + (0.5 * dd - 68) * sw4;
					var py2a = 0.5 * dd + (0.5 * dd - 68) * cw4;
					g_Map.placeEntityAnywhere(mine_metal, i, {"x":px2a, "y":py2a}, randomAngle());
					setPoint(px2a,py2a,5,setMine);
					mineXY.push({"x":px2a, "y":py2a});
					hills.push({'x': py2a, 'y': px2a, 'owner': owner, 'elevation': 0});
				}
				owner += 1;
			}		
		}
	}
		
	if (true) {	
		// random voronoi geography
		for (var y=-60; y < 61; y++) {
			for (var x=-50; x < 51; x++) {
				var randx = randHillMax * (Math.random() - 0.5);
				var randy = randHillMax * (Math.random() - 0.5);
				var xm = Math.round(0.5 * dd + distHill * (randx + x + 0.5 * (y % 2)));
				var ym = Math.round(0.5 * dd + distHill * 0.8660255 * (randy + y));
				if (0 <= xm && xm < dd && 0 <= ym && ym < dd) {
					var setHill = true;
					
					for (var cci = 0; cci < citycenterXY.length; cci += 1) {
						// distance from civil centers
						var dhx = citycenterXY[cci].y - xm;
						var dhy = citycenterXY[cci].x - ym;
						var ddh = Math.sqrt(dhx * dhx + dhy * dhy);
						if (ddh < clearMountainsBig) {
							setHill = false;
						}
					}
					
					for (var cci = 0; cci < mineXY.length; cci += 1) {
						// distance from mines
						var dhx = mineXY[cci].y - xm;
						var dhy = mineXY[cci].x - ym;
						var ddh = Math.sqrt(dhx * dhx + dhy * dhy);
						if (ddh < clearMountainsSmall) {
							setHill = false;
						}
					}
					
					if (setHill) {
						hills.push({'x': xm, 'y': ym, 'owner': owner, 'elevation': Math.floor(Math.random() * 2)});
						owner += 1;	
					}
				}
			}
		}
		Engine.SetProgress(25);
		
		var roC = 2;
		var mcTotal = roC * hills.length;
		for (var ro = 0; ro < roC; ro += 1) {
			for (var i = 0; i < hills.length; i += 1) {
				// g_Map.log("generating hills: " + ro + " " + i + "/" + hills.length);
				setHillD(ro, roC, hills[i].x, hills[i].y, hills[i].owner, hills[i].elevation);
				var mcActual = ro * hills.length + i;
				// making the hills is one of the most time consuming tasks, that's why there are regulary updates
				var progressHill = Math.round((85 - 25) * mcActual / mcTotal + 25);
				Engine.SetProgress(progressHill);
			}
			
			g_Map.log("generating heights");
			for (var i=0; i<dd; i++) {
				for (var j=0; j<dd; j++) {
					if (typeof map[i][j] != "undefined") {
						// g_Map.log("rendering:" + i + " " + j);
						renderCell(map[i][j], 0);
						delete map[i][j].d;
					} 
				}
			}
		}
		Engine.SetProgress(85);
	}
			
	// render pass 2 (slopes)
	g_Map.log("calculating slopes");
	for (var i=0; i<dd; i++) {
		for (var j=0; j<dd; j++) {
			var centerH = heightLand;
			if (typeof map[i][j] != "undefined") {
				centerH = getHeight(map[i][j]);
				var diffMax = 0;
				var diffMin = 0;
				for (var iDiff=-2; iDiff<3; iDiff++) {
					for (var jDiff=-2; jDiff<3; jDiff++) {
						var diff = iDiff * iDiff + jDiff * jDiff;
						if (0.1 < diff && diff < 5.1) {
							// only take fields in the distanze of sqrt(5.1)
							var ip = i + iDiff;
							var jp = j + jDiff;
							if (ip >= 0 && ip < dd && jp >= 0 && jp < dd && typeof map[ip][jp] != "undefined") {
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
	for (var i=0; i<dd; i++) {
		for (var j=0; j<dd; j++) {
			if (typeof map[i][j] != "undefined") {
				// g_Map.log("rendering:" + i + " " + j);
				renderCell(map[i][j], 1);
			}
		}
	}
	
	// rendering pass 4 (add some deco)
	for (var decoI = 0; decoI < deco.length; decoI += 1) {
		for (var ii = 0; ii < deco[decoI].decoMax; ii += 1) {
			var w = 2 * Math.PI * ii / deco[decoI].decoMax;
			var sw = Math.sin(w), cw = Math.cos(w);
			var rOffset = deco[decoI].radius + (Math.random() - 0.5) * 0.1;
			var px = Math.round(0.5 * dd * ( 1.0 + rOffset * sw ));
			var py = Math.round(0.5 * dd * ( 1.0 + rOffset * cw ));
			var ij = deco[decoI].clusterMax;
			var ik = 100;
			while (0 < ij && 0 < ik) {
				ik -= 1;
				var pxr = Math.round((Math.random() - 0.5) * 6 + px);
				var pyr = Math.round((Math.random() - 0.5) * 6 + py);
				if (map[pxr][pyr].allowElements) {
					g_Map.placeEntityAnywhere(deco[decoI].element, 0, {"x":pxr, "y":pyr}, randomAngle());
					map[pxr][pyr].allowElements = false;
					ij -= 1;
				}
			}
		}
	}

}

// g_Environment.victoryConditions="conquest";
g_Map.ExportMap();

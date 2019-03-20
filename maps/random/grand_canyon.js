Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("heightmap");


const heightLand = 60;
const tSand = "sand";
var g_Map = new RandomMap(heightLand, tSand);

var clRiver = g_Map.createTileClass();


const centerPos = g_Map.getCenter();

//var pnp = new perlin_noise_point(20, 10, 1, 28, false)

function bezier_quadratic(p0, p1, p2, t)
{
	const t1 = 1.0 - t;
	return p0.clone().mult(t1 * t1).add(p1.clone().mult(2 * t1 * t)).add(p2.clone().mult(t * t));
}

const river_readWidth = Math.PI * 0.3;
const p0 = new Vector2D(1, 0).mult(g_Map.size / 2).rotate(-river_readWidth / 2).add(centerPos);
const p1 = new Vector2D(1, 0).mult(-g_Map.size / 2).add(centerPos);
const p2 = new Vector2D(1, 0).mult(g_Map.size / 2).rotate(+river_readWidth / 2).add(centerPos);



let height = 0;

let river_pathAreas_points = [];
const pmax = 6;
for (let p = 0; p < pmax; p++)
{
	const t = parseFloat(p) / pmax;
	const t1 = parseFloat(p + 1) / pmax;
	const pb0 = bezier_quadratic(p0, p1, p2, t);
	const pb1 = bezier_quadratic(p0, p1, p2, t1);
	new createArea(
		new PathPlacer(pb0, pb1, 2, 0.25, 20, 0.9, 0), [
			//new TerrainPainter("red"),
			new TileClassPainter(clRiver),
			new SmoothElevationPainter(ELEVATION_SET, height, 0)
		], []
	);
}

const perlinTerrain = new PerlinPainter(ELEVATION_MODIFY);

const height_levels = [0, 2, 4, 6, 15, 17, 21, 23, 30, 50, 57];
const step_levels = [1, 1, 1, 1, 2, 1, 2, 2, 3, 3, 1];
const imax = height_levels.length;
for (var i = 0; i < imax; i++)
{
	createArea(
		new MapBoundsPlacer(), [
			new TileClassPainter(clRiver),
			new SmoothElevationPainter(ELEVATION_SET, height_levels[i], 0),
			perlinTerrain
		], [
			new borderClasses(clRiver, 0, step_levels[i])
		]
	);

}

createArea(
	new MapBoundsPlacer(), [
		perlinTerrain
	], [
		new avoidClasses(clRiver, 0)
	]
);




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
g_Map.ExportMap();
/*
 *@param {Bool} type - ELEVATION_MODIFY or ELEVATION_SET
 *@param {Number} scale - global scale of dune size (width and  height) - higher values make dunes bigger
 *@param {Number} vertical_scale - scale of dune height - higher makes dunes  taller
 */
function DunePainter(type = ELEVATION_MODIFY, scale = 1, vertical_scale = 1)
{
	this.type = type;
	this.scale = scale;
	this.vertical_scale = vertical_scale;
}
/*
 *Dune base shape
 *@param {Number} - x [0,1] value
 *@param {Number} - xm [0,1] position of the dune crest
 *@param {Bool} - d true for dune false for dome 
 */
DunePainter.prototype.dune = function(x, crest_x = 0.75, dune = true)
{
	if (x < crest_x) return (1 - Math.cos(Math.PI * x / crest_x)) * 0.5;
	if (dune) return (1 - Math.cos(Math.PI * (x - 1) / (crest_x - 1))) * 0.5;
	return 1 - Math.cos(Math.PI * (x - 1) / (crest_x - 1) * 0.5);
}

DunePainter.prototype.paint = function(area)
{
	const points = area.getPoints();
	const length = points.length;
	//1st dune layer
	const h1_1 = perlin_noise(points, 6, 2, 1, 1.1, true);
	const h1_2 = perlin_noise(points, 3, 2, 1, 1, true);
	const L1 = 17.0 * this.scale;
	//2on dune layer
	const h2_1 = perlin_noise(points, 8, 1, 2, 2, true);
	const h2_2 = perlin_noise(points, 4, 2, 2, 2, true);
	const L2 = 14.0 * this.scale;
	//loop all the points
	let elevation_type = this.type ? (i) => g_Map.getHeight(points[i]) : () => 0;
	for (var i = 0; i < length; i++)
	{
		//main dunes creation
		const v1 = ((points[i].x + h1_1[i] * 13 + points[i].y * 0.1) % L1) / L1;
		const h1 = this.dune(v1, 0.60, false) * 9 * 0.9 + h1_1[i] * h1_2[i] * 150 * 0.1;
		//secondary dunes
		const v2 = ((points[i].x + h2_1[i] * 13 + points[i].y * 0.1) % L2) / L2;
		const h2 = this.dune(v2, 0.60, false) * 9 * 0.9 + h2_2[i] * 50 * 0.1;
		const height = (h1 * 0.8 + h2 * 0.2) * this.vertical_scale * this.scale;
		//add or set height
		g_Map.setHeight(points[i], height + elevation_type(i));
	}
}
/*
 *@param {Bool} type - ELEVATION_MODIFY or ELEVATION_SET
 *@param {Array} points - Points
 *@param {Number} frequency - float value >= 1. Noise size, higher value makes noise more compact
 *@param {Number} octaves - int value >= 1Sub noise levels, higher the value gives noise more definition **can be as high as desired while the original frequcny doesn't reach < 1
 *@param {Number} scale - Scale size of the perlin noise (in the three axis) 
 *@param {Number} vertical_scale - Scale size of the perlin noise (in the vertical axis)
 *@param {Bool} positive - Returns only on the range of [0,1] (in the case of default paremeters)
 */
function PerlinPainter(type = ELEVATION_MODIFY, frequency = 25, octaves = 10, scale = 1, vertical_scale = 2, positive = true)
{
	this.type = type;
	this.frequency = frequency;
	this.octaves = octaves;
	this.scale = scale;
	this.vertical_scale = vertical_scale;
	this.positive = positive;
}
PerlinPainter.prototype.paint = function(area)
{
	const points = area.getPoints();
	const length = points.length;
	const perlinHeights = perlin_noise(points, this.frequency, this.octaves, this.scale, this.vertical_scale, this.positive);
	let elevation_type = this.type ? (i) => g_Map.getHeight(points[i]) : () => 0;
	points.forEach( (point,i) => g_Map.setHeight(point, perlinHeights[i] + elevation_type(i) ) );
}
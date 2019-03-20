/*
 *Perlin noise. Returns 1D array list of heights for each point given. With default paramenters returns in the range of [-1,1]
 *@param {Array} points - Points
 *@param {Number} frequency - float value >= 1. Noise size, higher value makes noise more compact
 *@param {Number} octaves - int value >= 1Sub noise levels, higher the value gives noise more definition **can be as high as desired while the original frequcny doesn't reach < 1
 *@param {Number} scale - Scale size of the perlin noise (in the three axis) 
 *@param {Number} vertical_scale - Scale size of the perlin noise (in the vertical axis)
 *@param {Bool} positive - Returns only on the range of [0,1] (in the case of default paremeters)
 *@return {Array}
 */
function perlin_noise(points, frequency = 10, octaves = 1, scale = 1, vertical_scale = 1, positive = false)
{
	const size = points.length;
	let heights = Array(size).fill(0);
	frequency /= scale;
	let weight = 1;
	const frequency_multiplier = 1.333333;
	const weight_multiplier = 0.75;

	for (let octave = 0; octave < octaves; octave++)
	{
		let noise2D = new Noise2D(frequency);
		for (let i = 0; i < size; i++)
		{
			const ix = (points[i].x / 256.0) % 1;
			const iy = (points[i].y / 256.0) % 1;
			//noise2D gives values between [0.15,0.85]
			//transform to a range of [-1,1]
			const val = (noise2D.get(ix, iy) - 0.15) / 0.7 * 2 - 1;
			heights[i] += val * weight;
		}
		frequency *= frequency_multiplier;
		weight *= weight_multiplier;
	}
	heights.forEach((v, i, a) => a[i] *= scale * vertical_scale)

	if (positive)
	{
		const hdisp = vertical_scale * scale * Array(octaves).fill().map((e, i) => Math.pow(weight_multiplier, i + 1)).reduce((a, b) => a + b);
		heights.forEach((v, i, a) => a[i] = (v + hdisp) * 0.5)
	}

	return heights;
}

/*
 *Perlin noise for individual points
 */
function perlin_noise_point(frequency = 10, octaves = 1, scale = 1, vertical_scale = 1, positive = false)
{
	this.frequency = frequency / scale;
	this.octaves = octaves;
	this.scale = scale;
	this.vertical_scale = vertical_scale;
	this.positive = positive;
	this.frequency_multiplier = 1.333333;
	this.weight_multiplier = 0.75;
	let frequency_i = this.frequency;
	let weight_i = 1;

	this.noise2D = [];
	this.weights = [];
	for (let octave = 0; octave < this.octaves; octave++)
	{
		this.noise2D.push(new Noise2D(frequency_i))
		this.weights.push(weight_i)
		frequency_i *= this.frequency_multiplier;
		weight_i *= this.weight_multiplier;
	}

	this.hdisp = this.vertical_scale * this.scale * Array(this.octaves).fill().map((e, i) => Math.pow(this.weight_multiplier, i + 1)).reduce((a, b) => a + b)
}

perlin_noise_point.prototype.get = function(point)
{
	let height = 0;
	for (let i = 0; i < this.octaves; i++)
	{
		const x = (point.x / 256.0) % 1;
		const y = (point.y / 256.0) % 1;
		//noise2D gives values between [0.15,0.85]
		//give range  [-1,1]
		const val = (this.noise2D[i].get(x, y) - 0.15) / 0.7 * 2 - 1;
		height += val * this.weights[i];
	}
	
	height *= this.scale * this.vertical_scale;

	return this.positive ? (height + this.hdisp) * 0.5 : height;
}
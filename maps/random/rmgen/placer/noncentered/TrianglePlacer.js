function TrianglePlacer(points, failFraction = 0)
{
	if (points.length != 3)
		error("TrianglePlacer exactly needs an array of 3 Vector2D integer points")
	this.vertices = points;
	this.failFraction = failFraction;
};



TrianglePlacer.prototype.orient = function(a, b, c)
{
	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

//https://fgiesen.wordpress.com/2013/02/10/optimizing-the-basic-rasterizer/
TrianglePlacer.prototype.place = function(constraint)
{
	let points = [];
	let count = 0;
	let failed = 0;

	/// triangle filling procedure
	const minx = Math.max(Math.min(this.vertices[0].x, this.vertices[1].x, this.vertices[2].x), 0);
	const miny = Math.max(Math.min(this.vertices[0].y, this.vertices[1].y, this.vertices[2].y), 0);
	const maxx = Math.min(Math.max(this.vertices[0].x, this.vertices[1].x, this.vertices[2].x), g_Map.size - 1);
	const maxy = Math.min(Math.max(this.vertices[0].y, this.vertices[1].y, this.vertices[2].y), g_Map.size - 1);

	const A01 = this.vertices[0].y - this.vertices[1].y;
	const B01 = this.vertices[1].x - this.vertices[0].x;
	const A12 = this.vertices[1].y - this.vertices[2].y;
	const B12 = this.vertices[2].x - this.vertices[1].x;
	const A20 = this.vertices[2].y - this.vertices[0].y;
	const B20 = this.vertices[0].x - this.vertices[2].x;

	let p = new Vector2D(minx, miny);

	let w0_row = this.orient(this.vertices[1], this.vertices[2], p);
	let w1_row = this.orient(this.vertices[2], this.vertices[0], p);
	let w2_row = this.orient(this.vertices[0], this.vertices[1], p);

	for (p.y = miny; p.y <= maxy; p.y++)
	{
		let w0 = w0_row;
		let w1 = w1_row;
		let w2 = w2_row;
		for (p.x = minx; p.x <= maxx; p.x++)
		{
			if ((w0 | w1 | w2) >= 0)
			{
				let point = p.clone();
				++count;
				if (constraint.allows(point))
					points.push(point);
				else
					++failed;
			}
			w0 += A12
			w1 += A20
			w2 += A01
		}
		w0_row += B12
		w1_row += B20
		w2_row += B01
	}

	return failed <= this.failFraction * count ? points : undefined;
};
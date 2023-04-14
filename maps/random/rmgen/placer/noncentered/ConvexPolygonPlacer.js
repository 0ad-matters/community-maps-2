function ConvexPolygonPlacer(points, failFraction = 0)
{
	this.polygonVertices = this.getConvexHull(points.map(point => point.clone().round()));
	this.polyLen = this.polygonVertices.length;
	this.failFraction = failFraction;
}

ConvexPolygonPlacer.prototype.orient = function(a, b, c)
{
	return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

// https://fgiesen.wordpress.com/2013/02/10/optimizing-the-basic-rasterizer/
ConvexPolygonPlacer.prototype.place = function(constraint)
{
	const points = [];
	let count = 0;
	let failed = 0;

	if (!this.polyLen)
		return undefined;

	const minx = Math.max(this.polygonVertices[0].x, 0);
	const v0 = this.polygonVertices[0];
	let w0, w1, w2, w0_row, w1_row, w2_row;

	for (var i = 1; i < this.polyLen - 1; i++)
	{
		// / triangle filling procedure
		const v1 = this.polygonVertices[i];
		const v2 = this.polygonVertices[i + 1];

		const miny = Math.max(Math.min(v0.y, v1.y, v2.y), 0);
		const maxx = Math.min(Math.max(v1.x, v2.x), g_Map.size - 1);
		const maxy = Math.min(Math.max(v0.y, v1.y, v2.y), g_Map.size - 1);

		const A01 = v0.y - v1.y;
		const B01 = v1.x - v0.x;
		const A12 = v1.y - v2.y;
		const B12 = v2.x - v1.x;
		const A20 = v2.y - v0.y;
		const B20 = v0.x - v2.x;

		const p = new Vector2D(minx, miny);
		w0_row = this.orient(v1, v2, p);
		w1_row = this.orient(v2, v0, p);
		w2_row = this.orient(v0, v1, p);

		for (p.y = miny; p.y <= maxy; p.y++)
		{
			w0 = w0_row;
			w1 = w1_row;
			w2 = w2_row;
			for (p.x = minx; p.x <= maxx; p.x++)
			{
				if ((w0 | w1 | w2) >= 0)
				{
					const point = p.clone();
					++count;
					if (constraint.allows(point))
						points.push(point);
					else
						++failed;
				}
				w0 += A12;
				w1 += A20;
				w2 += A01;
			}
			w0_row += B12;
			w1_row += B20;
			w2_row += B01;
		}
	}
	return failed <= this.failFraction * count ? points : undefined;
};

// http://mindthenerd.blogspot.com/2012/05/fastest-convex-hull-algorithm-ever.html
ConvexPolygonPlacer.prototype.pruning = function(points)
{
	if (points.length < 15)
		return points.slice();

	const plist = [];
	let A = points[0].clone();
	let B = points[0].clone();
	let C = points[0].clone();
	let D = points[0].clone();

	for (const p of points)
	{
		if (A.x - A.y <= p.x - p.y) A = p;
		if (B.x + B.y <= p.x + p.y) B = p;
		if (C.x - C.y >= p.x - p.y) C = p;
		if (D.x + D.y >= p.x + p.y) D = p;
	}

	const x1 = Math.max(C.x, D.x);
	const x2 = Math.max(A.x, B.x);
	const y1 = Math.max(A.y, D.y);
	const y2 = Math.max(B.y, C.y);

	for (const p of points)
	{
		if (!(p.x > x1 && p.x < x2 && p.y > y1 && p.y < y2))
			plist.push(p);
	}

	return plist;
};

ConvexPolygonPlacer.prototype.cross = function(a, b, o)
{
	return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
};

// https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript
ConvexPolygonPlacer.prototype.getConvexHull = function(points)
{
	const sortedPoints = this.pruning(points);
	var lower = [];
	var upper = [];

	if (sortedPoints.length < 4)
		return sortedPoints;

	sortedPoints.sort((a, b) => a.x == b.x ? a.y - b.y : a.x - b.x);

	for (var i = 0; i < sortedPoints.length; i++)
	{
		while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], sortedPoints[i]) <= 0)
		{
			lower.pop();
		}
		lower.push(sortedPoints[i]);
	}

	for (var i = sortedPoints.length - 1; i >= 0; i--)
	{
		while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], sortedPoints[i]) <= 0)
		{
			upper.pop();
		}
		upper.push(sortedPoints[i]);
	}

	upper.pop();
	lower.pop();

	return lower.concat(upper);
};

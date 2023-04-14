/*
 *Fills the inside of any polygon given 3 or more points  - filling also works with overlapping sections
 *Algorithm: https://en.wikipedia.org/wiki/Point_in_polygon
 */
function PolygonPlacer(points)
{
	this.points = points;

	this.horiLine = function(point1, point2)
	{
		const dy = point2.y - point1.y;
		if (dy == 0)
		{
			this.doesCross = point => false;
		}
		else
		{
			this.minx = Math.min(point1.x, point2.x);
			this.miny = Math.min(point1.y, point2.y);
			this.maxy = Math.max(point1.y, point2.y);
			this.val1 = (point2.x - point1.x) / dy;
			this.val2 = point1.x - this.val1 * point1.y;
			this.doesCross = point => this._cross(point);
		}
	};

	this.horiLine.prototype._cross = function(point)
	{
		// most probable cases
		if (point.y > this.maxy) return false;
		if (point.y <= this.miny) return false;
		// line segment side check
		return point.x >= this.val2 + this.val1 * point.y;
	};

	this.horiLine.prototype.cross = function(point)
	{
		return this.doesCross(point);
	};

	// bounding box
	const plength = this.points.length;
	const xlist = this.points.map(v => v.x).sort((a, b) => a - b);
	const ylist = this.points.map(v => v.y).sort((a, b) => a - b);
	this.minx = Math.floor(xlist[0]);
	this.miny = Math.floor(ylist[0]);
	this.maxx = Math.ceil(xlist[plength - 1]);
	this.maxy = Math.ceil(ylist[plength - 1]);
	// create lines and sort from min to max for this.minx
	this.lines = this.points.map((point, index, arr) => new this.horiLine(point, arr[(index + 1) % plength])).sort((a, b) => a.minx - b.minx);
}

PolygonPlacer.prototype.isInside = function(lines, point)
{
	// % 2 returns whether the number is odd or not
	return lines.filter(line => line.cross(point)).length % 2;
};

PolygonPlacer.prototype.place = function(constraint)
{
	// check every possible point
	const points = [];
	// upper right index of lines array
	let ix = 0;
	const length = this.lines.length;
	let lines = [];
	for (let x = this.minx; x < this.maxx; x++)
	{
		// only test for segments positioned to the left of x
		for (let i = ix; i < length; ++i)
		{
			if (this.lines[i].minx > x)
			{
				ix = i;
				lines = this.lines.slice(0, i);
				break;
			}
		}
		for (let y = this.miny; y < this.maxy; y++)
		{
			const point = new Vector2D(x, y);
			if (constraint.allows(point) && this.isInside(lines, point))
			{
				points.push(point);
			}
		}
	}

	return points;
};
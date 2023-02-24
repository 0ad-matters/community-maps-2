function clamp(value, min = 0, max = 1)
{
	if (value < min) return min;
	if (value < max) return value;
	return max;
}

function inValueBounds(value)
{
	return value >= 0 && value <= 1;
}

function valueSing(value)
{
	return value >= 0 ? 1 : -1;
}

/*
 * Density constraint
 */
function DensityConstraint(density)
{
	this.density = density;
	if (this.density.step === undefined)
	{
		this.density.step = (t) => t;
	}
}

DensityConstraint.prototype.allows = function(position)
{
	const value = this.density.probability(position);
	if (inValueBounds(value))
	{
		const height = g_Map.getHeight(position);
		const probability = this.density.step(value, height, position);
		const randomValue = randFloat(0, 1);
		return randomValue <= probability;
	}
	return false;
};

/*
 * Density radius function
 */
function DensityRadius(center, radius, stepDensityFunction = undefined)
{
	this.step = stepDensityFunction;
	this.center = center;
	this.radius = radius;
}

DensityRadius.prototype.probability = function(position)
{
	const distance = this.center.distanceTo(position);
	return distance / this.radius;
};

/*
 * Density direction function
 */
function DensityDirection(position, direction, maxDistance, stepDensityFunction = undefined)
{
	this.step = stepDensityFunction;
	this.position = position;
	this.positionEnd = direction.clone().rotate(Math.PI / 2).add(this.position);
	this.maxDistance = maxDistance;
}

DensityDirection.prototype.probability = function(position)
{
	const distance = distanceOfPointFromLine(this.position, this.positionEnd, position);
	return distance / this.maxDistance;
};

/*
 * Density custom defined function
 */
function DensityCustom(customFunction, stepDensityFunction = undefined)
{
	this.customFunction = customFunction;
}

DensityCustom.prototype.probability = function(position)
{
	return this.customFunction(position);
};
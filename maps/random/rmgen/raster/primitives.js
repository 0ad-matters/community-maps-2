/**
 * Rasters triangles and sets interpolated heights
 */
function triRast(v0, v1, v2, h0, h1, h2, setCondition)
{
    let validCondition = setCondition ? setCondition : () => true;

    let miny = Math.floor(Math.min(v0.y, v1.y, v2.y));
    let minx = Math.floor(Math.min(v0.x, v1.x, v2.x));
    let maxx = Math.ceil(Math.max(v0.x, v1.x, v2.x));
    let maxy = Math.ceil(Math.max(v0.y, v1.y, v2.y));
    let t0 = v1.clone().sub(v0);
    let t1 = v2.clone().sub(v0);
    let d00 = t0.dot(t0);
    let d01 = t0.dot(t1);
    let d11 = t1.dot(t1);
    let invdenom = 1 / (d00 * d11 - d01 * d01);
    for (let py = miny; py <= maxy; ++py)
    {
        for (let px = minx; px <= maxx; ++px)
        {
            let p = new Vector2D(px, py);
            let t2 = p.clone().sub(v0);
            let d20 = t2.dot(t0);
            let d21 = t2.dot(t1);
            let w1 = (d11 * d20 - d01 * d21) * invdenom;
            let w2 = (d00 * d21 - d01 * d20) * invdenom;
            let w0 = 1.0 - w2 - w1;
             // 0.000001 mini overlap (prevents cases of point being inbetween two triangles and not being picked up)
            if (w0 >= -0.00001 && w1 >= -0.00001 && w2 >= -0.00001)
            {
                let dw = w0 * h0 + w1 * h1 + w2 * h2;
                if (g_Map.validHeight(p) && validCondition(p, dw))
                    g_Map.setHeight(p, dw)
            }
        }
    }
}

/**
 * Rasters quad as two triRast together
 */
function quadRast(v0, v1, v2, v3, h0, h1, h2, h3, setCondition)
{
    triRast(v0, v1, v2, h0, h1, h2, setCondition);
    triRast(v2, v3, v0, h2, h3, h0, setCondition);
}

/**
 * Makes an arc
 * @param {Function} shaper - Returns the height of that point.
 * Is fed (normalizedAngle, normalizedRadius) as arguments.
 * @param {Function} [setCondition] - Returns whether place
 * or not that height at the position. Is fed (point,pointHeight)
 * as arguments.
 */
function arcRast(center, minRadius, maxRadius, minAngle, maxAngle, shaper, setCondition)
{
    let nAngles = 40;
    let nRadius = 40;
    let point = (a, d) => new Vector2D(1, 0).rotate(a).mult(d).add(center);
    let points_rect = (a, an, r, rn) => [point(a, r), point(a, rn), point(an, rn), point(an, r)];
    let heights_rect = (a, an, r, rn) => [shaper(a, r), shaper(a, rn), shaper(an, rn), shaper(an, r)];
    for (let iAngle = 0; iAngle < nAngles; ++iAngle)
    {
        let uAngle = iAngle / nAngles;
        let uAngleNext = (iAngle + 1) / nAngles;
        let angle = minAngle + uAngle * (maxAngle - minAngle);
        let angleNext = minAngle + uAngleNext * (maxAngle - minAngle);
        for (let iRadius = 0; iRadius < nRadius; ++iRadius)
        {
            let uRadius = iRadius / nRadius;
            let uRadiusNext = (iRadius + 1) / nRadius;
            let radius = minRadius + uRadius * (maxRadius - minRadius);
            let radiusNext = minRadius + uRadiusNext * (maxRadius - minRadius);
            let points = points_rect(angle, angleNext, radius, radiusNext);
            let heights = heights_rect(uAngle, uAngleNext, uRadius, uRadiusNext)
            quadRast(...points, ...heights, setCondition);
        }
    }
}

/**
 * Makes an arc
 * @param {Function} shaper - Returns the height of that point.
 * Is fed (normalizedAngle) as arguments.
 * @param {Function} [setCondition] - Returns whether place
 * or not that height at the position. Is fed (point,pointHeight)
 * as arguments.
 */
function spiralRast(center, width, startRadius, endRadius, startAngle, endAngle, shaper, setCondition)
{
    // nAngles == nRadius
    let subdivisions = 120;
    let point = (a, r, w) => new Vector2D(1, 0).rotate(a).mult(r + w).add(center);
    for (let i = 0; i < subdivisions; ++i)
    {
        let unitary = i / subdivisions;
        let unitaryNext = (i+1) / subdivisions;
        let radius = startRadius + unitary * (endRadius - startRadius);
        let radiusNext = startRadius + unitaryNext * (endRadius - startRadius);
        let angle = startAngle + unitary * (endAngle - startAngle);
        let angleNext = startAngle + unitaryNext * (endAngle - startAngle);
        let points = [point(angle, radius, 0), point(angleNext, radiusNext, 0), point(angleNext, radiusNext, width), point(angle, radius, width)];
        let heights = [shaper(unitary), shaper(unitary), shaper(unitaryNext), shaper(unitaryNext)];
        quadRast(...points, ...heights, setCondition);
    }
}

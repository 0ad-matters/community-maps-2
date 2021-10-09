Engine.LoadLibrary("rmgen/raster");
let genMapFertWithMountain = function (isMountain)
{
    setSelectedBiome();

    const tMainTerrain = g_Terrains.mainTerrain;
    const tForestFloor1 = g_Terrains.forestFloor1;
    const tForestFloor2 = g_Terrains.forestFloor2;
    const tTier1Terrain = g_Terrains.tier1Terrain;
    const tTier2Terrain = g_Terrains.tier2Terrain;
    const tTier3Terrain = g_Terrains.tier3Terrain;
    const tRoad = g_Terrains.road;
    const tRoadWild = g_Terrains.roadWild;
    const tTier4Terrain = g_Terrains.tier4Terrain;
    const tShore = g_Terrains.shore;
    const tWater = g_Terrains.water;

    const oTree1 = g_Gaia.tree1;
    const oTree2 = g_Gaia.tree2;
    const oTree3 = g_Gaia.tree3;
    const oTree4 = g_Gaia.tree4;
    const oTree5 = g_Gaia.tree5;
    const oFruitBush = g_Gaia.fruitBush;
    const oFish = g_Gaia.fish;
    const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
    const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
    const oStoneLarge = g_Gaia.stoneLarge;
    const oStoneSmall = g_Gaia.stoneSmall;
    const oMetalLarge = g_Gaia.metalLarge;

    const aGrass = g_Decoratives.grass;
    const aGrassShort = g_Decoratives.grassShort;
    const aRockLarge = g_Decoratives.rockLarge;
    const aRockMedium = g_Decoratives.rockMedium;
    const aBushMedium = g_Decoratives.bushMedium;
    const aBushSmall = g_Decoratives.bushSmall;
    const aWaterDecoratives = ["props/flora/reeds_pond_lush_a"].map(actorTemplate);

    var pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
    var pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

    var stonesGroup = new SimpleGroup([
        new SimpleObject("actor|geology/gray1.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/gray_rock1.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/highland1.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/highland1_moss.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/highland2.xml", 1, 2, 1, 3),
        new SimpleObject("actor|geology/highland2_moss.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/highland3.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/highland_c.xml", 1, 2, 1, 2),
        new SimpleObject("actor|geology/highland_d.xml", 1, 2, 1, 3),
        new SimpleObject("actor|geology/highland_e.xml", 1, 2, 1, 2)
    ]);

    g_Map = new RandomMap(0, tMainTerrain);

    let clamp = (val, min, max) => Math.min(Math.max(val, min), max);
    let linearScale = (val, min, max) => min + val * (max - min);
    let scaleByNumberOfPlayers = (a, b) => linearScale(getNumPlayers() / 8.0, a, b);

    function bezier_quadratic(p0, p1, p2, t)
    {
        let v0 = p0.clone().mult((1 - t) * (1 - t));
        let v1 = p1.clone().mult(2 * (1 - t) * t);
        let v2 = p2.clone().mult(t * t);
        return v0.add(v1).add(v2);
    }

    var clPlayer = g_Map.createTileClass();
    var clHill = g_Map.createTileClass();
    var clForest = g_Map.createTileClass();
    var clDirt = g_Map.createTileClass();
    var clRock = g_Map.createTileClass();
    var clMetal = g_Map.createTileClass();
    var clFood = g_Map.createTileClass();
    var clBaseResource = g_Map.createTileClass();

    Engine.SetProgress(10);

    g_Map.placeEntityPassable("undeletable|ungarrisonable|structures/brit/wonder", 0, new Vector2D(g_Map.size / 2, g_Map.size / 2), 0.0);

    var mountain = {};
    mountain.height = isMountain ? 100.0 * getNumPlayers() / 8.0 : 0;
    mountain.heightBase = 24;
    mountain.twist = Math.PI * scaleByMapSize(1.0, 2.0);
    mountain.spiralWidth = 20;
    mountain.minRadius = 18;
    mountain.maxRadius = mountain.minRadius + getNumPlayers() * mountain.twist;

    g_Map.log("Mountain or hill spiral and ground geometry of bases");
    var spiralEndPos = [];

    for (let t = 0; t < getNumPlayers(); t++)
    {
        let startAngle = 2 * Math.PI * t / getNumPlayers();

        // Bottom end point of spiral of each player (middle of the path)
        spiralEndPos.push(new Vector2D(1, 0).rotate(startAngle).mult(mountain.maxRadius - 2).add(g_Map.getCenter()));

        // Spiral
        if (isMountain)
        {
            let endAngle = startAngle + mountain.twist;
            let shaper = a => clamp(mountain.heightBase + mountain.height * a * 1.1, 0, mountain.heightBase + mountain.height);
            let setcondition = (p, h) => g_Map.getHeight(p) < h;
            spiralRast(g_Map.getCenter(), -mountain.spiralWidth, mountain.maxRadius, mountain.minRadius, startAngle, endAngle, shaper, setcondition)
        }

        // Player base area
        let baseRadius = g_Map.size / 2 - mountain.maxRadius;

        let arcAngleLength = 2 * Math.PI / 4.0;
        let littlePassageRadPod = arcAngleLength * 0.7 * linearScale(1 - getNumPlayers() / 8.0, 1, 0.7);
        let baseCenter = new Vector2D(1, 0).rotate(startAngle).mult(g_Map.size / 2).add(g_Map.getCenter());

        let anglemin = Math.PI + startAngle;
        let anglemaxh = anglemin + littlePassageRadPod;
        let anglemax = anglemin + arcAngleLength;

        // Circular strip from spiral to border
        let shaper0 = (a, r) => mountain.heightBase * (1 - Math.pow(easeCurve(a), 5));
        let setCondition0 = (p, h) => g_Map.getHeight(p) < h;
        arcRast(baseCenter, baseRadius, baseRadius + mountain.spiralWidth, anglemin, anglemaxh, shaper0, setCondition0);

        // Outer-circular strip from spiral to border
        let shaper1 = (a, r) => shaper0(a, r) * easeCurve(1 - r);
        let setCondition1 = (p, h) => g_Map.getHeight(p) < h;
        arcRast(baseCenter, baseRadius + mountain.spiralWidth, baseRadius + mountain.spiralWidth + 35, anglemin, anglemaxh, shaper1, setCondition1);

        // Inner-circular strip from spiral to border (water)
        let shaper2 = (a, r) => -40 * easeCurve(a) * Math.pow(r, 1.3);
        let setCondition2 = (p, h) => g_Map.getHeight(p) < 0.1;
        arcRast(baseCenter, baseRadius - 20, baseRadius, anglemin, anglemax, shaper2, setCondition2);

        // Bridge strip from player to player base
        let shaper3 = (a, r) => -4 + easeCurve(Math.abs(r * 2 - 1)) * 2;
        arcRast(baseCenter, baseRadius - 20, baseRadius + 2, anglemaxh - 6 / baseRadius, anglemaxh, shaper3);
    }

    Engine.SetProgress(40);
    g_Map.log("Creating plateau");
    createArea(
        new ClumpPlacer(diskArea(isMountain ? mountain.minRadius : mountain.maxRadius), 1, 0, Infinity, g_Map.getCenter()),
        [new SmoothElevationPainter(ELEVATION_SET, mountain.height + mountain.heightBase, 3)],
        null);

    // Smooth all the map and add some bumps
    createArea(
        new MapBoundsPlacer(),
        [new SmoothElevationPainter(ELEVATION_MODIFY, 0, 1)],
        [new SlopeConstraint(2, Infinity), new HeightConstraint(0, Infinity)]
    );

    createBumps(avoidClasses(clPlayer, 20), 100);

    Engine.SetProgress(50);
    // Custom player placement
    function playerPlacementCircleCustom(radius, startingAngle = undefined, center = undefined)
    {
        let startAngle = 2 * Math.PI / getNumPlayers() * scaleByMapSize(0.1, 0.3)
        let [playerPosition, playerAngle] = distributePointsOnCircle(getNumPlayers(), startAngle, radius * scaleByMapSize(0.9, 1.4), center || g_Map.getCenter());
        return [sortAllPlayers(), playerPosition.map(p => p.round()), playerAngle, startAngle];
    }

    Engine.SetProgress(55);
    // Players placement
    var civsPlacement = playerPlacementCircleCustom(fractionToTiles(0.37) * scaleByMapSize(1.2, 0.6))
    var civsPos = civsPlacement[1];
    placePlayerBases(
        {
            "PlayerPlacement": civsPlacement,
            "PlayerTileClass": clPlayer,
            "Walls": false,
            "BaseResourceClass": clBaseResource,
            "CityPatch":
            {
                "outerTerrain": tRoadWild,
                "innerTerrain": tRoad
            },
            "Chicken": {},
            "Berries":
            {
                "template": oFruitBush
            },
            "Mines":
            {
                "types": [
                    { "template": oMetalLarge },
                    { "template": oStoneLarge }]
            },
            "Trees":
            {
                "template": oTree1,
                "count": 25
            },
            "Decoratives":
            {
                "template": aGrassShort
            }
        }
    );

    Engine.SetProgress(60);
    var pathAreas = []

    // Get slope area
    var slopeSpiralArea = new createArea(
        new MapBoundsPlacer(),
        [],
        [new SlopeConstraint(2.7, Infinity)]
    );

    pathAreas.push(slopeSpiralArea)

	/*
	 * Makes a path from civic center to spiral entrance with bezier curve of 3 points.
	 * The control point (middle point) controls the curvature of the road.
	 */
    g_Map.log("Making roads");
    for (let i = 0; i < getNumPlayers(); ++i)
    {
        let startRoad = spiralEndPos[i];
        // civsPos indexes doesn't match with spiralEndPos ones.
        let endRoad = civsPos[(getNumPlayers() - i + 1) % getNumPlayers()];
        // Bezier control point
        let controlPoint = spiralEndPos[i].
            clone().
            sub(g_Map.getCenter()).
            rotate(-Math.PI / 2.0).
            mult(3 * scaleByNumberOfPlayers(2.3, 0.6) * scaleByMapSize(0.8, 1.2)).
            add(spiralEndPos[i]);

        let nSubpaths = 10;
        for (let step = 0; step < nSubpaths; step++)
        {
            let unitary = step / nSubpaths;
            let unitaryNext = (step + 1) / nSubpaths;
            let point = bezier_quadratic(startRoad, controlPoint, endRoad, unitary)
            let pointNext = bezier_quadratic(startRoad, controlPoint, endRoad, unitaryNext)
            var pathArea = new createArea(
                new PathPlacer(point, pointNext, 4, 3, 10, 0.2, 1),
                [new TerrainPainter(tRoadWild)],
                []
            );
            pathAreas.push(pathArea)
        }
    }

    var areaInCircle = new createArea(
        new ClumpPlacer(diskArea(mountain.minRadius - 9), 1, 0, Infinity, g_Map.getCenter()),
        [],
        null
    );

    g_Map.log("Creating more random trees");
    var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
    createStragglerTrees(
        [oTree1, oTree2, oTree4, oTree3],
        [
            avoidClasses(clForest, 8, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
            new HeightConstraint(2, mountain.heightBase * 0.7),
            new SlopeConstraint(0, 1.5),
            new AvoidAreasConstraint([areaInCircle])
        ],
        clForest,
        stragglerTrees
    );


    g_Map.log("Creating forest");
    createForests(
        [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
        [
            avoidClasses(clPlayer, 15, clForest, 1),
            new HeightConstraint(0, mountain.heightBase * 0.9),
            new AvoidAreasConstraint(pathAreas), new AvoidAreasConstraint([areaInCircle])
        ],
        clForest,
        forestTrees
    );

    Engine.SetProgress(65);
    g_Map.log("Creating dirt patches");
    createLayeredPatches(
        [
            scaleByMapSize(3, 6),
            scaleByMapSize(5, 10),
            scaleByMapSize(8, 21)
        ],
        [
            [tMainTerrain, tTier1Terrain],
            [tTier1Terrain, tTier2Terrain],
            [tTier2Terrain, tTier3Terrain]
        ],
        [1, 1],
        [
            avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
            new HeightConstraint(-2, 25),
            new AvoidAreasConstraint(pathAreas)
        ],
        scaleByMapSize(15, 45),
        clDirt
    );

    Engine.SetProgress(70);
    g_Map.log("Creating grass patches");
    createPatches(
        [
            scaleByMapSize(2, 4),
            scaleByMapSize(3, 7),
            scaleByMapSize(5, 15)
        ],
        tTier4Terrain,
        [
            avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
            new HeightConstraint(-2, 85),
            new AvoidAreasConstraint(pathAreas)
        ],
        scaleByMapSize(15, 45),
        clDirt
    );

    g_Map.log("Painting cliffs");
    createArea(
        new MapBoundsPlacer(),
        new TerrainPainter(g_Terrains.cliff),
        [new SlopeConstraint(2, Infinity)]
    );

    // Add little stones in slopes
    createObjectGroupsByAreas(stonesGroup, 0, [], 150, 10, [slopeSpiralArea]);

    var constraintHeightBase = isMountain ? new HeightConstraint(1, 17) : new HeightConstraint(1, Infinity);

    Engine.SetProgress(75);
    g_Map.log("Creating stone mines");
    createMines(
        [
            [
                new SimpleObject(oStoneSmall, 0, 1, 0, 4, 0, 2 * Math.PI, 1),
                new SimpleObject(oStoneLarge, 0, 1, 4, 8, 0, 2 * Math.PI, 4)
            ],
            [new SimpleObject(oStoneSmall, 1, 2, 4, 7, 0, 2 * Math.PI, 1)]
        ],
        [
            avoidClasses(clForest, 1, clPlayer, 15, clRock, 3, clHill, 1),
            constraintHeightBase, new AvoidAreasConstraint(pathAreas)
        ],
        clRock,
        10
    );

    Engine.SetProgress(77);
    g_Map.log("Creating metal mines");
    createMines(
        [
            [new SimpleObject(oMetalLarge, 0, 1, 4, 7)]
        ],
        [
            avoidClasses(clForest, 1, clPlayer, 15, clMetal, 5, clRock, 3, clHill, 1),
            constraintHeightBase,
            new AvoidAreasConstraint(pathAreas)
        ],
        clMetal,
        10
    );

    Engine.SetProgress(80);
    var planetm = currentBiome() == "generic/tropic" ? 8 : 1;

    g_Map.log("Creating stones decoration");
    createDecoration(
        [
            [new SimpleObject(aRockMedium, 1, 3, 0, 1)],
            [new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
            [new SimpleObject(aGrassShort, 4, 8, 1, 6)],
            [new SimpleObject(aGrass, 2, 15, 0, 6), new SimpleObject(aGrassShort, 3, 20, 1.2, 8)],
            [new SimpleObject(aBushMedium, 2, 8, 1, 6), new SimpleObject(aBushSmall, 2, 8, 1, 6)]
        ],
        [
            scaleByMapSize(16, 262),
            scaleByMapSize(8, 131),
            planetm * scaleByMapSize(13, 200),
            planetm * scaleByMapSize(13, 200),
            planetm * scaleByMapSize(13, 200)
        ],
        [
            avoidClasses(clForest, 0, clPlayer, 0, clHill, 0),
            new HeightConstraint(1, Infinity)
        ]
    );

    g_Map.log("Creating reeds");
    createObjectGroups(
        new SimpleGroup([new RandomObject(aWaterDecoratives, 2, 4, 1, 2)], true),
        0,
        [new HeightConstraint(-Infinity, 0)],
        scaleByMapSize(200, 500),
        100
    );

    g_Map.log("Creating reeds' passages");
    createObjectGroups(
        new SimpleGroup([new RandomObject(aWaterDecoratives, 2, 4, 1, 2)], true),
        0, [new HeightConstraint(-1, 0)],
        scaleByNumberOfPlayers(70, 300),
        100);

    g_Map.log("Painting water and shoreline");
    createArea(
        new MapBoundsPlacer(),
        new TerrainPainter(tShore),
        [
            new HeightConstraint(-Infinity, -0.2),
            new SlopeConstraint(0, 1)
        ]
    );

    createArea(
        new MapBoundsPlacer(),
        new TerrainPainter(tWater),
        [
            new HeightConstraint(-Infinity, -1.5),
            new SlopeConstraint(0, 1)
        ]
    );

    Engine.SetProgress(85);
    g_Map.log("Creating hunt");
    createFood(
        [
            [new SimpleObject(oMainHuntableAnimal, 3, 4, 0, 25)],
            [new SimpleObject(oSecondaryHuntableAnimal, 3, 5, 0, 25)]
        ],
        [
            50 * getNumPlayers(),
            50 * getNumPlayers()
        ],
        [
            avoidClasses(clForest, 0, clPlayer, 10, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
            new HeightConstraint(1, 15)
        ],
        clFood
    );

    Engine.SetProgress(90);
    g_Map.log("Creating fruit bush");
    createFood(
        [
            [new SimpleObject(oFruitBush, 3, 4, 0, 4)]
        ],
        [3 * getNumPlayers()],
        [
            avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
            new HeightConstraint(1, 15)
        ],
        clFood
    );

    Engine.SetProgress(95);
    g_Map.log("Creating even more random trees");
    {
        let constraints = [
            avoidClasses(clForest, 5, clHill, 1, clPlayer, 12, clMetal, 6, clRock, 6, clFood, 1),
            new HeightConstraint(1, Infinity),
            new AvoidAreasConstraint(pathAreas),
            new AvoidAreasConstraint([areaInCircle]),
        ];

        if (isMountain)
            constraints.push(new SlopeConstraint(1, Infinity));

        createStragglerTrees(
            [oTree1, oTree2, oTree4, oTree3],
            constraints,
            clForest,
            stragglerTrees
        );
    }

    g_Map.log("Creating fish");
    createObjectGroups(
        new SimpleGroup([new SimpleObject(oFish, 3, 4, 2, 3)], true, clFood),
        0,
        [
            new HeightConstraint(-Infinity, -1),
            new AvoidAreasConstraint([slopeSpiralArea])
        ],
        scaleByMapSize(3, 10) * getNumPlayers(),
        50
    );

    placePlayersNomad(clPlayer, [avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2), new HeightConstraint(1, 17)]);
    setSunElevation(getRandomDeviation(Math.PI / 2, Math.PI / 2 * 0.7))

    Engine.SetProgress(100);
    g_Map.ExportMap();
};

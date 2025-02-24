// License: GPL2
// Authors: Andy Alt, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("rmgen-helpers");

function* GenerateMap(mapSettings)
{
  setSelectedBiome();

  const heightScale = num => num * g_MapSettings.Size / 320;
  const heightLand = 30;
  const heightRavineValley = 2;
  const heightRavineHill = 40;
  const heightHill = 50;
  const heightOffsetRavine = 10;

  const oTree1 = g_Gaia.tree1;
  const oTree2 = g_Gaia.tree2;
  const oTree3 = g_Gaia.tree3;
  const oTree4 = g_Gaia.tree4;
  const oTree5 = g_Gaia.tree5;
  const oFruitBush = g_Gaia.fruitBush;
  const oGrapes = "gaia/fruit/grapes";
  const oApples = "gaia/fruit/apple";
  const oPig = "gaia/fauna_pig";
  const oSheep = "gaia/fauna_sheep";
  const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
  const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
  const oStoneLarge = g_Gaia.stoneLarge;
  const oStoneSmall = g_Gaia.stoneSmall;
  const oMetalLarge = g_Gaia.metalLarge;
  const oMetalSmall = g_Gaia.metalSmall;
  const fruit = [oFruitBush, oGrapes, oApples];

  const tMainTerrain = g_Terrains.mainTerrain;
  const tForestFloor1 = g_Terrains.forestFloor1;
  const tForestFloor2 = g_Terrains.forestFloor2;
  const tCliff = g_Terrains.cliff;
  const tTier1Terrain = g_Terrains.tier1Terrain;
  const tTier2Terrain = g_Terrains.tier2Terrain;
  const tTier3Terrain = g_Terrains.tier3Terrain;
  const tHill = g_Terrains.hill;
  const tRoad = g_Terrains.road;
  const tRoadWild = g_Terrains.roadWild;
  const tTier4Terrain = g_Terrains.tier4Terrain;

  const aGrass = g_Decoratives.grass;
  const aGrassShort = g_Decoratives.grassShort;
  const aRockLarge = g_Decoratives.rockLarge;
  const aRockMedium = g_Decoratives.rockMedium;
  const aBushMedium = g_Decoratives.bushMedium;
  const aBushSmall = g_Decoratives.bushSmall;
  const aCeltHomestead = "actor|structures/celts/homestead.xml";
  const aCeltHouse = "actor|structures/celts/house.xml";
  const aCeltLongHouse = "actor|structures/celts/longhouse.xml";

  const pForest1 = [tForestFloor2 + TERRAIN_SEPARATOR + oTree1, tForestFloor2 + TERRAIN_SEPARATOR + oTree2, tForestFloor2];
  const pForest2 = [tForestFloor1 + TERRAIN_SEPARATOR + oTree4, tForestFloor1 + TERRAIN_SEPARATOR + oTree5, tForestFloor1];

  globalThis.g_Map = new RandomMap(heightHill, tMainTerrain);
  var mapBounds = g_Map.getBounds();
  var mapCenter = g_Map.getCenter();
  var mapSize = g_Map.getSize();
  const playerBaseRadius = defaultPlayerBaseRadius() / (isNomad() ? 1.5 : 1);
  const numPlayers = getNumPlayers();

  var clPlayer = g_Map.createTileClass();
  var clPlayerTerritory = g_Map.createTileClass();
  var clHill = g_Map.createTileClass();
  var clHillDeco = g_Map.createTileClass();
  var clForest = g_Map.createTileClass();
  var clDirt = g_Map.createTileClass();
  var clRock = g_Map.createTileClass();
  var clMetal = g_Map.createTileClass();
  var clFood = g_Map.createTileClass();
  var clBaseResource = g_Map.createTileClass();

  function createBasesRandomHeights(playerIDs, playerPosition, walls)
  {
    for (let i = 0; i < getNumPlayers(); ++i)
    {
      placePlayerBase({
        "playerID": playerIDs[i],
        "playerPosition": playerPosition[i],
        "PlayerTileClass": clPlayer,
        "BaseResourceClass": clBaseResource,
        "Walls": false,
        "CityPatch": {
          "outerTerrain": tRoadWild,
          "innerTerrain": tRoad
        },
        "StartingAnimal": {
          "template": randBool() ? oPig : oSheep,
          "count": randIntInclusive(5, 20)
        },
        "Berries": {
          "template": fruit[randIntInclusive(0, fruit.length - 1)], "count": randIntInclusive(1, 4)
        },
        "Mines": {
          "types": [
            { "template": oMetalLarge },
            { "template": oStoneLarge }
          ]
        },
        "Trees": {
          "template": oTree1,
          "count": 5
        },
        "Decoratives": {
          "template": aGrassShort
        }
      });
    }

    return [playerIDs, playerPosition];
  }

  var playerPosition = [];
  if (!isNomad())
  {
    const pattern = g_MapSettings.TeamPlacement || pickRandom(Object.keys(g_PlayerbaseTypes));
    var [playerIDs, playerPosition] = createBasesByPattern(
      pattern,
      g_PlayerbaseTypes[pattern].distance,
      g_PlayerbaseTypes[pattern].groupedDistance,
      randomAngle(),
      createBasesRandomHeights);
  }

  Engine.SetProgress(20);

  // Some code from the Ardennes Forest map
  g_Map.log("Creating the central dip");
  createArea(
    new ClumpPlacer(diskArea(fractionToTiles(0.44)), 0.94, 0.05, 0.1, mapCenter),
    [
      new LayeredPainter([tCliff, tTier4Terrain], [3]),
      new SmoothElevationPainter(ELEVATION_SET, heightLand, 3)
    ]);

  g_Map.log("Finding hills");
  var noise0 = new Noise2D(20);
  for (var ix = 0; ix < mapSize; ix++)
  {
    for (var iz = 0; iz < mapSize; iz++)
    {
      const position = new Vector2D(ix, iz);
      const h = g_Map.getHeight(position);
      if (h > heightRavineHill)
      {
        clHill.add(position);

        // Add hill noise
        var x = ix / (mapSize + 1);
        var z = iz / (mapSize + 1);
        var n = (noise0.get(x, z) - 0.5) * heightRavineHill;
        g_Map.setHeight(position, h + n);
      }
    }
  }

  g_Map.log("Creating ravines");
  for (const size of [scaleByMapSize(50, 600), scaleByMapSize(50, 300), scaleByMapSize(50, 400), scaleByMapSize(10, 30), scaleByMapSize(10, 30)])
  {
    const ravine = createAreas(
      new ClumpPlacer(size, 0.1, 0.2, 0.1),
      [
        new LayeredPainter([tCliff, tForestFloor1], [2]),
        new SmoothElevationPainter(ELEVATION_SET, heightRavineValley, 2),
        new TileClassPainter(clHill)
      ],
      avoidClasses(clPlayer, playerBaseRadius * 2, clHill, 6),
      scaleByMapSize(1, 3));

    if (size > 150 && ravine.length)
    {
      g_Map.log("Placing huts in ravines");
      createObjectGroupsByAreasDeprecated(
        new RandomGroup(
          [
            new SimpleObject(aCeltHouse, 0, 1, 4, 5),
            new SimpleObject(aCeltLongHouse, 1, 1, 4, 5)
          ],
          true,
          clHillDeco),
        0,
        [avoidClasses(clHillDeco, 3), stayClasses(clHill, 3)],
        ravine.length * 5, 20,
        ravine);

      createObjectGroupsByAreasDeprecated(
        new RandomGroup([new SimpleObject(aCeltHomestead, 1, 1, 1, 1)], true, clHillDeco),
        0,
        [avoidClasses(clHillDeco, 5), stayClasses(clHill, 4)],
        ravine.length * 2, 100,
        ravine);

      // Place noise
      createAreasInAreas(
        new ClumpPlacer(size * 0.3, 0.94, 0.05, 0.1),
        [
          new LayeredPainter([tCliff, tForestFloor1], [2]),
          new SmoothElevationPainter(ELEVATION_SET, heightRavineValley, 2)
        ],
        [avoidClasses(clHillDeco, 2), stayClasses(clHill, 0)],
        ravine.length * 2,
        20,
        ravine);

      createAreasInAreas(
        new ClumpPlacer(size * 0.1, 0.3, 0.05, 0.1),
        [
          new LayeredPainter([tCliff, tForestFloor1], [2]),
          new SmoothElevationPainter(ELEVATION_SET, heightRavineHill, 2),
          new TileClassPainter(clHill)
        ],
        [avoidClasses(clHillDeco, 2), borderClasses(clHill, 15, 1)],
        ravine.length * 2,
        50,
        ravine);

      createObjectGroupsByAreas(
        new RandomGroup(
          [
            new SimpleObject(oTree1, 1, 4, 2, 5),
            new SimpleObject(oTree2, 1, 4, 2, 5)
          ],
          true,
          clHillDeco
        ),
        0,
        [
          avoidClasses(clHillDeco, 3),
          new HeightConstraint(-Infinity, heightRavineValley)
        ],
        ravine.length * 5, 20,
        ravine);
    }
  }

  g_Map.log("Generating random heights");
  for (let passes = 0; passes < 200; passes++)
  {
    const centerPosition = new Vector2D(
      randIntInclusive (mapBounds.left, mapBounds.right),
      randIntInclusive (mapBounds.top, mapBounds.bottom)
    );
    const size = randFloat(1, scaleByMapSize(2, 16));
    const coherence = randFloat(0.05, 0.35); // How much the radius of the clump varies (1 = circle, 0 = very random).
    const smoothness = randFloat(0.1, 0.6); // How smooth the border of the clump is (1 = few "peaks", 0 = very jagged).
    const height = randFloat(-12, 40);
    // const blendRadius = randFloat (size * 0.5, size * 1.7);

    createArea(
      new ClumpPlacer(diskArea(size), coherence, smoothness, Infinity, centerPosition),
      [
        new SmoothElevationPainter(ELEVATION_MODIFY, height, size * 1.1)
        // new SmoothingPainter(4, 1, 8),
      ],
      avoidClasses(clPlayer, playerBaseRadius * 1.2, clHill, 8)
    );
  }

  g_Map.log("Smoothing heightmap");
  createArea(
    new MapBoundsPlacer(),
    new SmoothingPainter(2, 1, 16),
    avoidClasses(clHill, 4));

  g_Map.log("Adding some noise");
  var noise0 = new Noise2D(20);
  for (var ix = 0; ix < mapSize; ix++)
  {
    for (var iz = 0; iz < mapSize; iz++)
    {
      const position = new Vector2D(ix, iz);
      const h = g_Map.getHeight(position);
      if (h > heightLand + 2 && !clHill.has(position))
      {
        // Don't add it yet, let it happen during the cliff painting
        // clHill.add(position);

        // Add hill noise
        var x = ix / (mapSize + 1);
        var z = iz / (mapSize + 1);
        var n = (noise0.get(x, z) - 0.5) * heightRavineHill;
        g_Map.setHeight(position, h + n);
      }
    }
  }

  g_Map.log("Re-smoothing heightmap");
  createArea(
    new MapBoundsPlacer(),
    new SmoothingPainter(2, 1, 2),
    avoidClasses(clHill, 4)); // We don't want the current tiles marked as hills to be smoothed

  g_Map.log("Painting cliffs");
  createArea(
    new MapBoundsPlacer(),
    [
      new TerrainPainter(g_Terrains.cliff),
      new TileClassPainter(clHill)
    ],
    [
      new SlopeConstraint(3, Infinity)
    ]);

  var [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
  createDefaultForests(
    [tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
    avoidClasses(clPlayer, playerBaseRadius * 1.5, clForest, 14, clHill, 6),
    clForest,
    forestTrees);

  Engine.SetProgress(50);

  g_Map.log("Creating dirt patches");
  createLayeredPatches(
    [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
    [[tMainTerrain, tTier1Terrain], [tTier1Terrain, tTier2Terrain], [tTier2Terrain, tTier3Terrain]],
    [1, 1],
    avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
    scaleByMapSize(15, 45),
    clDirt);

  g_Map.log("Creating grass patches");
  createPatches(
    [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
    tTier4Terrain,
    avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
    scaleByMapSize(15, 45),
    clDirt);
  Engine.SetProgress(55);

  g_Map.log("Creating metal mines");
  createBalancedMetalMines(
    oMetalSmall,
    oMetalLarge,
    clMetal,
    avoidClasses(clForest, 1, clPlayer, playerBaseRadius * 1.5, clHill, 1)
  );

  g_Map.log("Creating stone mines");
  createBalancedStoneMines(
    oStoneSmall,
    oStoneLarge,
    clRock,
    avoidClasses(clForest, 1, clPlayer, playerBaseRadius * 1.5, clHill, 1, clMetal, 10)
  );

  Engine.SetProgress(65);

  var planetm = 1;

  if (currentBiome() == "generic/india")
    planetm = 8;

  createDecoration(
    [
      [new SimpleObject(aRockMedium, 1, 3, 0, 1)],
      [new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
      [new SimpleObject(aGrassShort, 1, 2, 0, 1)],
      [new SimpleObject(aGrass, 2, 4, 0, 1.8), new SimpleObject(aGrassShort, 3, 6, 1.2, 2.5)],
      [new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
    ],
    [
      scaleByMapSize(16, 262),
      scaleByMapSize(8, 131),
      planetm * scaleByMapSize(13, 200),
      planetm * scaleByMapSize(13, 200),
      planetm * scaleByMapSize(13, 200)
    ],
    avoidClasses(clForest, 0, clPlayer, 0, clHill, 0));

  Engine.SetProgress(70);

  createFood(
    [
      [new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)],
      [new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)]
    ],
    [
      randIntInclusive(0, 3) * numPlayers,
      randIntInclusive(0, 3) * numPlayers
    ],
    avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 20),
    clFood);

  Engine.SetProgress(75);

  createFood(
    [
      [new SimpleObject(fruit[randIntInclusive(0, fruit.length - 1)], 3, 5, 0, 4)],
      [new SimpleObject(fruit[randIntInclusive(0, fruit.length - 1)], 3, 5, 0, 4)]
    ],
    [
      randIntInclusive(0, 3) * numPlayers,
      randIntInclusive(0, 3) * numPlayers
    ],
    avoidClasses(clForest, 0, clPlayer, 20, clHill, 1, clMetal, 4, clRock, 4, clFood, 10),
    clFood);

  Engine.SetProgress(85);

  createStragglerTrees(
    [oTree1, oTree2, oTree4, oTree3],
    avoidClasses(clForest, 14, clHill, 2, clMetal, 2, clRock, 2, clFood, 1, clBaseResource, 12),
    clForest,
    stragglerTrees);

  placePlayersNomad(clPlayer, avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2));

  setWaterHeight(heightLand - 100);

  return g_Map;
}

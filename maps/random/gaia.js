// License: GPL2
// Authors: MirceaKitsune, James Sherratt (based on code written by the 0AD project)

Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");

function* GenerateMap(mapSettings)
{
  setSelectedBiome();

  const mapHeight = 1;
  globalThis.g_Map = new RandomMap(mapHeight, g_Terrains.mainTerrain);
  const mapCenter = g_Map.getCenter();
  const mapSize = g_Map.getSize();
  const mapBounds = g_Map.getBounds();

  initTileClasses();
  createArea(
    new MapBoundsPlacer(),
    new TileClassPainter(g_TileClasses.land)
  );

  globalThis.g
  g_Map.log("Positioning players");
  Engine.SetProgress(10);

  var playerIDs;
  var playerPosition;
  if (!isNomad())
  {
    const pattern = g_MapSettings.TeamPlacement || pickRandom(Object.keys(g_PlayerbaseTypes));
    [playerIDs, playerPosition] = createBasesByPattern(
      pattern,
      g_PlayerbaseTypes[pattern].distance,
      g_PlayerbaseTypes[pattern].groupedDistance,
      randomAngle()
    );
    markPlayerAvoidanceArea(playerPosition, defaultPlayerBaseRadius());
  }

  g_Map.log("Creating paths between players");
  Engine.SetProgress(20);

  createBumps(avoidClasses(g_TileClasses.player, 0), scaleByMapSize(10, 250), 1, 8, 4, 0, 5);

  var clPath = g_Map.createTileClass();
  if (!isNomad())
  {
    for (let i = 0; i < playerPosition.length; ++i)
    {
      const pos1 = playerPosition[i];
      const pos2 = playerPosition[(i + 1) % playerPosition.length];
      const dist = pos1.distanceTo(pos2);

      // Roads get more worn based on length
      var tex = g_Terrains.road;
      if (dist >= scaleByMapSize(10, 500))
        tex = g_Terrains.forestFloor2;
      else if (dist >= scaleByMapSize(10, 250))
        tex = g_Terrains.forestFloor1;
      else if (dist >= scaleByMapSize(10, 100))
        tex = g_Terrains.roadWild;

      createArea(new RandomPathPlacer(pos1, pos2, 2, 5, true),
        [
          new TerrainPainter(tex),
          new ElevationBlendingPainter(mapHeight, 0.5),
          new TileClassPainter(clPath)
        ]);
    }
  }

  g_Map.log("Creating terrain features");
  Engine.SetProgress(30);

  addElements([
    // Bluffs
    {
      "func": addBluffs,
      "avoid": [
        g_TileClasses.player, 20,
        g_TileClasses.bluff, 5,
        g_TileClasses.bluffIgnore, 0,
        g_TileClasses.water, 0,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": g_AllAmounts
    },
    // Plateaus, form inside bluffs
    {
      "func": addPlateaus,
      "avoid": [
        g_TileClasses.player, 20,
        g_TileClasses.plateau, 5,
        g_TileClasses.water, 5,
        clPath, 1
      ],
      "stay": [
        g_TileClasses.bluff, 0
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": g_AllAmounts
    },
    // Mountains, form insite plateaus
    {
      "func": addMountains,
      "avoid": [
        g_TileClasses.player, 20,
        g_TileClasses.mountain, 5,
        g_TileClasses.water, 10,
        clPath, 1
      ],
      "stay": [
        g_TileClasses.plateau, 0
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": g_AllAmounts
    },
    // Valleys, form inside bluffs plateaus and mountains
    {
      "func": addValleys,
      "avoid": [
        g_TileClasses.player, 20,
        g_TileClasses.valley, 5,
        g_TileClasses.water, 5,
        clPath, 1
      ],
      "stay": [
        g_TileClasses.bluff, 0,
        g_TileClasses.plateau, 0,
        g_TileClasses.mountain, 0
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": g_AllAmounts
    },
    // Hills, form outside bluffs plateaus and mountains
    {
      "func": addHills,
      "avoid": [
        g_TileClasses.player, 15,
        g_TileClasses.bluff, 0,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 10,
        g_TileClasses.hill, 5,
        g_TileClasses.water, 5,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": g_AllAmounts
    },
    // Lakes, form outside bluffs plateaus and mountains
    {
      "func": addLakes,
      "avoid": [
        g_TileClasses.player, 20,
        g_TileClasses.bluff, 0,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 10,
        g_TileClasses.water, 5,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": g_AllAmounts
    }
  ]);

  g_Map.log("Painting terrain");
  Engine.SetProgress(40);

  addElements([
    {
      "func": addLayeredPatches,
      "avoid": [
        g_TileClasses.player, 0,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 5,
        g_TileClasses.valley, 5,
        g_TileClasses.spine, 5,
        g_TileClasses.water, 0,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["tons"]
    }
  ]);

  g_Map.log("Creating mines and plant resources");
  Engine.SetProgress(60);

  addElements([
    {
      "func": addForests,
      "avoid": [
        g_TileClasses.forest, 0,
        g_TileClasses.plateau, 0,
        g_TileClasses.mountain, 0,
        g_TileClasses.valley, 0,
        g_TileClasses.spine, 0,
        g_TileClasses.metal, 0,
        g_TileClasses.rock, 0,
        g_TileClasses.water, 0,
        g_TileClasses.player, 15,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["normal"]
    },
    {
      "func": addStragglerTrees,
      "avoid": [
        g_TileClasses.berries, 0,
        g_TileClasses.forest, 0,
        g_TileClasses.plateau, 0,
        g_TileClasses.mountain, 0,
        g_TileClasses.valley, 0,
        g_TileClasses.spine, 0,
        g_TileClasses.water, 0,
        g_TileClasses.rock, 5,
        g_TileClasses.metal, 5,
        g_TileClasses.player, 15,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["normal", "many", "tons"]
    },
    {
      "func": addBerries,
      "avoid": [
        g_TileClasses.berries, 0,
        g_TileClasses.forest, 0,
        g_TileClasses.plateau, 0,
        g_TileClasses.mountain, 0,
        g_TileClasses.valley, 0,
        g_TileClasses.spine, 0,
        g_TileClasses.water, 0,
        g_TileClasses.rock, 5,
        g_TileClasses.metal, 5,
        g_TileClasses.player, 10,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["normal", "many", "tons"]
    },
    {
      "func": addStone,
      "avoid": [
        g_TileClasses.berries, 5,
        g_TileClasses.forest, 0,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 5,
        g_TileClasses.valley, 5,
        g_TileClasses.spine, 5,
        g_TileClasses.water, 5,
        g_TileClasses.rock, 20,
        g_TileClasses.metal, 10,
        g_TileClasses.player, 20,
        clPath, 5
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["tons"]
    },
    {
      "func": addMetal,
      "avoid": [
        g_TileClasses.berries, 5,
        g_TileClasses.forest, 0,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 5,
        g_TileClasses.valley, 5,
        g_TileClasses.spine, 5,
        g_TileClasses.water, 5,
        g_TileClasses.rock, 10,
        g_TileClasses.metal, 20,
        g_TileClasses.player, 20,
        clPath, 5
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["many"]
    }
  ]);

  g_Map.log("Creating wildlife");
  Engine.SetProgress(70);

  addElements([
    {
      "func": addAnimals,
      "avoid": [
        g_TileClasses.berries, 0,
        g_TileClasses.forest, 0,
        g_TileClasses.plateau, 0,
        g_TileClasses.mountain, 0,
        g_TileClasses.valley, 0,
        g_TileClasses.spine, 0,
        g_TileClasses.water, 5,
        g_TileClasses.rock, 5,
        g_TileClasses.metal, 5,
        g_TileClasses.player, 10
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["tons"]
    },
    {
      "func": addFish,
      "avoid": [
        g_TileClasses.fish, 10,
        g_TileClasses.player, 10
      ],
      "stay": [g_TileClasses.water, 5],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["normal"]
    }
  ]);

  g_Map.log("Creating decorations");
  Engine.SetProgress(80);

  addElements([
    {
      "func": addDecoration,
      "avoid": [
        g_TileClasses.player, 5,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 5,
        g_TileClasses.valley, 5,
        g_TileClasses.spine, 5,
        g_TileClasses.water, 0,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["tons"]
    },
    {
      "func": addProps,
      "avoid": [
        g_TileClasses.player, 10,
        g_TileClasses.plateau, 5,
        g_TileClasses.mountain, 5,
        g_TileClasses.valley, 5,
        g_TileClasses.spine, 5,
        g_TileClasses.water, 0,
        clPath, 1
      ],
      "sizes": g_AllSizes,
      "mixes": g_AllMixes,
      "amounts": ["scarce"]
    }
  ]);

  // Treasures
  createDecoration(
    [
      [new SimpleObject("gaia/treasure/food_barrel", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/food_crate", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/food_bin", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/food_jars", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/wood", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/metal", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/stone", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/standing_stone", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/wood", 1, 1, 0, 1)],
      [new SimpleObject("gaia/treasure/shipwreck", 1, 1, 0, 1)]
    ],
    [
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 75),
      scaleByMapSize(1, 100),
      scaleByMapSize(1, 10)
    ],
    avoidClasses(
      g_TileClasses.berries, 0,
      g_TileClasses.forest, 0,
      g_TileClasses.mountain, 5,
      g_TileClasses.plateau, 5,
      g_TileClasses.valley, 5,
      g_TileClasses.spine, 5,
      g_TileClasses.water, 5,
      g_TileClasses.rock, 5,
      g_TileClasses.metal, 5,
      g_TileClasses.player, 30,
      clPath, 1
    )
  );

  // Ruins, outside bluffs
  createDecoration(
    [
      [new SimpleObject("gaia/ruins/stone_statues_roman", 1, 1, 0, 1)],
      [new SimpleObject("gaia/ruins/stone_statues_egyptian", 1, 1, 0, 1)],
      [new SimpleObject("gaia/ruins/metal_statue_isis", 1, 1, 0, 1)],
      [new SimpleObject("gaia/ruins/unfinished_greek_temple", 1, 1, 0, 1)]
    ],
    [
      scaleByMapSize(1, 100),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 10),
      scaleByMapSize(1, 25)
    ],
    avoidClasses(
      g_TileClasses.berries, 5,
      g_TileClasses.forest, 5,
      g_TileClasses.bluff, 20,
      g_TileClasses.mountain, 20,
      g_TileClasses.plateau, 20,
      g_TileClasses.valley, 20,
      g_TileClasses.spine, 20,
      g_TileClasses.water, 15,
      g_TileClasses.rock, 10,
      g_TileClasses.metal, 10,
      g_TileClasses.player, 20,
      clPath, 1
    )
  );

  // Ruins, inside bluffs
  createDecoration(
    [
      [new SimpleObject("gaia/ruins/stone_statues_roman", 1, 1, 0, 1)],
      [new SimpleObject("gaia/ruins/stone_statues_egyptian", 1, 1, 0, 1)],
      [new SimpleObject("gaia/ruins/column_doric", 1, 1, 0, 1)],
      [new SimpleObject("gaia/ruins/standing_stone", 1, 1, 0, 1)]
    ],
    [
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 25)
    ],
    avoidClasses(
      g_TileClasses.berries, 0,
      g_TileClasses.forest, 0,
      g_TileClasses.mountain, 10,
      g_TileClasses.plateau, 10,
      g_TileClasses.valley, 10,
      g_TileClasses.spine, 10,
      g_TileClasses.water, 5,
      g_TileClasses.rock, 5,
      g_TileClasses.metal, 5,
      g_TileClasses.player, 10,
      clPath, 1
    ),
    stayClasses(
      g_TileClasses.bluff, 10
    )
  );

  // Structures, outside bluffs
  createDecoration(
    [
      [new SimpleObject("structures/merc_camp_egyptian", 1, 1, 0, 1)],
      [new SimpleObject("structures/fence_short", 1, 1, 0, 1)],
      [new SimpleObject("structures/fence_long", 1, 1, 0, 1)],
      [new SimpleObject("structures/bench", 1, 1, 0, 1)],
      [new SimpleObject("structures/obelisk", 1, 1, 0, 1)]

    ],
    [
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 500),
      scaleByMapSize(1, 250),
      scaleByMapSize(1, 100),
      scaleByMapSize(1, 25)
    ],
    avoidClasses(
      g_TileClasses.berries, 0,
      g_TileClasses.forest, 5,
      g_TileClasses.bluff, 15,
      g_TileClasses.mountain, 15,
      g_TileClasses.plateau, 15,
      g_TileClasses.valley, 15,
      g_TileClasses.spine, 15,
      g_TileClasses.water, 10,
      g_TileClasses.rock, 5,
      g_TileClasses.metal, 5,
      g_TileClasses.player, 25,
      clPath, 5
    )
  );

  // Structures, inside bluffs
  createDecoration(
    [
      [new SimpleObject("structures/palisades_fort", 1, 1, 0, 1)],
      [new SimpleObject("structures/palisades_outpost", 1, 1, 0, 1)],
      [new SimpleObject("structures/palisades_tower", 1, 1, 0, 1)],
      [new SimpleObject("structures/palisades_watchtower", 1, 1, 0, 1)],
      [new SimpleObject("structures/obelisk", 1, 1, 0, 1)]
    ],
    [
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 50)
    ],
    avoidClasses(
      g_TileClasses.berries, 0,
      g_TileClasses.forest, 5,
      g_TileClasses.mountain, 10,
      g_TileClasses.plateau, 10,
      g_TileClasses.valley, 10,
      g_TileClasses.spine, 10,
      g_TileClasses.water, 5,
      g_TileClasses.rock, 5,
      g_TileClasses.metal, 5,
      g_TileClasses.player, 25,
      clPath, 5
    ),
    stayClasses(
      g_TileClasses.bluff, 10
    )
  );

  // Random mercenary buildings, outside bluffs
  createDecoration(
    [
      [new SimpleObject("structures/gaul/house", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/corral", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/storehouse", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/farmstead", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/field", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/outpost", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/sentry_tower", 1, 1, 0, 1)],
      [new SimpleObject("structures/gaul/defense_tower", 1, 1, 0, 1)]
    ],
    [
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 10)
    ],
    avoidClasses(
      g_TileClasses.berries, 0,
      g_TileClasses.forest, 5,
      g_TileClasses.bluff, 10,
      g_TileClasses.mountain, 10,
      g_TileClasses.plateau, 10,
      g_TileClasses.valley, 10,
      g_TileClasses.spine, 10,
      g_TileClasses.water, 10,
      g_TileClasses.rock, 5,
      g_TileClasses.metal, 5,
      g_TileClasses.player, 30,
      clPath, 5
    )
  );

  // Random mercenary units, inside bluffs
  createDecoration(
    [
      [new SimpleObject("units/gaul/champion_fanatic", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/champion_cavalry", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/infantry_slinger_b", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/infantry_javelineer_b", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/cavalry_swordsman_b", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/support_healer_b", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/support_female_citizen", 1, 1, 0, 1)],
      [new SimpleObject("units/gaul/support_trader", 1, 1, 0, 1)]
    ],
    [
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 10),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 10),
      scaleByMapSize(1, 25),
      scaleByMapSize(1, 50),
      scaleByMapSize(1, 10)
    ],
    avoidClasses(
      g_TileClasses.berries, 0,
      g_TileClasses.forest, 0,
      g_TileClasses.mountain, 5,
      g_TileClasses.plateau, 5,
      g_TileClasses.valley, 5,
      g_TileClasses.spine, 5,
      g_TileClasses.water, 5,
      g_TileClasses.rock, 5,
      g_TileClasses.metal, 5,
      g_TileClasses.player, 35
    ),
    stayClasses(
      g_TileClasses.bluff, 10
    )
  );

  placePlayersNomad(g_TileClasses.player, avoidClasses(
    g_TileClasses.berries, 0,
    g_TileClasses.forest, 0,
    g_TileClasses.plateau, 5,
    g_TileClasses.mountain, 5,
    g_TileClasses.valley, 5,
    g_TileClasses.spine, 5,
    g_TileClasses.water, 5,
    g_TileClasses.rock, 0,
    g_TileClasses.metal, 0
  ));

  g_Map.log("Generating daytime and weather");
  Engine.SetProgress(90);

  // Day is default, only override settings specified by the biome when necessary
  if (g_MapSettings.Daytime == "day")
  {
    setSunColor(1, 1, 1);
    setSunRotation(randomAngle());
    setSunElevation(randFloat(0.2, 0.25) * Math.PI);
    setAmbientColor(0.45, 0.5, 0.5);

    // setFogColor(0.75, 0.75, 0.75);

    setSkySet(pickRandom(["sunny", "cloudless", "cirrus"]));
  }
  else if (g_MapSettings.Daytime == "dawn")
  {
    setSunColor(1, 0.875, 0.625);
    setSunRotation(randomAngle());
    setSunElevation(randFloat(0.1, 0.15) * Math.PI);
    setAmbientColor(0.4, 0.45, 0.5);

    setFogColor(0.625, 0.625, 0.75);

    setSkySet(pickRandom(["sunset", "mountainous"]));
  }
  else if (g_MapSettings.Daytime == "sunrise")
  {
    setSunColor(0.5, 0.125, 0);
    setSunRotation(randomAngle());
    setSunElevation(0.05 * Math.PI);
    setAmbientColor(0.4, 0.35, 0.5);

    setFogColor(0.375, 0.375, 0.5);

    setSkySet(pickRandom(["fog"]));
  }
  else if (g_MapSettings.Daytime == "night")
  {
    setSunColor(0.125, 0.125, 0.125);
    setSunRotation(randomAngle());
    setSunElevation(randFloat(0.1, 0.25) * Math.PI);
    setAmbientColor(0.125, 0.125, 0.25);

    setFogColor(0.05, 0.075, 0.1);

    setSkySet(pickRandom(["dark"]));
  }
  else if (g_MapSettings.Daytime == "cloudy")
  {
    setSunColor(0.25, 0.25, 0.25);
    setSunRotation(0);
    setSunElevation(0.5 * Math.PI);
    setAmbientColor(0.75, 0.75, 0.75);

    setFogColor(0.5, 0.5, 0.5);
    // setFogFactor(0.5);
    // setFogThickness(0.25);

    setSkySet(pickRandom(["stratus", "cumulus"]));
  }
  else if (g_MapSettings.Daytime == "stormy")
  {
    setSunColor(0.125, 0.125, 0.125);
    setSunRotation(0);
    setSunElevation(0.5 * Math.PI);
    setAmbientColor(0.5, 0.5, 0.5);

    setFogColor(0.25, 0.25, 0.25);
    // setFogFactor(0.75);
    // setFogThickness(0.5);

    setSkySet(pickRandom(["overcast", "rain", "stormy"]));

    // Choose precipitation type and amount
    if (currentBiome() == "generic/arctic")
    {
      createObjectGroups(
        new SimpleGroup([new SimpleObject("actor|particle/snow_mist.xml", 1, 1, 0, 5)], true),
        0,
        avoidClasses(g_TileClasses.mountain, 5),
        scaleByMapSize(1, randIntInclusive(50, 100))
      );
    }
    else if (currentBiome() == "generic/sahara" || currentBiome() == "generic/nubia")
    {
      createObjectGroups(
        new SimpleGroup([new SimpleObject("actor|particle/blowing_sand.xml", 1, 1, 0, 5)], true),
        0,
        avoidClasses(g_TileClasses.water, 5),
        scaleByMapSize(1, randIntInclusive(250, 500))
      );
    }
    else
    {
      createObjectGroups(
        new SimpleGroup([new SimpleObject("actor|particle/rain_shower.xml", 1, 1, 0, 5)], true),
        0,
        avoidClasses(g_TileClasses.mountain, 5),
        scaleByMapSize(1, randIntInclusive(100, 250))
      );
    }
  }

  setPPEffect("hdr");
  setPPContrast(0.5);
  setPPSaturation(0.5);
  setPPBloom(0.5);

  return g_Map;
}

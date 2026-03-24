Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("fert_common");

export function* generateMap(mapSettings)
{
  yield* genMapFertWithMountain(true, mapSettings);
  return g_Map;
}

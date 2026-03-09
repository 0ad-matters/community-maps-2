Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("fert_common");

export function* generateMap(mapSettings)
{
  genMapFertWithMountain(false, mapSettings);
  return g_Map;
}

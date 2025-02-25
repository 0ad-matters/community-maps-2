Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("fert_common");

function* GenerateMap(mapSettings)
{
  genMapFertWithMountain(false, mapSettings);
  return g_Map;
}

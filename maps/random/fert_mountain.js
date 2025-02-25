Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("fert_common");

function* GenerateMap(mapSettings)
{
  genMapFertWithMountain(true, mapSettings);
  return g_Map;
}

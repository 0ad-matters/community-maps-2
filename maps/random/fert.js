import { genMapFertWithMountain } from "maps/random/fert_common/fert_common.js";
Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

export function* generateMap(mapSettings)
{
  yield* genMapFertWithMountain(false, mapSettings);
  return g_Map;
}


// mod compatibility

if( typeof(getFilteredMods) != "function")
{
    var getFilteredMods = function(){
            return Engine.GetEngineInfo().mods.filter(mod => !mod[0].startsWith("fgod"))
        }
}

var getFilteredMods_nani_maps = getFilteredMods;

var getFilteredMods = function(){
    var cmod = getFilteredMods_nani_maps();
    return cmod.filter(mod => !mod[0].startsWith("nani_maps"))
}



function sendRegisterGameStanzaImmediate()
{
    if (!g_IsController || !Engine.HasXmppClient())
        return;

    if (g_GameStanzaTimer !== undefined)
    {
        clearTimeout(g_GameStanzaTimer);
        g_GameStanzaTimer = undefined;
    }

    let clients = formatClientsForStanza();

    let stanza = {
        "name": g_ServerName,
        "port": g_ServerPort,
        "hostUsername": Engine.LobbyGetNick(),
        "mapName": g_GameAttributes.map,
        "niceMapName": getMapDisplayName(g_GameAttributes.map),
        "mapSize": g_GameAttributes.mapType == "random" ? g_GameAttributes.settings.Size : "Default",
        "mapType": g_GameAttributes.mapType,
        "victoryConditions": g_GameAttributes.settings.VictoryConditions.join(","),
        "nbp": clients.connectedPlayers,
        "maxnbp": g_GameAttributes.settings.PlayerData.length,
        "players": clients.list,
        "stunIP": g_StunEndpoint ? g_StunEndpoint.ip : "",
        "stunPort": g_StunEndpoint ? g_StunEndpoint.port : "",
        "mods": JSON.stringify( getFilteredMods() )
    };

    // Only send the stanza if the relevant settings actually changed
    if (g_LastGameStanza && Object.keys(stanza).every(prop => g_LastGameStanza[prop] == stanza[prop]))
        return;

    g_LastGameStanza = stanza;
    Engine.SendRegisterGame(stanza);
}

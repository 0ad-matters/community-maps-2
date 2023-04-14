var disabledTemplates = civ => [
	"structures/" + civ + "/wonder",
	"structures/" + civ + "/wallset_stone",
	"structures/" + civ + "/wallset_palisade",
	"structures/rome/wallset_siege",
	"structures/wallset_palisade"
];

Trigger.prototype.InitSurvival = function()
{
	this.SetDisableTemplates();
	this.gaiaWonder = TriggerHelper.GetPlayerEntitiesByClass(0, "Wonder")[0];
};

Trigger.prototype.SetDisableTemplates = function()
{
	for (let i = 1; i < TriggerHelper.GetNumberOfPlayers(); ++i)
	{
		const cmpPlayer = QueryPlayerIDInterface(i);
		cmpPlayer.SetDisabledTemplates(disabledTemplates(QueryPlayerIDInterface(i, IID_Identity).GetCiv()));
	}
};

{
	const cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.RegisterTrigger("OnInitGame", "InitSurvival", { "enabled": true });
}

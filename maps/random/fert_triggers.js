var disabledTemplates = (civ) => [
	"structures/" + civ + "/wonder",
	"structures/" + civ + "/wallset_stone",
	"structures/rome/wallset_siege",
	"structures/wallset_palisade",
];

Trigger.prototype.InitSurvival = function()
{
	this.SetDisableTemplates();
	this.gaiaWonder = TriggerHelper.GetPlayerEntitiesByClass(0, "Wonder")[0];
	Engine.QueryInterface(this.gaiaWonder, IID_Health);
	Engine.QueryInterface(this.gaiaWonder, IID_Resistance).SetInvulnerability(true);
	// Engine.QueryInterface(this.treasureFemale[playerID], IID_Resistance).SetInvulnerability(true);
};

Trigger.prototype.SetDisableTemplates = function()
{
	for (let i = 1; i < TriggerHelper.GetNumberOfPlayers(); ++i)
	{
		let cmpPlayer = QueryPlayerIDInterface(i);
		cmpPlayer.SetDisabledTemplates(disabledTemplates(cmpPlayer.GetCiv()));
	}
};

{
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.RegisterTrigger("OnInitGame", "InitSurvival",{"enabled": true});
}

var disabledTemplates = (civ) => [
	"structures/" + civ + "_wonder",
	"structures/" + civ + "_wallset_stone",
	"structures/rome_wallset_siege",
	"structures/wallset_palisade",
];

Trigger.prototype.InitSurvival = function()
{
	this.SetDisableTemplates();
	this.gaiaWonder = TriggerHelper.GetPlayerEntitiesByClass(0, "Wonder")[0];
	Engine.QueryInterface(this.gaiaWonder, IID_DamageReceiver).SetInvulnerability(true);
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



var disabledTemplates = (civ) => [
	"units/" + civ + "/support_trader",
	"units/" + civ + "/ship_merchant",
];

Trigger.prototype.InitSurvival = function()
{
	this.SetDisableTemplates();
};

Trigger.prototype.SetDisableTemplates = function()
{
	for (let i = 1; i < TriggerHelper.GetNumberOfPlayers(); ++i)
	{
		let cmpPlayer = QueryPlayerIDInterface(i);
		cmpPlayer.SetDisabledTemplates(disabledTemplates(QueryPlayerIDInterface(i, IID_Identity).GetCiv()));
	}
};

{
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.RegisterTrigger("OnInitGame", "InitSurvival",{"enabled": true});
}

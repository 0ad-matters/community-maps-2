var disabledTemplates = civ => [
	"structures/" + civ + "/dock",
	"structures/brit/crannog" // brit island settlement
];

Trigger.prototype.InitSurvival = function()
{
	this.SetDisableTemplates();
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

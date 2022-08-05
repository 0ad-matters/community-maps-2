Trigger.prototype.InitSurvival = function()
{
  this.SetDisableTemplates();
};

Trigger.prototype.SetDisableTemplates = function()
{
  const disabledTemplates = (civ) => [
    "units/" + civ + "/support_trader",
    "units/" + civ + "/ship_merchant",
  ];

  for (let i = 1; i < TriggerHelper.GetNumberOfPlayers(); ++i)
  {
    let cmpPlayer = QueryPlayerIDInterface(i);
    const civ = QueryPlayerIDInterface(i, IID_Identity).GetCiv();
    cmpPlayer.SetDisabledTemplates(disabledTemplates(civ));

    // Also disable market upgrades
    cmpPlayer.SetDisabledTechnologies(["trader_health", "trade_gain_01", "trade_gain_02", "trade_commercial_treaty"]);
  }
};

{
  let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
  cmpTrigger.RegisterTrigger("OnInitGame", "InitSurvival",{"enabled": true});
}

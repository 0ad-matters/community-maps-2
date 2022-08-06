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

    // Also disable market upgrades so the AI won't waste money on them
    let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
    let disabledTechs = cmpTemplateManager.GetTemplateWithoutValidation("structures/" + civ + "/market").Researcher.Technologies._string.split(" ");
    cmpPlayer.SetDisabledTechnologies(disabledTechs);
    const cmpTechnologyManager = Engine.QueryInterface(cmpPlayer.entity, IID_TechnologyManager);
    cmpTechnologyManager.ResearchTechnology("unlock_shared_dropsites");
  }
};

{
  let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
  cmpTrigger.RegisterTrigger("OnInitGame", "InitSurvival",{"enabled": true});
}

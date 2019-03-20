var g_InsectEntities = TriggerHelper.GetPlayerEntitiesByClass(0, "Insect");
var g_Farms = [];

function pickRandomElements(elementNum, sourceArray)
{
	let returnArray = [];
	
	while(returnArray.length < elementNum)
	{
		let randomElement = pickRandom(sourceArray);
		if (returnArray.indexOf(randomElement) == -1)
			returnArray.push(randomElement);
	}

	return returnArray;
};

Trigger.prototype.KillRandomUnits = function()
{
	let playerUnits = TriggerHelper.GetAllPlayersEntitiesByClass("Organic");
	let numUnitsToKill = TriggerHelper.GetNumberOfPlayers() * randIntInclusive(1, 2);

	for (let ent of pickRandomElements(numUnitsToKill, playerUnits))
	{
		let cmpHealth = Engine.QueryInterface(ent, IID_Health);
		if (randBool(0.75))
			cmpHealth.Kill();
		else
			cmpHealth.Reduce(cmpHealth.GetMaxHitpoints/2);
	}
};

Trigger.prototype.SendInsectWaves = function()
{
	let attackingTriggerPoints = shuffleArray(this.GetTriggerPoints("A"));

	for (let i = 0; i < g_InsectEntities.length; ++i)
	{
		let targetPos = TriggerHelper.GetEntityPosition2D(attackingTriggerPoints[i]);
		for (let j = 0; j < 5; ++j)
			ProcessCommand(0,
				{
					"type": "walk",
					"entities": [g_InsectEntities[i]],
					"x": targetPos.x + randIntInclusive(-15, 15), // randIntInclusive(-15, 15) here and below is to vary the position each time.
					"z": targetPos.y + randIntInclusive(-15, 15),
					"queued": i == 0 ? false : true, // Force the first order so it will stop doing what its currently doing. Maybe kinda unnecessary.
				});

		let mapCenter = TriggerHelper.GetMapSizeTerrain()/2;
		let retreatPos = new Vector2D(mapCenter + randIntInclusive(-15, 15), mapCenter + randIntInclusive(-15, 15));
		ProcessCommand(0,
			{
				"type": "walk",
				"entities": [g_InsectEntities[i]],
				"x": retreatPos.x,
				"z": retreatPos.y,
				"queued": true,
			});
	}
};

Trigger.prototype.RaiseWaterLevel = function()
{
	let cmpWaterManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_WaterManager);
	let currentWaterLevel = cmpWaterManager.GetWaterLevel();
	let newWaterLevel = currentWaterLevel + 1;

	cmpWaterManager.SetWaterLevel(newWaterLevel);

	// Destroy all submerged farms.
	for (let ent of g_Farms)
	{
		let cmpPosition = Engine.QueryInterface(ent, IID_Position);
		if (!cmpPosition || cmpPosition.GetPosition().y >= newWaterLevel) // First check just to be on the safe side.
			continue;

		Engine.QueryInterface(ent, IID_Health).Kill();
	}

	// Stop doing this when water submerged most land area. Would still be walkable at most areas.
	if (newWaterLevel < 23)
		this.DoAfterDelay(5 * 60 * 1000, "RaiseWaterLevel", {});
};

// Using range queries to find the farms everytime is very performance intensive. Lots of filtering and looping need to be done as well.
Trigger.prototype.StoreFarms = function(structure)
{
	let template = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager).GetCurrentTemplateName(structure.building);
	if (template.contains("field") && g_Farms.indexOf(structure.building) == -1)
		g_Farms.push(structure.building);
};

Trigger.prototype.RemoveFarms = function(data)
{
	let template = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager).GetCurrentTemplateName(data.entity);
	// change to player -1 means is destroyed. all else means a change of ownership (i.e, capture)
	if (template.contains("field") && data.to == -1)
		g_Farms.splice(g_Farms.indexOf(data.entity), 1);
};

{
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.DoRepeatedly(5 * 60 * 1000, "KillRandomUnits", {});
	cmpTrigger.DoAfterDelay(5 * 60 * 1000, "RaiseWaterLevel", {}); // Not DoRepeatedly as this would need to be stopped. And using DoRepeatedly would just be a waste.
	cmpTrigger.DoRepeatedly(10 * 60 * 1000, "SendInsectWaves", {});
	cmpTrigger.RegisterTrigger("OnStructureBuilt", "StoreFarms", { "enabled": true });
	cmpTrigger.RegisterTrigger("OnOwnershipChanged", "RemoveFarms", { "enabled": true }); // For getting rid of destroyed farms.
};

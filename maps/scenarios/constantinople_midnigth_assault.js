//Triggers points img labels represent some specific actions.
//A: Handles the Siege engines towers spawning points, moving points, and the units it spawns.
//B: 
//C: 
//D: Handles Defenders
//E:
//F:
//G: Handles Gatherers
//H:
//I:
//J:
//K:
warn("The game starts");

// ---------------------------------------------------
// Dialogs
// ---------------------------------------------------
TerritoryDecay.prototype.IsConnected = function() { return true; };

Trigger.prototype.InitDiplomacies = function()
{
	var cmpPlayer = TriggerHelper.GetPlayerComponent(1);
	//If they attack at the start, set it to ally
	cmpPlayer.SetAlly(2);
	cmpPlayer.SetMaxPopulation(2000);

	cmpPlayer = TriggerHelper.GetPlayerComponent(2);
	cmpPlayer.SetAlly(1);

	this.DoAfterDelay(1000, "Init", {});
}

Trigger.prototype.FarmerGather = function(data)
{
	this.DisableTrigger("OnRange", "FarmerGather");
	this.DoAfterDelay(200, "FarmerMessage", {});

	this.playerID = 1;
	var cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	var entities = cmpRangeManager.GetEntitiesByPlayer(this.playerID);

	var gatherers = [];
	var resource = [];

	for(var entity of entities)
	{
		if(TriggerHelper.EntityHasClass(entity, "Female"))
			gatherers.push(entity);
		if(TriggerHelper.EntityHasClass(entity, "Field"))
			resource.push(entity);
	}

	var cmd = {};
	cmd.type = "gather";
	cmd.entities = gatherers;
	cmd.target = resource[0];
	cmd.queued = true;
	ProcessCommand(1, cmd);

	data.enabled = true;
	data.delay = 10000;
	data.interval = 30000;	
}

Trigger.prototype.DifficultyDialog = function() 
{
	this.DialogID = 1;
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification(
	{
		"type": "dialog",
		"players": [1],
		"dialogName": "yes-no",
		"data": 
		{
			"text": 
			{
				"caption": 
				{
					"message": markForTranslation("This map supports multiple difficulties. \nEasy is recommended if you're a beginner. \nInsane if you have some experience already. \nIf you want to avoid all the dialogs, choose this one, but beware "),
					"translateMessage": true,
				},
			},
			"button1": 
			{
				"caption": 
				{
					"message": markForTranslation("Easy"),
					"translateMessage": true,
				},
				"tooltip": 
				{
					"message": markForTranslation("Choose the Easy difficulty."),
					"translateMessage": true,
				},
			},
			"button2": 
			{
				"caption": 
				{
					"message": markForTranslation("Insane"),
					"translateMessage": true,
				},
				"tooltip": 
				{
					"message": markForTranslation("Choose the Intermediate difficulty."),
					"translateMessage": true,
				},
			},
			"button3": 	
			{
				"caption": 
				{
					"message": markForTranslation("No Dialogs"),
					"translateMessage": true,
				},
				"tooltip": 
				{
					"message": markForTranslation("Choose the no Dialogs."),
					"translateMessage": true,
				},
			},
		},
	});
};

Trigger.prototype.ChatNotification = function(data)
{
	if(!data || !data.situation)
	{
		error("Nothing to talk :-(");
		return;
	}
	
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	var players = [];
	var numberOfPlayers = TriggerHelper.GetNumberOfPlayers();
	
	//only deliver messages to active players (not e.g. dead)
	for (var i = 1; i < numberOfPlayers; ++i)
	{
		if (TriggerHelper.GetPlayerComponent(i).GetState() == "active")
		{	
			players.push(i);
		}
	}
	
	switch (data.situation)
	{
		case "beginGame":
			cmpGUIInterface.PushNotification({
				"players": [1], 
				"message": markForTranslation("Welcome to Constantinople: Midnight Assault"),
				"translateMessage": true
			});
			break;

		case "waveIncoming":
			cmpGUIInterface.PushNotification({
				"players": [1], 
				"message": markForTranslation("Persians are attacking you!"),
				"translateMessage": true
			});
			break;
		
		default:
			warn("TalkToPlayers is panicking, some unknown gossip came in");
			break;
	}
};

Trigger.prototype.PlayerCommandHandler = function(data) {
	// check for dialog responses

	// DifficultyDialog
	if (this.DialogID == 1) {
		if (data.cmd.answer == "button1") {
			this.DifficultyMultiplier = 10; // Easy difficulty --- This will modify the spawning time of the units, not the size.
			this.DialogID = 0; //reset the dialog var
		} else if(data.cmd.answer == "button2") {
			this.DifficultyMultiplier = 4; // Intermediate difficulty
			this.DialogID = 0;  // reset the dialog var
		}else{
			this.DifficultyMultiplier = 2;
			this.DialogID = 0;
			this.DoAfterDelay(1000, "MakeFunOfTheDecision", {});
		}

		// start the actual storyline by arming the first OnRange trigger and posting a message 
		/*var entities = cmpTrigger.GetTriggerPoints("B");
		data = {
			"entities": entities, // central points to calculate the range circles
			"players": [1], // only count entities of player 1
			"maxRange": 20,
			"requiredComponent": IID_UnitAI, // only count units in range
			"enabled": true,
		};
		cmpTrigger.RegisterTrigger("OnRange", "VisitVillage", data);
		*/
		//Enable first objective message
		// data.enabled = true;
		// data.delay = 1000; // after 1 seconds
		// data.interval = this.messageTimeout;
		// this.RegisterTrigger("OnInterval", "ObjectiveVisitVillage", data);
	}

	// VisitVillageDialog
	// if ( (this.DialogID == 2) ) {
	// 	this.DoAfterDelay(1000, "VisitVillageMessage", {});
	// 	this.DialogID = 0;
	// }
};


var persianAttacker = {

	champion: [
							   "units/pers_champion_infantry",
							   "units/pers_kardakes_hoplite"
			  ],
	infantry: [
								"units/pers_infantry_spearman_e",
			  ],
	ranged: [
								"units/pers_infantry_archer_e",
								"units/pers_kardakes_skirmisher"
			  ],

}

var romanDefenders = {

	champion: [
							   "units/rome_centurio_imperial"	
			  ],
	infantry: [
								"units/rome_infantry_spearman",
								"units/rome_legionnaire_imperial",
								"units/rome_legionnaire_marian"
			  ],
	ranged: [
								"units/rome_infantry_javelinist",
								"units/rome_infantry_archer"
			  ],

}

function ChatNotification(sender, recipient, message) {
	var cmd = {
		"type" : "chat",
		"players" : recipient,
		"message" : message
	};
	ProcessCommand(sender, cmd);
}

Trigger.prototype.Defend = function()
{
	//var rand = Math.random();
	// randomize spawn points
	this.PlayerID = 1;
	//var spawnPoint = rand > 0.5 ? "B" : "C";
	var spawnPoint = "D";
	var championEntity = romanDefenders.champion[Math.floor(Math.random() * romanDefenders.champion.length)];
	var infantryEntity = romanDefenders.infantry[Math.floor(Math.random() * romanDefenders.infantry.length)];
	var rangedEntity = romanDefenders.ranged[Math.floor(Math.random() * romanDefenders.ranged.length)];

	var intruders_regular = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint, infantryEntity, this.defendSize, this.PlayerID);
	var intruders_elite = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint, championEntity, this.defendSize, this.PlayerID);
	var intruders_ranged = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint, rangedEntity, this.defendSize, this.PlayerID);

	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	this.defendTime = (this.DifficultyMultiplier*3000);
	this.defendSize = 1;
	this.DoAfterDelay(this.defendTime, "Defend", {});
};

Trigger.prototype.StartSiege = function()
{

	this.DoAfterDelay(1000, "SiegeStarting", {});
	var cmpPlayer = TriggerHelper.GetPlayerComponent(1);
	//If they attack at the start, set it to ally
	cmpPlayer.SetEnemy(2);

	cmpPlayer = TriggerHelper.GetPlayerComponent(2);
	cmpPlayer.SetEnemy(1);	
}



Trigger.prototype.SpawnAndAttack_RigthRush = function()
{
	//var rand = Math.random();
	// randomize spawn points
	this.PlayerID = 2;
	//var spawnPoint = rand > 0.5 ? "B" : "C";
	var spawnPoint = ["Gate_Spot_1", "Gate_Spot_2", "Gate_Spot_3"];
	var championEntity = persianAttacker.champion[Math.floor(Math.random() * persianAttacker.champion.length)];
	var infantryEntity = persianAttacker.infantry[Math.floor(Math.random() * persianAttacker.infantry.length)];
	var rangedEntity = persianAttacker.ranged[Math.floor(Math.random() * persianAttacker.ranged.length)];
	//var pick = [championEntity, infantryEntity, rangedEntity];

	//Default
	var intruders = null;

	var random_unit = Math.random();
	if(random_unit < 0.33)
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Rigth_Rush", infantryEntity, this.attackSize, this.PlayerID);

	}
	else if(random_unit > 0.33 && random_unit < 0.66)
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Rigth_Rush", championEntity, this.attackSize, this.PlayerID);
	}
	else
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Rigth_Rush", rangedEntity, this.attackSize, this.PlayerID);
	}

	for (var origin in intruders) {
		var cmd = null;

		for(var target of this.GetTriggerPoints("Gate_Spot_3")) {
			var cmpPosition = Engine.QueryInterface(target, IID_Position);
			if (!cmpPosition || !cmpPosition.IsInWorld)
				continue;
				// store the x and z coordinates in the command
			cmd = cmpPosition.GetPosition();
			break;
		}
		if (!cmd)
			continue;
		cmd.type = "attack-walk";
		cmd.entities = intruders[origin];
		cmd.queued = true;
		cmd.targetClasses = { "attack": ["Unit", "Structure"] };
		ProcessCommand(2, cmd);
	}
	
	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	var rand = Math.random() * 2 + 1;
	this.attackTime = (this.DifficultyMultiplier*1000);
	warn(this.attackTime);
	this.attackSize = 1;
	this.DoAfterDelay(this.attackTime, "SpawnAndAttack_RigthRush", {});
};

Trigger.prototype.SpawnAndAttack_MiddleRush = function()
{

	this.PlayerID = 2;
	var championEntity = persianAttacker.champion[Math.floor(Math.random() * persianAttacker.champion.length)];
	var infantryEntity = persianAttacker.infantry[Math.floor(Math.random() * persianAttacker.infantry.length)];
	var rangedEntity = persianAttacker.ranged[Math.floor(Math.random() * persianAttacker.ranged.length)];

	var intruders = null;

	var random_unit = Math.random();

	if(random_unit < 0.33)
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Middle_Rush", infantryEntity, this.attackSize, this.PlayerID);

	}
	else if(random_unit > 0.33 && random_unit < 0.66)
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Middle_Rush", championEntity, this.attackSize, this.PlayerID);
	}
	else
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Middle_Rush", rangedEntity, this.attackSize, this.PlayerID);
	}

	for (var origin in intruders) {
		var cmd = null;

		for(var target of this.GetTriggerPoints("Gate_Spot_2")) {
			var cmpPosition = Engine.QueryInterface(target, IID_Position);
			if (!cmpPosition || !cmpPosition.IsInWorld)
				continue;
				// store the x and z coordinates in the command
			cmd = cmpPosition.GetPosition();
			break;
		}
		if (!cmd)
			continue;
		cmd.type = "attack-walk";
		cmd.entities = intruders[origin];
		cmd.queued = true;
		cmd.targetClasses = { "attack": ["Unit", "Structure"] };
		ProcessCommand(2, cmd);
	}
	
	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	var rand = Math.random() * 2 + 1;
	this.attackTime = (this.DifficultyMultiplier*1000);
	warn(this.attackTime);
	this.attackSize = 1;
	this.DoAfterDelay(this.attackTime, "SpawnAndAttack_MiddleRush", {});
};

Trigger.prototype.SpawnAndAttack_LeftRush = function()
{
	//var rand = Math.random();
	// randomize spawn points
	this.PlayerID = 2;
	//var spawnPoint = rand > 0.5 ? "B" : "C";
	//var spawnPoint = ["Gate_Spot_1", "Gate_Spot_2", "Gate_Spot_3"];
	var championEntity = persianAttacker.champion[Math.floor(Math.random() * persianAttacker.champion.length)];
	var infantryEntity = persianAttacker.infantry[Math.floor(Math.random() * persianAttacker.infantry.length)];
	var rangedEntity = persianAttacker.ranged[Math.floor(Math.random() * persianAttacker.ranged.length)];
	
	//var intruders;/*= TriggerHelper.SpawnUnitsFromTriggerPoints("Left_Rush", infantryEntity, this.attackSize, this.PlayerID)*/;

	var random_unit = Math.random();
	var intruders = null;
	if(random_unit < 0.33)
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Left_Rush", infantryEntity, this.attackSize, this.PlayerID);

	}
	else if(random_unit > 0.33 && random_unit < 0.66)
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Left_Rush", championEntity, this.attackSize, this.PlayerID);
	}
	else
	{
		intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Left_Rush", rangedEntity, this.attackSize, this.PlayerID);
	}


	//intruders = TriggerHelper.SpawnUnitsFromTriggerPoints("Left_Rush", pick[Math.floor(Math.random() * pick.length)], this.attackSize, this.PlayerID);

	for (var origin in intruders) {
		var cmd = null;

		for(var target of this.GetTriggerPoints("Gate_Spot_1")) {
			var cmpPosition = Engine.QueryInterface(target, IID_Position);
			if (!cmpPosition || !cmpPosition.IsInWorld)
				continue;
				// store the x and z coordinates in the command
			cmd = cmpPosition.GetPosition();
			break;
		}
		if (!cmd)
			continue;
		cmd.type = "attack-walk";
		cmd.entities = intruders[origin];
		cmd.queued = true;
		cmd.targetClasses = { "attack": ["Unit", "Structure"] };
		ProcessCommand(2, cmd);
	}
	
	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	var rand = Math.random() * 2 + 1;
	this.attackTime = (this.DifficultyMultiplier*1000);
	warn(this.attackTime);
	this.attackSize = 1;
	this.DoAfterDelay(this.attackTime, "SpawnAndAttack_LeftRush", {});
};
	
Trigger.prototype.SpawnRams = function()
{
	this.PlayerID = 2;
	var movingPoints = ["Gate_Spot_1", "Gate_Spot_2", "Gate_Spot_3"];
	var spawnPoint = ["C", "C_1", "C_2"];

	for(var spawnLength = 0; spawnLength < movingPoints.length; spawnLength++){

		var intruders = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint[spawnLength], "units/avars_mechanical_siege_ram" , 1, this.PlayerID);

		for (var origin in intruders) {
			var cmd = null;

			for(var target of this.GetTriggerPoints(movingPoints[spawnLength])) {
				var cmpPosition = Engine.QueryInterface(target, IID_Position);
				if (!cmpPosition || !cmpPosition.IsInWorld)
					continue;
					// store the x and z coordinates in the command
				cmd = cmpPosition.GetPosition();
				break;
			}
			if (!cmd)
				continue;
			cmd.type = "attack-walk";
			cmd.entities = intruders[origin];
			cmd.queued = true;
			cmd.targetClasses = { "attack": ["Unit", "Structure"] };
			ProcessCommand(2, cmd);
		}
	}
	this.DoAfterDelay(1000, "RamsMoving", {});
	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	this.siegeAttackTime = 9999999999999999999999999999999;
	this.siegeAttackSize = 1;
	this.DoAfterDelay(this.siegeAttackTime, "SpawnRams", {});
};

Trigger.prototype.SpawnSiegeTowers = function()
{
	//var rand = 0;
	this.PlayerID = 2;
	var spawnPoint = ["Siege_Spawn_1", "Siege_Spawn_2", "Siege_Spawn_3", "Siege_Spawn_4", "Siege_Spawn_5", "Siege_Spawn_6", "Siege_Spawn_7", "Siege_Spawn_8", "Siege_Spawn_9", "Siege_Spawn_10", "Siege_Spawn_11", "Siege_Spawn_12", "Siege_Spawn_13", "Siege_Spawn_14", "Siege_Spawn_15"];
	var movingPoints = ["Siege_Spot_1", "Siege_Spot_2", "Siege_Spot_3", "Siege_Spot_4", "Siege_Spot_5", "Siege_Spot_6", "Siege_Spot_7", "Siege_Spot_8", "Siege_Spot_9", "Siege_Spot_10", "Siege_Spot_11", "Siege_Spot_12", "Siege_Spot_13", "Siege_Spot_14", "Siege_Spot_15"];
	this.option += 1;
	warn(uneval(spawnPoint.length));
	for(var spawnLength = 0; spawnLength < spawnPoint.length; spawnLength++ ){

		var intruders = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint[spawnLength], "units/avars_mechanical_siege_tower", this.siegeAttackSize, this.PlayerID);

		for (var origin in intruders) {
		var cmd = null;

			for(var target of this.GetTriggerPoints(movingPoints[spawnLength])) {
				var cmpPosition = Engine.QueryInterface(target, IID_Position);
				if (!cmpPosition || !cmpPosition.IsInWorld)
					continue;
					// store the x and z coordinates in the command
				cmd = cmpPosition.GetPosition();
				break;
			}
			if (!cmd)
				continue;
			cmd.type = "attack-walk";
			cmd.entities = intruders[origin];
			cmd.queued = true;
			cmd.targetClasses = { "attack": ["Unit", "Structure"] };
			ProcessCommand(2, cmd);
		}
	}
	this.DoAfterDelay(1000, "SiegeTowersMoving", {});
	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	this.siegeAttackTime = 10000000000000000000000000000;
	warn(this.siegeAttackTime);
	this.siegeAttackSize = 1;
	this.DoAfterDelay(this.siegeAttackTime, "SpawnSiegeTowers", {});

	var entities = cmpTrigger.GetTriggerPoints("E");
	data = {
		"entities": entities, // central points to calculate the range circles
		"players": [1], // only count entities of player 1
		"maxRange": 15,
		"requiredComponent": IID_UnitAI, // only count units in range
		"enabled": true,
	};
	this.RegisterTrigger("OnRange", "SpawnBesiegers", data);
};

Trigger.prototype.SpawnBesiegers = function(data)
{
	warn("SpawnBesiegers");
	//this.DisableTrigger("OnRange", "SpawnBesiegers");
	var rand = Math.random();
	// randomize spawn points
	var championEntity = persianAttacker.champion[Math.floor(Math.random() * persianAttacker.champion.length)];
	var infantryEntity = persianAttacker.infantry[Math.floor(Math.random() * persianAttacker.infantry.length)];
	this.PlayerID = 2;
	var spawnPoint = "Siege_Units_Spawn_Spot";
	//helper = TriggerHelper.SpawnUnitsFromTriggerPoints("A", championEntity, 1/*championCounter+2*/, playerID);
	var intruders_regular = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint, infantryEntity, this.besiegerAttackSize, this.PlayerID);
	var intruders_elite = TriggerHelper.SpawnUnitsFromTriggerPoints(spawnPoint, championEntity, this.besiegerAttackSize, this.PlayerID);
	// enlarge the attack time and size
	// multiply with a number between 1 and 3
	//rand = Math.random() * 2 + 1;
	//this.besiegerTime *= rand;
	warn(uneval(this.DifficultyMultiplier));
	this.besiegerTime = (this.DifficultyMultiplier*1000);
	this.besiegerAttackSize = 1;
	this.DoAfterDelay(this.besiegerTime, "SpawnBesiegers", {});
};
// *****************************************************************
//  						Messages 
// *****************************************************************
Trigger.prototype.Init = function()
{
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1],
		"message": markForTranslation("Collect treasures and prepare for the Siege!"),
		"translateMessage": true
	});
}


Trigger.prototype.RamsMoving = function() {

	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1], 
		"message": markForTranslation("Watch out! The enemy is moving battering rams to your gates!"),
		"translateMessage": true
	});

};

Trigger.prototype.FarmerMessage = function() {

	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1], 
		"message": markForTranslation("Your people will recollect resources."),
		"translateMessage": true
	});

};

Trigger.prototype.SiegeTowersMoving = function() {

	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1], 
		"message": markForTranslation("Ready your troops! The Siege Towers Approachs!"),
		"translateMessage": true
	});
	//ChatNotification(2, [1], markForTranslation());
};

Trigger.prototype.MakeFunOfTheDecision = function(){
	
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1],
		"message": markForTranslation("The crows will fest on your corpse"),
		"translateMessage": true
	});
};

Trigger.prototype.SiegeStarting = function(){
	
	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
	cmpGUIInterface.PushNotification({
		"players": [1],
		"message": markForTranslation("They are preparing the siege engines, Gather your men and be ready for the assault!!!"),
		"translateMessage": true
	});
};

Capturable.prototype.CanCapture = function(player) 
{ 
	return false; 
}

// disables the territory decay (for all players)
TerritoryDecay.prototype.Decay = function() {};

var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);

var data = {"enabled": true};
var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
cmpTrigger.attackSize = 1; // attack with 1 soldier

// The Siege will start in 9 minutes
cmpTrigger.attackTime = 9*60*1000; // attack in 1 minute
cmpTrigger.besiegerTime = 7*60*1000;
cmpTrigger.defendTime = 10*60*1000;
cmpTrigger.besiegerAttackSize = 1;
cmpTrigger.siegeAttackSize = 1;
cmpTrigger.siegeAttackTime = 6*60*1000;
cmpTrigger.defendSize = 1;


// Rushes
// ****************************************************************************
cmpTrigger.DoAfterDelay(cmpTrigger.attackTime, "SpawnAndAttack_RigthRush", {});
cmpTrigger.DoAfterDelay(cmpTrigger.attackTime, "SpawnAndAttack_MiddleRush", {});
cmpTrigger.DoAfterDelay(cmpTrigger.attackTime, "SpawnAndAttack_LeftRush", {});
// ****************************************************************************
cmpTrigger.DoAfterDelay(cmpTrigger.siegeAttackTime, "SpawnSiegeTowers", {});
cmpTrigger.DoAfterDelay(cmpTrigger.besiegerTime, "SpawnBesiegers", {});
cmpTrigger.DoAfterDelay(cmpTrigger.defendTime, "Defend", {});
cmpTrigger.DoAfterDelay(cmpTrigger.siegeAttackTime+5000, "SpawnRams", {});


cmpTrigger.DifficultyMultiplier = 5;

//Starts the story
//var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
cmpTrigger.DoAfterDelay(200, "DifficultyDialog", {});

cmpTrigger.DoAfterDelay(0, "InitDiplomacies", {});
cmpTrigger.DoAfterDelay(5*60*1000, "StartSiege", {});

var entities = cmpTrigger.GetTriggerPoints("Gather_Spot_1");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [1], // only count entities of player 1
	"maxRange": 40,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true,
};
cmpTrigger.RegisterTrigger("OnRange", "FarmerGather", data);
var entities = cmpTrigger.GetTriggerPoints("Gather_Spot_2");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [1], // only count entities of player 1
	"maxRange": 40,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true,
};
cmpTrigger.RegisterTrigger("OnRange", "FarmerGather", data);
var entities = cmpTrigger.GetTriggerPoints("Gather_Spot_3");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [1], // only count entities of player 1
	"maxRange": 40,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true,
};
cmpTrigger.RegisterTrigger("OnRange", "FarmerGather", data);
var entities = cmpTrigger.GetTriggerPoints("Gather_Spot_4");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [1], // only count entities of player 1
	"maxRange": 40,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true,
};
cmpTrigger.RegisterTrigger("OnRange", "FarmerGather", data);
var entities = cmpTrigger.GetTriggerPoints("Gather_Spot_5");
data = {
	"entities": entities, // central points to calculate the range circles
	"players": [1], // only count entities of player 1
	"maxRange": 40,
	"requiredComponent": IID_UnitAI, // only count units in range
	"enabled": true,
};
cmpTrigger.RegisterTrigger("OnRange", "FarmerGather", data);












// Trigger.prototype.StructureBuiltAction = function(data)
// {
// 	warn("The OnStructureBuilt event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.ConstructionStartedAction = function(data)
// {
// 	warn("The OnConstructionStarted event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.TrainingFinishedAction = function(data)
// {
// 	warn("The OnTrainingFinished event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.TrainingQueuedAction = function(data)
// {
// 	warn("The OnTrainingQueued event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.ResearchFinishedAction = function(data)
// {
// 	warn("The OnResearchFinished event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.ResearchQueuedAction = function(data)
// {
// 	warn("The OnResearchQueued event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.OwnershipChangedAction = function(data)
// {
// 	warn("The OnOwnershipChanged event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.PlayerCommandAction = function(data)
// {
// 	warn("The OnPlayerCommand event happened with the following data:");
// 	warn(uneval(data));
// };

// Trigger.prototype.IntervalAction = function(data)
// {
// 	warn("The OnInterval event happened with the following data:");
// 	warn(uneval(data));
// 	this.numberOfTimerTrigger++;
// 	if (this.numberOfTimerTrigger >= this.maxNumberOfTimerTrigger)
// 		this.DisableTrigger("OnInterval", "IntervalAction");

// 	// try out the dialog
// 	var cmpGUIInterface = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
// 	cmpGUIInterface.PushNotification({
// 		"type": "dialog",
// 		"players": [1,2,3,4,5,6,7,8],
// 		"dialogName": "yes-no",
// 		"data": {
// 			"text": {
// 				"caption": {
// 					"message": markForTranslation("Testing the yes-no dialog. Do you want to say sure or rather not?"),
// 					"translateMessage": true,
// 				},
// 			},
// 			"button1": {
// 				"caption": {
// 					"message": markForTranslation("Sure"),
// 					"translateMessage": true,
// 				},
// 				"tooltip": {
// 					"message": markForTranslation("Say sure"),
// 					"translateMessage": true,
// 				},
// 			},
// 			"button2": {
// 				"caption": {
// 					"message": markForTranslation("Rather not"),
// 					"translateMessage": true,
// 				},
// 				"tooltip": {
// 					"message": markForTranslation("Say rather not"),
// 					"translateMessage": true,
// 				},
// 			},

// 		},
// 	});
// };

// Trigger.prototype.RangeAction = function(data)
// {
// 	warn("The OnRange event happened with the following data:");
// 	warn(uneval(data));
// };

// // Activate all possible triggers
// //var cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);

// var data = {"enabled": true};
// cmpTrigger.RegisterTrigger("OnStructureBuilt", "StructureBuiltAction", data);
// cmpTrigger.RegisterTrigger("OnConstructionStarted", "ConstructionStartedAction", data);
// cmpTrigger.RegisterTrigger("OnTrainingFinished", "TrainingFinishedAction", data);
// cmpTrigger.RegisterTrigger("OnTrainingQueued", "TrainingQueuedAction", data);
// cmpTrigger.RegisterTrigger("OnResearchFinished", "ResearchFinishedAction", data);
// cmpTrigger.RegisterTrigger("OnResearchQueued", "ResearchQueuedAction", data);
// cmpTrigger.RegisterTrigger("OnOwnershipChanged", "OwnershipChangedAction", data);
// cmpTrigger.RegisterTrigger("OnPlayerCommand", "PlayerCommandAction", data);

// data.delay = 10000; // after 10 seconds
// data.interval = 5000; // every 5 seconds
// cmpTrigger.numberOfTimerTrigger = 0;
// cmpTrigger.maxNumberOfTimerTrigger = 3; // execute it 3 times maximum
// cmpTrigger.RegisterTrigger("OnInterval", "IntervalAction", data);
// var entities = cmpTrigger.GetTriggerPoints("A");
// data = {
// 	"entities": entities, // central points to calculate the range circles
// 	"players": [1], // only count entities of player 1
// 	"maxRange": 40,
// 	"requiredComponent": IID_UnitAI, // only count units in range
// 	"enabled": true,
// };
// cmpTrigger.RegisterTrigger("OnRange", "RangeAction", data);










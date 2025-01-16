/**
 * Endless Arena
 * 
 * @author blaszczyk.przemek@gmail.com
 */

class Alliances {

	/**
	 * @param {*} queueSize - Default = 1000. <br/>
	 * Ilość permutacji do badania za jednym wywołaniem getResult().<br/> 
	 * Im większa, tym dłużej getResult() będzie liczyć, ale będzie wymagane mniejsze użycie ponownego getResult(). 
	 * Na wolnych komputerach powinna to być relatywnie mała liczba. Przy 8 graczach mamy 8! permutacji, czyli 40320 możliwych kombinacji.<br/>
	 * Jeżeli w 0 A.D. gra wstrzymuje się na chwilę, należy tą wartość obniżyć. Lepiej bowiem otrzymać wynik później, ale przy mniejszych lagach w grze.<br/> 
	 *  
	 * @param {*} stdevTreshold -  Default = 0.0. Zakres 0.0 - 100.0 <br/>
	 * Znormalizowana wartość odchylenia standardowego między sojusznikami, który nas satysfakcjonuje. <br/>
	 * Jeżeli algorytm znajdzie zestaw sojuszy z odchyleniem standardowym niższym niż ta wartość, to kończy działanie uznając wynik za satysfakcjonujący.<br/>
	 * Ustawienie tego parametru na 0 oznacza, że algorytm przeszuka wszystkie permutacje graczy.<br/>
	 * Generalnie ustawienie tego parametru na 100.0 oznacza akceptację każdego, nawet najgorszego dopasowania graczy, podczas gdy 0.0 żadnego - zawsze wybierze najlepszy tak jak to możliwe. 
	 * Można uznać, że wartość 5.0 daje bardzo podobne sojusze, ale jeżeli potrzebne są idealnie najlepsze to można zostawić 0.0.<br/>
	 * Jeżeli gra mocno laguje na słabym sprzęcie można zwiększyć ten parametr, zmniejszając jednocześnie "queueSize".
	 *  
	 */
	constructor(queueSize, stdevTreshold) {
		this.queueSize = queueSize;
		this.stdevTreshold = stdevTreshold;
		this.allBuckets = {};
		this.allPlayersPermutations = [];
		this.working = false;
		this.queueIndex = -1; //aktualna pozycja
		this.playersPermutationsQueue = []; //wszystkie permutacje
		this.result = null;
		this.finished = false;
		this.progress = 0.0;
	};

	clean() {
		this.allBuckets = {};
		this.allPlayersPermutations = [];
		this.playersPermutationsQueue = [];
	}


	/**
	 * Inicjalizuje liczenie sojuszy w sposób lazy.
	 * <br/>
	 * Stosowane w celu eliminacji lagów w 0AD
	 */
	calculate(players) {
		let ret = {
			working: this.working,
			result: this.result,
			progress: this.progress,
			finished: this.finished,
		}

		if (!this.working) {
			this.working = true;
			this.finished = false;
			this.progress = 0.0;
			this.result = null;

			let buckets = {};
			let playersPermutations = [];

			Alliances.generateBuckets(null, players.length, buckets);
			Alliances.generatePlayers(null, players, playersPermutations);

			this.allBuckets = buckets;
			this.allPlayersPermutations = playersPermutations;

			this.queueIndex = -1;
			this.playersPermutationsQueue = [];

			for (let i = 0; i < this.allPlayersPermutations.length; i += this.queueSize)
				this.playersPermutationsQueue.push(this.allPlayersPermutations.slice(i, i + this.queueSize));

			if (this.playersPermutationsQueue.length > 0)
				this.queueIndex = 0;
		}

		return ret;
	}

	done() {
		this.working = false;
		this.clean();
	}

	/**
	 * Liczy wynik cząstkowy i zwraca wynik. 
	 * <br/>
	 * Jeżeli zwracana struktura jest oznaczona jako finished = true, to znaczy że result zawiera ostateczny wynik. W przeciwnym wypadku należy wywołać tą funkcję raz jeszcze.
	 */
	getResult() {
		if (this.queueIndex >= 0 && this.queueIndex < this.playersPermutationsQueue.length) {
			const buckets = this.allBuckets;
			const playersPermutations = this.playersPermutationsQueue[this.queueIndex++];

			let bucketsList = [];
			for (let key of Object.keys(buckets))
				bucketsList.push(buckets[key]);

			let localResult = Alliances.getBestAllianceFast(bucketsList, playersPermutations);

			if (this.result == null || localResult.stdev < this.result.stdev)
				this.result = localResult;

			this.progress = Math.round(100.0 * this.queueIndex / this.playersPermutationsQueue.length);
			if (this.queueIndex >= this.playersPermutationsQueue.length || this.result.stdev <= this.stdevTreshold) {
				this.finished = true;
				//this.working = false;
			}
		} else {
			this.finished = true;
			//this.working = false;
		}

		let ret = {
			working: this.working,
			result: this.result,
			progress: this.progress,
			finished: this.finished,
		}

		return ret;
	}

	static generateAlianceKey(aliance) {
		let ret = "";
		for (let i = 0; i < aliance.length; i++)
			ret += aliance[i] + (i < aliance.length - 1 ? "_" : "");
		return ret;
	};


	static generateBuckets(parent, n, result) {
		for (let i = 0; i < n / 2; i++) {
			//1. generowanie kombinacji
			const a = i + 1;
			const b = n - a;

			let bucket = {
				parent: parent,
				a: a,
				n: b,
			};

			//2. tworzenie kombinacji sojuszy
			let aliance = [a, b];
			let p = parent;
			while (p != null) {
				aliance.push(p.a);
				p = p.parent;
			}
			aliance.sort();
			let key = Alliances.generateAlianceKey(aliance);
			result[key] = aliance;

			//3. generowanie nowych bucketow potomnych na podstawie "n"
			if (b > 1)
				Alliances.generateBuckets(bucket, b, result);
		}
	};



	static generatePlayers(parent, availablePlayers, results) {
		for (let ap of availablePlayers) {

			let newParent = {
				player: ap,
				parent: parent,
			};

			let newAvailablePlayers = [];
			for (let nap of availablePlayers)
				if (nap != ap)
					newAvailablePlayers.push(nap);


			if (newAvailablePlayers.length > 0)
				Alliances.generatePlayers(newParent, newAvailablePlayers, results);
			else {
				let result = [ap];
				let p = parent;
				while (!!p) {
					result.push(p.player);
					p = p.parent;
				}

				results.push(result);
			}
		}
	}

	static getStDev(allySetup) {
		if (allySetup.alliances.length > 0) {
			let sum = allySetup.alliances.reduce((a, b) => a += b.total, 0);
			let avg = sum / allySetup.alliances.length;

			let sumDistance = allySetup.alliances.reduce((a, b) => a += (b.total - avg) * (b.total - avg), 0);
			let stdev = 100.0 * Math.sqrt(sumDistance / allySetup.alliances.length);

			if (avg > 0)
				stdev /= avg;

			return stdev;
		} else
			return null;
	}

	static getStDevArray(arr) {
		if (arr.length > 0) {
			let sum = arr.reduce((a, b) => a += b, 0);
			let avg = sum / arr.length;

			let sumDistance = arr.reduce((a, b) => a += (b - avg) * (b - avg), 0);
			let stdev = 100.0 * Math.sqrt(sumDistance / arr.length);

			if (avg > 0)
				stdev /= avg;

			return stdev;
		} else
			return null;
	}

	/**
	 * Zwraca wszystkie sojusze - zuzywa duzo pamieci. Nie uzywać w 0AD
	 * 
	 * @deprecated Use {@link Alliances#getBestAllianceFast}
	 */
	static getAlliances(buckets, playersPermutations) {
		let ret = [];
		for (let alliances of buckets) {
			for (let players of playersPermutations) {
				let c = 0;
				let allySetup = {
					alliances: [],
					stdev: 0.0,
				}
				for (let alliance of alliances) {
					let allies = {
						players: [],
						total: 0,
					};
					for (let i = 0; i < alliance; i++) {
						let p = players[c++];
						allies.players.push(p);
						allies.total += p.value;
					}
					allySetup.alliances.push(allies);
				}
				allySetup.stdev = Alliances.getStDev(allySetup);
				ret.push(allySetup);
			}
		}

		return ret;
	}

	/**
	 * Znajduje najlepszy zestaw sojuszy<br/>
	 * Ulepszona wersja, ale ciagle zbyt kosztowna w 0AD
	 * 
	 * @deprecated Use {@link Alliances#getBestAllianceFast}
	 */
	static getBestAlliance(buckets, playersPermutations) {
		let best = null;
		let lowestStDev = 0.0;

		for (let alliances of buckets) {
			for (let players of playersPermutations) {
				let c = 0;
				let allySetup = {
					alliances: [],
					stdev: 0.0,
				}
				for (let alliance of alliances) {
					let allies = {
						players: [],
						total: 0,
					};
					for (let i = 0; i < alliance; i++) {
						let p = players[c++];
						allies.players.push(p);
						allies.total += p.value;
					}
					allySetup.alliances.push(allies);
				}
				allySetup.stdev = Alliances.getStDev(allySetup);

				if (best == null || allySetup.stdev < lowestStDev)
					best = allySetup;
			}
		}

		return best;
	}

	/**
	 * W miare szybko znajduje najlepszy zestaw sojuszy dla 8 graczy. Nadaje sie do 0AD.
	 */
	static getBestAllianceFast(buckets, playersPermutations) {
		let best = null;

		let lowestStDev = 0.0;
		let bestPlayers = null;
		let bestAlliances = null;

		for (let alliances of buckets) {
			let totals = new Array(alliances.length).fill(0);

			for (let players of playersPermutations) {
				let b = 0;
				let a = 0;
				totals[a] = 0;

				for (let c = 0; c < players.length; c++) {
					totals[a] += players[c].value;
					b++;
					if (b >= alliances[a]) {
						b = 0;
						if (a < totals.length - 1) {
							a++;
							totals[a] = 0;
						}
					}
				}

				let currStDev = Alliances.getStDevArray(totals);
				if (bestPlayers === null || currStDev < lowestStDev) {
					bestPlayers = players;
					bestAlliances = alliances;

					lowestStDev = currStDev;
				}

			}
		}

		if (bestPlayers !== null) {
			let c = 0;
			let allySetup = {
				alliances: [],
				stdev: 0.0,
			}
			for (let alliance of bestAlliances) {
				let allies = {
					players: [],
					total: 0,
				};
				for (let i = 0; i < alliance; i++) {
					let p = bestPlayers[c++];
					allies.players.push(p);
					allies.total += p.value;
				}
				allySetup.alliances.push(allies);
			}
			allySetup.stdev = lowestStDev;
			best = allySetup;
		}

		return best;
	}

	/**
	 * @param {*} players Tablica wszystkich mozliwych graczy oraz ich potęg wg formatu: <br/>
	 * [{ 	id,  value },{ 	id,  value }, ...]<br/>
	 * gdzie <b>id</b> jest liczbą całkowitą reprezentującą ID gracza (typowo 1-8), 
	 * gdzie <b>value</b> jest liczbą reprezentującą nominalną potęgę gracza.
	 * 
	 * @returns Zwraca obiekt reprezentujący zestaw sojuszy dla graczy oraz odchylenie standardowe między sojuszami. Format: <br/>
	 * { <br/>
	 * 	alliances: [ <br/>
	 * 		{players: [{id,value},{id,value},...], total: 0 } <br/>
	 * 		,{players: [...], total: 0} <br/>
	 * 		,... <br/>
	 * 	], <br/>
	 * 	stdev: 0.0, <br/> 
	 * } <br/>
	 */
	static calculateBestAlliance(players) {
		let buckets = {};
		let playersPermutations = [];
		Alliances.generateBuckets(null, players.length, buckets);
		Alliances.generatePlayers(null, players, playersPermutations);

		let bucketsList = [];
		for (let key of Object.keys(buckets))
			bucketsList.push(buckets[key]);

		let best = Alliances.getBestAllianceFast(bucketsList, playersPermutations);

		return best;
	}

	static calculateEconomyScore(playerStats) {
		let ret = 0;
		for (let res of Object.keys(playerStats.resourcesGathered))
			ret += playerStats.resourcesGathered[res];
		ret += playerStats.tradeIncome;
		return Math.round(ret / 10);
	}

	static calculateMilitaryScore(playerStats) {
		return (playerStats.enemyUnitsKilledValue +
			playerStats.unitsCapturedValue +
			playerStats.enemyBuildingsDestroyedValue +
			playerStats.buildingsCapturedValue) / 10;
	}

	static calculateExplorationScore(playerStats) {
		return playerStats.percentMapExplored * 10;
	}

}

Trigger.prototype.EndlessArenaNotify = function(message) {
	let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);

	gui.PushNotification({
		"message": message,
		"players": playerManager.GetNonGaiaPlayers(),
	});
}

Trigger.prototype.EndlessArenaDiplomacyChange = function() {
	if (!this.ea.locked) {
		this.ea.locked = true;

		let timer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);

		let timePassed = timer.GetTime() - this.ea.lastExecuted;

		// Pomoc dla potrzebujacych
		this.EndlessArenaDistributeHelp();

		// Ostrzezenie przed zblizajaca sie ocena
		if (!allianceEngine.working && this.ea.diplomacyToChange.length == 0 && this.ea.minInterval - timePassed < 60000 && this.ea.minInterval - timePassed > 5000)
			this.EndlessArenaNotify("Players assessment in " + Math.round((this.ea.minInterval - timePassed) / 1000) + " seconds!");

		if (timePassed >= this.ea.minInterval) {

			if (!allianceEngine.working && this.ea.diplomacyToChange.length > 0)
				allianceEngine.working = true;

			if (!allianceEngine.working) {

				let currentDiplomacy = {};
				let currentPower = {};
				let currentLockTeams = {};

				let playersToEvaluate = [];
				let totalTotalPower = 0;
				this.ea.playersEstimate = [];

				let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
				let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);


				//1. Kalkulacja potęgi
				for (let pid of playerManager.GetNonGaiaPlayers()) {

					let pEntity = playerManager.GetPlayerByID(pid);

					let p = Engine.QueryInterface(pEntity, IID_Player);
					//let pStatsTracker = Engine.QueryInterface(pEntity, IID_StatisticsTracker);
					//let pStats = pStatsTracker.GetStatistics();

					if (p.IsActive()) {

						let totalPower = 0;

						//totalPower += Alliances.calculateEconomyScore(pStats);
						//totalPower += Alliances.calculateMilitaryScore(pStats);
						//totalPower += Alliances.calculateExplorationScore(pStats);						
						// Historyczna potęga nie ma sensu. Trzeba liczyć tymczasową:
						let playerEstimate = this.EndlessArenaCalculatePower(pid);
						this.ea.playersEstimate.push(playerEstimate);
						totalPower = playerEstimate.power;

						totalTotalPower += totalPower;

						currentPower[pid] = totalPower;
						currentDiplomacy[pid] = p.GetDiplomacy();
						currentLockTeams[pid] = p.GetLockTeams();

						playersToEvaluate.push({
							id: pid,
							value: totalPower,
						});
					}
				}

				if (playersToEvaluate.length > 1) {
					//2. Kalkulacja pomocy
					this.EndlessArenaCalculateHelp(this.ea.playersEstimate);
					//warn(JSON.stringify(this.ea.playersEstimate));

					//3. Kalkulacja sojuszy
					let query = allianceEngine.calculate(playersToEvaluate);
					if (!query.working) {

						for (let pte of playersToEvaluate) {
							let relativePower = 0.0;
							if (totalTotalPower != 0)
								relativePower = (Math.round(pte.value / totalTotalPower * 1000.0) / 10.0);
							let averagePower = 100.0 / playersToEvaluate.length;
							let note = relativePower / averagePower;
							let noteText = "";
							if (note < 0.01)
								noteText = "Hey...Are you allright? You'll receive serious help. This should get you up.";
							else if (note < 0.25)
								noteText = "You're in very bad shape. Expect to be part of a good alliance."
							else if (note < 0.5)
								noteText = "You're lagging behind. Maybe the next alliance will help you a little bit."
							else if (note < 0.75)
								noteText = "Your kingdom is slightly below average.";
							else if (note < 2.0)
								noteText = "";
							else if (note < 3.0)
								noteText = "You're doing pretty well. The next alliance should help your enemies a bit.";
							else if (note < 4.0)
								noteText = "You're quite strong. Expect your enemies to form a strong alliance against you.";
							else if (note < 10.0)
								noteText = "You dominate the World. Expect very strong resistance!"
							else
								noteText = "You're unstoppable warfare genius! How is this even possible...?";

							gui.AddTimeNotification({
								"message": "%(_player_)s, your relative power is %(power)s. Prepare for an imminent change of alliance!\n%(text)s",
								"players": [pte.id],
								"translateParameters": [],
								"parameters": {
									"_player_": pte.id,
									"power": (Math.round(note * 1000.0) / 10.0) + "%",
									"text": noteText,
								},
							}, 60 * 1000);
						}


						this.DoAfterDelay(50, "EndlessArenaAllianceEngineGetResult", {});
					} else
						if (this.ea.verbose)
							warn("Ongoing calculation in progress!");
				}

			}

			this.ea.lastExecuted = timer.GetTime();
		} else
			if (this.ea.verbose)
				warn("Too fast!");


		this.ea.locked = false;
	} else
		if (this.ea.verbose)
			warn("Sorry, I cant!");
};

Trigger.prototype.EndlessArenaAllianceEngineGetResult = function() {
	let query = allianceEngine.getResult();
	//warn("Progress: " + query.progress + "%");
	if (query.finished) {
		let results = query.result;

		//1. Change diplomacy
		let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);

		this.ea.diplomacyToChange = [];
		let newDiplomacyA = [];
		let newDiplomacyE = [];

		let team = 0;
		//let c = 0;

		for (let al of results.alliances) {

			if (al.players.length > 1)
				team++;

			for (let i = 0; i < al.players.length; i++) {

				let pid = al.players[i].id;

				let pEntity = playerManager.GetPlayerByID(pid);
				let p = Engine.QueryInterface(pEntity, IID_Player);
				let idnt = Engine.QueryInterface(pEntity, IID_Identity);

				this.ea.playerNames[pid] = idnt.GetName();

				if (p.IsActive()) {
					const currentDiplomacy = p.GetDiplomacy().slice();
					let newDiplomacy = currentDiplomacy.slice().fill(-1);

					let recipientsA = [];
					let recipientsE = [];
					for (let j = 0; j < al.players.length; j++) {
						newDiplomacy[al.players[j].id] = 1;

					}

					for (let j = 0; j < newDiplomacy.length; j++) {
						if (pid != j) {
							if (newDiplomacy[j] != currentDiplomacy[j]) {
								if (newDiplomacy[j] == 1)
									recipientsA.push(j);
								if (newDiplomacy[j] == -1)
									recipientsE.push(j);
							}
						}
					}

					/*
					if (this.ea.verbose) {
						warn("Allies of #" + pid + ": " + recipientsA.join(","));
						warn("Enemies of #" + pid + ": " + recipientsE.join(","));
					}
					*/


					for (let r of recipientsA) {
						newDiplomacyA.push({
							from: pid,
							to: r,
							stance: "ally",
						});
					}
					for (let r of recipientsE) {
						newDiplomacyE.push({
							from: pid,
							to: r,
							stance: "enemy",
						});
					}

				}
			}
		}

		/*
		//gdyby byla potrzeba robienia tego przez teams za jednym zamachem:
		
		let d = 0;
		let totalAlll = Object.keys(results.alliances).reduce((a, b) => a += results.alliances[b].total, 0);		
		for (let al of results.alliances) {
			let allianceDesc = "Alliance " + String.fromCharCode('A'.charCodeAt(0) + (d++)) + ", Total power = " + (totalAlll > 0 ? Math.round(al.total / totalAlll * 1000.0) / 10 : 0) + "%%, Members: " + al.players.map(x => "%(_player_" + x.id + ")s").join(", ");

			for (let player of al.players) {
				let playerEntity = playerManager.GetPlayerByID(player.id);
				let p = Engine.QueryInterface(playerEntity, IID_Player);

				p.SetLockTeams(false);
				p.SetTeam(d);
				p.SetLockTeams(true);
			}

			this.EndlessArenaMsg(0, allianceDesc);
		}
		this.EndlessArenaMsg(0, "New teams have been set");
		*/

		//posortowanie diplomacyA i diplomacyE aby były to pary. A => B, B => A
		while (newDiplomacyA.length > 0) {
			let aa = newDiplomacyA.pop();
			this.ea.diplomacyToChange.push(aa);
			newDiplomacyA = newDiplomacyA.reduce((a, b) => { if (b.from == aa.to && b.to == aa.from) this.ea.diplomacyToChange.push(b); else a.push(b); return a; }, []);
		}
		while (newDiplomacyE.length > 0) {
			let aa = newDiplomacyE.pop();
			this.ea.diplomacyToChange.push(aa);
			newDiplomacyE = newDiplomacyE.reduce((a, b) => { if (b.from == aa.to && b.to == aa.from) this.ea.diplomacyToChange.push(b); else a.push(b); return a; }, []);
		}

		//if (this.ea.diplomacyToChange.length > 0)
		//niezaleznie czy ktos jest czy nie jest odpalamy aby w razie czego zakonczyc

		this.ea.wasChange = this.ea.diplomacyToChange.length > 0;
		if (this.ea.diplomacyToChange.length > 0) {
			//let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
			let pls = playerManager.GetNonGaiaPlayers();

			for (let pl of pls) {
				this.EndlessArenaMsg(pl, "Players started changing their alliances. Expect short lags. Thank you for your patience.");
				/*
				ProcessCommand(0, {
					"type": "aichat",
					"message": "/msg " + this.ea.playerNames[pl] + "  Players started changing their alliances. Expect short lags. Thank you for your patience.",
				});
				*/
			}
			let totalAll = Object.keys(results.alliances).reduce((a, b) => a += results.alliances[b].total, 0);


			let alliancesDescription = [];
			let c = 0;
			for (let al of results.alliances)
				//alliancesDescription.push("Alliance " + String.fromCharCode('A'.charCodeAt(0) + (c++)) + ", Total power = " + (totalAll > 0 ? Math.round(al.total / totalAll * 1000.0) / 10 : 0) + "%, Members: " + al.players.map(x => this.ea.playerNames[x.id]).join(", "));
				alliancesDescription.push("Alliance " + String.fromCharCode('A'.charCodeAt(0) + (c++)) + ", Total power = " + (totalAll > 0 ? Math.round(al.total / totalAll * 1000.0) / 10 : 0) + "%%, Members: " + al.players.map(x => "%(_player_" + x.id + ")s").join(", "));

			for (let i = 0; i < alliancesDescription.length; i++) {
				let ad = alliancesDescription[i];

				for (let pl of pls) {
					this.EndlessArenaMsg(pl, ad);
					/*
					ProcessCommand(0, {
						"type": "aichat",
						"message": "/msg " + this.ea.playerNames[pl] + " " + ad,
					});
					*/
				}
			}
		}
		this.DoAfterDelay(this.ea.diplomacyDelay, "EndlessArenaDiplomacyLazyChanger", {});

	} else
		this.DoAfterDelay(50, "EndlessArenaAllianceEngineGetResult", {});
};

Trigger.prototype.EndlessArenaDiplomacyLazyChanger = function(data) {
	if (this.ea.diplomacyToChange.length > 0) {
		if (this.ea.verbose)
			warn("Mam " + this.ea.diplomacyToChange.length + " zmian w dyplomacji do zrobienia");

		let change = this.ea.diplomacyToChange.pop();

		/*
		let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
		let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
		let pEntity = playerManager.GetPlayerByID(change.from);
		let p = Engine.QueryInterface(pEntity, IID_Player);

		p.SetDiplomacyIndex(change.to, change.stance);
		*/

		let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
		let peFrom = playerManager.GetPlayerByID(change.from);
		let pFrom = Engine.QueryInterface(peFrom, IID_Player);
		let peTo = playerManager.GetPlayerByID(change.to);
		let pTo = Engine.QueryInterface(peTo, IID_Player);

		if (pFrom.IsActive() && pTo.IsActive()) {

			pFrom.SetLockTeams(false);
			ProcessCommand(change.from, {
				"type": "diplomacy",
				"player": change.to,
				"to": change.stance,
			});
			pFrom.SetLockTeams(true);

			if (this.ea.verbose) {
				let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);

				let stanceDescription = "an ally of";
				if (change.stance == "enemy")
					stanceDescription = "at war with"

				if (this.ea.verbose)
					warn(change.from + "=>" + change.to + " = " + change.stance);

				gui.AddTimeNotification({
					"message": "%(_player_1)s is now %(stance)s %(_player_2)s !",
					"players": [change.from, change.to],
					"translateParameters": [],
					"parameters": {
						"_player_1": change.from,
						"_player_2": change.to,
						"stance": stanceDescription,
					},
				}, 30 * 1000);
			}

		}

	}

	if (this.ea.diplomacyToChange.length <= 0) {
		if (this.ea.wasChange) {
			this.ea.wasChange = false;
			//let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);
			//let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);

			let timer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
			let timeLeftInMinutes = Math.round((this.ea.minInterval - (timer.GetTime() - this.ea.lastExecuted)) / 60000);
			let timeDesc = timeLeftInMinutes + " minutes";
			if (timeLeftInMinutes <= 0)
				timeDesc = "less than a minute";

			for (let pid of Object.keys(this.ea.playerNames)) {
				this.EndlessArenaMsg(pid, "All players finished changing their alliances. Next change in about " + timeDesc + "!");
			}
		}

		allianceEngine.done();
	} else
		this.DoAfterDelay(this.ea.diplomacyDelay, "EndlessArenaDiplomacyLazyChanger", {});
}

Trigger.prototype.EndlessArenaDiplomacyChangeSpawner = function() {
	this.EndlessArenaDiplomacyChange();

	this.DoAfterDelay(this.ea.checkInterval, "EndlessArenaDiplomacyChangeSpawner", {});
};

/**
 * Rozprowadza pomoc potrzebujacym graczom
 */
Trigger.prototype.EndlessArenaDistributeHelp = function() {
	let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	let ratio = this.ea.checkInterval / this.ea.minInterval;
	if (ratio <= 0)
		ratio = 1;

	if (this.ea.playersEstimate.length > 0)
		for (let pe of this.ea.playersEstimate) {
			let pEntity = playerManager.GetPlayerByID(pe.playerId);
			let p = Engine.QueryInterface(pEntity, IID_Player);

			if (p.IsActive()) {
				let newHelp = {};

				let gain = 0;
				for (let res of Object.keys(pe.help)) {
					if (pe.help[res] > 0) {
						let v = Math.round(pe.help[res] * ratio);
						if (v <= 0 && pe.help[res] > pe.helpReceived[res])
							v = pe.help[res] - pe.helpReceived[res];
						if (v + pe.helpReceived[res] > pe.help[res])
							v = pe.help[res] - pe.helpReceived[res];

						if (v > 0 && v + pe.helpReceived[res] <= pe.help[res]) {
							gain += v;
							newHelp[res] = v;
							pe.helpReceived[res] += v;
						}
					}
				}

				if (Object.keys(newHelp).length > 0) {
					p.AddResources(newHelp);

					let statsTracker = Engine.QueryInterface(pEntity, IID_StatisticsTracker);
					if (statsTracker)
						statsTracker.IncreaseTributesReceivedCounter(gain);
					//statsTracker.IncreaseTradeIncomeCounter(gain);


					if (this.ea.verbose) {
						if (!!!this.ea.playerNames[pe.playerId]) {
							let idnt = Engine.QueryInterface(pEntity, IID_Identity);
							this.ea.playerNames[pe.playerId] = idnt.GetName();
						}

						this.EndlessArenaMsg(pe.playerId, " A little help for you: " + JSON.stringify(newHelp) + ". Received: " + JSON.stringify(pe.helpReceived) + ", Target: " + JSON.stringify(pe.help));
					}
				}
			}
		}
}

Trigger.prototype.EndlessArenaCalculateHelp = function(playersPower) {
	const bestPower = playersPower.reduce((a, b) => (b.power > a ? b.power : a), 0);

	let ret = playersPower;

	for (let pp of playersPower) {

		pp["help"] = {
		};
		pp["helpReceived"] = {
		}

		if (pp.power < bestPower) { //pomagamy tylko slabszym. Najlepszy nie potrzebuje pomocy
			let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
			let pEntity = playerManager.GetPlayerByID(pp.playerId);
			let p = Engine.QueryInterface(pEntity, IID_Player);

			if (p.IsActive()) {
				//let scale = 10.0 * (bestPower - pp.power) / (pp.ratio * pp.totalCost);

				//Tyle brakuje surowcow aby osiagnac ten sam wynik co best player przy obecnym kill ratio tego gracza				
				let missingResources = 10.0 * (bestPower - pp.power) / pp.ratio;

				//Tyle gracz ma obecnie zasobow				
				let curRes = p.GetResourceCounts();
				let totalRes = Object.keys(curRes).reduce((a, b) => a += curRes[b], 0);
				let avgNeeded = 0;

				if (totalRes < missingResources) {
					//Tyle musimy dodac graczowi					
					let needed = Math.round(missingResources - totalRes);
					let avg = (totalRes + needed) / Object.keys(curRes).length; //srednio powinno byc tyle kazdego resource

					//dystrybuujemy tylko dla tych surowcow, ktore sa ponizej sredniej
					let relevantResources = Object.keys(curRes).map(x => curRes[x]).filter(x => x < avg);
					if (relevantResources.length > 0) {
						let total = relevantResources.reduce((a, b) => a += b, 0);
						avgNeeded = Math.round((total + needed) / relevantResources.length);
					}
				}

				for (let res of Object.keys(curRes)) {
					pp.help[res] = 0;
					pp.helpReceived[res] = 0;

					if (curRes[res] < avgNeeded)
						pp.help[res] = avgNeeded - curRes[res];
				}

				/*
				//TODO
				if (!!!this.ea.playerNames[pp.playerId]) {
					let idnt = Engine.QueryInterface(pEntity, IID_Identity);
					this.ea.playerNames[pp.playerId] = idnt.GetName();
				}
				this.EndlessArenaMsg(0, "Player " + this.ea.playerNames[pp.playerId] + " Target: " + JSON.stringify(pp.help) + " (" + pp.power + ") (" + pp.ratio + ")");
				*/

				if (this.ea.verbose) {
					this.EndlessArenaMsg(pp.playerId, "Best power: " + bestPower + ", Your power: " + pp.power + ", Missing res: " + missingResources + ", AvgNeeded: " + avgNeeded);
					this.EndlessArenaMsg(pp.playerId, "Cur res: " + JSON.stringify(curRes) + ", Final help: " + JSON.stringify(pp.help))
				}

			}
		} else {
			//this.EndlessArenaMsg(0, "Best Player: " + pp.playerId + " (" + pp.power + ") (" + pp.ratio + ")");
		}

	}

	return ret;
}

Trigger.prototype.EndlessArenaMsg = function(playerId, message) {
	if (!!!this.ea.playerNames[playerId]) {
		let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
		let pEntity = playerManager.GetPlayerByID(playerId);
		let idnt = Engine.QueryInterface(pEntity, IID_Identity);
		this.ea.playerNames[playerId] = idnt.GetName();
	}

	let gui = Engine.QueryInterface(SYSTEM_ENTITY, IID_GuiInterface);

	if (playerId > 0)
		gui.PushNotification({
			"type": "aichat",
			"players": [0],
			"message": "/msg " + this.ea.playerNames[playerId] + " " + message,
			"translateMessage": true,
			"translateParameters": [],
			"parameters": {
				"_player_1": 1,
				"_player_2": 2,
				"_player_3": 3,
				"_player_4": 4,
				"_player_5": 5,
				"_player_6": 6,
				"_player_7": 7,
				"_player_8": 8,
			}
		});
	else {
		gui.PushNotification({
			"type": "aichat",
			"players": [0],
			"message": message,
			"translateMessage": true,
			"translateParameters": [],
			"parameters": {
				"_player_1": 1,
				"_player_2": 2,
				"_player_3": 3,
				"_player_4": 4,
				"_player_5": 5,
				"_player_6": 6,
				"_player_7": 7,
				"_player_8": 8,
			}
		});
	}
}

/**
 * Potęga liczona jest jako kombinacja siły armii i skuteczności gracza w bitwie. <br/>
 * Power = A * log2(B) ,gdzie: <br/>
 * A - 	Suma kosztu obecnie posiadanych jednostek. Metal traktujemy z mnożnikiem 2, Kamień z mnożnikiem 1.5
 * 		Bierze pod uwage % zdrowia jednostek.
 * B - 	kill/lost ratio. Używane tylko wtedy gdy zabito co najmniej 10 przeciwników. W przeciwnym wypadku 1.0. 
 * 		Jeśli nic nie stracono a zabito więcej niż 10 przeciwników, to mnożnik jest równy liczbie zabitych przeciwników.
 * 		Jeśli ratio < 2.0, to nie logarytmujemy wyniku. 
 */
Trigger.prototype.EndlessArenaCalculatePower = function(playerId) {
	let ret = {
		playerId: playerId,
		power: 0.0,
		totalUnitCost: 0.0,
		totalCost: 0.0,
		ratio: 0.0,
		ratioLegit: false,
		multipliers: {
			metal: 2.0,
			stone: 1.5, //zwykle tak samo trudno jak metal, ale w wojnie zwykle mniej potrzebny
			food: 0.75, //latwo zdobywa sie jedzenie 
			wood: 1.0,
		},
		help: {
			food: 0,
			wood: 0,
			stone: 0,
			metal: 0,
		}
	}

	let playerManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager);
	let pEntity = playerManager.GetPlayerByID(playerId);
	let entityManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	let ents = entityManager.GetEntitiesByPlayer(playerId);

	//1. Kalkulacja siły

	let totalCost = 0.0;
	let totalUnitCost = 0.0;
	for (let entId of ents) {
		//entId - numer entity

		let ent = Engine.QueryInterface(entId, IID_Identity);

		if (MatchesClassList(ent.GetClassesList(), "Unit")) {
			let costManager = Engine.QueryInterface(entId, IID_Cost);
			let healthManager = Engine.QueryInterface(entId, IID_Health);

			let maxHp = healthManager.GetMaxHitpoints();
			let curHp = healthManager.GetHitpoints();
			let cost = costManager.GetResourceCosts();

			if (maxHp > 0) {
				let unitCost = 0;
				for (let material of Object.keys(cost)) {
					let mul = 1.0;
					if (!!ret.multipliers[material])
						mul = ret.multipliers[material];

					unitCost += cost[material] * mul;
				}

				totalUnitCost += unitCost;
				totalCost += unitCost * (curHp / maxHp);
			}
		}
	}

	let ratio = 1.0;

	let pStatsTracker = Engine.QueryInterface(pEntity, IID_StatisticsTracker);
	let pStats = pStatsTracker.GetStatistics();

	let killed = pStats.enemyUnitsKilled.total;
	let killedValue = pStats.enemyUnitsKilledValue.total;
	let lostValue = pStats.unitsLostValue.total;

	if (killed > 10) {
		if (lostValue > 0)
			ratio = killedValue / lostValue;
		else
			ratio = killed;
		if (ratio > 2)
			ratio = Math.log2(ratio);

		if (ratio <= 0)
			ratio = 0.01;

		ret.ratioLegit = true;
	}

	let result = totalCost * ratio;
	result /= 10.0;

	ret.power = result;
	ret.ratio = ratio;
	ret.totalUnitCost = totalUnitCost;
	ret.totalCost = totalCost;

	if (ret.totalUnitCost <= 0)
		ret.totalUnitCost = 1.0;
	if (ret.totalCost <= 0)
		ret.totalCost = 1.0;

	//mnozniki do pomocy beda zalezec od aktualnych brakow graczy.
	//im czegos jest u niego mniej, tym bardziej otrzyma to jako pomoc.
	let p = Engine.QueryInterface(pEntity, IID_Player);
	let currentResources = p.GetResourceCounts();
	let maxRes = Object.keys(currentResources).reduce((a, b) => currentResources[b] > a ? currentResources[b] : a, 1);
	if (maxRes <= 0)
		maxRes = 1;
	for (let res of Object.keys(currentResources)) {
		let v = currentResources[res];
		if (v <= 0)
			v = 1;
		ret.multipliers[res] = (maxRes / v) * (maxRes / v); //^2 poneiwaz czesc pracownikow na pewno pracuje i trzeba wzmocnic bardziej ta pomoc, ktorej brakuje
	}

	if (this.ea.verbose) {
		warn("Player " + playerId + " => Unit cost: " + totalCost + ", ratio: " + ratio + " => " + ret.power);
		warn(JSON.stringify(pStats));
	}

	return ret;
}

Trigger.prototype.EndlessArenaTest = function() {
	//let templateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	/*
	let entityManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	let ents = entityManager.GetEntitiesByPlayer(1);
	for (let entId of ents) {
		//entId - numer entity

		let ent = Engine.QueryInterface(entId, IID_Identity);
		if (MatchesClassList(ent.GetClassesList(), "Unit")) {
			let costManager = Engine.QueryInterface(entId, IID_Cost);
			let cost = costManager.GetResourceCosts();
			//let templateName = templateManager.GetCurrentTemplateName(entId);
			warn(JSON.stringify(cost));
		}
	}*/
	this.EndlessArenaMsg(1, "Total power = 49.4%%, Members: %(_player_8)s, %(_player_7)s, %(_player_5)s, %(_player_4)s");
}

var allianceEngine = new Alliances(500, 0.0);

{
	let trg = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);

	if (!!!trg.ea) {
		trg.ea = {
			initialDelay: 300000, //zaczynamy od 5 minuty!
			checkInterval: 10000, //interwał pomocy, notyfikacji i wyzwalacza sojuszy co 10 sekund.
			minInterval: 300000, //estymacja co 5 minut!
			lastExecuted: -300000, //uruchomienie za pierwszym razem
			diplomacyDelay: 2000, //odstep w zmianie sojuszy (moze redukowac lagi jesli zwiekszac)

			helpFactor: 1.0,
			locked: false,
			diplomacyToChange: [],
			playerNames: {},
			playersEstimate: [],
			verbose: false,
		};


		trg.DoAfterDelay(trg.ea.initialDelay, "EndlessArenaDiplomacyChangeSpawner", {});
		//trg.DoAfterDelay(10000, "EndlessArenaTest", {});
	}
}
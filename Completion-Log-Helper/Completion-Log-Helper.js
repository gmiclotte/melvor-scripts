// ==UserScript==
// @name         Melvor Completion Log Helper
// @namespace    http://tampermonkey.net/
// @version      0.5.3
// @description  Replaces question mark icon in the Item Completion Log, Mastery Progression, Pet Completion and Monster Completion Log with greyed out images of items/pets/monsters that you have yet to get/kill and adds links to the wiki. Also includes toggle for highlighting items in bank.
// @author       Breindahl#2660
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @grant        none
// ==/UserScript==
/* jshint esversion: 6 */
 
// Made for version 0.18
// Big thanks to Visua#9999 for helping with parts of the code and troubleshooting
 
(function () {
	function injectScript(main) {
		var script = document.createElement('script');
		script.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
		document.body.appendChild(script).parentNode.removeChild(script);
	}
 
	function script() {
		// Loading script
		console.log('Melvor Completion Log Helper Loaded');
		var sheet = document.styleSheets[5];
		sheet.insertRule(".item-in-bank-on {border: 1px gold dotted}");
 
		$('#modal-item-log').find('.block-options').prepend('<button id="toggleItems" class="btn btn-sm btn-success" style="margin:0px 10px; float:left;">Toggle Found</button>');
		$('#modal-item-log').find('.block-options').prepend('<img class="skill-icon-xs m-1 BankBordersOn pointer-enabled" id="toggleBankBorders" style="opacity:50%" src="assets/media/main/bank_header.svg">');
		//<img id="toggleBankBorders" class="btn btn-sm btn-success" style="margin:0px 10px; float:left;">Toggle Found</button>')
		$(document).ready(function () {
			$("#toggleItems").click(function () {
				$(".item-found").toggle();
			});
			$("#toggleBankBorders").click(function () {
				if ($("#toggleBankBorders").hasClass("BankBordersOff")) {
					$("#toggleBankBorders").removeClass("BankBordersOff").addClass("BankBordersOn").css('opacity', '100%');
					$(".item-in-bank").removeClass("item-in-bank-off").addClass("item-in-bank-on");
				} else {
					$("#toggleBankBorders").removeClass("BankBordersOn").addClass("BankBordersOff").css('opacity', '50%');
					$(".item-in-bank").removeClass("item-in-bank-on").addClass("item-in-bank-off");
				}
			});
		});
 
		$('#modal-item-log').find('.block-options').prepend('<div class="input-group" style="float:left;width:auto"><input type="text" class="form-control text-danger btn btn-sm" id="searchTextboxItemLog" style="height:auto; text-align:left;" name="searchTextboxItemLog" placeholder="Search Item Log..." autocomplete="off"><div class="input-group-append"><button type="button" class="btn btn-danger btn-sm" id="clearItemLog">X</button></div></div>');
 
		const itemIds = items.map((_, id) => id);
 
		function updateItemLogSearch(search) {
			if (search === '') {
				$('#itemlog-container img').removeClass('d-none');
				return;
			}
			search = search.toLowerCase();
			const itemsResults = itemIds.filter(id => items[id].name.toLowerCase().includes(search) || items[id].category.toLowerCase().includes(search) || items[id].type.toLowerCase().includes(search) || id == search);
			$('#itemlog-container img').addClass('d-none');
			for (let i = 0; i < itemsResults.length; i++) {
				document.getElementById('item-log-img-' + itemsResults[i]).classList.remove('d-none');
			}
		}
 
		function clearItemLogSearch() {
			$('#searchTextboxItemLog').val('');
			updateItemLogSearch($('#searchTextboxItemLog').val());
		}
 
		$("#clearItemLog").click(function () {
			clearItemLogSearch();
		});
 
		$(document).ready(function () {
			$("#searchTextboxItemLog").on("keyup", function () {
				updateItemLogSearch($(this).val());
			});
		});
 
		function openItemLogExtra() {
			let timesFound = (ignoreCompletion = timesSold = gpFromSale = deathCount = damageTaken = damageDealt = missedAttacks = timesEaten = healedFor = totalAttacks = amountUsedInCombat = timeWaited = timesDied = timesGrown = harvestAmount = enemiesKilled = timesOpened = "");
			$("#itemlog-container").html("");
			$("#toggleBankBorders").removeClass("BankBordersOn").addClass("BankBordersOff").css('opacity', '50%');
			clearItemLogSearch();
			for (let i = 0; i < itemStats.length; i++) {
				let itemTooltip;
				if (itemStats[i].stats[0] > 0) {
					timesFound = ignoreCompletion = timesSold = gpFromSale = deathCount = damageTaken = damageDealt = missedAttacks = timesEaten = healedFor = totalAttacks = amountUsedInCombat = timeWaited = timesDied = timesGrown = harvestAmount = enemiesKilled = timesOpened = "";
					if (items[i].ignoreCompletion)
						ignoreCompletion = "<br><span class='text-danger'>Item does not count towards completion.</span>";
					if (itemStats[i].stats[0] > 0)
						timesFound = "<br>Times Found: <small class='text-warning'>" + formatNumber(itemStats[i].stats[0]) + "</small>";
					if (itemStats[i].stats[1] > 0)
						timesSold = "<br>Quantity Sold: <small class='text-warning'>" + formatNumber(itemStats[i].stats[1]) + "</small>";
					if (itemStats[i].stats[2] > 0)
						gpFromSale = "<br>GP Gained from sales: <small class='text-warning'>" + formatNumber(itemStats[i].stats[2]) + "</small>";
					if (itemStats[i].stats[3] > 0)
						deathCount = "<br>Times lost due to death: <small class='text-warning'>" + formatNumber(itemStats[i].stats[3]) + "</small>";
					if (itemStats[i].stats[4] > 0)
						damageTaken = "<br>Damage Taken whilst Equipped: <small class='text-warning'>" + formatNumber(itemStats[i].stats[4]) + "</small>";
					if (itemStats[i].stats[5] > 0)
						damageDealt = "<br>Damage Dealt: <small class='text-warning'>" + formatNumber(itemStats[i].stats[5]) + "</small>";
					if (itemStats[i].stats[6] > 0)
						missedAttacks = "<br>Attacks Missed: <small class='text-warning'>" + formatNumber(itemStats[i].stats[6]) + "</small>";
					if (itemStats[i].stats[7] > 0)
						timesEaten = "<br>Times Eaten: <small class='text-warning'>" + formatNumber(itemStats[i].stats[7]) + "</small>";
					if (itemStats[i].stats[8] > 0)
						healedFor = "<br>Healed for: <small class='text-warning'>" + formatNumber(itemStats[i].stats[8]) + "</small>";
					if (itemStats[i].stats[9] > 0)
						totalAttacks = "<br>Total Attacks: <small class='text-warning'>" + formatNumber(itemStats[i].stats[9]) + "</small>";
					if (itemStats[i].stats[10] > 0)
						amountUsedInCombat = "<br>Amount used in combat: <small class='text-warning'>" + formatNumber(itemStats[i].stats[10]) + "</small>";
					if (itemStats[i].stats[11] > 0)
						timeWaited = "<br>Time spent waiting to grow: <small class='text-warning'>" + formatNumber(itemStats[i].stats[11]) + "</small>";
					if (itemStats[i].stats[12] > 0)
						timesDied = "<br>Crop deaths: <small class='text-warning'>" + formatNumber(itemStats[i].stats[12]) + "</small>";
					if (itemStats[i].stats[13] > 0)
						timesGrown = "<br>Successful grows: <small class='text-warning'>" + formatNumber(itemStats[i].stats[13]) + "</small>";
					if (itemStats[i].stats[14] > 0)
						harvestAmount = "<br>Amount harvested: <small class='text-warning'>" + formatNumber(itemStats[i].stats[14]) + "</small>";
					if (itemStats[i].stats[15] > 0)
						enemiesKilled = "<br>Enemies killed: <small class='text-warning'>" + formatNumber(itemStats[i].stats[15]) + "</small>";
					if (itemStats[i].stats[16] > 0)
						timesOpened = "<br>Opened: <small class='text-warning'>" + formatNumber(itemStats[i].stats[16]) + "</small>";
					$("#itemlog-container").append('<img class="skill-icon-sm item-found" id="item-log-img-' + i + '" src="' + getItemMedia(i) + '">');
					itemTooltip = "<div class='text-center'>" + items[i].name + "<small class='text-info'> " + timesFound + timesSold + gpFromSale + totalAttacks + missedAttacks + damageDealt + damageTaken + enemiesKilled + amountUsedInCombat + timesEaten + healedFor + timesGrown + timesDied + timeWaited + harvestAmount + timesOpened + ignoreCompletion + "</small></div>";
					if (items[i].ignoreCompletion && i !== CONSTANTS.item.Cape_of_Completion)
						$("#item-log-img-" + i).attr("onClick", "addItemToBank(" + i + ", 1);");
				} else {
					ignoreCompletion = "";
					if (items[i].ignoreCompletion)
						ignoreCompletion = "<br><span class='text-danger'>Item does not count towards completion.</span>";
					$("#itemlog-container").append('<a href="https://wiki.melvoridle.com/index.php?title=' + items[i].name + '" target="blank"><img class="skill-icon-sm" id="item-log-img-' + i + '" style="opacity:0.3;filter: grayscale(30%);" src="' + items[i].media + '"></a>');
					itemTooltip = "<div class='text-center'>" + items[i].name + ignoreCompletion + "</div>";
				}
				let haveInBank = getBankId(i);
				if (haveInBank !== false) {
					$('#item-log-img-' + i).addClass("item-in-bank").addClass("item-in-bank-off");
				}
				tippy("#item-log-img-" + i, {
					content: itemTooltip,
					placement: "bottom",
					allowHTML: true,
					interactive: false,
					animation: false,
				});
			}
			$("#modal-item-log").modal("show");
		}
 
		$('#modal-monster-log').find('.block-options').prepend('<button id="toggleMonsters" class="btn btn-sm btn-success">Toggle Found</button>');
		$(document).ready(function () {
			$("#toggleMonsters").click(function () {
				$(".monster-found").toggle();
			});
		});
 
		function openMonsterLogExtra() {
			let damageDealtToPlayer = (damageTakenFromPlayer = killedByPlayer = killedPlayer = hitsToPlayer = hitsFromPlayer = enemyMissed = playerMissed = seen = ranAway = "");
			$("#monsterlog-container").html("");
			for (let i = 0; i < monsterStats.length; i++) {
				let monsterTooltip;
				ignoreCompletion = "";
				if (MONSTERS[i].ignoreCompletion) {
					ignoreCompletion = "<br><span class='text-danger'>Monster does not count towards completion.</span>";
				}
				if (monsterStats[i].stats[2] > 0) {
					damageDealtToPlayer = damageTakenFromPlayer = killedByPlayer = killedPlayer = hitsToPlayer = hitsFromPlayer = enemyMissed = playerMissed = seen = ranAway = "";
					damageTakenFromPlayer = "<br>Total Damage Dealt to Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[1]) + "</small>";
					damageDealtToPlayer = "<br>Total Damage Taken from Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[0]) + "</small>";
					killedByPlayer = "<br>Times Slain: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[2]) + "</small>";
					killedPlayer = "<br>Times Killed by Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[3]) + "</small>";
					hitsToPlayer = "<br>Successful hits by Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[4]) + "</small>";
					hitsFromPlayer = "<br>Successful hits to Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[5]) + "</small>";
					enemyMissed = "<br>Missed Attacks by Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[6]) + "</small>";
					playerMissed = "<br>Missed Attacks to Monster: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[7]) + "</small>";
					seen = "<br>Times Fought: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[8]) + "</small>";
					ranAway = "<br>Times Ran Away: <small class='text-warning'>" + formatNumber(monsterStats[i].stats[9]) + "</small>";
					$("#monsterlog-container").append('<img class="skill-icon-md monster-found" id="monster-log-img-' + i + '"  src="' + MONSTERS[i].media + '">');
					monsterTooltip = "<div class='text-center'>" + MONSTERS[i].name + "<small class='text-info'> " + seen + killedByPlayer + killedPlayer + damageTakenFromPlayer + damageDealtToPlayer + hitsFromPlayer + hitsToPlayer + playerMissed + enemyMissed + ranAway + ignoreCompletion + "</small></div>";
				} else {
					$('#monsterlog-container').append('<a href="https://wiki.melvoridle.com/index.php?title=' + MONSTERS[i].name + '" target="blank"><img class="skill-icon-md" id="monster-log-img-' + i + '" style="opacity:0.3;filter: grayscale(30%);" src="' + MONSTERS[i].media + '"></a>');
					monsterTooltip = "<div class='text-center'>" + MONSTERS[i].name + ignoreCompletion + "</div>";
				}
				tippy("#monster-log-img-" + i, {
					content: monsterTooltip,
					placement: "bottom",
					allowHTML: true,
					interactive: false,
					animation: false,
				});
			}
			updateTooltips();
			$("#modal-monster-log").modal("show");
		}
 
		$('#modal-pet-log').find('.block-options').prepend('<button id="togglePets" class="btn btn-sm btn-success">Toggle Found</button>');
		$(document).ready(function () {
			$("#togglePets").click(function () {
				$(".pet-found").toggle();
			});
		});
 
		function openPetLogExtra() {
			$('#petlog-container').html('');
			for (let i = 0; i < PETS.length; i++) {
				let tooltop;
				if (petUnlocked[i]) {
					$('#petlog-container').append('<img class="skill-icon-md pet-found" id="pet-log-img-' + i + '" src="' + PETS[i].media + '">');
					tooltip = '<div class="text-center"><span class="text-warning">' + PETS[i].name + '</span><br><span class="text-info">' + PETS[i].description + '</span></div>';
				} else {
					$('#petlog-container').append('<a href="https://wiki.melvoridle.com/index.php?title=' + PETS[i].name + '" target="blank"><img class="skill-icon-md" id="pet-log-img-' + i + '" style="opacity:0.3;filter: grayscale(50%);" src="' + PETS[i].media + '"></a>');
					tooltip = '<div class="text-center">' + PETS[i].name + '<br><small class=\'text-danger\'>Hint: ' + PETS[i].acquiredBy + '</small></div>';
				}
				tippy('#pet-log-img-' + i, {
					content: tooltip,
					placement: 'bottom',
					allowHTML: true,
					interactive: false,
					animation: false,
				});
			}
			$('#modal-pet-log').modal('show');
		}
 
		window.openItemLog = function () {
			openItemLogExtra();
		};
 
		window.openMonsterLog = function () {
			openMonsterLogExtra();
		};
 
		window.openPetLog = function () {
			openPetLogExtra();
		};
	}
 
	function loadScript() {
		if (window.isLoaded || (typeof unsafeWindow !== 'undefined' && unsafeWindow.isLoaded)) {
			clearInterval(scriptLoader);
			injectScript(script);
		}
	}
 
	const scriptLoader = setInterval(loadScript, 200);
})();

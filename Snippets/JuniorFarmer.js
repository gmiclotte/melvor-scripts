// ==UserScript==
// @name		Melvor JuniorFarmer
// @namespace	http://tampermonkey.net/
// @version		0.0.18
// @description	Collection of various juniorFarmers
// @grant		none
// @author		GMiclotte
// @include		https://melvoridle.com/*
// @include		https://*.melvoridle.com/*
// @exclude		https://melvoridle.com/index.php
// @exclude		https://*.melvoridle.com/index.php
// @exclude		https://wiki.melvoridle.com/*
// @exclude		https://*.wiki.melvoridle.com/*
// @inject-into page
// @noframes
// @grant		none
// ==/UserScript==

((main) => {
    const script = document.createElement('script');
    script.textContent = `try { (${main})(); } catch (e) { console.log(e); }`;
    document.body.appendChild(script).parentNode.removeChild(script);
})(() => {

function startJuniorFarmer() {

window.juniorFarmer = {
    name: '',
    log: (...args) => console.log('JuniorFarmer:', ...args),
    start: () => juniorFarmer.log(`Loading ${juniorFarmer.name}.`),
    end: () => juniorFarmer.log(`Loaded ${juniorFarmer.name}.`),
};

// header end

////////////////
//LootDrops.js//
////////////////
juniorFarmer.name = 'LootDrops.js';
juniorFarmer.start();
// Loot Drops
window.lootDrops = () => {
    const loot = combatManager.loot;
    // only loot when the loot table is full
    if (loot.drops.length < loot.maxLoot) {
        return;
    }
    // when the bank is full, update the bank cache
    const bankFull = bank.length === getMaxBankSpace();
    if (bankFull) {
        for (let i = 0; i < bank.length; i++) {
            bankCache[bank[i].id] = i;
        }
    }
    loot.drops = loot.drops.filter(drop => {
        const itemID = drop.item.id;
        if (bankFull) {
            // reject all items that aren't in the bank cache
            if (bankCache[itemID] === undefined) {
                return false;
            }
        }
        if (addItemToBank(itemID, drop.qty))
            game.stats.Combat.add(CombatStats.ItemsLooted, drop.qty);
        return false;
    });
}

// hook to player.rewardGPForKill, this runs on player death and is a relatively small method
eval(player.rewardGPForKill.toString().replaceAll(
    'this',
    'player',
).replace(
    'rewardGPForKill(){',
    'window.rewardGPForKill = () => {window.lootDrops();',
));

window.hookLootDrops = () => {
    if (player) {
        player.rewardGPForKill = window.rewardGPForKill;
    } else {
        setTimeout(window.hookLootDrops, 50);
    }
}

// window.hookLootDrops();
juniorFarmer.end();

/////////////////////////
//RerollJuniorFarmer.js//
/////////////////////////
juniorFarmer.name = 'RerollJuniorFarmer.js';
juniorFarmer.start();
// automate rerolling and attacking of Junior Farmer
window.rerollJuniorFarmer = () => {
    // rewardGPForKill loots drops and rerolls slayer task
    eval(player.rewardGPForKill.toString().replaceAll(
        'this',
        'player',
    ).replace(
        'rewardGPForKill(){',
        'window.rewardGPForKill = () => {' +
        'window.lootDrops();' +
        'window.rerollSlayerTaskFast([Monsters.JuniorFarmer], 0, false);',
    ));
    player.rewardGPForKill = window.rewardGPForKill;

    // process death restarts fight
    let checkDeath = combatManager.checkDeath.toString().slice(0,-1); // remove closing curly brace
    checkDeath += 'if (playerDied) {' +
        'combatManager.selectMonster(Monsters.JuniorFarmer, getMonsterArea(Monsters.JuniorFarmer));' +
        'juniorFarmer.log("player death: new fight initiated");' +
        '}';
    checkDeath += '}'; // add closing curly brace
    eval(checkDeath.replaceAll(
        'this',
        'combatManager',
    ).replace(
        'checkDeath(){',
        'window.checkDeath = () => {',
    ));
    combatManager.checkDeath = window.checkDeath;
}

window.rerollJuniorFarmer();
juniorFarmer.end();

///////////////////
//RerollSlayer.js//
///////////////////
juniorFarmer.name = 'RerollSlayer.js';
juniorFarmer.start();
//reroll slayer task until desired task is met
window.rerollSlayerTask = (monsterIDs, tier, extend = true, loop = true) => {
    if (window.stopRerolling) {
        return;
    }
    const task = combatManager.slayerTask;
    const taskID = task.monster.id;
    const taskName = MONSTERS[taskID].name;
    if (!combatManager.slayerTask.taskTimer.active) {
        // only do something if slayer task timer is not running
        if (!combatManager.slayerTask.active || !monsterIDs.includes(taskID)) {
            // roll task if we don't have one, or if it has the wrong monster
            juniorFarmer.log(`rerolling ${taskName} for tier ${tier} task ${monsterIDs.map(monsterID => MONSTERS[monsterID].name).join(', ')}`);
            combatManager.slayerTask.selectTask(tier, true, true, false);
        } else if (extend && !task.extended) {
            // extend task if it is the right monster
            juniorFarmer.log(`extending ${taskName}`);
            combatManager.slayerTask.extendTask();
        }
    }
    if (loop) {
        setTimeout(() => rerollSlayerTask(monsterIDs, tier, extend), 1000);
    }
}

// simulate rerolling of slayer task until desired task is met
window.rerollSlayerTaskFast = (monsterIDs, tier, extend = true, verbose = false) => {
    const task = combatManager.slayerTask;
    if (task.taskTimer.active) {
        return;
    }
    // only do something if slayer task timer is not running
    if (task.active && monsterIDs.includes(task.monster.id)) {
        if (extend && !task.extended) {
            // extend task if it is the right monster
            if (verbose) {
                juniorFarmer.log(`extending ${MONSTERS[task.monster.id].name}`);
            }
            task.extendTask();
        }
        return;
    }
    // roll task if we don't have one, or if it has the wrong monster
    const monsterSelection = task.getMonsterSelection(tier).map(x => x.id);
    const monsterSelectionMap = {};
    monsterSelection.forEach(x => monsterSelectionMap[x] = true);
    monsterIDs = monsterIDs.filter(x => monsterSelectionMap[x]);
    if (monsterIDs.length === 0) {
        juniorFarmer.log(`no valid monsterIDs provided for tier ${tier}`);
        return;
    }
    // simulate rerolls until one of the target monsters is rolled
    let rerolls = 1;
    const prob = monsterIDs.length / monsterSelection.length;
    while (Math.random() > prob) {
        rerolls++;
    }
    let scAmount = 0;
    if (tier > 0) {
        scAmount = SlayerTask.data[tier].cost * rerolls;
        if (scAmount > player._slayercoins) {
            juniorFarmer.log(`insufficient slayer coins, needed ${scAmount}, have ${player._slayercoins}`);
            return;
        }
        task.player.removeSlayerCoins(scAmount, true);
    }
    // randomly pick one of the valid monsters
    const monsterID = monsterIDs[rollInteger(0, monsterIDs.length - 1)];
    // mimic task.selectTask
    task.monster = MONSTERS[monsterID];
    task.tier = tier;
    task.active = true;
    task.extended = false;
    task.killsLeft = task.getTaskLength(tier);
    task.renderRequired = true;
    task.renderNewButton = true;
    if (verbose) {
        juniorFarmer.log(`simulated ${rerolls} rerolls for tier ${tier} task ${MONSTERS[monsterID].name} costing ${scAmount}SC`);
    }
}
juniorFarmer.end();

// footer start
}

function loadScript() {
    if (typeof isLoaded !== typeof undefined && isLoaded) {
        // Only load script after game has opened
        clearInterval(scriptLoader);
        startJuniorFarmer();
    }
}

const scriptLoader = setInterval(loadScript, 200);
});
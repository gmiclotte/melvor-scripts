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
            console.log(`rerolling ${taskName} for tier ${tier} task ${monsterIDs.map(monsterID => MONSTERS[monsterID].name).join(', ')}`);
            combatManager.slayerTask.selectTask(tier, true, true, false);
        } else if (extend && !task.extended) {
            // extend task if it is the right monster
            console.log(`extending ${taskName}`);
            combatManager.slayerTask.extendTask();
        }
    }
    if (loop) {
        setTimeout(() => rerollSlayerTask(monsterIDs, tier, extend), 1000);
    }
}

// simulate rerolling of slayer task until desired task is met
window.rerollSlayerTaskFast = (monsterIDs, tier, extend = true) => {
    const task = combatManager.slayerTask;
    const taskID = task.monster.id;
    const taskName = MONSTERS[taskID].name;
    if (!combatManager.slayerTask.taskTimer.active) {
        // only do something if slayer task timer is not running
        if (!combatManager.slayerTask.active || !monsterIDs.includes(taskID)) {
            // roll task if we don't have one, or if it has the wrong monster
            console.log(`simulating reroll for tier ${tier} task ${monsterIDs.map(monsterID => MONSTERS[monsterID].name).join(', ')}`);
            const monsterSelection = combatManager.slayerTask.getMonsterSelection(tier).map(x => x.id);
            monsterIDs = monsterIDs.filter(x => monsterSelection.includes(x));
            if (monsterIDs.length === 0) {
                console.log(`no valid monsterIDs provided for tier ${tier}`);
                return;
            }
            // simulate rerolls until one of the target monsters is rolled
            let rerolls = 1;
            const prob = monsterIDs.length / monsterSelection.length;
            while (Math.random() > prob) {
                rerolls++;
            }
            const scAmount = SlayerTask.data[tier].cost * rerolls;
            if (scAmount > player._slayercoins) {
                console.log(`insufficient slayer coins, needed ${scAmount}, have ${player._slayercoins}`);
                return;
            }
            // randomly pick one of the valid monsters
            const monsterID = monsterIDs[rollInteger(0, monsterIDs.length - 1)];
            // mimic combatManager.slayerTask.selectTask
            combatManager.slayerTask.player.removeSlayerCoins(scAmount, true);
            combatManager.slayerTask.monster = MONSTERS[monsterID];
            combatManager.slayerTask.tier = tier;
            combatManager.slayerTask.active = true;
            combatManager.slayerTask.extended = false;
            combatManager.slayerTask.killsLeft = combatManager.slayerTask.getTaskLength(tier);
            combatManager.slayerTask.renderRequired = true;
            combatManager.slayerTask.renderNewButton = true;
            console.log(`simulated ${rerolls} rerolls for tier ${tier} task ${MONSTERS[monsterID].name} costing ${scAmount}SC`);
        } else if (extend && !task.extended) {
            // extend task if it is the right monster
            console.log(`extending ${taskName}`);
            combatManager.slayerTask.extendTask();
        }
    }
}

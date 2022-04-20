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
                console.log(`extending ${MONSTERS[task.monster.id].name}`);
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
        console.log(`no valid monsterIDs provided for tier ${tier}`);
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
            console.log(`insufficient slayer coins, needed ${scAmount}, have ${player._slayercoins}`);
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
        console.log(`simulated ${rerolls} rerolls for tier ${tier} task ${MONSTERS[monsterID].name} costing ${scAmount}SC`);
    }
}

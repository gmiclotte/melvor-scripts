//reroll slayer task until desired task is met
window.rerollSlayerTask = (monsterIDs, tier, extend = true) => {
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
    setTimeout(() => rerollSlayerTask(monsterIDs, tier, extend), 1000);
}

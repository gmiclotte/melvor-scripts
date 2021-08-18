
/////////////////
//reroll slayer//
/////////////////
window.rerollSlayerTask = (monsterIDs, tier) => {
    if (window.stopRerolling) {
        return;
    }
    const task = combatManager.slayerTask;
    const taskID = task.monster.id;
    const taskName = MONSTERS[taskID].name;
    if (!combatManager.slayerTask.active
        || !monsterIDs.includes(taskID)) {
        console.log(`rerolling ${taskName} for tier ${tier} task ${monsterIDs.map(monsterID => MONSTERS[monsterID].name).join(', ')}`);
        combatManager.slayerTask.selectTask(tier, true, true, false);
    } else if (!task.extended) {
        console.log(`extending ${taskName}`);
        combatManager.slayerTask.extendTask();
    }
    setTimeout(() => rerollSlayerTask(monsterIDs, tier), 1000);
}

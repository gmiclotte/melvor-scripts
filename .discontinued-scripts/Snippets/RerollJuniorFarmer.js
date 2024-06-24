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
        'console.log("player death: new fight initiated");' +
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

// window.rerollJuniorFarmer();

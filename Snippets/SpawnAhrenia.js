// spawn Ahrenia
window.spawnAhrenia = (phaseToSpawn = 1) => {
    // run
    combatManager.runCombat();
    // set respawn to 0
    if (!petUnlocked[0]) {
        unlockPet(0);
    }
    PETS[0].modifiers.decreasedMonsterRespawnTimer = 0;
    player.computeAllStats();
    PETS[0].modifiers.decreasedMonsterRespawnTimer = 3000 - TICK_INTERVAL - player.modifiers.decreasedMonsterRespawnTimer + player.modifiers.increasedMonsterRespawnTimer;
    player.computeAllStats();
    // unlock itm
    dungeonCompleteCount[CONSTANTS.dungeon.Fire_God_Dungeon] = Math.max(
        dungeonCompleteCount[CONSTANTS.dungeon.Fire_God_Dungeon],
        1,
    );
    skillLevel[Skills.Slayer] = Math.max(
        skillLevel[Skills.Slayer],
        90,
    );
    // skip to desired phase
    combatManager.selectDungeon(15);
    combatManager.dungeonProgress = 19 + phaseToSpawn;
    combatManager.loadNextEnemy();
}

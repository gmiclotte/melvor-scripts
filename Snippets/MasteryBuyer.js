// methods to buy base mastery levels
window.masteryBuyer = {
    poolXpPerItem: 500000,
};

masteryBuyer.availXp = (skillID, minPercent = 95) => {
    let minPool = MASTERY[skillID].xp.length * masteryBuyer.poolXpPerItem * minPercent / 100;
    return MASTERY[skillID].pool - minPool;
}

masteryBuyer.currentBase = (skillID) => {
    return Math.min(...MASTERY[skillID].xp.map((_, masteryID) => getMasteryLevel(skillID, masteryID)));
}

masteryBuyer.maxAffordableBase = (skillID, minPercent = 95) => {
    let xp = masteryBuyer.availXp(skillID, minPercent);
    // make bins with mastery levels
    let bins = [];
    for (let i = 0; i < 100; i++) {
        bins[i] = [];
    }
    MASTERY[skillID].xp.forEach((_, masteryID) => {
        let level = getMasteryLevel(skillID, masteryID);
        bins[level].push(masteryID);
    });
    // level one at a time
    let maxBase = 0;
    bins.forEach((x, i) => {
        if (i >= 99) {
            return;
        }
        if (x.length === 0) {
            return;
        }
        let xpRequired = (exp.level_to_xp(i + 1) - exp.level_to_xp(i)) * x.length;
        xp -= xpRequired;
        if (xp >= 0) {
            maxBase = i + 1;
            x.forEach(y => bins[i + 1].push(y));
        }
    });
    maxBase = maxBase > 99 ? 99 : maxBase;
    return maxBase;
}

masteryBuyer.increaseBase = (skillID, minPercent = 95, levelCap = 99) => {
    // buy until goal
    let goal = masteryBuyer.maxAffordableBase(skillID, minPercent);
    if (goal === 0) {
        goal = masteryBuyer.currentBase(skillID);
    }
    if (goal > levelCap) {
        goal = levelCap;
    }
    MASTERY[skillID].xp.forEach((_, masteryID) => {
        let level = getMasteryLevel(skillID, masteryID);
        if (level >= goal) {
            return;
        }
        masteryPoolLevelUp = goal - level;
        levelUpMasteryWithPool(skillID, masteryID);
    });
    // spend remainder on goal + 1
    const xpRequired = exp.level_to_xp(goal + 1) - exp.level_to_xp(goal);
    let count = Math.floor(masteryBuyer.availXp(skillID, minPercent) / xpRequired);
    masteryPoolLevelUp = 1;
    MASTERY[skillID].xp.forEach((_, masteryID) => {
        if (count === 0) {
            return;
        }
        let level = getMasteryLevel(skillID, masteryID);
        if (level > goal || level >= levelCap) {
            return;
        }
        count--;
        levelUpMasteryWithPool(skillID, masteryID);
    });
    // update total mastery
    updateTotalMastery(skillID);
}

masteryBuyer.overview = (minPercent = 95) => {
    Object.getOwnPropertyNames(SKILLS).forEach(skillID => {
        const skill = SKILLS[skillID];
        if (!skill.hasMastery) {
            return;
        }
        const maxBase = masteryBuyer.maxAffordableBase(skillID, minPercent);
        if (maxBase === 0) {
            return;
        }
        const currentBase = masteryBuyer.currentBase(skillID);
        console.log(`${skill.name}: ${currentBase} -> ${maxBase}`);
    });
}

masteryBuyer.remaining = (skillID, target = 99) => {
    let xp = 0;
    let xpTarget = exp.level_to_xp(target);
    MASTERY[skillID].xp.forEach(masteryXp => {
        xp += Math.max(0, xpTarget - masteryXp);
    });
    xp = Math.round(xp)
    console.log(formatNumber(xp))
    return xp
}

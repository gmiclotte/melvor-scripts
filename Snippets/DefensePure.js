
/////////////////////////////
//Defense Pure Calculations//
/////////////////////////////
const defLvlToHPLvl = def => {
    const hpXP = exp.level_to_xp(10) + 1;
    const minDefXP = exp.level_to_xp(def) + 1;
    const maxDefXP = exp.level_to_xp(def + 1);
    const minHpXP = hpXP + minDefXP / 3;
    const maxHpXP = hpXP + maxDefXP / 3;
    const minHp = exp.xp_to_level(minHpXP) - 1;
    const maxHp = exp.xp_to_level(maxHpXP) - 1;
    return {min: minHp, max: maxHp};
}

const defLvlToCbLvl = def => {
    const hp = defLvlToHPLvl(def);
    const att = 1, str = 1, ran = 1, mag = 1, pray = 1;
    const minBase = (def + hp.min + Math.floor(pray / 2)) / 4;
    const maxBase = (def + hp.max + Math.floor(pray / 2)) / 4;
    const melee = (att + str) * 1.3 / 8;
    const ranged = Math.floor(1.5 * ran) * 1.3 / 8;
    const magic = Math.floor(1.5 * mag) * 1.3 / 8;
    const best = Math.max(melee, ranged, magic);
    return {min: minBase + best, max: maxBase + best};
}

const lastHitOnly = (skillID, maxLevel = 1) => {
    if (skillXP[skillID] >= exp.level_to_xp(maxLevel + 1) - 1) {
        combatManager.stopCombat();
        return;
    }
    // swap weapon based on hp left
    let itemID = -1;
    if (combatManager.enemy.hitpoints > 1) {
        if (skillID === CONSTANTS.skill.Magic) {
            itemID = CONSTANTS.item.Normal_Shortbow;
        } else {
            // melee or ranged
            itemID = CONSTANTS.item.Staff_of_Air;
        }
    } else {
        if (skillID === CONSTANTS.skill.Ranged) {
            itemID = CONSTANTS.item.Iron_Throwing_Knife;
        } else if (skillID === CONSTANTS.skill.Magic) {
            itemID = CONSTANTS.item.Staff_of_Air;
        } else {
            // melee
            itemID = -1;
        }
    }
    if (player.equipment.slots.Weapon.item.id !== itemID) {
        if (itemID === -1) {
            player.unequipItem(0, 'Weapon');
        } else {
            player.equipItem(itemID, 0);
        }
    }
    // loop
    setTimeout(lastHitOnly, 1000);
}
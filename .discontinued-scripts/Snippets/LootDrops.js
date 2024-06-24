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

// Loot Drops
window.lootDrops = () => {
    combatManager.loot.drops = combatManager.loot.drops.filter(drop => {
        const fit = addItemToBank(drop.item.id, drop.qty);
        if (fit)
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

hookLootDrops = () => {
    if (player) {
        player.rewardGPForKill = window.rewardGPForKill;
    } else {
        setTimeout(hookLootDrops, 50);
    }
}

// hookLootDrops();

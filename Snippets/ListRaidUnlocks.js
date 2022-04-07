// list unlocked raid items
window.listCrateItems = (unlocked = true) =>
    RaidManager.crateItemWeights.filter(x =>
        unlocked === game.golbinRaid.ownedCrateItems.has(x.itemID)
    ).forEach(x =>
        console.log(items[x.itemID].name)
    );
// to list the ones you have unlocked:
// listCrateItems()
// to list the ones you haven't unlocked:
// listCrateItems(false)

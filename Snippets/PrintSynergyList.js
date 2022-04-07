// functions to print synergies per category (cb vs non-cb)
window.printSynergy = (x, y) => console.log('- [ ]',
    x.summoningID,
    parseInt(y),
    items[x.itemID].name,
    items[summoningItems[y].itemID].name,
    SUMMONING.Synergies[x.summoningID][y].description,
    SUMMONING.Synergies[x.summoningID][y].modifiers
);

window.printCombatSynergyList = () => {
    // get combat synergies
    summoningItems.filter(x => items[x.itemID].summoningMaxHit).map(x => {
        for (y in SUMMONING.Synergies[x.summoningID]) {
            printSynergy(x, y);
        }
    });
}

window.printNonCombatSynergyList = () => {
    // get non-combat synergies
    summoningItems.filter(x => !items[x.itemID].summoningMaxHit).map(x => {
        for (y in SUMMONING.Synergies[x.summoningID]) {
            printSynergy(x, y);
        }
    });
}

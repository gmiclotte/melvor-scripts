// unsell sold items
window.unsell = (id, count = Infinity) => {
    if (count < 0) {
        return;
    }
    const timesSold = game.stats.Items.get(id, ItemStats.TimesSold);
    const gpFromSales = game.stats.Items.get(id, ItemStats.GpFromSale);
    if (timesSold === 0) {
        console.log("zero times sold");
        return;
    }
    // check if transaction is affordable
    const times = Math.min(count, timesSold);
    const cost = Math.ceil(gpFromSales / timesSold * times);
    if (gp < cost) {
        console.log("can't afford: " + times + " costs " + cost + " have " + gp);
        return;
    }
    // add item
    if (times > 0) {
        addItemToBank(id, times);
    }
    game.stats.Items.add(id, ItemStats.TimesFound, -times);
    game.stats.Items.add(id, ItemStats.TimesSold, -times);
    // remove cost
    gp = Math.floor(gp - cost);
    game.stats.Items.add(id, ItemStats.GpFromSale, -cost);
    updateGP();
    // fix statistics
    game.stats.General.add(GeneralStats.TotalItemsSold, -times);
    updateBank();
    // log transaction
    console.log("bought " + times + " for " + cost);
}


/////////////////////
//unsell sold items//
/////////////////////
unsell = (id, count = Infinity) => {
    if (count < 0) {
        return;
    }
    let stats = itemStats[id].stats;
    if (stats[Stats.TimesSold] === 0) {
        console.log("zero times sold");
        return;
    }
    // check if transaction is affordable
    let times = Math.min(count, stats[Stats.TimesSold]);
    let cost = Math.ceil(stats[Stats.GpFromSale] / stats[Stats.TimesSold] * times);
    if (gp < cost) {
        console.log("can't afford: " + times + " costs " + cost + " have " + gp);
        return;
    }
    // add item
    if (times > 0) {
        addItemToBank(id, times);
    }
    stats[Stats.TimesFound] -= times;
    stats[Stats.TimesSold] -= times;
    // remove cost
    gp = Math.floor(gp - cost);
    stats[Stats.GpFromSale] -= cost;
    updateGP();
    // fix statistics
    statsGeneral[0].count -= cost;
    statsGeneral[1].count -= times;
    updateStats();
    // log transaction
    console.log("bought " + times + " for " + cost);
}

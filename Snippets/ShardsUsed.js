// compute total shards used
window.shardsUsed = () => {
    // compute amount of gp spent on summoning shards that have been used (for summoning or agility obstacles)
    items.map((x, i) => [x, i])
        .filter(x => x[0].type === 'Shard' && x[0].category === 'Summoning')
        .map(x => x[1])
        .map(x => (itemStats[x].stats[0] - getBankQty(x) - itemStats[x].stats[1]) * items[x].buysFor)
        .reduce((a, b) => a + b, 0);
}

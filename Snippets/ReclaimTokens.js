// reclaim tokens
window.reclaimMasteryTokens = () => {
    skillXP.forEach((_, s) => {
        if (MASTERY[s] === undefined) {
            return;
        }
        const id = Items['Mastery_Token_' + Skills[s]];
        const p = Math.floor((MASTERY[s].pool - getMasteryPoolTotalXP(s) ) / Math.floor(getMasteryPoolTotalXP(s)*0.001));
        const m = game.stats.Items.statsMap.get(id).stats.get(ItemStats.TimesFound);
        const o = getBankQty(id);
        const a = Math.min(p, m - o);
        const b = getBankId(id);
        if (a > 0 && b >= 0) {
            bank[b].qty += a;
            MASTERY[s].pool -= a * Math.floor(getMasteryPoolTotalXP(s)*0.001);
            snippets.log('reclaimed', a, Skills[s], 'tokens');  
        }
    });
}


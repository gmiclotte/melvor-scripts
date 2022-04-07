// return total healing in bank
window.bankedHealth = () => {
    return items.filter(x => x.healsFor)
        .map(x => player.getFoodHealing(x) * combatManager.bank.getQty(x.id))
        .reduce((a, b) => a + b, 0);
}

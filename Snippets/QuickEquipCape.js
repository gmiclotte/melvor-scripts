
/////////////////////////////
//Quick Equip Max/Comp Cape//
/////////////////////////////
quickEquipSkillcape = (skill) => {
    const capes = [
        CONSTANTS.item.Cape_of_Completion,
        CONSTANTS.item.Max_Skillcape,
        skillcapeItems[skill],
    ];
    for (let i = 0; i < capes.length; i++) {
        const capeId = capes[i];
        if (player.equipment.checkForItemID(capeId)) {
            notifyPlayer(skill, `${items[capeId].name} is already equipped.`, "info");
            return;
        }
        const bankId = getBankId(capeId);
        if (bankId === -1) {
            continue;
        }
        if (!player.equipItem(capeId, player.selectedEquipmentSet)) {
            continue;
        }
        notifyPlayer(skill, `${items[capeId].name} Equipped.`, "success");
        if (skill === 0) {
            updateWCRates();
        }
        return;
    }
    notifyPlayer(skill, "There's no " + setToUppercase(skillName[skill]) + " Skillcape in your bank *shrug*", "danger");
}

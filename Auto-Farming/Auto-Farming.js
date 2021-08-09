// ==UserScript==
// @name         Melvor Auto Farming
// @version      1.3
// @description  Automatically plants your seeds, prioritizes highest level tree seed and equal allotment and herb produce. Comment seeds you don't want to plant and equipment you don't want to use.
// @author		 GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @grant        none
// @namespace    github.com/gmiclotte
// ==/UserScript==

function script() {
    window.maf = {}
    maf.log = (...x) => {
        console.log('Melvor Auto Farming:', ...x);
    }
    maf.allotmentSeedOrder = [
        // CONSTANTS.item.Potato_Seed,
        // CONSTANTS.item.Onion_Seed,
        // CONSTANTS.item.Cabbage_Seed,
        // CONSTANTS.item.Tomato_Seed,
        // CONSTANTS.item.Sweetcorn_Seed,
        // CONSTANTS.item.Strawberry_Seed,
        // CONSTANTS.item.Watermelon_Seed,
        CONSTANTS.item.Snape_Grass_Seed,
        CONSTANTS.item.Carrot_Seeds,
    ];
    maf.herbSeedOrder = [
        CONSTANTS.item.Garum_Seed,
        CONSTANTS.item.Sourweed_Seed,
        CONSTANTS.item.Mantalyme_Seed,
        CONSTANTS.item.Lemontyle_Seed,
        CONSTANTS.item.Oxilyme_Seed,
        CONSTANTS.item.Poraxx_Seed,
        CONSTANTS.item.Pigtayle_Seed,
        CONSTANTS.item.Barrentoe_Seed,
    ];
    maf.treeSeedOrder = [
        CONSTANTS.item.Oak_Tree_Seed,
        CONSTANTS.item.Willow_Tree_Seed,
        CONSTANTS.item.Maple_Tree_Seed,
        CONSTANTS.item.Yew_Tree_Seed,
        CONSTANTS.item.Magic_Tree_Seed,
    ];

    // gear
    maf.farmGear = {
        Cape: [],
        Weapon: [
            CONSTANTS.item.Bobs_Rake,
        ],
        Ring: [
            CONSTANTS.item.Aorpheats_Signet_Ring,
            CONSTANTS.item.Ancient_Ring_Of_Mastery,
            CONSTANTS.item.Ancient_Ring_Of_Skills,
        ],
    };
    if (completionStats >= 100) {
        maf.farmGear.Cape.push(CONSTANTS.item.Cape_of_Completion);
    }
    if (checkRequirements(items[CONSTANTS.item.Max_Skillcape].equipRequirements, false, '')) {
        maf.farmGear.Cape.push(CONSTANTS.item.Max_Skillcape);
    }
    maf.farmGear.Cape.push(CONSTANTS.item.Farming_Skillcape);

    maf.checkGrown = function () {
        for (let j = 0; j < newFarmingAreas.length; j++) {
            for (let i = 0; i < newFarmingAreas[j].patches.length; i++) {
                let patch = newFarmingAreas[j].patches[i]
                if (!patch.unlocked) {
                    continue;
                }
                if (patch.hasGrown) {
                    return true;
                }
            }
        }
        return false
    }

    maf.checkEmpty = function () {
        for (let j = 0; j < newFarmingAreas.length; j++) {
            for (let i = 0; i < newFarmingAreas[j].patches.length; i++) {
                let patch = newFarmingAreas[j].patches[i]
                if (!patch.unlocked) {
                    continue;
                }
                if (patch.seedID === 0) {
                    return true;
                }
            }
        }
        return false
    }

    maf.harvest = function () {
        for (let j = 0; j < newFarmingAreas.length; j++) {
            for (let i = 0; i < newFarmingAreas[j].patches.length; i++) {
                if (newFarmingAreas[j].patches[i].hasGrown) {
                    harvestSeed(j, i);
                }
            }
        }
    }

    // helper methods
    maf.checkEquipped = (valid, slot) => {
        for (let i = 0; i < valid.length; i++) {
            if (combatManager.player.equipment.slots[slot].item.id === valid[i]) {
                return true;
            }
        }
        return false;
    };

    maf.swapEquipped = (valid, slot) => {
        if (!maf.checkEquipped(valid, slot)) {
            for (let i = 0; i < valid.length; i++) {
                if (checkBankForItem(valid[i])) {
                    combatManager.player.equipItem(valid[i], 0, slot, 1);
                    return true;
                }
            }
        }
        return false;
    };

    maf.harvestWithGear = function () {
        if (combatManager.isInCombat) {
            maf.harvest();
            return;
        }
        // swap harvest gear
        // variables
        let swapped = {};
        let current = {};

        // save Shield since it might be unequipped when equipping weapon
        current.Shield = combatManager.player.equipment.slots.Shield.occupiedBy === 'None' ? combatManager.player.equipment.slots.Shield.item.id : -1;

        // swap gear
        Object.getOwnPropertyNames(maf.farmGear).forEach(slot => {
            if (swapped[slot]) {
                // already swapped higher priority item
                return;
            }
            current[slot] = combatManager.player.equipment.slots[slot].item.id;
            swapped[slot] = maf.swapEquipped(maf.farmGear[slot], slot);
        });

        // harvest
        maf.harvest()

        // swap back gear
        Object.getOwnPropertyNames(maf.farmGear).forEach(slot => {
            if (swapped[slot] && current[slot] !== -1) {
                combatManager.player.equipItem(current[slot], 0, slot, 1);
            }
        });
        if (swapped.Weapon && current.Shield !== -1) {
            combatManager.player.equipItem(current.Shield, 0, 'Shield', 1);
        }
    }

    maf.farm = function (idx, seedCount, seedOrder, priority = "level") {
        // count patches
        let totalPatches = newFarmingAreas[idx].patches.filter(x => x.unlocked);
        let emptyPatches = totalPatches.filter(x => x.seedID === 0).length;
        // find seed with sufficient seeds
        let chosenSeed = 0;
        let required = emptyPatches * seedCount;
        let minAmt = Infinity;
        for (let h = 0; h < seedOrder.length; h++) {
            let seed = seedOrder[h];
            if (skillLevel[CONSTANTS.skill.Farming] < items[seed].farmingLevel) {
                continue;
            }
            if (!checkBankForItem(seed)) {
                continue;
            }
            if (bank[getBankId(seed)].qty < required) {
                continue;
            }
            let choose = false;
            if (priority === "level") {
                choose = true
            } else if (priority === "amount") {
                let grownAmt = 0;
                if (checkBankForItem(items[seed].grownItemID)) {
                    grownAmt = bank[getBankId(items[seed].grownItemID)].qty;
                }
                if (grownAmt < minAmt) {
                    choose = true;
                    minAmt = grownAmt;
                }
            }
            if (choose) {
                chosenSeed = seed;
            }
        }
        // insufficient seeds
        if (chosenSeed === 0) {
            return;
        }
        // plant seeds
        totalPatches.forEach((patch, i) => {
            if (patch.seedID === 0) {
                if (!patch.gloop && checkBankForItem(679) !== false && bank[getBankId(679)].qty > 0) {
                    addGloop(idx, i);
                }
                selectedPatch = [idx, i];
                selectSeed(chosenSeed);
                plantSeed();
            }
        });
    }

    maf.autoFarming = setInterval(() => {
        try {
            if (maf.checkGrown()) {
                maf.harvestWithGear();
            }
            if (!maf.checkEmpty()) {
                return;
            }
            maf.farm(0, 3, maf.allotmentSeedOrder, "amount");
            maf.farm(1, 2, maf.herbSeedOrder, "amount");
            maf.farm(2, 1, maf.treeSeedOrder);
        } catch (e) {
            // catch and ignore newFarmingAreas is not defined
            // everything seems to work fine, but it still throws this error...
            if (e.message !== "newFarmingAreas is not defined") {
                maf.log(e);
            }
        }
    }, 5000);

    ///////
    //log//
    ///////
    maf.log('Loaded');
}

(function () {
    function injectScript(main) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
    }

    function loadScript() {
        if ((window.isLoaded && !window.currentlyCatchingUp)
            || (typeof unsafeWindow !== 'undefined' && unsafeWindow.isLoaded && !unsafeWindow.currentlyCatchingUp)) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
})();
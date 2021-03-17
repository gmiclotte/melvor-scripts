// ==UserScript==
// @name         Lemvor
// @version      0.0.8
// @namespace    github.com/gmiclotte
// @description  lemon
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// ==/UserScript==
 
function script() {
    // convert object to array
    const unpack = object => Object.getOwnPropertyNames(object).map(prop => object[prop]);
    // lemon
    const lemon = getItemMedia(CONSTANTS.item.Lemon);
    // when life gives you media, make some lemons
    [
        // arrays of objects that have media
        ANCIENT,
        AURORAS,
        CURSES,
        DUNGEONS,
        MONSTERS,
        PETS,
        PRAYER,
        SPELLS,
        agilityObstacles,
        combatAreas,
        items,
        slayerAreas,
        thievingNPC,
        trees,
        // objects of objects that have media
        unpack(SKILLS),
        // objects of arrays of objects that have media
        ...unpack(MILESTONES),
        ...unpack(SHOP),
        ...unpack(masteryMedia),
    ].forEach(list => {
        list.forEach(entry => entry.media = lemon);
    });
 
    // update lemons
    document.getElementsByTagName('img').forEach(img => {
        img.src = lemon;
    });
 
    // make 0's lemons too
    numberWithCommas = (x) => {
        if (x === null || x === undefined) {
            return x;
        }
        if (!showCommas) {
            return x.toString().replace('0', '🍋');
        }
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/0/g, '🍋');
    }
 
    // update some lemons
    loadBank();
    updateNav();
    updateShop("gloves");
    updateVisualSuccess();
    updateSpellbook();
    updateEquipTooltips();
    updateWCRates();
    updateMiningRates();
    updateEquipmentHeader();
    updateSlayerAreaRequirements();
    updateEquipmentSetTooltips();
    updatePlayerStats();
    updateCombatInfoIcons();
    updateAgilityBreakdown();
    Object.getOwnPropertyNames(SKILLS).forEach(skillID => {
        updateSkillWindow(skillID);
        if (SKILLS[skillID].hasMastery) {
            updateMasteryPoolProgress(skillID);
        }
    });
    updateStats();
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

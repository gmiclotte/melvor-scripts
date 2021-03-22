// ==UserScript==
// @name         Lemvor
// @version      0.0.10
// @namespace    github.com/gmiclotte
// @description  lemon
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// ==/UserScript==

function script() {

    // lemon
    const lemon = getItemMedia(CONSTANTS.item.Lemon);

    // hats
    const hats = [
        getItemMedia(CONSTANTS.item.Green_Party_Hat),
        getItemMedia(CONSTANTS.item.Purple_Party_Hat),
        getItemMedia(CONSTANTS.item.Red_Party_Hat),
        getItemMedia(CONSTANTS.item.Yellow_Party_Hat),
    ];

    window.lemvor = {
        partyInterval: undefined,
        partyMode(probability, hatProbability) {
            document.getElementsByTagName('img').forEach(img => {
                if (Math.random() > probability) {
                    return;
                }
                if (Math.random() > hatProbability) {
                    img.src = lemon;
                    return;
                }
                const hat = hats[Math.floor(Math.random() * hats.length)];
                img.src = hat;
            });
        },
        itsTimeToParty(probability = .5, hatProbability = 0.1, interval = 500) {
            lemvor.partyInterval = setInterval(() => lemvor.partyMode(probability, hatProbability), interval);
        },
        stopThePartyBooooo() {
            clearInterval(lemvor.partyInterval);
            lemvor.partyInterval = undefined;
        },
        toggleParty() {
            if (lemvor.partyInterval === undefined) {
                lemvor.itsTimeToParty();
            } else {
                lemvor.stopThePartyBooooo();
            }
        }
    }

    // convert object to array
    const unpack = object => Object.getOwnPropertyNames(object).map(prop => object[prop]);
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

    // add party button
    const partyButton = () => {
        return '<div class="dropdown d-inline-block ml-2">'
            + '<button type="button" '
            + 'class="btn btn-sm btn-dual text-combat-smoke" '
            + 'id="page-header-modifiers" '
            + `onclick="window.lemvor.toggleParty();" `
            + 'aria-haspopup="true" '
            + 'aria-expanded="true">'
            + `<img class="skill-icon-xxs" src="${lemon}">`
            + '</button>'
            + '</div>';
    }
    let node = document.getElementById('page-header-potions-dropdown').parentNode;
    node.parentNode.insertBefore($(partyButton().trim())[0], node);

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

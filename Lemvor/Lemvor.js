// ==UserScript==
// @name         Lemvor
// @version      0.1.5
// @namespace    github.com/gmiclotte
// @description  lemon
// @author		GMiclotte
// @include		https://melvoridle.com/*
// @include		https://*.melvoridle.com/*
// @exclude		https://melvoridle.com/index.php
// @exclude		https://*.melvoridle.com/index.php
// @exclude		https://wiki.melvoridle.com*
// @exclude		https://*.wiki.melvoridle.com*
// @inject-into page
// @noframes
// @grant		none
// ==/UserScript==

((main) => {
    const script = document.createElement('script');
    script.textContent = `try { (${main})(); } catch (e) { console.log(e); }`;
    document.body.appendChild(script).parentNode.removeChild(script);
})(() => {

    window.lemvor = {
        lemon: undefined,
        replaceLemon: undefined,
        partyInterval: undefined,
        partyMode(probability, hatProbability) {
            document.getElementsByTagName('img').forEach(img => {
                if (Math.random() > probability) {
                    return;
                }
                if (Math.random() > hatProbability) {
                    img.src = lemvor.lemon;
                    return;
                }
                const hat = lemvor.hats[Math.floor(Math.random() * lemvor.hats.length)];
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
    lemvor.makeLemon = () => [
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
        Thieving.npcs,
        Woodcutting.trees,
        // objects of objects that have media
        unpack(SKILLS),
        // objects of arrays of objects that have media
        ...unpack(MILESTONES),
        ...unpack(SHOP),
    ].forEach(list => {
        list.forEach(entry => entry.media = lemvor.lemon);
    });

    // update some lemons
    lemvor.updateLemon = () => {
        loadBank();
        updateShop("gloves");
        updateSpellbook();
        updatePlayerStats();
        updateAgilityBreakdown();
        Object.getOwnPropertyNames(SKILLS).forEach((_, skillID) => {
            updateSkillWindow(skillID);
            if (SKILLS[skillID].hasMastery) {
                updateMasteryPoolProgress(skillID);
            }
        });

        // update lemons
        document.getElementsByTagName('img').forEach(img => {
            img.src = lemvor.lemon;
        });
    }

    // add party button
    const partyButton = () => {
        return '<div class="dropdown d-inline-block ml-2">'
            + '<button type="button" '
            + 'class="btn btn-sm btn-dual text-combat-smoke" '
            + 'id="page-header-modifiers" '
            + `onclick="window.lemvor.toggleParty();" `
            + 'aria-haspopup="true" '
            + 'aria-expanded="true">'
            + `<img class="skill-icon-xxs" src="${lemvor.lemon}">`
            + '</button>'
            + '</div>';
    }

    // make 0's lemons too
    numberWithCommas = (x) => {
        if (x === null || x === undefined) {
            return x;
        }
        const replaceLemon = (x) => {
            if (lemvor.replaceLemon === true) {
                return x.replace(/0/g, '🍋');
            }
            return x;
        }
        if (!showCommas) {
            return replaceLemon(x.toString());
        }
        return replaceLemon(x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    }

    lemvor.setLemon = id => {
        lemvor.lemon = lemvor.mediaBackup[id];
        lemvor.replaceLemon = id === Items.Lemon;
        lemvor.makeLemon();
        lemvor.updateLemon();
    }

    function startLemvor() {
        lemvor.mediaBackup = items.map((_, i) => getItemMedia(i));
        // hats
        lemvor.hats = [
            getItemMedia(Items.Green_Party_Hat),
            getItemMedia(Items.Purple_Party_Hat),
            getItemMedia(Items.Red_Party_Hat),
            getItemMedia(Items.Yellow_Party_Hat),
        ];
        let node = document.getElementById('page-header-potions-dropdown').parentNode;
        node.parentNode.insertBefore($(partyButton().trim())[0], node);
        lemvor.setLemon(Items.Lemon);
    }

    function loadScript() {
        if (typeof confirmedLoaded !== typeof undefined && confirmedLoaded) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            startLemvor();
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
});

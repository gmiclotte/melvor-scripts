// ==UserScript==
// @name         Melvor Swap RC
// @version      0.0.3
// @description  Automatically changes RC runes.
// @author		 GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com*
// @noframes
// @grant        none
// @namespace    github.com/gmiclotte
// ==/UserScript==

function script() {
    window.swapRCData = {
        frequency: 100,
        counter: 100,
        limits: [
            {id: 0, name: "Air Rune", limit: 1e5},
            {id: 3, name: "Mind Rune", limit: 0},
            {id: 5, name: "Water Rune", limit: 1e5},
            {id: 9, name: "Earth Rune", limit: 1e5},
            {id: 13, name: "Mist Rune", limit: 0},
            {id: 17, name: "Fire Rune", limit: 1e5},
            {id: 20, name: "Light Rune", limit: 0},
            {id: 24, name: "Body Rune", limit: 0},
            {id: 25, name: "Dust Rune", limit: 0},
            {id: 30, name: "Mud Rune", limit: 0},
            {id: 31, name: "Chaos Rune", limit: 0},
            {id: 37, name: "Nature Rune", limit: 0},
            {id: 38, name: "Smoke Rune", limit: 0},
            {id: 47, name: "Havoc Rune", limit: 0},
            {id: 48, name: "Steam Rune", limit: 1e9},
            {id: 54, name: "Lava Rune", limit: 0},
            {id: 56, name: "Death Rune", limit: 0},
            {id: 64, name: "Blood Rune", limit: 0},
            {id: 71, name: "Spirit Rune", limit: 0},
            {id: 78, name: "Ancient Rune", limit: 0},
        ]
    }

    const swapRC = () => {
        if (offline.skill !== CONSTANTS.skill.Runecrafting) {
            return;
        }
        let minRune;
        let minAmt = Infinity;
        swapRCData.limits.forEach(x => {
            const i = x.id;
            const limit = x.limit;
            let bankID = getBankId(runecraftingItems[i].itemID);
            if (bankID === -1) {
                minRune = i;
                minAmt = 0;
            } else {
                const qty = bank[bankID].qty;
                if (qty < limit && qty < minAmt) {
                    minRune = i;
                    minAmt = qty;
                }
            }
        });
        if (minRune !== selectedRunecraft) {
            selectRunecraft(minRune);
            startRunecrafting(true);
            return true;
        }
        return false;
    };

    const startRCRef = startRunecrafting;

    startRunecrafting = (...args) => {
        if (!args[0] && swapRCData.counter >= swapRCData.frequency) {
            swapRCData.counter = 0;
            if (swapRC()) {
                return;
            }
        }
        swapRCData.counter++;
        startRCRef(...args);
    }

    ///////
    //log//
    ///////
    console.log("Melvor Swap RC");
}

(function () {
    function injectScript(main) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
    }

    function loadScript() {
        if (confirmedLoaded) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 2000);
})();

// ==UserScript==
// @name        Melvor Loot Container
// @namespace   github.com/gmiclotte
// @version     0.0.1
// @description For monster drops and pickpocketing: shows drop rates, avg drops per kill, and current number owned.
// @author      GMiclotte
// @match       https://*.melvoridle.com/*
// @exclude     https://wiki.melvoridle.com*
// @noframes
// @grant       none
// ==/UserScript==

function script() {
    let tempContainer = (id) => {
        return ''
            + '<div class="col-12 justify-content-center">'
            + `	<small id ="${id}">`
            + '	</small>'
            + '</div>';
    }
    $('#combat-pause-container').next().after(tempContainer('cb-lootContainer'))
    $('#thieving-food-container').parent().parent().parent().next().after(tempContainer('pp-lootContainer'))

    // Function to get unformatted number for Qty
    function getQtyOfItem(itemID) {
        for (let i = 0; i < bank.length; i++) {
            if (bank[i].id === itemID) {
                return bank[i].qty;
            }
        }
        return 0;
    }

    let sortedLoot = {};

    function drawEmptyLootTable(container) {
        $(`#${container}`).replaceWith(''
            + `<small id=${container}>`
            + '</small>'
        );
    }

    function drawLootTable() {
        let name;
        let container;
        let loot;
        let id;
        let hasBones = false;
        let bones = undefined;
        let lootChance = 1;
        if (npcID !== null) {
            container = 'pp-lootContainer';
            if (isGolbinRaid || isDungeon || thievingNPC[npcID] === undefined) {
                drawEmptyLootTable(container);
                return;
            }
            name = thievingNPC[npcID].name;
            loot = thievingNPC[npcID].lootTable;
            id = `pp-${npcID}`;
        } else {
            container = 'cb-lootContainer';
            if (isDungeon || MONSTERS[combatData.enemy.id] === undefined) {
                drawEmptyLootTable(container);
                return;
            }
            name = MONSTERS[combatData.enemy.id].name;
            loot = MONSTERS[combatData.enemy.id].lootTable;
            id = `cb-${combatData.enemy.id}`;
            bones = MONSTERS[combatData.enemy.id].bones;
            hasBones = bones !== undefined && bones !== null;
            if (MONSTERS[combatData.enemy.id].lootChance !== undefined) {
                lootChance = MONSTERS[combatData.enemy.id].lootChance / 100;
            }
        }

        // sort the loot if it is not cached
        if (sortedLoot[id] === undefined) {
            console.log(`sorting ${name} loot`)
            let tmp = [];
            for (let i = 0; i < loot.length; i++) {
                const q = loot[i][2] === undefined ? 1 : loot[i][2];
                const item = items[loot[i][0]];
                if (item.dropTable !== undefined) {
                    let s = item.dropTable.map(x => x[1]).reduce((acc, x) => acc + x, 0);
                    for (let j = 0; j < item.dropTable.length; j++) {
                        tmp.push({
                            itemID: item.dropTable[j][0],
                            w: loot[i][1] * item.dropTable[j][1] / s,
                            qty: q * item.dropQty[j],
                        });
                    }
                } else {
                    tmp.push({
                        itemID: loot[i][0],
                        w: loot[i][1],
                        qty: q,
                    });
                }
            }
            tmp.sort(function (a, b) {
                return b.w - a.w;
            });
            sortedLoot[id] = tmp;
        }

        // compute values
        const lootTable = sortedLoot[id];
        if (lootTable.length === 0 && !hasBones) {
            // no loot to insert, so insert an empty placeholder and return
            drawEmptyLootTable(container);
            return;
        }
        const lootSize = lootTable.map(x => x.w).reduce((acc, x) => acc + x, 0) / lootChance;
        const rate = lootTable.map(x => x.w / lootSize * 100);
        const avg = lootTable.map(x => x.w / lootSize * (1 + x.qty) / 2);
        const owned = lootTable.map(x => getQtyOfItem(x.itemID));
        const media = lootTable.map(x => items[x.itemID].media);

        // make table
        let header = '<tr>';
        header += '<th scope="col"></th>';
        if (hasBones) {
            header += `<td><img class="skill-icon-xs mr-2" src="${items[bones].media}"></td>`;
        }
        media.forEach(img => {
            header += `<td><img class="skill-icon-xs mr-2" src="${img}"></td>`;
        });
        header += '</tr>';

        let bodyRate = '<tr>';
        bodyRate += '<th scope="col">drop %</th>';
        if (hasBones) {
            bodyRate += `<td/>`;
        }
        rate.forEach(x => {
            bodyRate += `<td>${x.toFixed(2)}</td>`;
        });
        bodyRate += '</tr>';

        let bodyAvg = '';
        bodyAvg += '<tr>';
        bodyAvg += `<th scope="col">avg/${npcID === null ? "kill" : "steal"}</th>`;
        if (hasBones) {
            bodyAvg += `<td/>`;
        }
        avg.forEach(x => {
            bodyAvg += `<td>${formatNumber(1 * x.toFixed(3))}</td>`;
        });
        bodyAvg += '</tr>';

        let bodyOwned = '<tr>';
        bodyOwned += '<th scope="col">owned</th>';
        if (hasBones) {
            bodyOwned += `<td>${getQtyOfItem(bones)}</td>`;
        }
        owned.forEach(x => {
            bodyOwned += `<td>${formatNumber(x)}</td>`;
        });
        bodyOwned += '</tr>';

        // insert table
        $(`#${container}`).replaceWith(''
            + `<small id=${container}>`
            + '<table class="table table-borderless table-sm">'
            + '<thead>'
            + header
            + '</thead>'
            + '<tbody>'
            + bodyRate
            + bodyAvg
            + bodyOwned
            + '</tbody>'
            + '</table>'
            + '</small>'
        );
    }

    const loadNewEnemyRef = loadNewEnemy;
    loadNewEnemy = (...args) => {
        if (forcedEnemy !== null) {
            combatData.enemy.id = forcedEnemy;
        }
        drawLootTable();
        loadNewEnemyRef(...args);
    }

    const pickpocketRef = pickpocket;
    pickpocket = (...args) => {
        if (npcID === null) {
            npcID = args[0];
        }
        drawLootTable();
        pickpocketRef(...args);
    }

    ///////
    //log//
    ///////
    console.log("Melvor Loot Container Loaded");
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

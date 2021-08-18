// ==UserScript==
// @name		Melvor Snippets
// @namespace	http://tampermonkey.net/
// @version		0.0.1
// @description	Collection of various snippets
// @author		GMiclotte
// @match		https://*.melvoridle.com/*
// @exclude		https://wiki.melvoridle.com*
// @noframes
// @grant		none
// ==/UserScript==

function script() {
// header end

////////////////
//Mastery bars//
////////////////
setInterval(() => {
    for (const id in SKILLS) {
        if (SKILLS[id].hasMastery) {
            if ($(`#skill-nav-mastery-${id} .progress-bar`)[0]) {
                $(`#skill-nav-mastery-${id} .progress-bar`)[0].style.width =
                    (MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100 + '%';
                if (MASTERY[id].pool < getMasteryPoolTotalXP(id)) {
                    $(`#skill-nav-mastery-${id}`)[0].style.setProperty('background', 'rgb(76,80,84)', 'important');
                    $(`#skill-nav-mastery-${id} .progress-bar`)[0].className = 'progress-bar bg-warning';
                } else {
                    $(`#skill-nav-mastery-${id}`)[0].style.setProperty('background', 'rgb(48,199,141)', 'success');
                    $(`#skill-nav-mastery-${id} .progress-bar`)[0].className = 'progress-bar bg-success';
                }
                const tip = $(`#skill-nav-mastery-${id}`)[0]._tippy;
                tip.setContent((Math.min(1, MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100).toFixed(2) + '%');
            } else {
                const skillItem = $(`#skill-nav-name-${id}`)[0].parentNode;
                skillItem.style.flexWrap = 'wrap';
                skillItem.style.setProperty('padding-top', '.25rem', 'important');
                const progress = document.createElement('div');
                const progressBar = document.createElement('div');
                progress.id = `skill-nav-mastery-${id}`;
                progress.className = 'progress active pointer-enabled';
                progress.style.height = '6px';
                progress.style.width = '100%';
                progress.style.margin = '.25rem 0rem';
                if (MASTERY[id].pool < getMasteryPoolTotalXP(id)) {
                    progress.style.setProperty('background', 'rgb(76,80,84)', 'important');
                    progressBar.className = 'progress-bar bg-warning';
                } else {
                    progress.style.setProperty('background', 'rgb(48,199,141)', 'success');
                    progressBar.className = 'progress-bar bg-success';
                }
                progressBar.style.width = (MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100 + '%';
                progress.appendChild(progressBar);
                skillItem.appendChild(progress);
                tippy($(`#skill-nav-mastery-${id}`)[0], {
                    placement: 'right',
                    content: ((MASTERY[id].pool / getMasteryPoolTotalXP(id)) * 100).toFixed(2) + '%',
                });
            }
        }
    }
}, 5000);

//////////////////////////
//buy mastery level base//
//////////////////////////
window.masteryBuyer = {
    poolXpPerItem: 500000,
};
masteryBuyer.availXp = (skillID, minPercent = 95) => {
    let minPool = MASTERY[skillID].xp.length * masteryBuyer.poolXpPerItem * minPercent / 100;
    return MASTERY[skillID].pool - minPool;
}
masteryBuyer.currentBase = (skillID) => {
    return Math.min(...MASTERY[skillID].xp.map((_, masteryID) => getMasteryLevel(skillID, masteryID)));
}
masteryBuyer.maxAffordableBase = (skillID, minPercent = 95) => {
    let xp = masteryBuyer.availXp(skillID, minPercent);
    // make bins with mastery levels
    let bins = [];
    for (let i = 0; i < 100; i++) {
        bins[i] = [];
    }
    MASTERY[skillID].xp.forEach((_, masteryID) => {
        let level = getMasteryLevel(skillID, masteryID);
        bins[level].push(masteryID);
    });
    // level one at a time
    let maxBase = 0;
    bins.forEach((x, i) => {
        if (i >= 99) {
            return;
        }
        if (x.length === 0) {
            return;
        }
        let xpRequired = (exp.level_to_xp(i + 1) - exp.level_to_xp(i)) * x.length;
        xp -= xpRequired;
        if (xp >= 0) {
            maxBase = i + 1;
            x.forEach(y => bins[i + 1].push(y));
        }
    });
    maxBase = maxBase > 99 ? 99 : maxBase;
    return maxBase;
}
masteryBuyer.increaseBase = (skillID, minPercent = 95, levelCap = 99) => {
    // buy until goal
    let goal = masteryBuyer.maxAffordableBase(skillID, minPercent);
    if (goal === 0) {
        goal = masteryBuyer.currentBase(skillID);
    }
    if (goal > levelCap) {
        goal = levelCap;
    }
    MASTERY[skillID].xp.forEach((_, masteryID) => {
        let level = getMasteryLevel(skillID, masteryID);
        if (level >= goal) {
            return;
        }
        masteryPoolLevelUp = goal - level;
        levelUpMasteryWithPool(skillID, masteryID);
    });
    // spend remainder on goal + 1
    const xpRequired = exp.level_to_xp(goal + 1) - exp.level_to_xp(goal);
    let count = Math.floor(masteryBuyer.availXp(skillID, minPercent) / xpRequired);
    masteryPoolLevelUp = 1;
    MASTERY[skillID].xp.forEach((_, masteryID) => {
        if (count === 0) {
            return;
        }
        let level = getMasteryLevel(skillID, masteryID);
        if (level > goal || level >= levelCap) {
            return;
        }
        count--;
        levelUpMasteryWithPool(skillID, masteryID);
    });
    // update total mastery
    updateTotalMastery(skillID);
}
masteryBuyer.overview = (minPercent = 95) => {
    Object.getOwnPropertyNames(SKILLS).forEach(skillID => {
        const skill = SKILLS[skillID];
        if (!skill.hasMastery) {
            return;
        }
        const maxBase = masteryBuyer.maxAffordableBase(skillID, minPercent);
        if (maxBase === 0) {
            return;
        }
        const currentBase = masteryBuyer.currentBase(skillID);
        console.log(`${skill.name}: ${currentBase} -> ${maxBase}`);
    });
}
masteryBuyer.remaining = (skillID, target = 99) => {
    let xp = 0;
    let xpTarget = exp.level_to_xp(target);
    MASTERY[skillID].xp.forEach(masteryXp => {
        xp += Math.max(0, xpTarget - masteryXp);
    });
    xp = Math.round(xp)
    console.log(formatNumber(xp))
    return xp
}

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

///////////////////
//remove elements//
///////////////////
// combat
document.getElementById('offline-combat-alert').remove();

// summoning marks
// green
document.getElementById('summoning-category-0').children[0].children[0].children[2].remove();
// orange and red
document.getElementById('summoning-category-0').children[0].children[0].children[1].remove();

// summoning tablets
document.getElementById('summoning-notice').remove();

// alt. magic
document.getElementById('magic-container').children[0].children[1].remove();

// cloud saving
document.getElementById('header-cloud-save-time').remove();
document.getElementById('header-cloud-save-btn-connected').remove();

// minibar-max-cape
document.getElementById('minibar-max-cape').remove();

/////////////////
//reroll slayer//
/////////////////
window.rerollSlayerTask = (monsterIDs, tier) => {
    if (window.stopRerolling) {
        return;
    }
    const task = combatManager.slayerTask;
    const taskID = task.monster.id;
    const taskName = MONSTERS[taskID].name;
    if (!combatManager.slayerTask.active
        || !monsterIDs.includes(taskID)) {
        console.log(`rerolling ${taskName} for tier ${tier} task ${monsterIDs.map(monsterID => MONSTERS[monsterID].name).join(', ')}`);
        combatManager.slayerTask.selectTask(tier, true, true, false);
    } else if (!task.extended) {
        console.log(`extending ${taskName}`);
        combatManager.slayerTask.extendTask();
    }
    setTimeout(() => rerollSlayerTask(monsterIDs, tier), 1000);
}

//////////////////
//mining swapper//
//////////////////
window.rockOrder = [];
setInterval(() => {
    if (currentRock === null) {
        return;
    }
    for (let i = 0; i < window.rockOrder.length; i++) {
        let rock = window.rockOrder[i];
        if (miningData[rock].level > skillLevel[CONSTANTS.skill.Mining]) {
            continue;
        }
        if (!rockData[rock].depleted) {
            if (currentRock === rock) {
                return;
            } else {
                console.log("start mining " + rock);
                mineRock(rock);
                return;
            }
        }
    }
}, 1000);

///////////////
//shards used//
///////////////
// compute amount of gp spent on summoning shards that have been used (for summoning or agility obstacles)
items.map((x, i) => [x, i])
    .filter(x => x[0].type === 'Shard' && x[0].category === 'Summoning')
    .map(x => x[1])
    .map(x => (itemStats[x].stats[0] - getBankQty(x) - itemStats[x].stats[1]) * items[x].buysFor)
    .reduce((a, b) => a + b, 0);

/////////////////////
//Show Fish Cooking//
/////////////////////
// make cookable array and sort it based on cooking milestone index
const cookable = items.filter(x => x.cookingID !== undefined);
cookable.forEach((x, i) => {
    for (let j = 0; j < MILESTONES.Cooking.length; j++) {
        const ms = MILESTONES.Cooking[j];
        if (ms.name === x.name) {
            cookable[i].msId = j;
            return;
        }
    }
});
cookable.sort((a, b) => a.msId - b.msId);
// set to true to show raw foods with 0 amount banked
let showAllRaws = true;
// override updateAvailableFood
updateAvailableFood = () => {
    $("#cooking-food-dropdown").html("");
    let selectedFoodExists = 0;
    cookable.forEach(raw => {
        let onClick = 'void(0)';
        let required = `<div className="font-size-sm"><small>Level ${raw.cookingLevel} Required</small></div>`
        if (skillLevel[3] >= raw.cookingLevel) {
            onClick = `selectFood(${raw.id})`;
            required = '';
        }
        const bankId = getBankId(raw.id);
        const qty = bankId === -1 ? 0 : bank[bankId].qty;
        if (!showAllRaws && qty === 0) {
            return;
        }
        $("#cooking-food-dropdown").append(''
            + `<a class="dropdown-item pointer-enabled" id="skill-cooking-food-${raw.msId}" onClick="${onClick}">`
            + '  <div class="media d-flex align-items-center push mb-0">'
            // img
            + '    <div class="mr-2">'
            + '      <img class="skill-icon-sm" src="' + raw.media + '">'
            + '    </div>'
            + '    <div class="media-body">'
            // name
            + '      <div class="font-w600 font-size-sm">'
            + raw.name
            + '      </div>'
            // required level
            + required
            // qty
            + '      <div class="font-w600 font-size-sm">'
            + '        <span class="badge badge-pill badge-primary">'
            + formatNumber(qty)
            + '        </span>'
            + '      </div>'
            // xp and healing
            + '      <div class="font-size-sm text-info">'
            + '        <small>'
            + `${raw.cookingXP} XP`
            + '        </small>'
            + '        <small class="text-success ml-2">'
            + '          <img class="skill-icon-xxs mr-1" src="https://melvorcdn.fra1.cdn.digitaloceanspaces.com/current/assets/media/skills/combat/hitpoints.svg">'
            + `${items[raw.cookedItemID].healsFor * numberMultiplier} HP`
            + '        </small>'
            + '      </div>'
            + '    </div>'
            + '  </div>'
            + '</a>'
        );
        if (selectedFood === raw.id) {
            $("#skill-cooking-food-selected-qty").text(formatNumber(qty));
            selectedFoodExists++;
        }
    });
    if (selectedFoodExists < 1) {
        $("#skill-cooking-food-selected-qty").text(0);
    }
}

/////////////////////
//don't cap pool xp//
/////////////////////
eval(addMasteryXPToPool.toString()
    .replace('MASTERY[skill].pool>getMasteryPoolTotalXP(skill)', 'false')
    .replace(/^function (\w+)/, "window.$1 = function")
);

////////////////////////////
//don't cap token claiming//
////////////////////////////
eval(claimToken.toString()
    .replace('qty>=tokensToFillPool', 'false')
    .replace(/^function (\w+)/, "window.$1 = function")
);

/////////////////////
//unsell sold items//
/////////////////////
unsell = (id, count = Infinity) => {
    if (count < 0) {
        return;
    }
    let stats = itemStats[id].stats;
    if (stats[Stats.TimesSold] === 0) {
        console.log("zero times sold");
        return;
    }
    // check if transaction is affordable
    let times = Math.min(count, stats[Stats.TimesSold]);
    let cost = Math.ceil(stats[Stats.GpFromSale] / stats[Stats.TimesSold] * times);
    if (gp < cost) {
        console.log("can't afford: " + times + " costs " + cost + " have " + gp);
        return;
    }
    // add item
    if (times > 0) {
        addItemToBank(id, times);
    }
    stats[Stats.TimesFound] -= times;
    stats[Stats.TimesSold] -= times;
    // remove cost
    gp = Math.floor(gp - cost);
    stats[Stats.GpFromSale] -= cost;
    updateGP();
    // fix statistics
    statsGeneral[0].count -= cost;
    statsGeneral[1].count -= times;
    updateStats();
    // log transaction
    console.log("bought " + times + " for " + cost);
}

// footer start
}

// inject the script
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
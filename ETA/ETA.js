// ==UserScript==
// @name		Melvor ETA
// @namespace	http://tampermonkey.net/
// @version		0.8.5-1.0
// @description	Shows xp/h and mastery xp/h, and the time remaining until certain targets are reached. Takes into account Mastery Levels and other bonuses.
// @description	Please report issues on https://github.com/gmiclotte/melvor-scripts/issues or message TinyCoyote#1769 on Discord
// @description	The last part of the version number is the most recent version of Melvor that was tested with this script. More recent versions might break the script.
// @description	Forked from Breindahl#2660's Melvor TimeRemaining script v0.6.2.2., originally developed by Breindahl#2660, Xhaf#6478 and Visua#9999
// @author		GMiclotte
// @match		https://*.melvoridle.com/*
// @exclude		https://wiki.melvoridle.com*
// @exclude		https://*.melvoridle.com/index.php
// @noframes
// @grant		none
// ==/UserScript==

function script() {
    if (window.ETA !== undefined) {
        console.error('ETA is already loaded!');
    } else {
        createETASettings();
        createETA();
        loadETA();
    }

    function createETASettings() {
        // settings can be changed from the console, the default values here will be overwritten by the values in localStorage['ETASettings']
        window.ETASettings = {
            /*
                toggles
             */
            // true for 12h clock (AM/PM), false for 24h clock
            IS_12H_CLOCK: false,
            // true for short clock `xxhxxmxxs`, false for long clock `xx hours, xx minutes and xx seconds`
            IS_SHORT_CLOCK: true,
            // true for alternative main display with xp/h, mastery xp/h and action count
            SHOW_XP_RATE: true,
            // true to show action times
            SHOW_ACTION_TIME: false,
            // true to allow final pool percentage > 100%
            UNCAP_POOL: true,
            // true will show the current xp/h and mastery xp/h; false shows average if using all resources
            // does not affect anything if SHOW_XP_RATE is false
            CURRENT_RATES: true,
            // set to true to include mastery tokens in time until 100% pool
            USE_TOKENS: false,
            // set to true to show partial level progress in the ETA tooltips
            SHOW_PARTIAL_LEVELS: false,
            // set to true to hide the required resources in the ETA tooltips
            HIDE_REQUIRED: false,
            // set to true to include "potential" Summoning exp from created tablets
            USE_TABLETS: false,
            // set to true to play a sound when we run out of resources or reach a target
            DING_RESOURCES: true,
            DING_LEVEL: true,
            DING_MASTERY: true,
            DING_POOL: true,
            // change the ding sound level
            DING_VOLUME: 0.1,
            /*
                targets
             */
            // Default global target level / mastery / pool% is 99 / 99 / 100
            GLOBAL_TARGET_LEVEL: 99,
            GLOBAL_TARGET_MASTERY: 99,
            GLOBAL_TARGET_POOL: 100,
            // skill specific targets can be defined here, these override the global targets
            TARGET_LEVEL: {
                // [CONSTANTS.skill.Firemaking]: 120,
            },
            TARGET_MASTERY: {
                // [CONSTANTS.skill.Herblore]: 90,
            },
            TARGET_POOL: {
                // [CONSTANTS.skill.Crafting]: 25,
            },
            // returns the appropriate target
            getNext: (current, list) => {
                if (list === undefined) {
                    return list
                }
                if (list.length !== undefined) {
                    for (let i = 0; i < list.length; i++) {
                        if (list[i] > current) {
                            return list[i];
                        }
                    }
                    return Math.max(list);
                }
                return list;
            },
            getTarget: (current, global, specific, defaultTarget, maxTarget) => {
                if (current !== null) {
                    global = ETASettings.getNext(current, global);
                    specific = ETASettings.getNext(current, specific);
                }
                let target = defaultTarget;
                if (Number.isInteger(global)) {
                    target = global;
                }
                if (Number.isInteger(specific)) {
                    target = specific;
                }
                if (target <= 0) {
                    target = defaultTarget;
                }
                if (target >= maxTarget) {
                    target = maxTarget;
                }
                return Math.ceil(target);
            },
            getTargetLevel: (skillID, currentLevel) => {
                return ETASettings.getTarget(currentLevel, ETASettings.GLOBAL_TARGET_LEVEL, ETASettings.TARGET_LEVEL[skillID], 99, 200);
            },
            getTargetMastery: (skillID, currentMastery) => {
                return ETASettings.getTarget(currentMastery, ETASettings.GLOBAL_TARGET_MASTERY, ETASettings.TARGET_MASTERY[skillID], 99, 200);
            },
            getTargetPool: (skillID, currentPool) => {
                return ETASettings.getTarget(currentPool, ETASettings.GLOBAL_TARGET_POOL, ETASettings.TARGET_POOL[skillID], 100, 100);
            },

            /*
                methods
             */
            // save settings to local storage
            save: () => {
                window.localStorage['ETASettings'] = window.JSON.stringify(window.ETASettings);
            }
        };
    }

    function createETA() {
        // global object
        window.ETA = {};

        ETA.log = function (...args) {
            console.log("Melvor ETA:", ...args)
        }

        ETA.createSettingsMenu = () => {
            // check if combat sim methods are available
            if (window.MICSR === undefined || MICSR.TabCard === undefined) {
                ETA.menuCreationAttempts = (ETA.menuCreationAttempts || 0) + 1;
                if (ETA.menuCreationAttempts > 10) {
                    ETA.log('Failed to add settings menu! Melvor ETA will work fine without it. '
                        + 'Install the "Melvor Idle Combat Simulator Reloaded" extension to use the settings interface.');
                    ETA.log('Find it here: https://github.com/visua0/Melvor-Idle-Combat-Simulator-Reloaded');
                } else {
                    // try again in 50 ms
                    setTimeout(ETA.createSettingsMenu, 50);
                }
                return;
            }

            // set names
            ETA.modalID = 'etaModal';
            ETA.menuItemID = 'etaButton';

            // clean up in case elements already exist
            MICSR.destroyMenu(ETA.menuItemID, ETA.modalID);

            // create wrapper
            ETA.content = document.createElement('div');
            ETA.content.className = 'mcsTabContent';

            // add toggles card
            ETA.addToggles();

            // add global target card
            ETA.addGlobalTargetInputs();

            // add target card
            ETA.addTargetInputs();

            // create modal and access point
            ETA.modal = MICSR.addModal('ETA Settings', ETA.modalID, [ETA.content]);
            let style = document.createElement("style");
            document.head.appendChild(style);
            let sheet = style.sheet;
            sheet.insertRule('#etaModal.show { display: flex !important; }')
            sheet.insertRule('#etaModal .modal-dialog { max-width: 95%; display: inline-block; }')
            MICSR.addMenuItem('ETA Settings', 'assets/media/main/settings_header.svg', ETA.menuItemID, ETA.modalID);

            // log
            ETA.log('added settings menu!')
        }

        ETA.addToggles = () => {
            ETA.togglesCard = new MICSR.Card(ETA.content, '', '150px', true);
            const titles = {
                IS_12H_CLOCK: 'Use 12h clock',
                IS_SHORT_CLOCK: 'Use short time format',
                SHOW_XP_RATE: 'Show XP rates',
                SHOW_ACTION_TIME: 'Show action times',
                UNCAP_POOL: 'Show pool past 100%',
                CURRENT_RATES: 'Show current rates',
                USE_TOKENS: '"Use" Mastery tokens for final Pool %',
                SHOW_PARTIAL_LEVELS: 'Show partial levels',
                HIDE_REQUIRED: 'Hide required resources',
                DING_RESOURCES: 'Ding when out of resources',
                DING_LEVEL: 'Ding on level target',
                DING_MASTERY: 'Ding on mastery target',
                DING_POOL: 'Ding on pool target',
                USE_TABLETS: '"Use" all created Summoning Tablets',
            };
            Object.getOwnPropertyNames(titles).forEach(property => {
                const title = titles[property];
                ETA.togglesCard.addToggleRadio(
                    title,
                    property,
                    ETASettings,
                    property,
                    ETASettings[property],
                );
            });
        }

        ETA.addGlobalTargetInputs = () => {
            ETA.globalTargetsCard = new MICSR.Card(ETA.content, '', '150px', true);
            [
                {id: 'LEVEL', label: 'Global level targets', defaultValue: [99]},
                {id: 'MASTERY', label: 'Global mastery targets', defaultValue: [99]},
                {id: 'POOL', label: 'Global pool targets (%)', defaultValue: [100]},
            ].forEach(target => {
                const globalKey = 'GLOBAL_TARGET_' + target.id;
                ETA.globalTargetsCard.addNumberArrayInput(
                    target.label,
                    ETASettings,
                    globalKey,
                    target.defaultValue
                );
            });

        }

        ETA.addTargetInputs = () => {
            ETA.skillTargetCard = new MICSR.TabCard('EtaTarget', true, ETA.content, '', '150px', true);
            [
                CONSTANTS.skill.Woodcutting,
                CONSTANTS.skill.Fishing,
                CONSTANTS.skill.Firemaking,
                CONSTANTS.skill.Cooking,
                CONSTANTS.skill.Mining,
                CONSTANTS.skill.Smithing,
                CONSTANTS.skill.Thieving,
                CONSTANTS.skill.Fletching,
                CONSTANTS.skill.Crafting,
                CONSTANTS.skill.Runecrafting,
                CONSTANTS.skill.Herblore,
                CONSTANTS.skill.Agility,
                CONSTANTS.skill.Summoning,
                CONSTANTS.skill.Astrology,
                CONSTANTS.skill.Magic,
            ].forEach(i => {
                const card = ETA.skillTargetCard.addTab(SKILLS[i].name, SKILLS[i].media, '', '150px', false);
                card.addSectionTitle(SKILLS[i].name + ' Targets');
                [
                    {id: 'LEVEL', label: 'Level targets'},
                    {id: 'MASTERY', label: 'Mastery targets'},
                    {id: 'POOL', label: 'Pool targets (%)'},
                ].forEach(target => {
                    const key = 'TARGET_' + target.id;
                    card.addNumberArrayInput(
                        target.label,
                        ETASettings[key],
                        i,
                    );
                });
            });
        }

        ////////
        //ding//
        ////////
        // Function to check if task is complete
        ETA.taskComplete = function () {
            const last = ETA.timeLeftLast;
            const current = ETA.timeLeftCurrent;
            if (last === undefined) {
                return;
            }
            if (last.skillID !== current.skillID) {
                // started a different skill, don't ding
                return;
            }
            if (last.action !== current.action) {
                // started a different action, don't ding
                return;
            }
            if (last.times.length !== current.times.length) {
                // ding settings were changed, don't ding
                return;
            }
            // ding if any targets were reached
            for (let i = 0; i < last.times.length; i++) {
                const lastTime = last.times[i];
                const currentTime = current.times[i];
                if (lastTime.current >= lastTime.target) {
                    // target already reached
                    continue;
                }
                if (currentTime.current >= lastTime.target) { // current level is higher than previous target
                    notifyPlayer(last.skillID, currentTime.msg, "danger");
                    ETA.log(currentTime.msg);
                    let ding = new Audio("https://www.myinstants.com/media/sounds/ding-sound-effect.mp3");
                    ding.volume = ETASettings.DING_VOLUME;
                    ding.play();
                    return;
                }
            }
        }

        ETA.time = (ding, target, current, msg) => {
            return {ding: ding, target: target, current: current, msg: msg};
        };

        ETA.setTimeLeft = function (initial, times) {
            // save previous
            ETA.timeLeftLast = ETA.timeLeftCurrent;
            // set current
            ETA.timeLeftCurrent = {
                skillID: initial.skillID,
                action: initial.currentAction.toString(),
                times: times.filter(x => x.ding),
            }
        }


        //////////////
        //containers//
        //////////////

        const html2Node = (html) => {
            html = html.trim(); // Never return a text node of whitespace as the result
            return $(html)[0];
            // var template = document.createElement('template');
            // template.innerHTML = html;
            // return template.content.firstChild;
        }

        const tempContainer = (id) => {
            return html2Node(''
                + '<div class="font-size-base font-w600 text-center text-muted">'
                + `	<small id ="${id}" class="mb-2" style="display:block;clear:both;white-space:pre-line" data-toggle="tooltip" data-placement="top" data-html="true" title="" data-original-title="">`
                + '	</small>'
                + `	<small id ="${id}" class="mb-2" style="display:block;clear:both;white-space:pre-line">`
                + `<div id="${id + '-YouHave'}"/>`
                + '	</small>'
                + '</div>');
        }

        ETA.makeProcessingDisplays = function () {
            // smithing
            let node = document.querySelector('[aria-labelledBy=Smithing-artisan-menu-recipe-select]').parentElement.parentElement.parentElement;
            node.parentNode.insertBefore(tempContainer('timeLeftSmithing'), node.nextSibling);
            // fletching
            node = document.querySelector('[aria-labelledBy=Fletching-artisan-menu-recipe-select]').parentElement.parentElement.parentElement;
            node.parentNode.insertBefore(tempContainer('timeLeftFletching'), node.nextSibling);
            // Runecrafting
            node = document.querySelector('[aria-labelledBy=Runecrafting-artisan-menu-recipe-select]').parentElement.parentElement.parentElement;
            node.parentNode.insertBefore(tempContainer('timeLeftRunecrafting'), node.nextSibling);
            // Crafting
            node = document.querySelector('[aria-labelledBy=Crafting-artisan-menu-recipe-select]').parentElement.parentElement.parentElement;
            node.parentNode.insertBefore(tempContainer('timeLeftCrafting'), node.nextSibling);
            // Herblore
            node = document.querySelector('[aria-labelledBy=Herblore-artisan-menu-recipe-select]').parentElement.parentElement.parentElement;
            node.parentNode.insertBefore(tempContainer('timeLeftHerblore'), node.nextSibling);
            // Cooking
            for (let i = 0; i < 3; i++) {
                node = document.getElementById(`cooking-menu-container`).children[i].firstChild.firstChild.firstChild.firstChild.children[4];
                const newChild = html2Node(`<div class="col-12"/>`)
                newChild.appendChild(tempContainer(`timeLeftCooking-${i}`));
                node.parentNode.appendChild(newChild);
            }
            // Firemaking
            node = document.getElementById('skill-fm-logs-selected-qty');
            node = node.parentNode.parentNode.parentNode;
            node.parentNode.insertBefore(tempContainer('timeLeftFiremaking'), node.nextSibling);
            // Alt. Magic
            node = document.getElementById('magic-item-have-and-div');
            node.parentNode.insertBefore(tempContainer('timeLeftMagic'), node.nextSibling);
            // Summoning
            node = document.querySelector('[aria-labelledBy=Summoning-artisan-menu-recipe-select]').parentElement.parentElement.parentElement
            if (node) {
                node.parentNode.insertBefore(tempContainer('timeLeftSummoning'), node.nextSibling);
            }
        }

        ETA.makeMiningDisplay = function () {
            Mining.rockData.forEach((_, i) => {
                const node = document.getElementById(`mining-ores-container`).children[i].childNodes[1].childNodes[1].childNodes[1].children[7];
                node.parentNode.insertBefore(tempContainer(`timeLeftMining-${(10 + i) % 11}`), node);
            });
        }

        ETA.makeThievingDisplay = function () {
            Thieving.npcs.forEach(npc => {
                document.getElementById(`mastery-screen-skill-10-${npc.id}`)
                    .parentElement
                    .parentElement
                    .parentElement
                    .parentElement
                    .parentElement
                    .parentElement
                    .children[0]
                    .appendChild(tempContainer(`timeLeftThieving-${npc.id}`));
            });
        }

        ETA.makeWoodcuttingDisplay = function () {
            trees.forEach((_, i) => {
                const node = document.getElementById(`cut-tree-${i}-progress`).parentNode;
                node.parentNode.insertBefore(tempContainer(`timeLeftWoodcutting-${i}`), node.nextSibling);
            });
            const node = document.getElementById('skill-woodcutting-multitree').parentNode;
            node.parentNode.insertBefore(tempContainer('timeLeftWoodcutting-Secondary'), node.nextSibling);
        }

        ETA.makeFishingDisplay = function () {
            fishingAreas.forEach((_, i) => {
                const node = document.getElementById(`fishing-area-${i}-selected-fish-xp`);
                node.parentNode.insertBefore(tempContainer(`timeLeftFishing-${i}`), node.nextSibling);
            });
        }

        ETA.makeAgilityDisplay = function () {
            chosenAgilityObstacles.forEach(i => {
                if (i === -1) {
                    return;
                }
                if (document.getElementById(`timeLeftAgility-${i}`)) {
                    // element already exists
                    return;
                }
                let node = document.getElementById(`agility-obstacle-${i}`);
                node = node.children[0].children[0].children[0];
                node.insertBefore(tempContainer(`timeLeftAgility-${i}`), node.children[3]);
            });
            if (document.getElementById('timeLeftAgility-Secondary')) {
                // element already exists
                return;
            }
            document.getElementById('agility-breakdown-items').appendChild(tempContainer('timeLeftAgility-Secondary'));
        }

        ETA.makeAstrologyDisplay = function () {
            ASTROLOGY.forEach((_, i) => {
                const node = document.getElementById(`astrology-buttons-${i}`);
                const wrapper = html2Node('<div class="col-12"></div>');
                node.parentNode.insertBefore(wrapper, node);
                wrapper.appendChild(tempContainer(`timeLeftAstrology-${i}`));
            });
        }

        ////////////////
        //main wrapper//
        ////////////////

        ETA.timeRemainingWrapper = function (skillID, checkTaskComplete) {
            // check if valid state
            switch (skillID) {
                case CONSTANTS.skill.Firemaking:
                    if (game.firemaking.selectedRecipeID === -1) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Smithing:
                    if (selectedSmith === null) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Fletching:
                    if (selectedFletch === null) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Crafting:
                    if (selectedCraft === null) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Runecrafting:
                    if (selectedRunecraft === null) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Magic:
                    if (selectedAltMagic === -1) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Herblore:
                    if (selectedHerblore === null) {
                        return;
                    }
                    break;
                case CONSTANTS.skill.Summoning:
                    if (selectedSummon === null) {
                        return;
                    }
                    break;
            }
            // populate the main `time remaining` variables
            if (isGathering(skillID)) {
                gatheringWrapper(skillID, checkTaskComplete);
            } else {
                productionWrapper(skillID, checkTaskComplete);
            }
        }

        function gatheringWrapper(skillID, checkTaskComplete) {
            let data = [];
            // gathering skills
            switch (skillID) {
                case CONSTANTS.skill.Mining:
                    data = Mining.rockData;
                    break;

                case CONSTANTS.skill.Thieving:
                    data = Thieving.npcs;
                    break;

                case CONSTANTS.skill.Woodcutting:
                    data = trees;
                    break;

                case CONSTANTS.skill.Fishing:
                    data = fishingAreas;
                    break;

                case CONSTANTS.skill.Agility:
                    data = [];
                    // only keep active chosen obstacles
                    for (const x of chosenAgilityObstacles) {
                        if (x >= 0) {
                            data.push(x);
                        } else {
                            break;
                        }
                    }
                    break;
                case CONSTANTS.skill.Astrology:
                    data = ASTROLOGY;
                    break;
            }
            if (data.length > 0) {
                if (skillID !== CONSTANTS.skill.Agility) {
                    data.forEach((x, i) => {
                        if (skillID === CONSTANTS.skill.Woodcutting && currentlyCutting === 2 && currentTrees.includes(i)) {
                            return;
                        }
                        let initial = initialVariables(skillID, checkTaskComplete);
                        if (initial.skillID === CONSTANTS.skill.Fishing) {
                            initial.fishID = selectedFish[i];
                            if (initial.fishID === null) {
                                return;
                            }
                        }
                        initial.currentAction = i;
                        if (initial.skillID === CONSTANTS.skill.Agility) {
                            initial.currentAction = x;
                            initial.agilityObstacles = data;
                        }
                        asyncTimeRemaining(initial);
                    });
                }
                if (skillID === CONSTANTS.skill.Woodcutting) {
                    if (currentlyCutting === 2) {
                        // init first tree
                        let initial = initialVariables(skillID, checkTaskComplete);
                        initial.currentAction = currentTrees;
                        initial.multiple = ETA.PARALLEL;
                        // run time remaining
                        asyncTimeRemaining(initial);
                    } else {
                        // wipe the display, there's no way of knowing which tree is being cut
                        document.getElementById(`timeLeft${Skills[skillID]}-Secondary`).textContent = '';
                    }
                }
                if (skillID === CONSTANTS.skill.Agility) {
                    // init first tree
                    let initial = initialVariables(skillID, checkTaskComplete);
                    initial.currentAction = data;
                    initial.agilityObstacles = data;
                    initial.multiple = ETA.SEQUENTIAL;
                    // run time remaining
                    asyncTimeRemaining(initial);
                }
            }
        }

        function productionWrapper(skillID, checkTaskComplete) {
            // production skills
            let initial = initialVariables(skillID, checkTaskComplete);
            switch (initial.skillID) {
                case CONSTANTS.skill.Smithing:
                    initial.currentAction = selectedSmith;
                    break;
                case CONSTANTS.skill.Fletching:
                    initial.currentAction = selectedFletch;
                    break;
                case CONSTANTS.skill.Runecrafting:
                    initial.currentAction = selectedRunecraft;
                    break;
                case CONSTANTS.skill.Crafting:
                    initial.currentAction = selectedCraft;
                    break;
                case CONSTANTS.skill.Herblore:
                    initial.currentAction = selectedHerblore;
                    break;
                case CONSTANTS.skill.Cooking:
                    initial.data = selectedCookingRecipe;
                    break;
                case CONSTANTS.skill.Firemaking:
                    initial.currentAction = game.firemaking.selectedRecipeID;
                    break;
                case CONSTANTS.skill.Magic:
                    initial.currentAction = selectedAltMagic;
                    break;
                case CONSTANTS.skill.Summoning:
                    initial.currentAction = selectedSummon;
            }
            if (initial.currentAction === undefined && initial.data === undefined) {
                return;
            }
            if (initial.data === undefined) {
                asyncTimeRemaining(initial);
                return;
            }
            initial.data.forEach((x, i) => {
                if (x === -1) {
                    return;
                }
                let initial = initialVariables(skillID, checkTaskComplete);
                initial.currentAction = x;
                initial.cookingCategory = i;
                asyncTimeRemaining(initial);
            });
        }

        function asyncTimeRemaining(initial) {
            setTimeout(
                function () {
                    timeRemaining(initial);
                },
                0,
            );
        }

        ////////////////////
        //internal methods//
        ////////////////////
        // Function to get unformatted number for Qty
        function getQtyOfItem(itemID) {
            if (itemID === -4) {
                return gp;
            }
            if (itemID === -5) {
                return player.slayercoins;
            }
            const bankID = getBankId(itemID);
            if (bankID === -1) {
                return 0;
            }
            return bank[bankID].qty;
        }

        // help function for time display
        function appendName(t, name, isShortClock) {
            if (t === 0) {
                return "";
            }
            if (isShortClock) {
                return t + name[0];
            }
            let result = t + " " + name;
            if (t === 1) {
                return result;
            }
            return result + "s";
        }

        // Convert milliseconds to hours/minutes/seconds and format them
        function msToHms(ms, isShortClock = ETASettings.IS_SHORT_CLOCK) {
            let seconds = Number(ms / 1000);
            // split seconds in days, hours, minutes and seconds
            let d = Math.floor(seconds / 86400)
            let h = Math.floor(seconds % 86400 / 3600);
            let m = Math.floor(seconds % 3600 / 60);
            let s = Math.floor(seconds % 60);
            // no comma in short form
            // ` and ` if hours and minutes or hours and seconds
            // `, ` if hours and minutes and seconds
            let dDisplayComma = " ";
            if (!isShortClock && d > 0) {
                let count = (h > 0) + (m > 0) + (s > 0);
                if (count === 1) {
                    dDisplayComma = " and ";
                } else if (count > 1) {
                    dDisplayComma = ", ";
                }
            }
            let hDisplayComma = " ";
            if (!isShortClock && h > 0) {
                let count = (m > 0) + (s > 0);
                if (count === 1) {
                    hDisplayComma = " and ";
                } else if (count > 1) {
                    hDisplayComma = ", ";
                }
            }
            // no comma in short form
            // ` and ` if minutes and seconds
            let mDisplayComma = " ";
            if (!isShortClock && m > 0) {
                if (s > 0) {
                    mDisplayComma = " and ";
                }
            }
            // append h/hour/hours etc depending on isShortClock, then concat and return
            return appendName(d, "day", isShortClock) + dDisplayComma
                + appendName(h, "hour", isShortClock) + hDisplayComma
                + appendName(m, "minute", isShortClock) + mDisplayComma
                + appendName(s, "second", isShortClock);
        }

        // Add seconds to date
        function addMSToDate(date, ms) {
            return new Date(date.getTime() + ms);
        }

        // Format date 24 hour clock
        function dateFormat(now, then, is12h = ETASettings.IS_12H_CLOCK) {
            let format = {weekday: "short", month: "short", day: "numeric"};
            let date = then.toLocaleString(undefined, format);
            if (date === now.toLocaleString(undefined, format)) {
                date = "";
            } else {
                date += " at ";
            }
            let hours = then.getHours();
            let minutes = then.getMinutes();
            // convert to 12h clock if required
            let amOrPm = '';
            if (is12h) {
                amOrPm = hours >= 12 ? 'pm' : 'am';
                hours = (hours % 12) || 12;
            } else {
                // only pad 24h clock hours
                hours = hours < 10 ? '0' + hours : hours;
            }
            // pad minutes
            minutes = minutes < 10 ? '0' + minutes : minutes;
            // concat and return remaining time
            return date + hours + ':' + minutes + amOrPm;
        }

        // Convert level to Xp needed to reach that level
        function convertLvlToXp(level) {
            if (level === Infinity) {
                return Infinity;
            }
            let xp = 0;
            if (level === 1) {
                return xp;
            }
            xp = ETA.lvlToXp[level] + 1;
            return xp;
        }

        // binary search for optimization
        function binarySearch(array, pred) {
            let lo = -1, hi = array.length;
            while (1 + lo < hi) {
                const mi = lo + ((hi - lo) >> 1);
                if (pred(array[mi])) {
                    hi = mi;
                } else {
                    lo = mi;
                }
            }
            return hi;
        }

        // Convert Xp value to level
        function convertXpToLvl(xp, noCap = false) {
            let level = binarySearch(ETA.lvlToXp, (t) => (xp <= t)) - 1;
            if (level < 1) {
                level = 1;
            } else if (!noCap && level > 99) {
                level = 99;
            }
            return level;
        }

        // Get Mastery Level of given Skill and Mastery ID
        function getMasteryLevel(skill, masteryID) {
            return convertXpToLvl(MASTERY[skill].xp[masteryID]);
        }

        // Progress in current level
        function getPercentageInLevel(currentXp, finalXp, type, bar = false) {
            let currentLevel = convertXpToLvl(currentXp, true);
            if (currentLevel >= 99 && (type === "mastery" || bar === true)) return 0;
            let currentLevelXp = convertLvlToXp(currentLevel);
            let nextLevelXp = convertLvlToXp(currentLevel + 1);
            let diffLevelXp = nextLevelXp - currentLevelXp;
            let currentLevelPercentage = (currentXp - currentLevelXp) / diffLevelXp * 100;
            if (bar === true) {
                let finalLevelPercentage = ((finalXp - currentXp) > (nextLevelXp - currentXp)) ? 100 - currentLevelPercentage : ((finalXp - currentXp) / diffLevelXp * 100).toFixed(4);
                return finalLevelPercentage;
            } else {
                return currentLevelPercentage;
            }
        }

        //Return the preservation for any mastery and pool
        masteryPreservation = (initial, masteryXp, poolXp) => {
            if (!initial.hasMastery) {
                return 0;
            }
            const masteryLevel = convertXpToLvl(masteryXp);
            const itemID = initial.actions[0].itemID;
            // modifiers and base rhaelyx
            let preservationChance = initial.staticPreservation;
            // skill specific bonuses
            switch (initial.skillID) {
                case CONSTANTS.skill.Cooking:
                    if (poolReached(initial, poolXp, 2)) {
                        preservationChance += 10;
                    }
                    break;
                case CONSTANTS.skill.Smithing:
                    if (masteryLevel >= 99) {
                        preservationChance += 30;
                    } else if (masteryLevel >= 80) {
                        preservationChance += 20;
                    } else if (masteryLevel >= 60) {
                        preservationChance += 15;
                    } else if (masteryLevel >= 40) {
                        preservationChance += 10;
                    } else if (masteryLevel >= 20) {
                        preservationChance += 5;
                    }
                    if (poolReached(initial, poolXp, 1)) {
                        preservationChance += 5;
                    }
                    if (poolReached(initial, poolXp, 2)) {
                        preservationChance += 5;
                    }
                    if (items[itemID].tier === "dragon") {
                        preservationChance += player.modifiers.summoningSynergy_5_17;
                    }
                    break;
                case CONSTANTS.skill.Fletching:
                    preservationChance += 0.2 * masteryLevel - 0.2;
                    if (masteryLevel >= 99) {
                        preservationChance += 5;
                    }
                    break;
                case CONSTANTS.skill.Crafting:
                    preservationChance += 0.2 * masteryLevel - 0.2;
                    if (masteryLevel >= 99) {
                        preservationChance += 5;
                    }
                    if (poolReached(initial, poolXp, 1)) {
                        preservationChance += 5;
                    }
                    if (craftingJewelleryIDs.includes(itemID)) {
                        preservationChance += player.modifiers.summoningSynergy_16_17;
                    }
                    break;
                case CONSTANTS.skill.Runecrafting:
                    if (items[itemID].type === "Rune") {
                        preservationChance += player.modifiers.increasedRunecraftingEssencePreservation;
                    }
                    if (items[itemID].type === "Magic Staff") {
                        preservationChance += player.modifiers.summoningSynergy_3_10;
                    }
                    if (poolReached(initial, poolXp, 2)) {
                        preservationChance += 10;
                    }
                    break;
                case CONSTANTS.skill.Herblore:
                    preservationChance += 0.2 * masteryLevel - 0.2;
                    if (masteryLevel >= 99) preservationChance += 5;
                    if (poolReached(initial, poolXp, 2)) {
                        preservationChance += 5;
                    }
                    break;
                case CONSTANTS.skill.Summoning:
                    if (poolReached(initial, poolXp, 2)) {
                        preservationChance += 10;
                    }
                    break;
            }
            // rhaelyx is handled outside of this function

            // cap preservation to ub 80%
            if (preservationChance > 80) {
                preservationChance = 80;
            }
            // don't cap preservation to lb 0% at this point, still need to add charge stones
            return preservationChance;
        }

        function poolReached(initial, poolXp, idx) {
            if (initial.completionCape) {
                return true;
            }
            return poolXp >= initial.poolLim[idx];
        }

        // Adjust interval based on unlocked bonuses
        function intervalAdjustment(initial, poolXp, masteryXp, skillInterval) {
            let flatReduction = initial.flatIntervalReduction;
            let percentReduction = initial.percentIntervalReduction;
            let adjustedInterval = skillInterval;
            // compute mastery or pool dependent modifiers
            switch (initial.skillID) {
                case CONSTANTS.skill.Woodcutting:
                    if (convertXpToLvl(masteryXp) >= 99) {
                        flatReduction += 200;
                    }
                    break;
                case CONSTANTS.skill.Firemaking:
                    if (poolReached(initial, poolXp, 1)) {
                        percentReduction += 10;
                    }
                    percentReduction += convertXpToLvl(masteryXp) * 0.1;
                    break;
                case CONSTANTS.skill.Mining:
                    if (poolReached(initial, poolXp, 2)) {
                        flatReduction += 200;
                    }
                    break;
                case CONSTANTS.skill.Crafting:
                    if (poolReached(initial, poolXp, 2)) {
                        flatReduction += 200;
                    }
                    break;
                case CONSTANTS.skill.Fletching:
                    if (poolReached(initial, poolXp, 3)) {
                        flatReduction += 200;
                    }
                    break;
                case CONSTANTS.skill.Agility:
                    percentReduction += 3 * Math.floor(convertXpToLvl(masteryXp) / 10);
                    break;
                case CONSTANTS.skill.Thieving:
                    if (initial.currentAction === ThievingNPCs.FISHERMAN) {
                        percentReduction -= player.modifiers.summoningSynergy_5_11;
                    }
                    if (convertXpToLvl(masteryXp) >= 50) {
                        flatReduction += 200;
                    }
                    if (poolReached(initial, poolXp, 1)) {
                        flatReduction += 200;
                    }
                    break;
                case CONSTANTS.skill.Smithing:
                    flatReduction += player.modifiers.summoningSynergy_9_17;
                    break;
                case CONSTANTS.skill.Cooking:
                    flatReduction += player.modifiers.summoningSynergy_9_17;
                    break;
            }
            // apply modifiers
            adjustedInterval *= 1 - percentReduction / 100;
            adjustedInterval -= flatReduction;
            adjustedInterval = Math.ceil(adjustedInterval);
            return Math.max(250, adjustedInterval);
        }

        // Adjust interval based on down time
        // This only applies to Mining, Thieving and Agility
        function intervalRespawnAdjustment(initial, currentInterval, skillXp, poolXp, masteryXp, agiLapTime) {
            let adjustedInterval = currentInterval;
            switch (initial.skillID) {
                case CONSTANTS.skill.Mining:
                    // compute max rock HP
                    let rockHP = 5 /*base*/ + convertXpToLvl(masteryXp);
                    if (poolReached(initial, poolXp, 3)) {
                        rockHP += 10;
                    }
                    rockHP += player.modifiers.increasedMiningNodeHP - player.modifiers.decreasedMiningNodeHP;
                    // synergy 4 18
                    rockHP += player.modifiers.summoningSynergy_4_18;
                    // potions can preserve rock HP
                    let noDamageChance = player.modifiers.increasedChanceNoDamageMining - player.modifiers.decreasedChanceNoDamageMining;
                    if (noDamageChance >= 100) {
                        break;
                    }
                    rockHP /= (1 - noDamageChance / 100);
                    // compute average time per action
                    let spawnTime = Mining.rockData[initial.currentAction].baseRespawnInterval;
                    if (poolReached(initial, poolXp, 1)) {
                        spawnTime *= 0.9;
                    }
                    adjustedInterval = (adjustedInterval * rockHP + spawnTime) / rockHP;
                    break;

                case CONSTANTS.skill.Thieving:
                    const successRate = getThievingSuccessRate(initial, currentInterval, skillXp, poolXp, masteryXp);
                    // stunTime = 3s + time of the failed action, since failure gives no xp or mxp
                    let stunTime = 3000 + adjustedInterval;
                    // compute average time per action
                    adjustedInterval = adjustedInterval + stunTime / successRate - stunTime;
                    break;

                case CONSTANTS.skill.Agility:
                    adjustedInterval = agiLapTime;
            }
            return Math.ceil(adjustedInterval);
        }

        function getStealthAgainstNPC(initial, npc, skillXp, poolXp, masteryXp) {
            const mastery = convertXpToLvl(masteryXp);
            const level = convertXpToLvl(skillXp)
            let stealth = level + mastery;
            if (mastery >= 99) {
                stealth += 75;
            }
            if (poolReached(initial, poolXp, 0)) {
                stealth += 30;
            }
            if (poolReached(initial, poolXp, 3)) {
                stealth += 100;
            }
            stealth += player.modifiers.increasedThievingStealth;
            stealth -= player.modifiers.decreasedThievingStealth;
            return stealth;
        }

        function getThievingSuccessRate(initial, currentInterval, skillXp, poolXp, masteryXp) {
            const npc = Thieving.npcs[initial.currentAction];
            const stealth = getStealthAgainstNPC(initial, npc, skillXp, poolXp, masteryXp);
            return Math.min(100, (100 * (100 + stealth)) / (100 + npc.perception)) / 100;
        }

        // Adjust skill Xp based on unlocked bonuses
        function skillXpAdjustment(initial, itemXp, itemID, poolXp, masteryXp) {
            let staticXpBonus = initial.staticXpBonus;
            switch (initial.skillID) {
                case CONSTANTS.skill.Herblore:
                    if (poolReached(initial, poolXp, 1)) {
                        staticXpBonus += 0.03;
                    }
                    break;
            }
            let xpMultiplier = 1;
            switch (initial.skillID) {
                case CONSTANTS.skill.Runecrafting:
                    if (poolReached(initial, poolXp, 1) && items[itemID].type === "Rune") {
                        xpMultiplier += 1.5;
                    }
                    break;

                case CONSTANTS.skill.Cooking: {
                    const burnChance = calcBurnChance(masteryXp);
                    const cookXp = itemXp * (1 - burnChance);
                    const burnXp = 1 * burnChance;
                    itemXp = cookXp + burnXp;
                    break;
                }

                case CONSTANTS.skill.Fishing: {
                    const junkChance = calcJunkChance(initial, masteryXp, poolXp);
                    const fishXp = itemXp * (1 - junkChance);
                    const junkXp = 1 * junkChance;
                    itemXp = (fishXp + junkXp);
                    break;
                }

                case CONSTANTS.skill.Summoning: {
                    if (ETASettings.USE_TABLETS) {
                        const qty = calcSummoningTabletQty(initial, poolXp, convertXpToLvl(masteryXp));
                        itemXp += qty * initial.useTabletXp;
                    }
                }
            }
            return itemXp * staticXpBonus * xpMultiplier;
        }

        // Calculate total number of unlocked items for skill based on current skill level
        ETA.msLevelMap = {};

        function calcTotalUnlockedItems(skillID, skillXp) {
            const currentSkillLevel = convertXpToLvl(skillXp);
            if (ETA.msLevelMap[skillID] === undefined) {
                ETA.msLevelMap[skillID] = MILESTONES[Skills[skillID]].map(x => x.level)
            }
            return binarySearch(ETA.msLevelMap[skillID], (t) => currentSkillLevel < t);
        }

        // compute average actions per mastery token
        function actionsPerToken(skillID, skillXp, masteryXp) {
            let actions = 20000 / calcTotalUnlockedItems(skillID, skillXp);
            if (player.equipment.slots.Amulet.item.id === CONSTANTS.item.Clue_Chasers_Insignia) {
                actions *= ETA.insigniaModifier;
            }
            return actions;
        }

        function isGathering(skillID) {
            return [
                CONSTANTS.skill.Woodcutting,
                CONSTANTS.skill.Fishing,
                CONSTANTS.skill.Mining,
                CONSTANTS.skill.Thieving,
                CONSTANTS.skill.Agility,
                CONSTANTS.skill.Astrology,
            ].includes(skillID);
        }

        function initialVariables(skillID, checkTaskComplete) {
            let initial = {
                skillID: skillID,
                checkTaskComplete: checkTaskComplete,
                staticXpBonus: 1,
                flatIntervalReduction: 0,
                percentIntervalReduction: 0,
                skillReq: [], // Needed items for craft and their quantities
                itemQty: {}, // Initial amount of resources
                hasMastery: skillID !== CONSTANTS.skill.Magic, // magic has no mastery, so we often check this
                multiple: ETA.SINGLE,
                completionCape: player.equipment.slots.Cape.item.id === CONSTANTS.item.Cape_of_Completion,
                // gathering skills are treated differently, so we often check this
                isGathering: isGathering(skillID),
                // Generate default values for script
                // skill
                skillXp: skillXP[skillID],
                targetLevel: ETASettings.getTargetLevel(skillID, skillLevel[skillID]),
                skillLim: [], // Xp needed to reach next level
                skillLimLevel: [],
                // mastery
                masteryLim: [], // Xp needed to reach next level
                masteryLimLevel: [0],
                totalMasteryLevel: 0,
                // pool
                poolXp: 0,
                targetPool: 0,
                targetPoolXp: 0,
                poolLim: [], // Xp need to reach next pool checkpoint
                staticPreservation: 0,
                maxPoolXp: 0,
                tokens: 0,
                poolLimCheckpoints: [10, 25, 50, 95, 100, Infinity], //Breakpoints for mastery pool bonuses followed by Infinity
                //////////////
                //DEPRECATED//
                //////////////
                masteryID: 0,
                masteryXp: 0,
                skillInterval: 0,
                itemID: undefined,
                itemXp: 0,
            }
            // skill
            initial.targetXp = convertLvlToXp(initial.targetLevel);
            // Breakpoints for skill bonuses - default all levels starting at 2 to 99, followed by Infinity
            initial.skillLimLevel = Array.from({length: 98}, (_, i) => i + 2);
            initial.skillLimLevel.push(Infinity);
            // mastery
            // Breakpoints for mastery bonuses - default all levels starting at 2 to 99, followed by Infinity
            if (initial.hasMastery) {
                initial.masteryLimLevel = Array.from({length: 98}, (_, i) => i + 2);
            }
            initial.masteryLimLevel.push(Infinity);
            // static preservation
            initial.staticPreservation = player.modifiers.increasedGlobalPreservationChance;
            initial.staticPreservation -= player.modifiers.decreasedGlobalPreservationChance;
            initial.staticPreservation += getTotalFromModifierArray("increasedSkillPreservationChance", skillID);
            initial.staticPreservation -= getTotalFromModifierArray("decreasedSkillPreservationChance", skillID);
            if (player.equipment.slots.Helmet.item.id === CONSTANTS.item.Crown_of_Rhaelyx
                && getBankQty(CONSTANTS.item.Charge_Stone_of_Rhaelyx) > 0) {
                initial.staticPreservation -= ETA.rhaelyxChargePreservation; // Remove stone 15% chance from base
            }
            return initial;
        }

        function skillCapeEquipped(capeID) {
            return [
                capeID,
                CONSTANTS.item.Max_Skillcape,
                CONSTANTS.item.Cape_of_Completion,
            ].includes(player.equipment.slots.Cape.item.id);
        }

        function configureSmithing(initial) {
            initial.itemID = smithingItems[initial.currentAction].itemID;
            initial.itemXp = items[initial.itemID].smithingXP;
            initial.skillInterval = 2000;
            for (let i of items[initial.itemID].smithReq) {
                const req = {...i};
                if (req.id === CONSTANTS.item.Coal_Ore) {
                    if (skillCapeEquipped(CONSTANTS.item.Smithing_Skillcape)) {
                        req.qty /= 2;
                    }
                    req.qty -= player.modifiers.summoningSynergy_17_19;
                    if (req.qty < 0) {
                        req.qty = 0;
                    }
                }
                initial.skillReq.push(req);
            }
            initial.masteryLimLevel = [20, 40, 60, 80, 99, Infinity]; // Smithing Mastery Limits
            return initial;
        }

        function configureFletching(initial) {
            initial.itemID = fletchingItems[initial.currentAction].itemID;
            initial.itemXp = items[initial.itemID].fletchingXP;
            initial.skillInterval = 2000;
            for (let i of items[initial.itemID].fletchReq) {
                initial.skillReq.push(i);
            }
            //Special Case for Arrow Shafts
            if (initial.itemID === CONSTANTS.item.Arrow_Shafts) {
                if (selectedFletchLog === undefined) {
                    selectedFletchLog = 0;
                }
                initial.skillReq = [initial.skillReq[selectedFletchLog]];
            }
            return initial;
        }

        function configureRunecrafting(initial) {
            initial.itemID = runecraftingItems[initial.currentAction].itemID;
            initial.itemXp = items[initial.itemID].runecraftingXP;
            initial.skillInterval = 2000;
            for (let i of items[initial.itemID].runecraftReq) {
                initial.skillReq.push(i);
            }
            initial.masteryLimLevel = [99, Infinity]; // Runecrafting has no Mastery bonus
            return initial;
        }

        function configureCrafting(initial) {
            initial.itemID = craftingItems[initial.currentAction].itemID;
            initial.itemXp = items[initial.itemID].craftingXP;
            initial.skillInterval = 3000;
            items[initial.itemID].craftReq.forEach(i => {
                let qty = i.qty;
                if (items[initial.itemID].category === "Combat" && items[initial.itemID].tier === "Dragonhide" && qty > 1) {
                    qty -= player.modifiers.summoningSynergy_9_16;
                }
                initial.skillReq.push({
                    ...i,
                    qty: qty,
                });
            });
            return initial;
        }

        function configureHerblore(initial) {
            initial.itemID = herbloreItemData[initial.currentAction].itemID[getHerbloreTier(initial.currentAction)];
            initial.itemXp = herbloreItemData[initial.currentAction].herbloreXP;
            initial.skillInterval = 2000;
            for (let i of items[initial.itemID].herbloreReq) {
                initial.skillReq.push(i);
            }
            return initial;
        }

        function configureCooking(initial) {
            const item = items[initial.currentAction];
            initial.itemID = item.id;
            initial.masteryID = item.masteryID[1];
            initial.itemXp = item.cookingXP;
            initial.skillInterval = item.cookingInterval;
            initial.skillReq = items[initial.itemID].recipeRequirements[0];
            initial.masteryLimLevel = [99, Infinity]; //Cooking has no Mastery bonus
            return initial;
        }

        function configureFiremaking(initial) {
            initial.itemID = initial.currentAction;
            const recipe = Firemaking.recipes[initial.currentAction];
            initial.itemXp = recipe.baseXP * (1 + recipe.bonfireXPBonus / 100);
            initial.skillInterval = recipe.baseInterval;
            initial.skillReq = [{id: initial.itemID, qty: 1}];
            return initial;
        }

        function configureSummoning(initial) {
            initial.itemID = summoningItems[initial.currentAction].itemID;
            initial.itemXp = getBaseSummoningXP(initial.currentAction);
            initial.useTabletXp = getBaseSummoningXP(initial.currentAction, true);
            initial.skillInterval = 5000;
            initial.recipeID = summoningData.defaultRecipe[items[initial.itemID].masteryID[1]];
            // costs can change with increasing pool / mastery
            initial.skillReq = items[initial.itemID].summoningReq[initial.recipeID].map((r, i) => {
                return {
                    id: r.id,
                    qty: getSummoningRecipeQty(initial.itemID, initial.recipeID, i),
                };
            });
            // add xp of owned tablets to initial xp
            if (ETASettings.USE_TABLETS) {
                const qty = getQtyOfItem(initial.itemID);
                initial.skillXp += qty * initial.useTabletXp;
                initial.targetSkillReached = initial.skillXp >= initial.targetXp;
            }
            initial.chanceToDouble = calculateChanceToDouble(CONSTANTS.skill.Summoning, false, 0, 0, items[initial.itemID]);
            return initial;
        }

        function configureMagic(initial) {
            initial.skillInterval = 2000;
            //Find need runes for spell
            if (ALTMAGIC[initial.currentAction].runesRequiredAlt !== undefined && useCombinationRunes) {
                for (let i of ALTMAGIC[initial.currentAction].runesRequiredAlt) {
                    initial.skillReq.push({...i});
                }
            } else {
                for (let i of ALTMAGIC[initial.currentAction].runesRequired) {
                    initial.skillReq.push({...i});
                }
            }
            // Get Rune discount
            let capeMultiplier = 1;
            if (skillCapeEquipped(CONSTANTS.item.Magic_Skillcape)) {
                // Add cape multiplier
                capeMultiplier = 2;
            }
            for (let i = 0; i < initial.skillReq.length; i++) {
                const weapon = player.equipment.slots.Weapon.item;
                if (weapon.providesRune !== undefined && weapon.providesRune.includes(initial.skillReq[i].id)) {
                    initial.skillReq[i].qty -= weapon.providesRuneQty * capeMultiplier;
                }
            }
            initial.skillReq = initial.skillReq.filter(item => item.qty > 0); // Remove all runes with 0 cost
            //Other items
            if (ALTMAGIC[initial.currentAction].selectItem === 1 && selectedMagicItem[1] !== null) { // Spells that just use 1 item
                let found = false;
                for (const req of initial.skillReq) {
                    if (req.id === selectedMagicItem[1]) {
                        req.qty++;
                        found = true;
                    }
                }
                if (!found) {
                    initial.skillReq.push({id: selectedMagicItem[1], qty: 1});
                }
            } else if (ALTMAGIC[initial.currentAction].selectItem === -1) { // Spells that doesn't require you to select an item
                if (ALTMAGIC[initial.currentAction].needCoal) { // Rags to Riches II
                    initial.skillReq.push({id: 48, qty: 1});
                }
            } else if (selectedMagicItem[0] !== null && ALTMAGIC[initial.currentAction].selectItem === 0) { // SUPERHEAT
                for (let i of items[selectedMagicItem[0]].smithReq) {
                    initial.skillReq.push({...i});
                }
                if (ALTMAGIC[initial.currentAction].ignoreCoal) {
                    initial.skillReq = initial.skillReq.filter(item => item.id !== 48);
                }
            }
            initial.masteryLimLevel = [Infinity]; //AltMagic has no Mastery bonus
            initial.itemXp = ALTMAGIC[initial.currentAction].magicXP;
            return initial;
        }

        function configureGathering(initial) {
            initial.skillReq = [];
            initial.masteryID = initial.currentAction;
            return initial;
        }

        function configureMining(initial) {
            initial.itemID = Mining.rockData[initial.currentAction].oreID;
            initial.itemXp = items[initial.itemID].miningXP;
            initial.skillInterval = 3000;
            return configureGathering(initial);
        }

        function configureThieving(initial) {
            initial.itemID = undefined;
            initial.itemXp = Thieving.npcs[initial.currentAction].xp;
            initial.skillInterval = 3000;
            return configureGathering(initial);
        }

        function configureWoodcutting(initial) {
            const wcAction = x => {
                return {
                    itemID: x,
                    itemXp: trees[x].xp,
                    skillInterval: trees[x].interval,
                    masteryID: x,
                };
            }
            if (!isNaN(initial.currentAction)) {
                initial.actions = [wcAction(initial.currentAction)];
            } else {
                initial.actions = initial.currentAction.map(x => wcAction(x));
            }
            return configureGathering(initial);
        }

        function configureFishing(initial) {
            initial.itemID = fishingItems[fishingAreas[initial.currentAction].fish[initial.fishID]].itemID;
            initial.itemXp = items[initial.itemID].fishingXP;
            // base avg interval
            let avgRoll = 0.5;
            const max = items[initial.itemID].maxFishingInterval;
            const min = items[initial.itemID].minFishingInterval;
            initial.skillInterval = Math.floor(avgRoll * (max - min)) + min;
            initial = configureGathering(initial);
            // correctly set masteryID
            initial.masteryID = fishingAreas[initial.currentAction].fish[initial.fishID];
            return initial
        }

        function configureAgility(initial) {
            const agiAction = x => {
                return {
                    itemXp: agilityObstacles[x].completionBonuses.xp,
                    skillInterval: agilityObstacles[x].interval,
                    masteryID: x,
                };
            }
            if (!isNaN(initial.currentAction)) {
                initial.actions = [agiAction(initial.currentAction)];
            } else {
                initial.actions = initial.currentAction.map(x => agiAction(x));
            }
            return configureGathering(initial);
        }

        function configureAstrology(initial) {
            initial.itemID = undefined;
            initial.itemXp = ASTROLOGY[initial.currentAction].provides.xp;
            initial.skillInterval = AstrologyDefaults.interval;
            return configureGathering(initial);
        }

        function calcSummoningRecipeQty(initial, poolXp, recipeItemIndex, masteryLevel) {
            const recipe = items[initial.itemID].summoningReq[initial.recipeID][recipeItemIndex];
            const recipeGPCostReduction = Math.floor(masteryLevel / 10);
            const recipeGPCost = SUMMONING.Settings.recipeGPCost * (1 - (recipeGPCostReduction * 5) / 100);

            // gp cost or sc cost
            if (recipe.id === -4 || recipe.id === -5) {
                return {
                    id: recipe.id,
                    qty: Math.max(1, recipeGPCost),
                };
            }

            // non-shard item cost
            if (items[recipe.id].type !== undefined && items[recipe.id].type !== "Shard") {
                const itemCost = Math.max(20, items[recipe.id].sellsFor);
                return {
                    id: recipe.id,
                    qty: Math.max(1, Math.floor(recipeGPCost / itemCost)),
                };
            }

            // shard cost
            let qty = recipe.qty;
            // shard cost
            // mastery shard reduction
            if (masteryLevel >= 50) {
                qty--;
            }
            if (masteryLevel >= 99) {
                qty--;
            }
            // pool shard reduction
            if (poolReached(initial, poolXp, 1) && items[initial.itemID].summoningTier <= 2) {
                qty--;
            } else if (poolReached(initial, poolXp, 3) && items[initial.itemID].summoningTier === 3) {
                qty--;
            }
            // modifier shard reduction
            qty -= player.modifiers.decreasedSummoningShardCost - player.modifiers.increasedSummoningShardCost;
            return {
                id: recipe.id,
                qty: Math.max(1, qty),
            };
        }

        function calcSummoningTabletQty(initial, poolXp, masteryLevel) {
            let qty = 25;
            if (poolReached(initial, poolXp, 3)) {
                qty += 10;
            }
            if (masteryLevel >= 99) {
                qty += 10;
            }
            return qty * (1 + initial.chanceToDouble / 100);
        }

        // Calculate mastery xp based on unlocked bonuses
        function calcMasteryXpToAdd(initial, totalMasteryLevel, skillXp, masteryXp, poolXp, timePerAction, masteryID) {
            const modifiedTimePerAction = getTimePerActionModifierMastery(initial.skillID, timePerAction, masteryID);
            let xpModifier = initial.staticMXpBonus;
            // General Mastery Xp formula
            let xpToAdd = ((calcTotalUnlockedItems(initial.skillID, skillXp) * totalMasteryLevel) / getTotalMasteryLevelForSkill(initial.skillID) + convertXpToLvl(masteryXp) * (getTotalItemsInSkill(initial.skillID) / 10)) * (modifiedTimePerAction / 1000) / 2;
            // Skill specific mastery pool modifier
            if (poolReached(initial, poolXp, 0)) {
                xpModifier += 0.05;
            }
            // Firemaking pool and log modifiers
            if (initial.skillID === CONSTANTS.skill.Firemaking) {
                // If current skill is Firemaking, we need to apply mastery progression from actions and use updated poolXp values
                if (poolReached(initial, poolXp, 3)) {
                    xpModifier += 0.05;
                }
                for (let i = 0; i < MASTERY[CONSTANTS.skill.Firemaking].xp.length; i++) {
                    // The logs you are not burning
                    if (initial.actions[0].masteryID !== i) {
                        if (getMasteryLevel(CONSTANTS.skill.Firemaking, i) >= 99) {
                            xpModifier += 0.0025;
                        }
                    }
                }
                // The log you are burning
                if (convertXpToLvl(masteryXp) >= 99) {
                    xpModifier += 0.0025;
                }
            } else {
                // For all other skills, you use the game function to grab your FM mastery progression
                if (getMasteryPoolProgress(CONSTANTS.skill.Firemaking) >= masteryCheckpoints[3]) {
                    xpModifier += 0.05;
                }
                for (let i = 0; i < MASTERY[CONSTANTS.skill.Firemaking].xp.length; i++) {
                    if (getMasteryLevel(CONSTANTS.skill.Firemaking, i) >= 99) {
                        xpModifier += 0.0025;
                    }
                }
            }
            // Combine base and modifiers
            xpToAdd *= xpModifier;
            // minimum 1 mastery xp per action
            if (xpToAdd < 1) {
                xpToAdd = 1;
            }
            // BurnChance affects average mastery Xp
            if (initial.skillID === CONSTANTS.skill.Cooking) {
                let burnChance = calcBurnChance(masteryXp);
                xpToAdd *= (1 - burnChance);
            }
            // Fishing junk gives no mastery xp
            if (initial.skillID === CONSTANTS.skill.Fishing) {
                let junkChance = calcJunkChance(initial, masteryXp, poolXp);
                xpToAdd *= (1 - junkChance);
            }
            // return average mastery xp per action
            return xpToAdd;
        }

        // Calculate pool Xp based on mastery Xp
        function calcPoolXpToAdd(skillXp, masteryXp) {
            if (convertXpToLvl(skillXp) >= 99) {
                return masteryXp / 2;
            } else {
                return masteryXp / 4;
            }
        }

        // Calculate burn chance based on mastery level
        function calcBurnChance(masteryXp) {
            // primary burn chance
            let primaryBurnChance = 30;
            primaryBurnChance += player.modifiers.summoningSynergy_4_9;
            primaryBurnChance -= player.modifiers.increasedChanceSuccessfulCook;
            primaryBurnChance += player.modifiers.decreasedChanceSuccessfulCook;
            primaryBurnChance -= (convertXpToLvl(masteryXp) - 1) * 0.6;
            if (primaryBurnChance < 0) {
                primaryBurnChance = 0;
            }
            primaryBurnChance /= 100;
            // secondary burn chance
            let secondaryBurnChance = 1 - player.modifiers.decreasedSecondaryFoodBurnChance;
            if (secondaryBurnChance < 0) {
                secondaryBurnChance = 0;
            }
            secondaryBurnChance /= 100;
            // total burn chance
            return 1 - (1 - primaryBurnChance) * (1 - secondaryBurnChance);
        }

        // calculate junk chance
        function calcJunkChance(initial, masteryXp, poolXp) {
            // base
            let junkChance = fishingAreas[initial.currentAction].junkChance;
            // mastery turns 3% junk in 3% special
            let masteryLevel = convertXpToLvl(masteryXp);
            if (masteryLevel >= 50) {
                junkChance -= 3;
            }
            // no junk if mastery level > 65 or pool > 25%
            if (masteryLevel >= 65
                || junkChance < 0
                || poolReached(initial, poolXp, 1)) {
                junkChance = 0;
            }
            return junkChance / 100;
        }

        function perAction(masteryXp, targetMasteryXp) {
            return {
                // mastery
                masteryXp: masteryXp,
                targetMasteryReached: masteryXp >= targetMasteryXp,
                targetMasteryTime: 0,
                targetMasteryResources: {},
                // estimated number of actions taken so far
                actions: 0,
            }
        }

        function currentVariables(initial) {
            let current = {
                actionCount: 0,
                activeTotalTime: 0,
                sumTotalTime: 0,
                // skill
                skillXp: initial.skillXp,
                targetSkillReached: initial.skillXp >= initial.targetXp,
                targetSkillTime: 0,
                targetSkillResources: {},
                // pool
                poolXp: initial.poolXp,
                targetPoolReached: initial.poolXp >= initial.targetPoolXp,
                targetPoolTime: 0,
                targetPoolResources: {},
                totalMasteryLevel: initial.totalMasteryLevel,
                // items
                chargeUses: 0, // estimated remaining charge uses
                tokens: initial.tokens,
                // stats per action
                actions: initial.actions.map(x => perAction(x.masteryXp, x.targetMasteryXp)),
                // available resources
                itemQty: {...initial.itemQty},
                skillReqMap: {...initial.skillReqMap},
                used: {},
            };
            for (let id in current.itemQty) {
                current.used[id] = 0;
            }
            // Check for Crown of Rhaelyx
            if (player.equipment.slots.Helmet.item.id === CONSTANTS.item.Crown_of_Rhaelyx && initial.hasMastery && !initial.isGathering) {
                let rhaelyxCharge = getQtyOfItem(CONSTANTS.item.Charge_Stone_of_Rhaelyx);
                current.chargeUses = rhaelyxCharge * 1000; // average crafts per Rhaelyx Charge Stone
            }
            return current;
        }

        function gainPerAction(initial, current, averageActionTime) {
            return current.actions.map((x, i) => {
                const gain = {
                    xpPerAction: skillXpAdjustment(initial, initial.actions[i].itemXp, initial.actions[i].itemID, current.poolXp, x.masteryXp),
                    masteryXpPerAction: 0,
                    poolXpPerAction: 0,
                    tokensPerAction: 0,
                    tokenXpPerAction: 0,
                };

                if (initial.hasMastery) {
                    gain.masteryXpPerAction = calcMasteryXpToAdd(initial, current.totalMasteryLevel, current.skillXp, x.masteryXp, current.poolXp, averageActionTime[i], initial.actions[i].masteryID);
                    gain.poolXpPerAction = calcPoolXpToAdd(current.skillXp, gain.masteryXpPerAction);
                    gain.tokensPerAction = 1 / actionsPerToken(initial.skillID, current.skillXp, x.masteryXp);
                    gain.tokenXpPerAction = initial.maxPoolXp / 1000 * gain.tokensPerAction;
                }
                return gain;
            });
        }

        // Actions until limit
        function getLim(lims, xp, max) {
            const lim = lims.find(element => element > xp);
            if (xp < max && max < lim) {
                return Math.ceil(max);
            }
            return Math.ceil(lim);
        }

        function actionsToBreakpoint(initial, current, noResources = false) {
            // Adjustments
            const currentIntervals = current.actions.map((x, i) => intervalAdjustment(initial, current.poolXp, x.masteryXp, initial.actions[i].skillInterval));
            if (initial.skillID === CONSTANTS.skill.Agility) {
                current.agiLapTime = currentIntervals.reduce((a, b) => a + b, 0);
            }
            const averageActionTimes = current.actions.map((x, i) => intervalRespawnAdjustment(initial, currentIntervals[i], current.skillXp, current.poolXp, x.masteryXp, current.agiLapTime));
            // Current Xp
            let gains = gainPerAction(initial, current, currentIntervals);

            // average gains
            const avgXpPerS = gains.map((x, i) => x.xpPerAction / averageActionTimes[i] * 1000).reduce((a, b) => a + b, 0);
            let avgPoolPerS = gains.map((x, i) => x.poolXpPerAction / averageActionTimes[i] * 1000).reduce((a, b) => a + b, 0);
            const masteryPerS = gains.map((x, i) => x.masteryXpPerAction / averageActionTimes[i] * 1000);
            const avgTokenXpPerS = gains.map((x, i) => x.tokenXpPerAction / averageActionTimes[i] * 1000).reduce((a, b) => a + b, 0);
            const avgTokensPerS = gains.map((x, i) => x.tokensPerAction / averageActionTimes[i] * 1000).reduce((a, b) => a + b, 0);
            // TODO rescale sequential gains ?

            // get time to next breakpoint
            // skill
            const skillXpToLimit = getLim(initial.skillLim, current.skillXp, initial.targetXp) - current.skillXp;
            const skillXpSeconds = skillXpToLimit / avgXpPerS;
            // mastery
            let masteryXpSeconds = Infinity;
            const allMasteryXpSeconds = [];
            if (initial.hasMastery) {
                initial.actions.forEach((x, i) => {
                    const masteryXpToLimit = getLim(initial.skillLim, current.actions[i].masteryXp, x.targetMasteryXp) - current.actions[i].masteryXp;
                    allMasteryXpSeconds.push(masteryXpToLimit / masteryPerS[i]);
                });
                masteryXpSeconds = Math.min(...allMasteryXpSeconds);
            }
            // pool
            let poolXpSeconds = Infinity;
            if (initial.hasMastery) {
                const poolXpToLimit = getLim(initial.poolLim, current.poolXp, initial.targetPoolXp) - current.poolXp;
                poolXpSeconds = poolXpToLimit / avgPoolPerS;
            }
            // resources
            let resourceSeconds = Infinity;
            const rawPreservation = masteryPreservation(initial, current.actions[0].masteryXp, current.poolXp) / 100;
            const totalChanceToUse = Math.min(1, 1 - rawPreservation);
            const totalChanceToUseWithCharges = Math.min(1, Math.max(0.2, 1 - rawPreservation - ETA.rhaelyxChargePreservation / 100));
            // update summoning costs
            if (initial.skillID === CONSTANTS.skill.Summoning) {
                const masteryLevel = convertXpToLvl(current.actions[0].masteryXp);
                initial.skillReq.map((_, i) =>
                    calcSummoningRecipeQty(initial, current.poolXp, i, masteryLevel)
                ).forEach(x => {
                    current.skillReqMap[x.id] = x.qty;
                })
            }
            // estimate actions remaining with current resources
            if (!noResources) {
                if (initial.actions.length > 1) {
                    ETA.log('Attempting to simulate multiple different production actions at once, this is not implemented!')
                }
                // estimate amount of actions possible with remaining resources
                // number of actions with rhaelyx charges
                const actionsWithCharge = Math.min(
                    current.chargeUses,
                    ...Object.getOwnPropertyNames(current.itemQty).map(id =>
                        current.itemQty[id] / current.skillReqMap[id] / totalChanceToUseWithCharges
                    ),
                );
                // remaining resources
                const resWithoutCharge = Math.max(
                    0,
                    Math.min(...Object.getOwnPropertyNames(current.itemQty).map(id =>
                        current.itemQty[id] / current.skillReqMap[id] - current.chargeUses * totalChanceToUseWithCharges
                    )),
                );
                const actionsWithoutCharge = resWithoutCharge / totalChanceToUse
                // add number of actions without rhaelyx charges
                const resourceActions = Math.ceil(actionsWithCharge + actionsWithoutCharge);
                resourceSeconds = resourceActions * averageActionTimes[0] / 1000;
            }

            // Minimum actions based on limits
            const rawExpectedS = Math.min(skillXpSeconds, masteryXpSeconds, poolXpSeconds, resourceSeconds);
            const expectedMS = Math.ceil(1000 * rawExpectedS);
            const expectedS = expectedMS / 1000;
            const expectedActions = averageActionTimes.map(x => expectedMS / x);
            // estimate total remaining actions
            if (!noResources) {
                current.actionCount += expectedActions[0];
            }

            // add token xp to pool xp if desired
            if (ETASettings.USE_TOKENS) {
                avgPoolPerS += avgTokenXpPerS;
            }

            // Take away resources based on expectedActions
            if (!initial.isGathering) {
                // Update remaining Rhaelyx Charge uses
                current.chargeUses -= expectedActions[0];
                if (current.chargeUses < 0) {
                    current.chargeUses = 0;
                }
                // Update remaining resources
                let resUsed;
                if (expectedActions[0] < current.chargeUses) {
                    // won't run out of charges yet
                    resUsed = expectedActions[0] * totalChanceToUseWithCharges;
                } else {
                    // first use charges
                    resUsed = current.chargeUses * totalChanceToUseWithCharges;
                    // remaining actions are without charges
                    resUsed += (expectedActions[0] - current.chargeUses) * totalChanceToUse;
                }
                for (let id in current.itemQty) {
                    const qty = Math.ceil(resUsed * current.skillReqMap[id]);
                    current.itemQty[id] -= qty;
                    current.used[id] += qty;
                }
            }

            // time for current iteration
            // gain tokens, unless we're using them
            if (!ETASettings.USE_TOKENS) {
                current.tokens += avgTokensPerS * expectedS;
            }
            // Update time and Xp
            switch (initial.multiple) {
                // active total time is number of actions * action time, number of actions is time spent / (action time + "respawn")
                case ETA.SINGLE:
                    current.activeTotalTime += expectedMS / averageActionTimes[0] * currentIntervals[0];
                    break;

                case ETA.PARALLEL:
                case ETA.SEQUENTIAL:
                    current.activeTotalTime += expectedMS
                        / averageActionTimes.reduce((a, b) => (a + b), 0)
                        * currentIntervals.reduce((a, b) => (a + b), 0);
                    break;
            }
            current.sumTotalTime += expectedMS;
            current.skillXp += avgXpPerS * expectedS;
            current.actions.forEach((x, i) => current.actions[i].masteryXp += gains[i].masteryXpPerAction * expectedActions[i]);
            current.poolXp += avgPoolPerS * expectedS;
            // Time for target skill level, 99 mastery, and 100% pool
            if (!current.targetSkillReached && initial.targetXp <= current.skillXp) {
                current.targetSkillTime = current.sumTotalTime;
                current.targetSkillReached = true;
                current.targetSkillResources = {...current.used};
            }
            current.actions.forEach((x, i) => {
                if (!x.targetMasteryReached && initial.actions[i].targetMasteryXp <= x.masteryXp) {
                    x.targetMasteryTime = current.sumTotalTime;
                    x.targetMasteryReached = true;
                    x.targetMasteryResources = {...current.used};
                }
            });
            if (!current.targetPoolReached && initial.targetPoolXp <= current.poolXp) {
                current.targetPoolTime = current.sumTotalTime;
                current.targetPoolReached = true;
                current.targetPoolResources = {...current.used};
            }
            // Update total mastery level
            current.totalMasteryLevel = initial.totalMasteryLevel;
            initial.actions.forEach((x, i) => {
                const y = current.actions[i];
                const masteryLevel = convertXpToLvl(y.masteryXp);
                if (x.masteryLevel !== masteryLevel) {
                    // increase total mastery
                    current.totalMasteryLevel += masteryLevel - x.masteryLevel;
                    if (masteryLevel === 99 && x.lastMasteryLevel !== 99) {
                        halveAgilityMasteryDebuffs(initial, initial.actions[i].masteryID);
                    }
                    x.lastMasteryLevel = masteryLevel;
                }
            });
            // return updated values
            return current;
        }

        function halveAgilityMasteryDebuffs(initial, id) {
            if (initial.skillID !== CONSTANTS.skill.Agility) {
                return;
            }
            // check if we need to halve one of the debuffs
            const m = agilityObstacles[id].modifiers;
            // xp
            initial.staticXpBonus += getBuff(m, 'decreasedGlobalSkillXP', 'decreasedSkillXP') / 100 / 2;
            // mxp
            initial.staticMXpBonus += getBuff(m, 'decreasedGlobalMasteryXP', 'decreasedMasteryXP') / 100 / 2;
            // interval
            initial.percentIntervalReduction += getBuff(m, 'increasedSkillIntervalPercent') / 2;
            initial.flatIntervalReduction += getBuff(m, 'increasedSkillInterval') / 2;
        }

        function getBuff(modifier, global, specific) {
            let change = 0;
            if (global && modifier[global]) {
                change += modifier[global];
            }
            if (specific && modifier[specific]) {
                modifier[specific].forEach(x => {
                    if (x[0] === CONSTANTS.skill.Agility) {
                        change += x[1];
                    }
                });
            }
            return change;
        }

        function currentXpRates(initial) {
            let rates = {
                xpH: 0,
                masteryXpH: 0,
                poolH: 0,
                tokensH: 0,
                actionTime: 0,
                actionsH: 0,
            };
            initial.actions.forEach((x, i) => {
                const initialInterval = intervalAdjustment(initial, initial.poolXp, x.masteryXp, x.skillInterval);
                const initialAverageActionTime = intervalRespawnAdjustment(initial, initialInterval, initial.skillXp, initial.poolXp, x.masteryXp, initial.agiLapTime);
                rates.xpH += skillXpAdjustment(initial, x.itemXp, x.itemID, initial.poolXp, x.masteryXp) / initialAverageActionTime * 1000 * 3600;
                if (initial.hasMastery) {
                    // compute current mastery xp / h using the getMasteryXpToAdd from the game or the method from this script
                    // const masteryXpPerAction = getMasteryXpToAdd(initial.skillID, initial.masteryID, initialInterval);
                    const masteryXpPerAction = calcMasteryXpToAdd(initial, initial.totalMasteryLevel, initial.skillXp, x.masteryXp, initial.poolXp, initialInterval, x.masteryID);
                    const masteryXpH = masteryXpPerAction / initialAverageActionTime * 1000 * 3600
                    rates.masteryXpH += masteryXpH;
                    // pool percentage per hour
                    rates.poolH += calcPoolXpToAdd(initial.skillXp, masteryXpH) / initial.maxPoolXp;
                    rates.tokensH += 3600 * 1000 / initialAverageActionTime / actionsPerToken(initial.skillID, initial.skillXp, x.masteryXp);
                }
                rates.actionTime += initialInterval;
                rates.actionsH += 3600 * 1000 / initialAverageActionTime;
            });
            if (initial.multiple === ETA.PARALLEL) {
                rates.actionTime /= initial.actions.length;
            }
            if (initial.multiple === ETA.SEQUENTIAL) {
                rates.actionsH /= initial.actions.length;
            }
            // each token contributes one thousandth of the pool and then convert to percentage
            rates.poolH = (rates.poolH + rates.tokensH / 1000) * 100;
            return rates;
        }

        function resourcesLeft(itemQty, reqMap) {
            for (let id in itemQty) {
                if (itemQty[id] < reqMap[id]) {
                    return false;
                }
            }
            return true;
        }

        function getXpRates(initial, current) {
            // compute exp rates, either current or average until resources run out
            let rates = {};
            if (ETASettings.CURRENT_RATES || initial.isGathering || !resourcesLeft(initial.itemQty, initial.skillReqMap)) {
                // compute current rates
                rates = currentXpRates(initial);
            } else {
                // compute average rates until resources run out
                rates.xpH = (current.skillXp - initial.skillXp) * 3600 * 1000 / current.sumTotalTime;
                rates.masteryXpH = initial.actions.map((x, i) => (current.actions[i].masteryXp - x.masteryXp) * 3600 * 1000 / current.sumTotalTime);
                // average pool percentage per hour
                rates.poolH = (current.poolXp - initial.poolXp) * 3600 * 1000 / current.sumTotalTime / initial.maxPoolXp;
                rates.tokensH = (current.tokens - initial.tokens) * 3600 * 1000 / current.sumTotalTime;
                rates.actionTime = current.activeTotalTime / current.actionCount;
                rates.actionsH = 3600 * 1000 / current.sumTotalTime * current.actionCount;
                // each token contributes one thousandth of the pool and then convert to percentage
                rates.poolH = (rates.poolH + rates.tokensH / 1000) * 100;
            }
            return rates;
        }

        // Calculates expected time, taking into account Mastery Level advancements during the craft
        function calcExpectedTime(initial) {
            // initialize the expected time variables
            let current = currentVariables(initial);

            // loop until out of resources
            while (!initial.isGathering && resourcesLeft(current.itemQty, current.skillReqMap)) {
                current = actionsToBreakpoint(initial, current);
            }

            // method to convert final pool xp to percentage
            const poolCap = ETASettings.UNCAP_POOL ? Infinity : 100
            const poolXpToPercentage = poolXp => Math.min((poolXp / initial.maxPoolXp) * 100, poolCap).toFixed(2);
            // create result object
            let expectedTime = {
                timeLeft: Math.round(current.sumTotalTime),
                actionCount: Math.floor(current.actionCount),
                finalSkillXp: current.skillXp,
                finalMasteryXp: current.actions.map(x => x.masteryXp),
                finalPoolXp: current.poolXp,
                finalPoolPercentage: poolXpToPercentage(current.poolXp),
                targetPoolTime: current.targetPoolTime,
                targetMasteryTime: current.actions.map(x => x.targetMasteryTime),
                targetSkillTime: current.targetSkillTime,
                rates: getXpRates(initial, current),
                tokens: current.tokens,
            };
            // continue calculations until time to all targets is found
            while (!current.targetSkillReached || (initial.hasMastery && (!current.actions.map(x => x.targetMasteryReached).reduce((a, b) => a && b, true) || !current.targetPoolReached))) {
                current = actionsToBreakpoint(initial, current, true);
            }
            // if it is a gathering skill, then set final values to the values when reaching the final target
            if (initial.isGathering) {
                expectedTime.finalSkillXp = current.skillXp;
                expectedTime.finalMasteryXp = current.actions.map(x => x.masteryXp);
                expectedTime.finalPoolXp = current.poolXp;
                expectedTime.finalPoolPercentage = poolXpToPercentage(current.poolXp);
                expectedTime.tokens = current.tokens;
            }
            // set time to targets
            expectedTime.targetSkillTime = current.targetSkillTime;
            expectedTime.targetMasteryTime = current.actions.map(x => x.targetMasteryTime);
            expectedTime.targetPoolTime = current.targetPoolTime;
            // return the resulting data object
            expectedTime.current = current;
            return expectedTime;
        }

        function setupTimeRemaining(initial) {
            // Set current skill and pull matching variables from game with script
            switch (initial.skillID) {
                case CONSTANTS.skill.Smithing:
                    initial = configureSmithing(initial);
                    break;
                case CONSTANTS.skill.Fletching:
                    initial = configureFletching(initial);
                    break;
                case CONSTANTS.skill.Runecrafting:
                    initial = configureRunecrafting(initial);
                    break;
                case CONSTANTS.skill.Crafting:
                    initial = configureCrafting(initial);
                    break;
                case CONSTANTS.skill.Herblore:
                    initial = configureHerblore(initial);
                    break;
                case CONSTANTS.skill.Cooking:
                    initial = configureCooking(initial);
                    break;
                case CONSTANTS.skill.Firemaking:
                    initial = configureFiremaking(initial);
                    break;
                case CONSTANTS.skill.Magic:
                    initial = configureMagic(initial);
                    break;
                case CONSTANTS.skill.Mining:
                    initial = configureMining(initial);
                    break;
                case CONSTANTS.skill.Thieving:
                    initial = configureThieving(initial);
                    break;
                case CONSTANTS.skill.Woodcutting:
                    initial = configureWoodcutting(initial);
                    break;
                case CONSTANTS.skill.Fishing:
                    initial = configureFishing(initial);
                    break;
                case CONSTANTS.skill.Agility:
                    initial = configureAgility(initial);
                    break;
                case CONSTANTS.skill.Summoning:
                    initial = configureSummoning(initial);
                    break;
                case CONSTANTS.skill.Astrology:
                    initial = configureAstrology(initial);
                    break;
            }
            // configure interval reductions
            initial.percentIntervalReduction += getTotalFromModifierArray("decreasedSkillIntervalPercent", initial.skillID);
            initial.percentIntervalReduction -= getTotalFromModifierArray("increasedSkillIntervalPercent", initial.skillID);
            initial.flatIntervalReduction += getTotalFromModifierArray("decreasedSkillInterval", initial.skillID);
            initial.flatIntervalReduction -= getTotalFromModifierArray("increasedSkillInterval", initial.skillID);
            if (initial.skillID === CONSTANTS.skill.Agility) {
                // set initial lap time
                initial.agiLapTime = 0;
                if (initial.skillID === CONSTANTS.skill.Agility) {
                    const poolXp = MASTERY[initial.skillID].pool;
                    initial.agilityObstacles.forEach(x => {
                        const masteryXp = MASTERY[initial.skillID].xp[x];
                        const interval = agilityObstacles[x].interval;
                        initial.agiLapTime += intervalAdjustment(initial, poolXp, masteryXp, interval);
                    });
                }
            }
            // Configure initial mastery values for all skills with masteries
            if (initial.hasMastery) {
                // mastery
                initial.totalMasteryLevel = getCurrentTotalMasteryLevelForSkill(initial.skillID);
                // pool
                initial.poolXp = MASTERY[initial.skillID].pool;
                initial.maxPoolXp = getMasteryPoolTotalXP(initial.skillID);
                initial.targetPool = ETASettings.getTargetPool(initial.skillID, 100 * initial.poolXp / initial.maxPoolXp);
                initial.targetPoolXp = initial.maxPoolXp;
                if (initial.targetPool !== 100) {
                    initial.targetPoolXp = initial.maxPoolXp / 100 * initial.targetPool;
                }
                initial.tokens = getQtyOfItem(CONSTANTS.item["Mastery_Token_" + Skills[initial.skillID]])
            }

            // convert single action skills to `actions` format
            // TODO: put it in this format straight away and remove the duplication
            if (initial.actions === undefined) {
                initial.actions = [{
                    itemID: initial.itemID,
                    itemXp: initial.itemXp,
                    skillInterval: initial.skillInterval,
                    masteryID: initial.masteryID, // this might still be undefined at this point
                }];
            }

            // further configure the `actions`
            initial.actions.forEach(x => {
                if (initial.hasMastery) {
                    if (!initial.isGathering) {
                        x.masteryID = items[x.itemID].masteryID[1];
                    }
                    x.masteryXp = MASTERY[initial.skillID].xp[x.masteryID];
                    x.masteryLevel = convertXpToLvl(x.masteryXp);
                    x.lastMasteryLevel = x.masteryLevel;
                    x.targetMastery = ETASettings.getTargetMastery(initial.skillID, convertXpToLvl(x.masteryXp));
                    x.targetMasteryXp = convertLvlToXp(x.targetMastery);
                }
            });

            // Get itemXp Bonuses from gear and pets
            initial.staticXpBonus = getStaticXPBonuses(initial.skillID);
            initial.staticMXpBonus = getStaticMXPBonuses(initial.skillID);

            // Populate masteryLim from masteryLimLevel
            for (let i = 0; i < initial.masteryLimLevel.length; i++) {
                initial.masteryLim[i] = convertLvlToXp(initial.masteryLimLevel[i]);
            }
            // Populate skillLim from skillLimLevel
            for (let i = 0; i < initial.skillLimLevel.length; i++) {
                initial.skillLim[i] = convertLvlToXp(initial.skillLimLevel[i]);
            }
            // Populate poolLim from masteryCheckpoints
            for (let i = 0; i < initial.poolLimCheckpoints.length; i++) {
                initial.poolLim[i] = initial.maxPoolXp * initial.poolLimCheckpoints[i] / 100;
            }

            // Get Item Requirements and Current Requirements
            initial.skillReqMap = {};
            for (let i = 0; i < initial.skillReq.length; i++) {
                let itemQty = getQtyOfItem(initial.skillReq[i].id);
                initial.itemQty[initial.skillReq[i].id] = itemQty;
                initial.skillReqMap[initial.skillReq[i].id] = initial.skillReq[i].qty;
            }
            return initial;
        }

        function getStaticXPBonuses(skill) {
            let xpMultiplier = 1;
            xpMultiplier += getTotalFromModifierArray("increasedSkillXP", skill) / 100;
            xpMultiplier -= getTotalFromModifierArray("decreasedSkillXP", skill) / 100;
            xpMultiplier += (player.modifiers.increasedGlobalSkillXP - player.modifiers.decreasedGlobalSkillXP) / 100;
            if (skill === CONSTANTS.skill.Magic) {
                xpMultiplier += (player.modifiers.increasedAltMagicSkillXP - player.modifiers.decreasedAltMagicSkillXP) / 100;
            }
            // TODO: does not match the test-v0.21?980 implementation
            if (skill === CONSTANTS.skill.Firemaking
                && player.modifiers.summoningSynergy_18_19
                && herbloreBonuses[8].bonus[0] === 0
                && herbloreBonuses[8].bonus[1] > 0) {
                xpMultiplier += 5 / 100;
            }
            return xpMultiplier;
        }

        function getStaticMXPBonuses(skill) {
            let xpMultiplier = 1;
            xpMultiplier += getTotalFromModifierArray("increasedMasteryXP", skill) / 100;
            xpMultiplier -= getTotalFromModifierArray("decreasedMasteryXP", skill) / 100;
            xpMultiplier += (player.modifiers.increasedGlobalMasteryXP - player.modifiers.decreasedGlobalMasteryXP) / 100;
            return xpMultiplier;
        }

        // Main function
        function timeRemaining(initial) {
            initial = setupTimeRemaining(initial);
            //Time left
            const results = calcExpectedTime(initial);
            const ms = {
                resources: Math.round(results.timeLeft),
                skill: Math.round(results.targetSkillTime),
                mastery: Math.round(results.targetMasteryTime),
                pool: Math.round(results.targetPoolTime),
            };
            //Inject timeLeft HTML
            const now = new Date();
            const timeLeftElement = injectHTML(initial, results, ms.resources, now);
            if (timeLeftElement !== null) {
                generateTooltips(initial, ms, results, timeLeftElement, now, {noMastery: initial.actions.length > 1});
            }
            if (initial.actions.length > 1) {
                const actions = [...initial.actions];
                const currentActions = [...initial.currentAction];
                actions.forEach((a, i) => {
                    initial.actions = [a];
                    initial.currentAction = currentActions[i];
                    const singleTimeLeftElement = injectHTML(initial, {rates: currentXpRates(initial)}, ms.resources, now, false);
                    if (singleTimeLeftElement !== null) {
                        const aux = {
                            finalMasteryXp: [results.finalMasteryXp[i]],
                            current: {actions: [{targetMasteryResources: {}}]},
                        }
                        generateTooltips(initial, {mastery: results.current.actions[i].targetMasteryTime}, aux, singleTimeLeftElement, now, {
                            noSkill: true,
                            noPool: true
                        });
                    }
                });
                //reset
                initial.actions = actions;
                initial.currentAction = currentActions;
            }

            // TODO fix this for woodcutting and agility
            if (initial.actions.length === 1) {
                // Set global variables to track completion
                let times = [];
                if (!initial.isGathering) {
                    times.push(ETA.time(ETASettings.DING_RESOURCES, 0, -ms.resources, "Processing finished."));
                }
                times.push(ETA.time(ETASettings.DING_LEVEL, initial.targetLevel, convertXpToLvl(initial.skillXp), "Target level reached."));
                if (initial.hasMastery) {
                    initial.actions.forEach((x, i) =>
                        times.push(ETA.time(ETASettings.DING_MASTERY, x.targetMastery, convertXpToLvl(x.masteryXp), "Target mastery reached."))
                    );
                    times.push(ETA.time(ETASettings.DING_POOL, initial.targetPool, 100 * initial.poolXp / initial.maxPoolXp, "Target pool reached."));
                }
                ETA.setTimeLeft(initial, times);
                if (initial.checkTaskComplete) {
                    ETA.taskComplete();
                }
                if (!initial.isGathering) {
                    generateProgressBars(initial, results, 0 /*TODO add proper action index here, usually it's 0 though*/);
                }
            }
        }

        function injectHTML(initial, results, msLeft, now, initialRun = true) {
            let timeLeftElementId = `timeLeft${Skills[initial.skillID]}`;
            if (initial.actions.length > 1) {
                timeLeftElementId += "-Secondary";
            } else if (initial.isGathering) {
                timeLeftElementId += "-" + initial.currentAction;
            } else if (initial.cookingCategory !== undefined) {
                timeLeftElementId += "-" + initial.cookingCategory;
            }
            const timeLeftElement = document.getElementById(timeLeftElementId);
            if (timeLeftElement === null) {
                switch (initial.skillID) {
                    case CONSTANTS.skill.Thieving:
                        ETA.makeThievingDisplay();
                        break;
                    case CONSTANTS.skill.Agility:
                        ETA.makeAgilityDisplay();
                        break;
                }
                if (initialRun) {
                    // try running the method again
                    return injectHTML(initial, results, msLeft, now, false);
                }
                return null;
            }
            let finishedTime = addMSToDate(now, msLeft);
            timeLeftElement.textContent = "";
            if (ETASettings.SHOW_XP_RATE) {
                timeLeftElement.textContent = "Xp/h: " + formatNumber(Math.floor(results.rates.xpH));
                if (initial.hasMastery) {
                    timeLeftElement.textContent += "\r\nMXp/h: " + formatNumber(Math.floor(results.rates.masteryXpH))
                        + `\r\nPool/h: ${results.rates.poolH.toFixed(2)}%`
                }
            }
            if (ETASettings.SHOW_ACTION_TIME) {
                timeLeftElement.textContent += "\r\nAction time: " + formatNumber(Math.ceil(results.rates.actionTime) / 1000) + 's';
                timeLeftElement.textContent += "\r\nActions/h: " + formatNumber(Math.round(100 * results.rates.actionsH) / 100);
            }
            if (!initial.isGathering) {
                if (msLeft === 0) {
                    timeLeftElement.textContent += "\r\nNo resources!";
                } else {
                    timeLeftElement.textContent += "\r\nActions: " + formatNumber(results.actionCount)
                        + "\r\nTime: " + msToHms(msLeft)
                        + "\r\nETA: " + dateFormat(now, finishedTime);
                }
            }
            if (initial.actions.length === 1 && (initial.isGathering || initial.skillID === CONSTANTS.skill.Cooking)) {
                const itemID = initial.actions[0].itemID;
                if (itemID !== undefined) {
                    const youHaveElementId = timeLeftElementId + "-YouHave";
                    const perfectID = items[itemID].perfectItem;
                    $("#" + youHaveElementId).replaceWith(''
                        + `<small id="${youHaveElementId}">`
                        + `<span>You have: ${formatNumber(getQtyOfItem(itemID))}</span>`
                        + `<img class="skill-icon-xs mr-2" src="${items[itemID].media}">`
                        + (items[itemID].perfectItem === undefined
                            ? ''
                            : `<span>${formatNumber(getQtyOfItem(perfectID))}</span>`
                            + `<img class="skill-icon-xs mr-2" src="${items[perfectID].media}">`)
                        + "</small>"
                    );
                }
            }
            timeLeftElement.style.display = "block";
            return timeLeftElement;
        }

        function generateTooltips(initial, ms, results, timeLeftElement, now, flags = {}) {
            // Generate progression Tooltips
            if (!timeLeftElement._tippy) {
                tippy(timeLeftElement, {
                    allowHTML: true,
                    interactive: false,
                    animation: false,
                });
            }
            let tooltip = '';
            // level tooltip
            if (!flags.noSkill) {
                const finalLevel = convertXpToLvl(results.finalSkillXp, true)
                const levelProgress = getPercentageInLevel(results.finalSkillXp, results.finalSkillXp, "skill");
                tooltip += finalLevelElement(
                    'Final Level',
                    formatLevel(finalLevel, levelProgress) + ' / 99',
                    'success',
                ) + tooltipSection(initial, now, ms.skill, initial.targetLevel, results.current.targetSkillResources);
            }
            // mastery tooltip
            if (!flags.noMastery && initial.hasMastery) {
                // don't show mastery target when combining multiple actions
                const finalMastery = convertXpToLvl(results.finalMasteryXp[0]);
                const masteryProgress = getPercentageInLevel(results.finalMasteryXp[0], results.finalMasteryXp[0], "mastery");
                tooltip += finalLevelElement(
                    'Final Mastery',
                    formatLevel(finalMastery, masteryProgress) + ' / 99',
                    'info',
                ) + tooltipSection(initial, now, ms.mastery, initial.actions[0].targetMastery, results.current.actions[0].targetMasteryResources);
            }
            // pool tooltip
            if (!flags.noPool && initial.hasMastery) {
                tooltip += finalLevelElement(
                    'Final Pool XP',
                    results.finalPoolPercentage + '%',
                    'warning',
                )
                let prepend = ''
                const tokens = Math.round(results.tokens);
                if (tokens > 0) {
                    prepend += `Final token count: ${tokens}`;
                    if (ms.pool > 0) {
                        prepend += '<br>';
                    }
                }
                tooltip += tooltipSection(initial, now, ms.pool, `${initial.targetPool}%`, results.current.targetPoolResources, prepend);
            }
            // wrap and return
            timeLeftElement._tippy.setContent(`<div>${tooltip}</div>`);
        }

        function tooltipSection(initial, now, ms, target, resources, prepend = '') {
            // final level and time to target level
            if (ms > 0) {
                return wrapTimeLeft(
                    prepend + timeLeftToHTML(
                        initial,
                        target,
                        msToHms(ms),
                        dateFormat(now, addMSToDate(now, ms)),
                        resources,
                    ),
                );
            } else if (prepend !== '') {
                return wrapTimeLeft(
                    prepend,
                );
            }
            return '';
        }

        function finalLevelElement(finalName, finalTarget, label) {
            return ''
                + '<div class="row no-gutters">'
                + '  <div class="col-6" style="white-space: nowrap;">'
                + '    <h3 class="font-size-base m-1" style="color:white;" >'
                + `      <span class="p-1" style="text-align:center; display: inline-block;line-height: normal;color:white;">`
                + finalName
                + '      </span>'
                + '    </h3>'
                + '  </div>'
                + '  <div class="col-6" style="white-space: nowrap;">'
                + '    <h3 class="font-size-base m-1" style="color:white;" >'
                + `      <span class="p-1 bg-${label} rounded" style="text-align:center; display: inline-block;line-height: normal;width: 100px;color:white;">`
                + finalTarget
                + '      </span>'
                + '    </h3>'
                + '  </div>'
                + '</div>';
        }

        const timeLeftToHTML = (initial, target, time, finish, resources) => `Time to ${target}: ${time}<br>ETA: ${finish}` + resourcesLeftToHTML(initial, resources);

        const resourcesLeftToHTML = (initial, resources) => {
            if (ETASettings.HIDE_REQUIRED || initial.isGathering || resources === 0) {
                return '';
            }
            let req = Object.getOwnPropertyNames(resources).map(id => {
                    let src;
                    if (id === "-5") {
                        src = "assets/media/main/slayer_coins.svg"
                    }
                    if (id === "-4") {
                        src = "assets/media/main/coins.svg"
                    }
                    if (items[id] !== undefined) {
                        src = items[id].media;
                    }
                    return `<span>${formatNumber(resources[id])}</span><img class="skill-icon-xs mr-2" src="${src}">`
                }
            ).join('');
            return `<br/>Requires: ${req}`;
        }

        const wrapTimeLeft = (s) => {
            return ''
                + '<div class="row no-gutters">'
                + '	<span class="col-12 m-1" style="padding:0.5rem 1.25rem;min-height:2.5rem;font-size:0.875rem;line-height:1.25rem;text-align:center">'
                + s
                + '	</span>'
                + '</div>';
        }

        const formatLevel = (level, progress) => {
            if (!ETASettings.SHOW_PARTIAL_LEVELS) {
                return level;
            }
            progress = Math.floor(progress);
            if (progress !== 0) {
                level = (level + progress / 100).toFixed(2);
            }
            return level;
        }

        function generateProgressBars(initial, results, idx) {
            // skill
            const skillProgress = getPercentageInLevel(initial.skillXp, results.finalSkillXp, "skill", true);
            $(`#skill-progress-bar-end-${initial.skillID}`).css("width", skillProgress + "%");
            // mastery
            if (initial.hasMastery) {
                const masteryProgress = getPercentageInLevel(initial.actions[idx].masteryXp, results.finalMasteryXp[idx], "mastery", true);
                $(`#${initial.skillID}-mastery-pool-progress-end`).css("width", masteryProgress + "%");
                // pool
                const poolProgress = (results.finalPoolPercentage > 100) ?
                    100 - ((initial.poolXp / initial.maxPoolXp) * 100) :
                    (results.finalPoolPercentage - ((initial.poolXp / initial.maxPoolXp) * 100)).toFixed(4);
                $(`#mastery-pool-progress-end-${initial.skillID}`).css("width", poolProgress + "%");
            }
        }
    }

    function loadETA() {
        // Loading script
        ETA.log('loading...');

        // constants
        ETA.SINGLE = 0;
        ETA.PARALLEL = 1;
        ETA.SEQUENTIAL = 2;

        // data
        ETA.insigniaModifier = 1 - items[CONSTANTS.item.Clue_Chasers_Insignia].increasedItemChance / 100;
        // rhaelyx goes from 10% to 25% with charge stones
        ETA.rhaelyxChargePreservation = conditionalModifiers.get(CONSTANTS.item.Crown_of_Rhaelyx)[0].modifiers.increasedGlobalPreservationChance;

        // lvlToXp cache
        ETA.lvlToXp = Array.from({length: 200}, (_, i) => exp.level_to_xp(i));

        // select and start craft overrides
        ETA.selectRef = {};
        [	// skill name, select names, < start name >
            // start name is only required if the start method is not of the form `start${skill name}`
            // production skills
            ["Smithing", ["Smith"]],
            ["Fletching", ["Fletch"]],
            ["Runecrafting", ["Runecraft"]],
            ["Crafting", ["Craft"]],
            ["Herblore", ["Herblore"]],
            ["Cooking", ["CookingRecipe"]],
            ["Summoning", ["Summon"]],
            // alt magic
            ["Magic", ["Magic", "ItemForMagic"]],
            // gathering skills
            ["Fishing", ["Fish"]],
        ].forEach(skill => {
            let skillName = skill[0];
            // wrap the select methods
            let selectNames = skill[1];
            selectNames.forEach(entry => {
                let selectName = "select" + entry;
                // original methods are kept in the selectRef object
                ETA.selectRef[selectName] = window[selectName];
                window[selectName] = function (...args) {
                    ETA.selectRef[selectName](...args);
                    try {
                        ETA.timeRemainingWrapper(CONSTANTS.skill[skillName], false);
                    } catch (e) {
                        console.error(e);
                    }
                };
            });
        });

        ETA.updateSkillWindowRef = updateSkillWindow;
        updateSkillWindow = function (skill) {
            try {
                ETA.timeRemainingWrapper(skill, false);
            } catch (e) {
                console.error(e);
            }
            ETA.updateSkillWindowRef(skill);
        };

        // update tick-based skills
        ETA.renderSkillMastery = (skillName, propName) => {
            // mimic Craftingskill.renderSkillMastery
            if (game[propName].renderQueue.skillMastery) {
                try {
                    ETA.timeRemainingWrapper(CONSTANTS.skill[skillName], false);
                } catch (e) {
                    console.error(e);
                }
                updateTotalMastery(CONSTANTS.skill[skillName]);
                updateMasteryPoolProgress(CONSTANTS.skill[skillName]);
                updateOpenMasteryXPModal(CONSTANTS.skill[skillName]);
            }
            game[propName].renderQueue.skillMastery = false;
        }

        // Thieving
        game.thieving.renderSkillMastery = () => ETA.renderSkillMastery('Thieving', 'thieving');
        game.firemaking.renderSkillMastery = () => ETA.renderSkillMastery('Firemaking', 'firemaking');
        game.mining.renderSkillMastery = () => ETA.renderSkillMastery('Mining', 'mining');

        // Create timeLeft containers
        ETA.makeProcessingDisplays();
        ETA.makeMiningDisplay();
        ETA.makeThievingDisplay();
        ETA.makeWoodcuttingDisplay();
        ETA.makeFishingDisplay();
        ETA.makeAgilityDisplay();
        ETA.makeAstrologyDisplay();

        // remake Agility display after loading the Agility Obstacles
        ETA.loadAgilityRef = loadAgility;
        loadAgility = (...args) => {
            ETA.loadAgilityRef(...args);
            ETA.log('Remaking Agility display');
            ETA.makeAgilityDisplay();
            try {
                ETA.timeRemainingWrapper(CONSTANTS.skill.Agility, false);
            } catch (e) {
                console.error(e);
            }
        }

        // Mastery Pool progress
        for (let id in SKILLS) {
            if (SKILLS[id].hasMastery) {
                let bar = $(`#mastery-pool-progress-${id}`)[0];
                $(bar).after(`<div id="mastery-pool-progress-end-${id}" class="progress-bar bg-warning" role="progressbar" style="width: 0%; background-color: #e5ae679c !important;"></div>`);
            }
        }

        // Mastery Progress bars
        for (let id in SKILLS) {
            if (SKILLS[id].hasMastery) {
                let name = Skills[id].toLowerCase();
                let bar = $(`#${name}-mastery-progress`)[0];
                $(bar).after(`<div id="${id}-mastery-pool-progress-end" class="progress-bar bg-info" role="progressbar" style="width: 0%; background-color: #5cace59c !important;"></div>`);
            }
        }

        // Mastery Skill progress
        for (let id in SKILLS) {
            if (SKILLS[id].hasMastery) {
                let bar = $(`#skill-progress-bar-${id}`)[0];
                $(bar).after(`<div id="skill-progress-bar-end-${id}" class="progress-bar bg-info" role="progressbar" style="width: 0%; background-color: #5cace59c !important;"></div>`);
            }
        }
        //
        ETA.log('loaded!');
        setTimeout(ETA.createSettingsMenu, 50);

        // load settings from local storage
        if (window.localStorage['ETASettings'] !== undefined) {
            const stored = window.JSON.parse(window.localStorage['ETASettings']);
            Object.getOwnPropertyNames(stored).forEach(x => {
                window.ETASettings[x] = stored[x];
            });
            window.ETASettings.save();
        }
        // regularly save settings to local storage
        setInterval(window.ETASettings.save, 1000)
    }
}

// inject the script
(function () {
    function injectScript(main) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
    }

    function loadScript() {
        if (typeof isLoaded !== typeof undefined && isLoaded) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
})();
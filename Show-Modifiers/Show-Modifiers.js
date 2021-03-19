// ==UserScript==
// @name         Melvor Show Modifiers
// @version      0.0.4
// @description  Adds a button to show all your modifiers
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com/*
// @grant        none
// @namespace    http://tampermonkey.net/
// @noframes
// ==/UserScript==


function script() {

    class ShowModifiers {

        constructor(name) {
            this.name = name;
            // increased - decreased
            this.creasedModifiers = {
                // modifiers that do not directly relate to skilling
                misc: {
                    BankSpace: 0,
                    BankSpaceShop: 0,
                },
                // modifiers that relate to both combat and non-combat skilling
                skilling: {
                    ChanceToPreservePotionCharge: 0,
                    GPFromSales: 0,
                    GPGlobal: 0,
                    GlobalSkillXP: 0,
                    HiddenSkillLevel: [],
                    PotionChargesFlat: 0,
                    SkillXP: [],

                },
                // modifiers that only relate to combat and are not classified in a finer group
                combat: {
                    ChanceToDoubleLootCombat: 0,
                    DamageToAllMonsters: 0,
                    DamageToBosses: 0,
                    DamageToCombatAreaMonsters: 0,
                    DamageToDungeonMonsters: 0,
                    GPFromMonsters: 0,
                    GPFromMonstersFlat: 0,
                    GlobalAccuracy: 0,
                    MaxHitFlat: 0,
                    MaxHitPercent: 0,
                    MaxHitpoints: 0,
                    MinHitBasedOnMaxHit: 0,
                    MonsterRespawnTimer: 0,
                    PlayerAttackSpeed: 0,
                    PlayerAttackSpeedPercent: 0,
                },
                // modifiers that relate to healing
                hitpoints: {
                    AutoEatEfficiency: 0,
                    AutoEatHPLimit: 0,
                    AutoEatThreshold: 0,
                    FoodHealingValue: 0,
                    HPRegenFlat: 0,
                    HitpointRegeneration: 0,
                    Lifesteal: 0,
                },
                // modifiers that relate to defence
                defence: {
                    DamageReduction: 0,
                    MagicEvasion: 0,
                    MeleeEvasion: 0,
                    RangedEvasion: 0,
                    ReflectDamage: 0,
                },
                // modifiers that relate to using melee attacks
                melee: {

                    MeleeAccuracyBonus: 0,
                    MeleeStrengthBonus: 0,
                },
                // modifiers that relate to using ranged attacks
                ranged: {
                    AmmoPreservation: 0,
                    RangedAccuracyBonus: 0,
                    RangedStrengthBonus: 0,
                },
                // modifiers that relate to using magic attacks
                magic: {
                    MagicAccuracyBonus: 0,
                    MagicDamageBonus: 0,
                    MinAirSpellDmg: 0,
                    MinEarthSpellDmg: 0,
                    MinFireSpellDmg: 0,
                    MinWaterSpellDmg: 0,
                    RunePreservation: 0,
                },
                // modifiers that relate to slayer tasks, areas, or monsters
                slayer: {
                    DamageToSlayerAreaMonsters: 0,
                    DamageToSlayerTasks: 0,
                    SlayerAreaEffectNegationFlat: 0,
                    SlayerCoins: 0,
                    SlayerTaskLength: 0,
                },
                // modifiers that relate to prayer
                prayer: {
                    ChanceToPreservePrayerPoints: 0,
                    FlatPrayerCostReduction: 0,
                },
                // modifiers that apply to general non-combat skilling
                nonCombat: {
                    ChanceToDoubleItemsGlobal: 0,
                    ChanceToDoubleItemsSkill: [],
                    SkillInterval: [],
                    SkillIntervalPercent: [],
                },
                production: {
                    GlobalPreservationChance: 0,
                    SkillPreservationChance: [],
                },
                mastery: {
                    GlobalMasteryXP: 0,
                    MasteryXP: [],
                },
                farming: {
                    FarmingYield: 0,
                },
                mining: {
                    ChanceToDoubleOres: 0,
                    MiningNodeHP: 0,
                },
                thieving: {
                    ChanceToDoubleLootThieving: 0,
                    GPFromThieving: 0,
                    GPFromThievingFlat: 0,
                },
                agility: {
                    GPFromAgility: 0,
                },
                // modifiers that are not actually implemented in the game
                unimplemented: {
                    MaxStamina: 0,
                    StaminaCost: 0,
                    StaminaPerObstacle: 0,
                    StaminaPreservationChance: 0,
                },
            }

            this.singletonModifiers = {
                misc: {
                    autoSlayerUnlocked: 0,
                    dungeonEquipmentSwapping: 0,
                    increasedEquipmentSets: 0,
                },
                woodcutting: {
                    increasedTreeCutLimit: 0,
                },
                // golbin raid modifiers
                golbinRaid: {
                    golbinRaidIncreasedMaximumAmmo: 0,
                    golbinRaidIncreasedMaximumRunes: 0,
                    golbinRaidIncreasedMinimumFood: 0,
                    golbinRaidIncreasedPrayerLevel: 0,
                    golbinRaidIncreasedPrayerPointsStart: 0,
                    golbinRaidIncreasedPrayerPointsWave: 0,
                    golbinRaidIncreasedStartingRuneCount: 0,
                    golbinRaidPassiveSlotUnlocked: 0,
                    golbinRaidPrayerUnlocked: 0,
                    golbinRaidStartingWeapon: 0,
                    golbinRaidWaveSkipCostReduction: 0,
                },
            }

            this.relevantModifiers = {};

            // all
            this.relevantModifiers.all = {
                names: [
                    ...Object.getOwnPropertyNames(this.creasedModifiers).map(tag => this.creasedModifiers[tag]),
                    ...Object.getOwnPropertyNames(this.singletonModifiers).map(tag => this.singletonModifiers[tag]),
                ],
                skillIDs: Object.getOwnPropertyNames(SKILLS).map(x => Number(x)),
            };

            // misc
            this.relevantModifiers.misc = {
                names: [
                    this.creasedModifiers.misc,
                    this.singletonModifiers.misc,
                ],
                skillIDs: [],
            };

            // golbin raid
            this.relevantModifiers.golbin = {
                names: [this.singletonModifiers.golbinRaid],
                skillIDs: [],
            };

            // all combat
            this.relevantModifiers.combat = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.combat,
                    this.creasedModifiers.hitpoints,
                    this.creasedModifiers.defence,
                    this.creasedModifiers.melee,
                    this.creasedModifiers.ranged,
                    this.creasedModifiers.magic,
                    this.creasedModifiers.slayer,
                    this.creasedModifiers.prayer,
                ],
                skillIDs: [
                    CONSTANTS.skill.Attack,
                    CONSTANTS.skill.Strength,
                    CONSTANTS.skill.Ranged,
                    CONSTANTS.skill.Magic,
                    CONSTANTS.skill.Defence,
                    CONSTANTS.skill.Hitpoints,
                    CONSTANTS.skill.Prayer,
                    CONSTANTS.skill.Slayer,
                ],
            };

            // melee combat
            this.relevantModifiers.melee = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.combat,
                    this.creasedModifiers.hitpoints,
                    this.creasedModifiers.defence,
                    this.creasedModifiers.melee,
                    this.creasedModifiers.slayer,
                    this.creasedModifiers.prayer,
                ],
                skillIDs: [
                    CONSTANTS.skill.Attack,
                    CONSTANTS.skill.Strength,
                    CONSTANTS.skill.Defence,
                    CONSTANTS.skill.Hitpoints,
                    CONSTANTS.skill.Prayer,
                    CONSTANTS.skill.Slayer,
                ],
            };

            // ranged combat
            this.relevantModifiers.ranged = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.combat,
                    this.creasedModifiers.hitpoints,
                    this.creasedModifiers.defence,
                    this.creasedModifiers.ranged,
                    this.creasedModifiers.slayer,
                    this.creasedModifiers.prayer,
                ],
                skillIDs: [
                    CONSTANTS.skill.Ranged,
                    CONSTANTS.skill.Defence,
                    CONSTANTS.skill.Hitpoints,
                    CONSTANTS.skill.Prayer,
                    CONSTANTS.skill.Slayer,
                ],
            };

            // magic combat
            this.relevantModifiers.magic = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.combat,
                    this.creasedModifiers.hitpoints,
                    this.creasedModifiers.defence,
                    this.creasedModifiers.magic,
                    this.creasedModifiers.slayer,
                    this.creasedModifiers.prayer,
                ],
                skillIDs: [
                    CONSTANTS.skill.Magic,
                    CONSTANTS.skill.Defence,
                    CONSTANTS.skill.Hitpoints,
                    CONSTANTS.skill.Prayer,
                    CONSTANTS.skill.Slayer,
                ],
            };

            // gathering skills
            this.gatheringSkills = ['Woodcutting', 'Fishing', 'Mining', 'Thieving', 'Farming', 'Agility'];
            this.gatheringSkills.forEach(name => {
                this.relevantModifiers[name] = {
                    names: [
                        this.creasedModifiers.skilling,
                        this.creasedModifiers.nonCombat,
                        this.creasedModifiers.mastery,
                    ],
                    skillIDs: [
                        CONSTANTS.skill[name]
                    ],
                };
                if (this.creasedModifiers[name] !== undefined) {
                    this.relevantModifiers[name].push(this.creasedModifiers[name]);
                }
                if (this.singletonModifiers[name] !== undefined) {
                    this.relevantModifiers[name].push(this.singletonModifiers[name]);
                }
            });

            // production skills
            this.productionSkills = ['Firemaking', 'Cooking', 'Smithing', 'Fletching', 'Crafting', 'Runecrafting', 'Herblore'];
            this.productionSkills.forEach(name => {
                this.relevantModifiers[name] = {
                    names: [
                        this.creasedModifiers.skilling,
                        this.creasedModifiers.nonCombat,
                        this.creasedModifiers.production,
                        this.creasedModifiers.mastery,
                    ],
                    skillIDs: [
                        CONSTANTS.skill[name]
                    ],
                };
                if (this.creasedModifiers[name] !== undefined) {
                    this.relevantModifiers[name].push(this.creasedModifiers[name]);
                }
                if (this.singletonModifiers[name] !== undefined) {
                    this.relevantModifiers[name].push(this.singletonModifiers[name]);
                }
            });

            // whatever alt magic is
            this.relevantModifiers.altMagic = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.nonCombat,
                ],
                skillIDs: [],
            };

            // golbin raid
            this.relevantModifiers.golbinRaid = {
                names: [this.singletonModifiers.golbinRaid],
                skillIDs: [],
            };
        }


        arrayModifierToSkill(array, skillID) {
            const result = array.filter(x => {
                return x.id === skillID || x[0] === skillID
            });
            if (result.length === 0) {
                return 0;
            }
            return result[0].value | result[0][1];
        }

        printDiffModifier(modifier, increased, decreased, skillID = undefined) {
            // compute difference
            const value = increased - decreased;
            if (value === 0) {
                return [];
            }
            // store if value is positive or negative
            const positive = value > 0;
            // take absolute value
            let valueToPrint = positive ? value : -value;
            // convert to array if required
            valueToPrint = skillID !== undefined ? [skillID, valueToPrint] : valueToPrint;
            // print increased or decreased
            if (positive) {
                return [printPlayerModifier('increased' + modifier, valueToPrint)];
            } else {
                return [printPlayerModifier('decreased' + modifier, valueToPrint)];
            }
        }

        printModifier(modifiers, modifier, skillIDs) {
            // modifiers that occur on their own
            if (modifiers[modifier] !== undefined) {
                if (modifiers[modifier] === 0) {
                    return [];
                }
                return [printPlayerModifier(modifier, modifiers[modifier])];
            }
            // increased-decreased type modifier
            const increased = modifiers['increased' + modifier];
            const decreased = modifiers['decreased' + modifier];
            let toPrint = [];
            if (increased.length !== undefined) {
                skillIDs.forEach(skillID => {
                    const increasedEntry = this.arrayModifierToSkill(increased, skillID);
                    const decreasedEntry = this.arrayModifierToSkill(decreased, skillID);
                    toPrint = toPrint.concat(this.printDiffModifier(modifier, increasedEntry, decreasedEntry, skillID));
                });
            } else {
                toPrint = toPrint.concat(this.printDiffModifier(modifier, increased, decreased));
            }
            return toPrint;
        }

        printRelevantModifiers(modifiers, tag) {
            const relevantNames = this.relevantModifiers[tag].names;
            const skillIDs = this.relevantModifiers[tag].skillIDs;
            const toPrint = [];
            relevantNames.forEach(names => Object.getOwnPropertyNames(names).forEach(name => {
                this.printModifier(modifiers, name, skillIDs).forEach(result => toPrint.push(result));
            }));
            return toPrint;
        }

        makeTagButton(tag, text, icon) {
            return '<div class="dropdown d-inline-block ml-2">'
                + '<button type="button" '
                + 'class="btn btn-sm btn-dual text-combat-smoke" '
                + 'id="page-header-modifiers" '
                + `onclick="window.${this.name}.replaceRelevantModifiersHtml(playerModifiers, '${text}', '${tag}');" `
                + 'aria-haspopup="true" '
                + 'aria-expanded="true">'
                + `<img class="skill-icon-xxs" src="${icon}">`
                + '</button>'
                + '</div>';
        }

        replaceRelevantModifiersHtml(modifiers, text, tag) {
            $('#show-modifiers').replaceWith(this.printRelevantModifiersHtml(modifiers, text, tag));
        }

        printRelevantModifiersHtml(modifiers, text, tag) {
            let passives = '<div id="show-modifiers"><br/>';
            passives += `<h5 class=\"font-w400 font-size-sm mb-1\">${text}</h5><br/>`;
            this.printRelevantModifiers(modifiers, tag).forEach(toPrint => {
                passives += `<h5 class=\"font-w400 font-size-sm mb-1 ${toPrint[1]}\">${toPrint[0]}</h5>`;
            });
            passives += '</div>';
            return passives;
        }

        showRelevantModifiers(modifiers, text, tag = 'all') {
            let passives = `<h5 class=\"font-w600 font-size-sm mb-1 text-combat-smoke\">${text}</h5><h5 class=\"font-w600 font-size-sm mb-3 text-warning\"></h5>`;
            passives += `<h5 class="font-w600 font-size-sm mb-3 text-warning"><small>(Does not include non-modifier effects)</small></h5>`;
            passives += this.makeTagButton('all', 'All Modifiers', 'assets/media/main/completion_log.svg');
            passives += this.makeTagButton('golbinRaid', 'Golbin Raid', 'assets/media/main/raid_coins.svg');
            passives += this.makeTagButton('combat', 'Combat', 'assets/media/skills/combat/combat.svg');
            passives += this.makeTagButton('melee', 'Melee', 'assets/media/skills/attack/attack.svg');
            passives += this.makeTagButton('ranged', 'Ranged', 'assets/media/skills/ranged/ranged.svg');
            passives += this.makeTagButton('magic', 'Combat Magic', 'assets/media/skills/combat/spellbook.svg');
            passives += '<br/>';
            this.gatheringSkills.forEach(skill => passives += this.makeTagButton(skill, skill, `assets/media/skills/${skill.toLowerCase()}/${skill.toLowerCase()}.svg`));
            passives += '<br/>';
            this.productionSkills.forEach(skill => passives += this.makeTagButton(skill, skill, `assets/media/skills/${skill.toLowerCase()}/${skill.toLowerCase()}.svg`));
            passives += this.makeTagButton('altMagic', 'Alt. Magic', 'assets/media/skills/magic/magic.svg');
            passives += this.printRelevantModifiersHtml(modifiers, 'All Modifiers', tag);
            Swal.fire({
                html: passives,
            });
        }
    }

    const name = 'melvorShowModifiers';
    window[name] = new ShowModifiers(name);
    let modifierButton = () => {
        return '<div class="dropdown d-inline-block ml-2">'
            + '<button type="button" '
            + 'class="btn btn-sm btn-dual text-combat-smoke" '
            + 'id="page-header-modifiers" '
            + `onclick="window.${name}.showRelevantModifiers(playerModifiers, \'Active Modifiers\');" `
            + 'aria-haspopup="true" '
            + 'aria-expanded="true">'
            + `<img class="skill-icon-xxs" src="${getItemMedia(CONSTANTS.item.Event_Clue_1)}">`
            + '</button>'
            + '</div>';
    }

    let node = document.getElementById('page-header-potions-dropdown').parentNode;
    node.parentNode.insertBefore($(modifierButton().trim())[0], node);
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
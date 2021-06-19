// ==UserScript==
// @name         Melvor Show Modifiers
// @version      0.0.11
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

        constructor(name, logName) {
            this.name = name;
            this.logName = logName;
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
                    ChanceToDoubleItemsGlobal: 0,
                    GPFromSales: 0,
                    GPGlobal: 0,
                    GlobalSkillXP: 0,
                    HiddenSkillLevel: [],
                    PotionChargesFlat: 0,
                    SkillXP: [],
                    SummoningChargePreservation: 0,
                },
                // modifiers that only relate to combat and are not classified in a finer group
                combat: {
                    AttackRolls: 0,
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
                    EnemyAccuracy: 0,
                    ChanceToApplyBurn: 0,
                    GPOnEnemyHit: 0,
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
                    EnemyMeleeEvasion: 0,
                },
                // modifiers that relate to using ranged attacks
                ranged: {
                    AmmoPreservation: 0,
                    RangedAccuracyBonus: 0,
                    RangedStrengthBonus: 0,
                    EnemyRangedEvasion: 0,
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
                    EnemyMagicEvasion: 0,
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
                    ChanceToDoubleItemsSkill: [],
                    SkillInterval: [],
                    SkillIntervalPercent: [],
                    ChanceAdditionalSkillResource: [],
                },
                production: {
                    GlobalPreservationChance: 0,
                    SkillPreservationChance: [],
                },
                mastery: {
                    GlobalMasteryXP: 0,
                    MasteryXP: [],
                },
                // specific skills
                agility: {
                    GPFromAgility: 0,
                },
                altMagic: {
                    AltMagicSkillXP: 0,
                },
                farming: {
                    ChanceDoubleHarvest: 0,
                    FarmingYield: 0,
                },
                herblore: {
                    ChanceRandomPotionHerblore: 0,
                },
                mining: {
                    ChanceNoDamageMining: 0,
                    ChanceToDoubleOres: 0,
                    MiningNodeHP: 0,
                },
                runecrafting: {
                    ChanceForElementalRune: 0,
                    ElementalRuneGain: 0,
                    AdditionalRunecraftCountRunes: 0,
                },
                smithing: {
                    SeeingGoldChance: 0,
                },
                thieving: {
                    ChanceToDoubleLootThieving: 0,
                    GPFromThieving: 0,
                    GPFromThievingFlat: 0,
                },
                woodcutting: {
                    BirdNestDropRate: 0,
                },
                summoning: {
                    SummoningShardCost: 0,
                    SummoningCreationCharges: 0,
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
                // specific skills
                firemaking: {
                    freeBonfires: 0,
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
                // summoning synergy modifiers, should be moved to the appropriate location, IF they are here to stay
                summoning: {
                    summoningSynergy_0_1: 0,
                    summoningSynergy_0_6: 0,
                    summoningSynergy_0_7: 0,
                    summoningSynergy_0_8: 0,
                    summoningSynergy_0_12: 0,
                    summoningSynergy_0_13: 0,
                    summoningSynergy_0_14: 0,
                    summoningSynergy_0_15: 0,
                    summoningSynergy_1_2: 0,
                    summoningSynergy_1_8: 0,
                    summoningSynergy_1_12: 0,
                    summoningSynergy_1_13: 0,
                    summoningSynergy_1_14: 0,
                    summoningSynergy_1_15: 0,
                    summoningSynergy_2_6: 0,
                    summoningSynergy_2_7: 0,
                    summoningSynergy_2_8: 0,
                    summoningSynergy_2_12: 0,
                    summoningSynergy_2_13: 0,
                    summoningSynergy_2_14: 0,
                    summoningSynergy_2_15: 0,
                    summoningSynergy_3_4: 0,
                    summoningSynergy_3_5: 0,
                    summoningSynergy_3_9: 0,
                    summoningSynergy_3_10: 0,
                    summoningSynergy_3_11: 0,
                    summoningSynergy_3_16: 0,
                    summoningSynergy_3_17: 0,
                    summoningSynergy_3_18: 0,
                    summoningSynergy_3_19: 0,
                    summoningSynergy_4_5: 0,
                    summoningSynergy_4_9: 0,
                    summoningSynergy_4_10: 0,
                    summoningSynergy_4_11: 0,
                    summoningSynergy_4_16: 0,
                    summoningSynergy_4_17: 0,
                    summoningSynergy_4_18: 0,
                    summoningSynergy_4_19: 0,
                    summoningSynergy_5_9: 0,
                    summoningSynergy_5_10: 0,
                    summoningSynergy_5_11: 0,
                    summoningSynergy_5_16: 0,
                    summoningSynergy_5_17: 0,
                    summoningSynergy_5_18: 0,
                    summoningSynergy_6_7: 0,
                    summoningSynergy_6_8: 0,
                    summoningSynergy_6_12: 0,
                    summoningSynergy_6_13: 0,
                    summoningSynergy_6_14: 0,
                    summoningSynergy_6_15: 0,
                    summoningSynergy_7_8: 0,
                    summoningSynergy_7_12: 0,
                    summoningSynergy_7_13: 0,
                    summoningSynergy_7_14: 0,
                    summoningSynergy_7_15: 0,
                    summoningSynergy_8_12: 0,
                    summoningSynergy_8_13: 0,
                    summoningSynergy_8_14: 0,
                    summoningSynergy_9_10: 0,
                    summoningSynergy_9_11: 0,
                    summoningSynergy_9_16: 0,
                    summoningSynergy_9_17: 0,
                    summoningSynergy_9_18: 0,
                    summoningSynergy_9_19: 0,
                    summoningSynergy_10_11: 0,
                    summoningSynergy_10_16: 0,
                    summoningSynergy_10_18: 0,
                    summoningSynergy_10_19: 0,
                    summoningSynergy_11_16: 0,
                    summoningSynergy_11_17: 0,
                    summoningSynergy_11_18: 0,
                    summoningSynergy_11_19: 0,
                    summoningSynergy_12_13: 0,
                    summoningSynergy_12_14: 0,
                    summoningSynergy_12_15: 0,
                    summoningSynergy_13_14: 0,
                    summoningSynergy_13_15: 0,
                    summoningSynergy_14_15: 0,
                    summoningSynergy_16_17: 0,
                    summoningSynergy_16_18: 0,
                    summoningSynergy_16_19: 0,
                    summoningSynergy_17_18: 0,
                    summoningSynergy_17_19: 0,
                    summoningSynergy_18_19: 0,
                },
                aprilFools: {
                    aprilFoolsIncreasedMovementSpeed: 0,
                    aprilFoolsDecreasedMovementSpeed: 0,
                    aprilFoolsIncreasedTeleportCost: 0,
                    aprilFoolsDecreasedTeleportCost: 0,
                    aprilFoolsIncreasedUpdateDelay: 0,
                    aprilFoolsDecreasedUpdateDelay: 0,
                    aprilFoolsIncreasedLemonGang: 0,
                    aprilFoolsDecreasedLemonGang: 0,
                    aprilFoolsIncreasedCarrotGang: 0,
                    aprilFoolsDecreasedCarrotGang: 0,
                }
            }

            this.knownModifiers = {};
            Object.getOwnPropertyNames(this.creasedModifiers).forEach(subset => {
                Object.getOwnPropertyNames(this.creasedModifiers[subset]).forEach(modifier => {
                    this.knownModifiers[`increased${modifier}`] = true;
                    this.knownModifiers[`decreased${modifier}`] = true;
                });
            });
            Object.getOwnPropertyNames(this.singletonModifiers).forEach(subset => {
                Object.getOwnPropertyNames(this.singletonModifiers[subset]).forEach(modifier => {
                    this.knownModifiers[modifier] = true;
                });
            });

            // check for unknown modifiers
            let hasUnknownModifiers = false;
            Object.getOwnPropertyNames(playerModifiers).forEach(modifier => {
                if (this.knownModifiers[modifier]) {
                    return;
                }
                hasUnknownModifiers = true;
                this.log(`unknown modifier ${modifier}`);
            });
            if (!hasUnknownModifiers) {
                this.log('no unknown modifiers detected!')
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
                    CONSTANTS.skill.Summoning,
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
                    CONSTANTS.skill.Summoning,
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
                    CONSTANTS.skill.Summoning,
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
                    CONSTANTS.skill.Summoning,
                ],
            };

            // slayer
            this.relevantModifiers.slayer = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.slayer,
                ],
                skillIDs: [
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
                const lname = name.toLowerCase();
                if (this.creasedModifiers[lname] !== undefined) {
                    this.relevantModifiers[name].names.push(this.creasedModifiers[lname]);
                }
                if (this.singletonModifiers[lname] !== undefined) {
                    this.relevantModifiers[name].names.push(this.singletonModifiers[lname]);
                }
            });

            // production skills
            this.productionSkills = ['Firemaking', 'Cooking', 'Smithing', 'Fletching', 'Crafting', 'Runecrafting', 'Herblore', 'Summoning'];
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
                const lname = name.toLowerCase();
                if (this.creasedModifiers[lname] !== undefined) {
                    this.relevantModifiers[name].names.push(this.creasedModifiers[lname]);
                }
                if (this.singletonModifiers[lname] !== undefined) {
                    this.relevantModifiers[name].names.push(this.singletonModifiers[lname]);
                }
            });

            // whatever alt magic is
            this.relevantModifiers.altMagic = {
                names: [
                    this.creasedModifiers.skilling,
                    this.creasedModifiers.nonCombat,
                    this.creasedModifiers.altMagic,
                ],
                skillIDs: [],
            };

            // golbin raid
            this.relevantModifiers.golbinRaid = {
                names: [this.singletonModifiers.golbinRaid],
                skillIDs: [],
            };
        }

        log(...args) {
            console.log(`${this.logName}:`, ...args);
        }

        arrayModifierToSkill(array, skillID) {
            if (!array) {
                return 0;
            }
            const result = array.filter(x => {
                return x.id === skillID || x[0] === skillID
            });
            if (result.length === 0) {
                return 0;
            }
            return result[0].value | result[0][1] | 0;
        }

        printPlayerModifier(modifier, value) {
            const result = printPlayerModifier(modifier, value);
            if (result[0].length > 0) {
                return result;
            }
            let toPrint = '';
            // summoning synergy modifiers
            const split = modifier.split('_');
            if (split.length === 3 && split[0] === 'summoningSynergy') {
                return [SUMMONING.Synergies[split[1]][split[2]].description, 'text-success'];
            }
            // positive modifiers
            switch (modifier) {
                // positive
                case 'golbinRaidWaveSkipCostReduction':
                    toPrint = `-${value}% Wave Skip Cost`;
                    break;
                case 'golbinRaidIncreasedMinimumFood':
                    toPrint = `+${value} Minimum Food Quantity Roll`;
                    break;
                case 'golbinRaidIncreasedMaximumAmmo':
                    toPrint = `+${value}% Maximum Ranged Ammo Quantity Roll`;
                    break;
                case 'golbinRaidIncreasedMaximumRunes':
                    toPrint = `+${value}% Maximum Runes Quantity Roll`;
                    break;
                case 'golbinRaidPrayerUnlocked':
                    toPrint = value === 0 ? 'Prayer Locked in Golbin Raid' : 'Prayer Unlocked in Golbin Raid';
                    break;
                case 'golbinRaidIncreasedPrayerLevel':
                    toPrint = `+${value} Prayer Level in Golbin Raid`;
                    break;
                case 'golbinRaidIncreasedPrayerPointsStart':
                    toPrint = `+${value} Initial Prayer Points`;
                    break;
                case 'golbinRaidIncreasedPrayerPointsWave':
                    toPrint = `+${value} Prayer Points per Wave`;
                    break;
                case 'golbinRaidPassiveSlotUnlocked':
                    toPrint = value === 0 ? 'Passive Slot Locked in Golbin Raid' : 'Passive Slot Unlocked in Golbin Raid';
                    break;
                case 'golbinRaidIncreasedStartingRuneCount':
                    toPrint = `+${value} Initial Runes`;
                    break;
                case 'golbinRaidStartingWeapon':
                    toPrint = 'Starting Weapon: ' + (value === 0
                        ? 'Bronze Scimitar'
                        : items[value].name);
                    break;
                case 'freeBonfires':
                    toPrint = value < 1 ? 'No Free Bonfires' : 'Free Bonfires';
                    break;
            }
            if (toPrint.length > 0) {
                return [toPrint, value > 0 ? 'text-success' : 'text-warning'];
            }
            // negative modifiers
            switch (modifier) {
            }
            if (toPrint.length > 0) {
                return [toPrint, value > 0 ? 'text-danger' : 'text-warning'];
            }
            // creased modifiers
            switch (modifier.slice(9)) {
                case 'BirdNestDropRate':
                    toPrint = `${value}% Bird Nest Drop Rate`;
                    break;
                case 'ChanceNoDamageMining':
                    toPrint = `${value}% to do Zero Damage to Mining Rocks`;
                    break;
                case 'SeeingGoldChance':
                    toPrint = `${value}% Chance for Silver Ore to Produce a Gold Bar`;
                    break;
                case 'ChanceDoubleHarvest':
                    toPrint = `${value}% Chance for Double Harvest`;
                    break;
                case 'ChanceForElementalRune':
                    toPrint = `${value}% Chance for Random Elemental Runes`;
                    break;
                case 'ElementalRuneGain':
                    toPrint = `${value} Random Elemental Runes`;
                    break;
                case 'ChanceRandomPotionHerblore':
                    toPrint = `${value}% Chance for Random Tier Herblore Potion`;
                    break;
                case 'AttackRolls':
                    toPrint = `${value} Additional Attack Roll`;
                    if (value !== 1) {
                        toPrint += 's';
                    }
                    break;
                case 'AltMagicSkillXP':
                    toPrint = `${value}% Alt. Magic Skill XP`;
                    break;
            }
            if (toPrint.length > 0) {
                if (modifier.slice(0, 9) === 'increased') {
                    return [`+${toPrint}`, value > 0 ? 'text-success' : 'text-warning'];
                }
                if (modifier.slice(0, 9) === 'decreased') {
                    return [`-${toPrint}`, value > 0 ? 'text-danger' : 'text-warning'];
                }
            }
            // unknown modifiers
            return [`${modifier}: ${value}`, 'text-warning']
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
                return [this.printPlayerModifier('increased' + modifier, valueToPrint)];
            } else {
                return [this.printPlayerModifier('decreased' + modifier, valueToPrint)];
            }
        }

        printModifier(modifiers, modifier, skillIDs) {
            // modifiers that occur on their own
            if (modifiers[modifier] !== undefined) {
                if (modifiers[modifier] === 0) {
                    return [];
                }
                return [this.printPlayerModifier(modifier, modifiers[modifier])];
            }
            // increased-decreased type modifier
            const increased = modifiers['increased' + modifier] | 0;
            const decreased = modifiers['decreased' + modifier] | 0;
            let toPrint = [];
            if (increased === undefined) {
                return [];
            }
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
            passives += this.makeTagButton('slayer', 'Slayer', 'assets/media/skills/slayer/slayer.svg');
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
    window[name] = new ShowModifiers(name, 'Show Modifiers');
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
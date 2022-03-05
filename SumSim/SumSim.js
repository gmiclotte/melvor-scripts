// ==UserScript==
// @name		Melvor Summoning Simulator
// @namespace	http://tampermonkey.net/
// @version		0.0.1
// @description	Melvor Summoning Simulator, see examples to run it.
// @grant		none
// @author		GMiclotte
// @include		https://melvoridle.com/*
// @include		https://*.melvoridle.com/*
// @exclude		https://melvoridle.com/index.php
// @exclude		https://*.melvoridle.com/index.php
// @exclude		https://wiki.melvoridle.com/*
// @exclude		https://*.wiki.melvoridle.com/*
// @inject-into page
// @noframes
// @grant		none
// ==/UserScript==

((main) => {
    const script = document.createElement('script');
    script.textContent = `try { (${main})(); } catch (e) { console.log(e); }`;
    document.body.appendChild(script).parentNode.removeChild(script);
})(() => {

    class SumSim {
        constructor(debug = false) {
            this.debugFlag = debug;
        }

        debug(...args) {
            if (this.debugFlag) {
                console.log(...args);
            }
        }

        log(...args) {
            console.log(...args);
        }

        getInitial() {
            return {
                startXP: 0,
                startMasteryXP: 0,
                startMasteryLevels: MILESTONES.Summoning.length - 1,
                startPoolXP: 0,
            };
        }

        getUnlockedItems(level) {
            let count = 0;
            const milestones = MILESTONES.Summoning;
            for (let i = 0; i < milestones.length; i++) {
                if (level >= milestones[i].level) count++;
                else break;
            }
            return count;
        }

        baseMasteryXpToAdd(unlockedItems, masteryLevel, currentTotalMastery) {
            //XP per Action = ((Total unlocked items for skill * current total Mastery level for skill / total Mastery level of skill) + (Mastery level of action * (total items in skill / 10))) * time per action (seconds) / 2
            this.debug('term1', unlockedItems, currentTotalMastery, getTotalMasteryLevelForSkill(Skills.Summoning));
            const term1 = unlockedItems * currentTotalMastery / getTotalMasteryLevelForSkill(Skills.Summoning);
            this.debug('term2', masteryLevel, getTotalItemsInSkill(Skills.Summoning));
            const term2 = masteryLevel * getTotalItemsInSkill(Skills.Summoning) / 10;
            const timeFactor = game.summoning.masteryModifiedInterval / 1000 / 2;
            this.debug('base mastery xp', term1, term2, timeFactor);
            return (term1 + term2) * timeFactor;
        }

        masteryXpModifier(pool) {
            let xpModifier = 0;
            if (pool >= masteryCheckpoints[0]) {
                xpModifier += 5;
            }
            if (getMasteryPoolProgress(CONSTANTS.skill.Firemaking) >= masteryCheckpoints[3]) {
                xpModifier += 5;
            }
            for (let i = 0; i < MASTERY[CONSTANTS.skill.Firemaking].xp.length; i++) {
                if (getMasteryLevel(CONSTANTS.skill.Firemaking, i) >= 99) xpModifier += 0.25;
            }
            xpModifier += playerModifiers.increasedGlobalMasteryXP - playerModifiers.decreasedGlobalMasteryXP;
            xpModifier += getTotalFromModifierArray("increasedMasteryXP", Skills.Summoning) - getTotalFromModifierArray("decreasedMasteryXP", Skills.Summoning);
            return xpModifier;
        }

        masteryXpFinal(base, xpModifier) {
            return Math.max(applyModifier(base, xpModifier), 1);
        }

        plan(current, targetLevel, summonID, actionInterval, quiet = false) {
            const targetXP = exp.level_to_xp(targetLevel) + 1e-5;
            this.debug('target xp', targetXP);
            const mark = Summoning.marks[summonID];
            const consumptionXP = Summoning.getTabletConsumptionXP(summonID, actionInterval);
            const otherMasteryLevels = current.startMasteryLevels - (exp.xp_to_level(current.startMasteryXP) - 1);
            let xp = current.startXP;
            let masteryXP = current.startMasteryXP;
            let poolXP = current.startPoolXP;
            const maxPool = getMasteryPoolTotalXP(Skills.Summoning);
            let totalActions = 0;
            let totalTablets = 0;
            while (xp < targetXP) {
                const level = Math.min(99, exp.xp_to_level(xp) - 1);
                this.debug('level', level);
                // determine actions to mastery change
                const masteryLevel = Math.min(99, exp.xp_to_level(masteryXP) - 1);
                const masteryPerAction = this.masteryXpFinal(
                    this.baseMasteryXpToAdd(this.getUnlockedItems(level), masteryLevel, masteryLevel + otherMasteryLevels),
                    this.masteryXpModifier(poolXP / maxPool * 100),
                )
                const actionsToMasteryLevel = masteryLevel >= 99 ? Infinity : (exp.level_to_xp(masteryLevel + 1) + 1e-5 - masteryXP) / masteryPerAction;
                // determine actions to pool change
                const poolPerAction = masteryPerAction / (level >= 99 ? 2 : 4);
                const actionsToPoolCheckpoint = [.10, .25, .50, .95, Infinity].find(x => x > poolXP / maxPool) * maxPool / poolPerAction;
                // compute tablets per action
                let tabletsPerAction = mark.baseQuantity;
                if (masteryLevel >= 99) {
                    tabletsPerAction += 10;
                }
                if (poolXP / maxPool > .95) {
                    tabletsPerAction += 10;
                }
                tabletsPerAction += player.modifiers.increasedSummoningCreationCharges - player.modifiers.decreasedSummoningCreationCharges;
                // compute xp per action
                let xpMultiplier = 1;
                xpMultiplier += getTotalFromModifierArray("increasedSkillXP", Skills.Summoning) / 100;
                xpMultiplier -= getTotalFromModifierArray("decreasedSkillXP", Skills.Summoning) / 100;
                xpMultiplier += (playerModifiers.increasedGlobalSkillXP - playerModifiers.decreasedGlobalSkillXP) / 100;
                const xpPerAction = xpMultiplier * (mark.baseXP + tabletsPerAction * consumptionXP);
                // compute actions to target
                const actionsToTarget = (targetXP - xp) / xpPerAction;
                // compute total actions
                this.debug('actions', actionsToTarget, actionsToMasteryLevel, actionsToPoolCheckpoint)
                const actions = Math.ceil(Math.min(actionsToTarget, actionsToMasteryLevel, actionsToPoolCheckpoint));
                totalActions += actions;
                totalTablets += actions * tabletsPerAction;
                // compute rewards for this iteration
                this.debug('rewards', xpPerAction, masteryPerAction, poolPerAction);
                const rewardXP = actions * xpPerAction;
                const rewardMastery = actions * masteryPerAction;
                const rewardPool = actions * poolPerAction;
                // add rewards to running totals
                xp += rewardXP;
                masteryXP += rewardMastery;
                poolXP += rewardPool;
                this.debug(`${xp} (+${rewardXP})xp; ${masteryXP} (+${rewardMastery}) mxp; ${poolXP} (+${rewardPool}) pool`);
                this.debug(`${exp.xp_to_level(xp) - 1} level; ${exp.xp_to_level(masteryXP) - 1} mastery; ${100.0 * poolXP / maxPool}% pool`);
                // TODO compute costs for this iteration
                // TODO add costs to running totals
            }
            if (!quiet) {
                this.log(`${totalActions} actions; ${totalTablets} tablets; ${xp} xp; ${masteryXP} mxp; ${poolXP} pool`);
                this.log(`${exp.xp_to_level(xp) - 1} level; ${exp.xp_to_level(masteryXP) - 1} mastery; ${100.0 * poolXP / maxPool}% pool`);
            }
            return {
                // these values are used by next iteration
                startXP: xp,
                startMasteryXP: 0, // this is set to 0 since typically we continue with a different action
                startMasteryLevels: otherMasteryLevels + Math.min(99, exp.xp_to_level(masteryXP) - 1),
                startPoolXP: poolXP,
                // additional values in case we want to log something
                endLevel: exp.xp_to_level(xp) - 1,
                endMasteryXP: masteryXP,
                endMastery: exp.xp_to_level(masteryXP) - 1,
                endPool: 100.0 * poolXP / maxPool,
                endActions: totalActions,
                endTablets: totalTablets,
            }
        }
    }

    window.sumSim = new SumSim(false);

    // note: SumSim assumes you use all tablets immediately upon creation

    // scenario 1
    // Ent to 5, 1300ms wc actions (dragon axe, normal tree, mastery = 99, no other speed modifiers)
    // Mole to 99, 2200ms mining actions (mithril pickaxe, >50% pool)
    sumSim.example1 = () => {
        let current = sumSim.getInitial();
        current = sumSim.plan(current, 5, Summons.Ent, 1300);
        current.startMasteryXP = 0; // different action, so reset mastery xp
        current = sumSim.plan(current, 99, Summons.Mole, 2200);
    }

    // scenario 2
    // Ent to 5, don't use tablets ( == 0ms wc actions)
    // Mole to 99, 2200ms mining actions (mithril pickaxe, >50% pool)
    sumSim.example2 = () => {
        let current = sumSim.getInitial();
        current = sumSim.plan(current, 5, Summons.Ent, 0);
        current.startMasteryXP = 0; // different action, so reset mastery xp
        current = sumSim.plan(current, 99, Summons.Mole, 2200);
    }

    // scenario 3
    // Ent to 45, 1300ms wc actions (dragon axe, normal tree, mastery = 99, no other speed modifiers)
    // Leprechaun to 99, 2600ms thieving actions
    sumSim.example3 = () => {
        let current = sumSim.getInitial();
        current = sumSim.plan(current, 45, Summons.Ent, 1300);
        current.startMasteryXP = 0; // different action, so reset mastery xp
        current = sumSim.plan(current, 99, Summons.Leprechaun, 2600);
    }


});
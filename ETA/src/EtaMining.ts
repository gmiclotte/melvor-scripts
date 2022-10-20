import {Mining} from "../../Game-Files/built/rockTicking";
import {CurrentSkill} from "./CurrentSkill";
import {ETASettings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";

export class EtaMining extends CurrentSkill {
    constructor(mining: Mining, action: any, modifiers: PlayerModifiers, settings: ETASettings) {
        console.log(action.id)
        super(mining, action, modifiers, settings);
        this.baseInterval = mining.baseInterval;
    }

    get maxRockHP() {
        const rock = this.action;
        if (rock.fixedMaxHP !== undefined) {
            return rock.fixedMaxHP;
        }
        let rockHP = this.skill.baseRockHP;
        if (this.isPoolTierActive(3)) {
            rockHP += 10;
        }
        const activePotion = this.skill.activePotion;
        if (activePotion !== undefined &&
            [
                "melvorF:Perfect_Swing_Potion_I" /* ItemIDs.Perfect_Swing_Potion_I */,
                "melvorF:Perfect_Swing_Potion_II" /* ItemIDs.Perfect_Swing_Potion_II */,
                "melvorF:Perfect_Swing_Potion_III" /* ItemIDs.Perfect_Swing_Potion_III */,
                "melvorF:Perfect_Swing_Potion_IV" /* ItemIDs.Perfect_Swing_Potion_IV */,
            ].includes(activePotion.id)) {
            rockHP += this.modifiers.increasedMiningNodeHPWithPerfectSwing;
        }
        rockHP += this.masteryLevel;
        rockHP += this.modifiers.increasedMiningNodeHP - this.modifiers.decreasedMiningNodeHP;
        return Math.max(rockHP, 1);
    }

    get rockHPPreserveChance() {
        return this.modifiers.increasedChanceNoDamageMining
            - this.modifiers.decreasedChanceNoDamageMining;
    }

    get averageActionTime() {
        // base action time
        const actionInterval = this.actionInterval;
        // check if rock respawns
        if (!this.action.hasPassiveRegen) {
            return this.actionInterval;
        }
        // compute inverse factor for rock hp
        let rockHPDivisor = 1;
        // account for rockHPPreserveChance
        rockHPDivisor -= this.rockHPPreserveChance / 100;
        // rock regens 1 hp every 10s, i.e. every 1e4 ms
        rockHPDivisor -= actionInterval / 1e4;
        if (rockHPDivisor <= 0) {
            // rock never dies
            return actionInterval;
        }
        const effectiveRockHP = this.maxRockHP / rockHPDivisor;
        // respawn interval
        let respawnInterval = this.action.baseRespawnInterval;
        if (this.isPoolTierActive(1)) {
            respawnInterval *= 0.9;
        }
        // @ts-ignore
        respawnInterval = roundToTickInterval(respawnInterval);
        // average action time is time for one cycle divided by number of actions during that cycle
        return (actionInterval * effectiveRockHP + respawnInterval) / effectiveRockHP;
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.isPoolTierActive(2)) {
            modifier -= 200;
        }
        return modifier;
    }

}
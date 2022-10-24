import {Mining} from "../../Game-Files/built/rockTicking";
import {EtaSkill} from "./EtaSkill";
import {Settings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {Game} from "../../Game-Files/built/game";

export class EtaMining extends EtaSkill {
    constructor(game: Game, mining: Mining, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: Settings) {
        super(game, mining, action, modifiers, astrology, settings);
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
            return actionInterval;
        }
        // compute inverse factor for rock hp
        let rockHPDivisor = 1;
        // account for rockHPPreserveChance
        rockHPDivisor -= this.rockHPPreserveChance / 100;
        // rock regenerates 1 hp every 10s, i.e. every 1e4 ms
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

    get totalUnlockedMasteryActions() {
        return this.skill.actions.reduce((previous: number, action: any) => {
            if (this.skillLevel >= action.level && this.totalCurrentMasteryLevel > action.totalMasteryRequired) {
                previous++;
            }
            return previous;
        }, 0);
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.isPoolTierActive(2)) {
            modifier -= 200;
        }
        return modifier;
    }

}
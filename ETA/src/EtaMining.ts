import type {Mining, MiningRock} from "../../Game-Files/gameTypes/rockTicking";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {roundToTickInterval} from "../../Game-Files/gameTypes/utils";

export class EtaMining extends EtaSkillWithMastery {
    constructor(game: Game, mining: Mining, action: any, settings: Settings) {
        super(game, mining, action, settings);
    }

    get maxRockHP() {
        const rock = this.action;
        if (rock.fixedMaxHP !== undefined) {
            return rock.fixedMaxHP;
        }
        let rockHP = this.skill.baseRockHP;
        if (this.isMelvorPoolTierActive(3)) {
            rockHP += 10;
        }
        rockHP += this.changeInMasteryLevel;
        rockHP += this.modifiers.getValue(
            "melvorD:flatMiningNodeHP" /* ModifierIDs.flatMiningNodeHP */,
            this.getActionModifierQuery()
        )
        return Math.max(rockHP, 1);
    }

    get rockHPPreserveChance() {
        return this.modifiers.getValue(
            "melvorD:noMiningNodeDamageChance" /* ModifierIDs.noMiningNodeDamageChance */,
            this.getActionModifierQuery()
        );
    }

    get averageAttemptTime() {
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
        let respawnModifier = this.modifiers.getValue(
            "melvorD:miningNodeRespawnInterval" /* ModifierIDs.miningNodeRespawnInterval */,
            this.getActionModifierQuery()
        );
        if (this.isMelvorPoolTierActive(1) || this.isAbyssalPoolTierActive(1)) {
            respawnModifier -= 10;
        }
        respawnInterval *= 1 + respawnModifier / 100;
        respawnInterval = Math.max(respawnInterval, 250);
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

    isMasteryActionUnlocked(action: MiningRock, skillLevel: number) {
        return super.isBasicSkillRecipeUnlocked(action, skillLevel) && this.totalCurrentMasteryLevel >= action.totalMasteryRequired;
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.isMelvorPoolTierActive(2)) {
            modifier -= 200;
        }
        if (this.isAbyssalPoolTierActive(3)) {
            modifier -= 200;
        }
        return modifier;
    }
}
import type {Thieving} from "../../Game-Files/gameTypes/thieving2";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";

export class EtaThieving extends EtaSkillWithMastery {
    constructor(game: Game, thieving: Thieving, action: any, settings: Settings) {
        super(game, thieving, action, settings);
    }

    get avoidStunChance() {
        return this.modifiers.getValue(
            "melvorD:thievingStunAvoidanceChance" /* ModifierIDs.thievingStunAvoidanceChance */,
            this.getActionModifierQuery()
        );
    }

    get stunInterval() {
        let interval = this.skill.baseStunInterval;
        interval *= 1 + this.modifiers.getValue(
            "melvorD:thievingStunInterval" /* ModifierIDs.thievingStunInterval */,
            this.getActionModifierQuery()
        ) / 100;

        // @ts-ignore
        interval = roundToTickInterval(interval);
        return Math.max(interval, this.settings.get('minimalActionTime'));
    }

    get successRate() {
        return this.getNPCSuccessRate() / 100;
    }

    get averageAttemptTime() {
        const failRate = 1 - this.getNPCSuccessRate() / 100;
        const avoidStunRate = this.avoidStunChance / 100;
        return (this.actionInterval + failRate * (1 - avoidStunRate) * this.stunInterval);
    }

    getNPCSuccessRate() {
        const successRate = (100 * (100 + this.getStealthAgainstNPC())) / (100 + this.action.perception);
        if (successRate < 0) {
            return 0;
        }
        if (successRate > 100) {
            return 100;
        }
        return successRate;
    }

    getStealthAgainstNPC() {
        const mastery = this.masteryLevel;
        let stealth = this.skillLevel + mastery;
        if (mastery >= 99) {
            stealth += 75;
        }
        if (this.isPoolTierActive(0)) {
            stealth += 30;
        }
        if (this.isPoolTierActive(3)) {
            stealth += 100;
        }
        stealth += this.modifiers.getValue(
            "melvorD:thievingStealth" /* ModifierIDs.thievingStealth */,
            this.getActionModifierQuery()
        );
        return stealth;
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.checkMasteryMilestone(50)) {
            modifier -= 200;
        }
        if (this.isPoolTierActive(1)) {
            modifier -= 200;
        }
        return modifier;
    }

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        if (this.action.id === "melvorF:FISHERMAN" /* ThievingNPCIDs.FISHERMAN */) {
            modifier += this.modifiers.summoningSynergy_Octopus_Leprechaun;
        }
        return modifier;
    }

    getXPModifier() {
        let modifier = super.getXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 3;
        }
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(1)) {
            modifier += 3;
        }
        return modifier;
    }
}
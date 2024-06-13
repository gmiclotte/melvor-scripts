import type {Firemaking} from "../../Game-Files/gameTypes/firemakingTicks";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import {EtaCosts} from "./EtaCosts";

export class EtaFiremaking extends ResourceSkillWithMastery {
    constructor(game: Game, firemaking: Firemaking, action: any, settings: Settings) {
        super(game, firemaking, action, settings);
    }

    get masteryModifiedInterval() {
        return this.action.baseInterval * 0.6;
    }

    get actionInterval() {
        return this.modifyInterval(this.action.baseInterval);
    }

    actionXP(realmID: string) {
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            return super.actionXP(realmID) * (1 + this.skill.bonfireBonusXP / 100);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return super.actionXP(realmID) * (1 + this.skill.bonfireBonusAXP / 100);
        }
        return 0;
    }

    getCurrentRecipeCosts() {
        const costs = new EtaCosts();
        costs.addItem(this.action.log, 1);
        return costs;
    }

    getPercentageIntervalModifier() {
        let modifier = super.getPercentageIntervalModifier();
        if (this.isMelvorPoolTierActive(1) || this.isAbyssalPoolTierActive(2)) {
            modifier -= 10;
        }
        modifier -= this.changeInMasteryLevel * 0.1;
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
            modifier += 5;
        }
        if (this.isMelvorPoolTierActive(3)) {
            modifier += 5;
        }
        if (this.checkMasteryMilestone(99)) {
            modifier += 0.25;
        }
        return modifier;
    }
}
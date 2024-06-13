import type {Herblore} from "../../Game-Files/gameTypes/herblore";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";

export class EtaHerblore extends ResourceSkillWithMastery {
    constructor(game: Game, herblore: Herblore, action: any, settings: Settings) {
        super(game, herblore, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    getPreservationChance(chance: number) {
        chance += this.changeInMasteryLevel * 0.2;
        if (this.checkMasteryMilestone(99)) {
            chance += 5;
        }
        if (this.isMelvorPoolTierActive(2)) {
            chance += 5;
        }
        if (this.isAbyssalPoolTierActive(1)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }

    getMelvorXPModifier() {
        let modifier = super.getMelvorXPModifier();
        if (this.isMelvorPoolTierActive(1)) {
            modifier += 3;
        }
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}
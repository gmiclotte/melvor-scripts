import {Herblore} from "../../Game-Files/built/herblore";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaHerblore extends ResourceSkillWithMastery {
    constructor(game: Game, herblore: Herblore, action: any, settings: Settings) {
        super(game, herblore, action, settings);
    }

    get masteryModifiedInterval() {
        return 1700;
    }

    getPreservationChance(chance: number) {
        const masteryLevel = this.masteryLevel;
        chance += (masteryLevel - 1) * 0.2;
        if (masteryLevel >= 99) {
            chance += 5;
        }
        if (this.isPoolTierActive(2)) {
            chance += 5;
        }
        return super.getPreservationChance(chance);
    }

    getXPModifier() {
        let modifier = super.getXPModifier();
        if (this.isPoolTierActive(1)) {
            modifier += 3;
        }
        return modifier;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}
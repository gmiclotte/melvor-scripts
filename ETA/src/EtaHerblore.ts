import {Herblore} from "../../Game-Files/built/herblore";
import {Settings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaHerblore extends ResourceSkill {
    constructor(game: Game, herblore: Herblore, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: Settings) {
        super(game, herblore, action, modifiers, astrology, settings);
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
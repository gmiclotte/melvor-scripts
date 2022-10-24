import {Smithing} from "../../Game-Files/built/smithing";
import {Settings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaSmithing extends ResourceSkill {
    constructor(game: Game, smithing: Smithing, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: Settings) {
        super(game, smithing, action, modifiers, astrology, settings);
    }

    get masteryModifiedInterval() {
        return 1700;
    }

    getPreservationChance(chance: number) {
        const masteryLevel = this.masteryLevel;
        chance += Math.floor(masteryLevel / 20) * 5;
        if (masteryLevel >= 99) {
            chance += 10;
        }
        if (this.isPoolTierActive(1)) {
            chance += 5;
        }
        if (this.isPoolTierActive(2)) {
            chance += 5;
        }
        if (this.action.category.id === "melvorD:DragonGear") {
            chance += this.modifiers.increasedSmithingDragonGearPreservation;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }
}
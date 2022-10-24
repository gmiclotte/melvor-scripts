import {Crafting} from "../../Game-Files/built/crafting";
import {Settings} from "./Settings";
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaCrafting extends ResourceSkill {
    constructor(game: Game, crafting: Crafting, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: Settings) {
        super(game, crafting, action, modifiers, astrology, settings);
    }

    get masteryModifiedInterval() {
        return 1650;
    }

    getPreservationChance(chance: number): number {
        const masteryLevel = this.masteryLevel;
        chance += (masteryLevel - 1) * 0.2;
        if (masteryLevel >= 99) {
            chance += 5;
        }
        if (this.isPoolTierActive(1)) {
            chance += 5;
        }
        const categoryID = this.action.category.id;
        if (categoryID === "melvorF:Necklaces" || categoryID === "melvorF:Rings") {
            chance += this.modifiers.increasedCraftingJewelryPreservation;
        }
        return super.getPreservationChance(chance);
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.isPoolTierActive(2)) {
            modifier -= 200;
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
import {Crafting} from "../../Game-Files/built/crafting";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";

export class EtaCrafting extends ResourceSkillWithMastery {
    constructor(game: Game, crafting: Crafting, action: any, settings: Settings) {
        super(game, crafting, action, settings);
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
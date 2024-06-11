import type {Smithing} from "../../Game-Files/gameTypes/smithing";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";

export class EtaSmithing extends ResourceSkillWithMastery {
    constructor(game: Game, smithing: Smithing, action: any, settings: Settings) {
        super(game, smithing, action, settings);
    }
    /*
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

    modifyItemCost(item: Item, quantity: number) {
        // @ts-ignore
        if (item.id === "melvorD:Coal_Ore") {
            // @ts-ignore
            quantity = applyModifier(quantity, this.modifiers.decreasedSmithingCoalCost, 2);
            quantity -= this.modifiers.decreasedFlatSmithingCoalCost;
            return quantity;
        }
        return quantity;
    }
    */
}
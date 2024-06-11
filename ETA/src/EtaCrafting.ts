import type {Crafting} from "../../Game-Files/gameTypes/crafting";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";

export class EtaCrafting extends ResourceSkillWithMastery {
    constructor(game: Game, crafting: Crafting, action: any, settings: Settings) {
        super(game, crafting, action, settings);
    }
/*
    get masteryModifiedInterval() {
        return 1650;
    }

    getPreservationChance(chance: number): number {
        const masteryLevel = this.masteryLevel;
        chance += (masteryLevel - 1) * 0.2;
        if (checkMasteryMilestone(99)) {
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

    modifyItemCost(item: Item, quantity: number) {
        if (this.action.category.id === "melvorF:Dragonhide") {
            quantity -= this.modifiers.decreasedFlatCraftingDragonhideCost;
            quantity = Math.max(1, quantity);
        }
        return quantity;
    }
    
 */
}

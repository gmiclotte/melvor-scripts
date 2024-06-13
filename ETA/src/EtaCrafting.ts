import type {Crafting} from "../../Game-Files/gameTypes/crafting";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";

export class EtaCrafting extends ResourceSkillWithMastery {
    constructor(game: Game, crafting: Crafting, action: any, settings: Settings) {
        super(game, crafting, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    getPreservationChance(chance: number): number {
        const masteryLevel = this.masteryLevel;
        chance += (masteryLevel - 1) * 0.2;
        if (this.checkMasteryMilestone(99)) {
            chance += 5;
        }
        if (this.isPoolTierActive(1)) {
            chance += 5;
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

    getFlatCostReduction(item: Item) {
        let reduction = super.getFlatCostReduction(item);
        // TODO: Convert to category scoped modifier
        // Monkey + Pig Synergy: Dragonhide cost reduced by 1. Minimum 1.
        if (this.action.category.id === "melvorF:Dragonhide" /* CraftingCategoryIDs.Dragonhide */) {
            reduction += this.modifiers.flatCraftingDragonhideCost;
        }
        return reduction;
    }
}

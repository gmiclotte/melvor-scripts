import type {Fletching} from "../../Game-Files/gameTypes/fletching";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {EquipmentItem, Item} from "../../Game-Files/gameTypes/item";

export class EtaFletching extends ResourceSkillWithMastery {
    constructor(game: Game, fletching: Fletching, action: any, settings: Settings) {
        super(game, fletching, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    getPreservationChance(chance: number) {
        chance += 0.2 * this.changeInMasteryLevel;
        if (this.checkMasteryMilestone(99)) {
            chance += 5;
        }
        return super.getPreservationChance(chance);
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.isMelvorPoolTierActive(3)) {
            modifier -= 200;
        }
        if (this.isAbyssalPoolTierActive(3)) {
            modifier -= 200;
        }
        return modifier;
    }

    doesRecipeMakeArrows() {
        const product = this.action.product;
        // @ts-ignore
        return product instanceof EquipmentItem
            // @ts-ignore
            && product.ammoType === AmmoTypeID.Arrows;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    getRecipeCosts() {
        const costs = super.getRecipeCosts();
        if (this.action.alternativeCosts !== undefined) {
            const altID = this.skill.setAltRecipes.get(this.action) ?? 0;
            const altCosts = this.action.alternativeCosts[altID];
            altCosts.itemCosts.forEach((cost: { item: Item, quantity: number }) => {
                costs.addItem(cost.item, this.modifyItemCost(cost.item, cost.quantity));
            });
        }
        return costs;
    }
}
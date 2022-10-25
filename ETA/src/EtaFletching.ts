import {Fletching} from "../../Game-Files/built/fletching";
import {Settings} from "./Settings";
import {ResourceSkill} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";
import {EquipmentItem, Item} from "../../Game-Files/built/item";

export class EtaFletching extends ResourceSkill {
    constructor(game: Game, fletching: Fletching, action: any, settings: Settings) {
        super(game, fletching, action, settings);
    }

    get masteryModifiedInterval() {
        return 1300;
    }

    getPreservationChance(chance: number) {
        const masteryLevel = this.masteryLevel;
        chance += 0.2 * (masteryLevel - 1);
        if (masteryLevel >= 99) {
            chance += 5;
        }
        return super.getPreservationChance(chance);
    }

    getFlatIntervalModifier() {
        let modifier = super.getFlatIntervalModifier();
        if (this.isPoolTierActive(3)) {
            modifier -= 200;
        }
        if (this.doesRecipeMakeArrows()) {
            modifier -= this.modifiers.decreasedFletchingIntervalWithArrows
                + this.modifiers.increasedFletchingIntervalWithArrows;
        }
        return modifier;
    }

    doesRecipeMakeArrows() {
        const product = this.action.product;
        return product instanceof EquipmentItem
            // @ts-ignore
            && product.ammoType === AmmoTypeID.Arrows;
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    getRecipeCosts() {
        const costs = super.getRecipeCosts();
        if (this.action.alternativeCosts !== undefined) {
            const altID = this.skill.setAltRecipes.get(this.action);
            const altCosts = this.action.alternativeCosts[altID ?? 0];
            altCosts.itemCosts.forEach((cost: { item: Item, quantity: number }) => {
                costs.addItem(cost.item, this.modifyItemCost(cost.item, cost.quantity));
            });
        }
        return costs;
    }
}
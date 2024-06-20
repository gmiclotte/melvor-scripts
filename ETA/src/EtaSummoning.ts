import type {Summoning} from "../../Game-Files/gameTypes/summoning";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";
import type {Costs} from "../../Game-Files/gameTypes/skill";
import type {Currency} from "../../Game-Files/gameTypes/currency";

export class EtaSummoning extends ResourceSkillWithMastery {

    constructor(game: Game, summoning: Summoning, action: any, settings: Settings) {
        super(game, summoning, action, settings);
    }

    get masteryModifiedInterval() {
        return this.skill.masteryModifiedInterval;
    }

    getNonShardCostReduction(item: Item | undefined) {
        if (this.action.id === "melvorF:Salamander" /* SummoningRecipeIDs.Salamander */
            && this.modifiers.disableSalamanderItemReduction && item !== undefined) {
            return 0;
        }
        let modifier = this.getUncappedCostReduction(item);
        modifier += this.modifiers.getValue(
            "melvorD:nonShardSummoningCostReduction" /* ModifierIDs.nonShardSummoningCostReduction */,
            this.getActionModifierQuery()
        );
        // Non-Shard Cost reduction that scales with mastery level
        modifier += this.changeInXMasteryLevel(10) * 5;
        // Level 99 Mastery: 5% Non Shard Cost Reduction
        if (this.checkMasteryMilestone(99)) {
            modifier += 5;
        }
        return Math.min(80, modifier);
    }

    modifyNonShardItemCost(item: Item, quantity: number) {
        const costReduction = this.getNonShardCostReduction(item);
        quantity *= 1 - costReduction / 100;
        quantity = Math.ceil(quantity);
        quantity -= this.getFlatCostReduction(item);
        return Math.max(1, quantity);
    }

    getFlatCostReduction(item: Item | undefined) {
        let reduction = super.getFlatCostReduction(item);
        if (item === undefined || item.type !== 'Shard') {
            return reduction;
        }
        // handle shards
        reduction -= this.modifiers.getValue(
            "melvorD:flatSummoningShardCost" /* ModifierIDs.flatSummoningShardCost */,
            this.getActionModifierQuery()
        );
        // Level 50 Mastery: +1 Shard Cost Reduction
        if (this.checkMasteryMilestone(50)) {
            reduction--;
        }
        // Level 99 Mastery: +1 Shard Cost Reduction
        if (this.checkMasteryMilestone(99)) {
            reduction--;
        }
        // Tier 2 Mastery Pool: +1 Shard Cost Reduction for Tier 1 and Tier 2 Tablets
        if ((this.action.tier === 1 || this.action.tier === 2) && this.isMelvorPoolTierActive(1)) {
            reduction--;
        }
        // Tier 4 Mastery Pool: +1 Shard Cost Reduction for Tier 3 Tablets
        if (this.action.tier === 3 && this.isMelvorPoolTierActive(3)) {
            reduction--;
        }
        if (this.isAbyssalPoolTierActive(1)) {
            reduction -= 3;
        }
        // grab modifier reductions
        switch (this.action.tier) {
            case 1:
                reduction -= this.modifiers.flatTier1SummoningShardCost;
                break;
            case 2:
                reduction -= this.modifiers.flatTier2SummoningShardCost;
                break;
            case 3:
                reduction -= this.modifiers.flatTier3SummoningShardCost;
                break;
        }
        return reduction;
    }

    modifyCurrencyCost(currency: Currency, quantity: number) {
        const costReduction = this.getNonShardCostReduction(undefined);
        quantity *= 1 - costReduction / 100;
        quantity = Math.ceil(quantity);
        quantity -= this.getFlatCostReduction(undefined);
        return Math.max(1, quantity);
    }

    getPreservationChance(chance: number) {
        // Tier 3 Mastery Pool: +10% Resource Preservation chance
        if (this.isMelvorPoolTierActive(2) || this.isAbyssalPoolTierActive(2)) {
            chance += 10;
        }
        return super.getPreservationChance(chance);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isMelvorPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    addNonShardCosts(costs: Costs) {
        const nonShardItem = this.skill.selectedNonShardCosts.get(this.action) ?? this.action.nonShardItemCosts[0];
        const salePrice = Math.max(20, nonShardItem.sellsFor.quantity);
        const recipeCost = nonShardItem.sellsFor.currency.id === "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */
            // @ts-ignore
            ? Summoning.recipeAPCost : Summoning.recipeGPCost;
        const baseQuantity = recipeCost / salePrice;
        const qtyToAdd = this.modifyNonShardItemCost(nonShardItem, baseQuantity);
        costs.addItem(nonShardItem, qtyToAdd);
    }

    getAltRecipeCosts() {
        const costs = super.getRecipeCosts();
        if (this.action.nonShardItemCosts.length > 0) {
            this.addNonShardCosts(costs);
        }
        return costs;
    }

    getRecipeCosts() {
        return this.getAltRecipeCosts();
    }
}
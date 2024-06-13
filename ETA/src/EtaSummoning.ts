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

    getNonShardCostReductionModifier() {
        if (this.action.id === "melvorF:Salamander" && this.modifiers.disableSalamanderItemReduction) {
            return 100;
        }
        // Equipped summon cost reduction
        let modifier = 100;
        modifier -= this.modifiers.getValue(
            "melvorD:nonShardSummoningCostReduction", // ModifierIDs.nonShardSummoningCostReduction
            this.getActionModifierQuery()
        );
        // Non-Shard Cost reduction that scales with mastery level
        modifier -= this.changeIn10MasteryLevel * 5;
        // Level 99 Mastery: 5% Non Shard Cost Reduction
        if (this.checkMasteryMilestone(99)) {
            modifier -= 5;
        }
        return Math.max(0, modifier);
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
            reduction-=3;
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
        quantity = super.modifyCurrencyCost(currency, quantity);
        const modifier = this.getNonShardCostReductionModifier();
        // @ts-ignore
        quantity = applyModifier(quantity, modifier, 3);
        return Math.max(1, Math.floor(quantity));
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
        const modifier = this.getNonShardCostReductionModifier();
        const recipeCost = nonShardItem.sellsFor.currency.id === "melvorItA:AbyssalPieces" /* CurrencyIDs.AbyssalPieces */
            // @ts-ignore
            ? Summoning.recipeAPCost : Summoning.recipeGPCost;
        // @ts-ignore
        const itemValueRequired = applyModifier(recipeCost, modifier, 3);
        const qtyToAdd = Math.max(1, Math.floor(itemValueRequired / salePrice));
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
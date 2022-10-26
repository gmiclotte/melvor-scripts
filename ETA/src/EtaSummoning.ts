import {Summoning} from "../../Game-Files/built/summoning";
import {Settings} from "./Settings";
import {ResourceSkillWithMastery} from "./ResourceSkill";
import {Game} from "../../Game-Files/built/game";
import {Item} from "../../Game-Files/built/item";
import {Player} from "../../Game-Files/built/player";
import {Costs} from "../../Game-Files/built/skill";

export class EtaSummoning extends ResourceSkillWithMastery {
    private readonly player: Player;

    constructor(game: Game, summoning: Summoning, action: any, settings: Settings) {
        super(game, summoning, action, settings);
        this.player = game.combat.player;
    }

    get masteryModifiedInterval() {
        return 4850;
    }

    getNonShardCostReductionModifier() {
        if (this.action.id === "melvorF:Salamander" && this.modifiers.disableSalamanderItemReduction) {
            return 0;
        }
        const masteryLevel = this.masteryLevel;
        let modifier = 0;
        // Non-Shard Cost reduction that scales with mastery level
        modifier += Math.floor(masteryLevel / 10) * 5;
        // Level 99 Mastery: +5% Non Shard Cost Reduction
        if (masteryLevel >= 99) {
            modifier += 5;
        }
        // Equipped summon cost reduction
        const equippedModifier = this.modifiers.decreasedNonShardCostForEquippedTablets
            - this.modifiers.increasedNonShardCostForEquippedTablets;
        const summon1 = this.player.equipment.slots.Summon1;
        const summon2 = this.player.equipment.slots.Summon2;
        if (this.action.product === summon1.item || this.action.product === summon2.item) {
            modifier += equippedModifier;
        }
        return modifier;
    }

    modifyItemCost(item: Item, quantity: number) {
        const masteryLevel = this.masteryLevel;
        if (item.type === 'Shard') {
            // Level 50 Mastery: +1 Shard Cost Reduction
            if (masteryLevel >= 50) {
                quantity--;
            }
            // Level 99 Mastery: +1 Shard Cost Reduction
            if (masteryLevel >= 99) {
                quantity--;
            }
            // Generic Shard Cost Decrease modifier
            quantity += this.modifiers.increasedSummoningShardCost - this.modifiers.decreasedSummoningShardCost;
            // Tier 2 Mastery Pool: +1 Shard Cost Reduction for Tier 1 and Tier 2 Tablets
            if ((this.action.tier === 1 || this.action.tier === 2) && this.isPoolTierActive(1)) {
                quantity--;
            }
            // Tier 4 Mastery Pool: +1 Shard Cost Reduction for Tier 3 Tablets
            if (this.action.tier === 3 && this.isPoolTierActive(3)) {
                quantity--;
            }
        }
        return Math.max(1, quantity);
    }

    modifyGPCost() {
        let gpCost = super.modifyGPCost();
        gpCost *= 1 - this.getNonShardCostReductionModifier() / 100;
        return Math.max(1, Math.floor(gpCost));
    }

    modifySCCost() {
        let scCost = super.modifySCCost();
        scCost *= 1 - this.getNonShardCostReductionModifier() / 100;
        return Math.max(1, Math.floor(scCost));
    }

    getPreservationChance(chance: number) {
        // Tier 3 Mastery Pool: +10% Resource Preservation chance
        if (this.isPoolTierActive(2)) {
            chance += 10;
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

    addNonShardCosts(altID: number, costs: Costs) {
        const item = this.action.nonShardItemCosts[altID];
        const salePrice = Math.max(20, item.sellsFor);
        const itemValueRequired = Summoning.recipeGPCost * (1 - this.getNonShardCostReductionModifier() / 100);
        const qtyToAdd = Math.max(1, Math.floor(itemValueRequired / salePrice));
        costs.addItem(item, qtyToAdd);
    }

    getAltRecipeCosts() {
        const altID = this.skill.setAltRecipes.get(this.action);
        const costs = super.getRecipeCosts();
        if (this.action.nonShardItemCosts.length > 0) {
            this.addNonShardCosts(altID, costs);
        }
        return costs;
    }

    getRecipeCosts() {
        return this.getAltRecipeCosts();
    }
}
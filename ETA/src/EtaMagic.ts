import {AltMagic} from "../../Game-Files/built/altMagic";
import {Settings} from "./Settings";
import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import {Item} from "../../Game-Files/built/item";
import {Costs} from "../../Game-Files/built/skill";
import {Game} from "../../Game-Files/built/game";
import {ResourceActionCounter} from "./ResourceActionCounter";

export class EtaMagic extends ResourceSkillWithoutMastery {
    protected runeCostQuantityMap: Map<Item, number>;
    private game: Game;
    private consumptionID: any;

    constructor(game: Game, magic: AltMagic, action: any, settings: Settings) {
        const args: [Game, any, any, Settings] = [game, magic, action, settings];
        super(...args);
        this.game = game;
        // @ts-ignore
        this.consumptionID = AltMagicConsumptionID;
        this.runeCostQuantityMap = new Map<Item, number>();
    }

    get runePreservationChance() {
        return this.modifiers.increasedRunePreservation
            - this.modifiers.decreasedRunePreservation
            + this.modifiers.increasedAltMagicRunePreservation
            - this.modifiers.decreasedAltMagicRunePreservation;
    }

    init(game: Game) {
        super.init(game);
        this.runeCostQuantityMap = new Map<Item, number>();
        this.getRuneRecipeCosts().getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
            this.runeCostQuantityMap.set(cost.item, cost.quantity);
        });
        // actions performed
        this.runeCostQuantityMap.forEach((_: number, item: Item) => {
            this.actionsTaken.active.items.set(item, 0);
        });
        // set up remaining resources
        this.runeCostQuantityMap.forEach((_: number, item: Item) => {
            const amt = this.remainingResources.items.get(item) ?? 0;
            this.remainingResources.items.set(item, amt + game.bank.getQty(item));
        });
        // flag to check if target was already reached
        this.resourcesReached = false;
    }

    actionsToResourceCheckpoint() {
        const actionsToRuneCheckpoint: number[] = [];
        this.runeCostQuantityMap.forEach((quantity: number, item: Item) => {
            const itemCost = this.costQuantityMap.get(item);
            if (itemCost) {
                quantity += itemCost;
            }
            actionsToRuneCheckpoint.push((this.remainingResources.items.get(item) ?? 0) / quantity);
        });
        const runeSets = Math.min(...actionsToRuneCheckpoint);
        if (runeSets <= 0) {
            return 0;
        }
        // apply preservation
        return Math.ceil(Math.min(
            super.actionsToResourceCheckpoint(),
            runeSets / (1 - this.runePreservationChance / 100),
        ));
    }

    addCost(counter: ResourceActionCounter, actions: number) {
        super.addCost(counter, actions);
        const resourceSetsUsed = actions * (1 - this.runePreservationChance / 100);
        this.runeCostQuantityMap.forEach((quantity: number, item: Item) => {
            const amt = counter.items.get(item) ?? 0;
            counter.items.set(item, amt + quantity * resourceSetsUsed);
        });
    }

    getPreservationChance(chance: number): number {
        return 0;
    }

    getXPModifier() {
        // Note: creasedNonCombatSkillXP is handled in super.getXPModifier
        return super.getXPModifier()
            + this.game.modifiers.increasedAltMagicSkillXP
            - this.game.modifiers.decreasedAltMagicSkillXP;
    }

    getRuneRecipeCosts() {
        const costs = new Costs({});
        // rune costs
        this.game.combat.player.getRuneCosts(this.action).forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        return costs;
    }

    getRecipeCosts() {
        const costs = new Costs({});
        // variable item costs
        switch (this.action.specialCost.type) {
            case this.consumptionID.AnyItem:
            case this.consumptionID.JunkItem:
            case this.consumptionID.AnySuperiorGem:
            case this.consumptionID.AnyNormalFood:
                if (this.skill.selectedConversionItem !== undefined)
                    costs.addItem(this.skill.selectedConversionItem, this.action.specialCost.quantity);
                break;
            case this.consumptionID.BarIngredientsWithCoal:
                if (this.skill.selectedSmithingRecipe !== undefined)
                    return this.skill.getSuperheatBarCosts(this.skill.selectedSmithingRecipe, true, this.action.specialCost.quantity);
                break;
            case this.consumptionID.BarIngredientsWithoutCoal:
                if (this.skill.selectedSmithingRecipe !== undefined)
                    return this.skill.getSuperheatBarCosts(this.skill.selectedSmithingRecipe, false, this.action.specialCost.quantity);
                break;
            case this.consumptionID.None:
                break;
        }
        // fixed item costs
        this.action.fixedItemCosts.forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        return costs;
    }
}
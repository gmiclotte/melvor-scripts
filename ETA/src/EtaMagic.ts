import type {AltMagic} from "../../Game-Files/gameTypes/altMagic";
import {Settings} from "./Settings";
import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import type {Item} from "../../Game-Files/gameTypes/item";
import type {Costs} from "../../Game-Files/gameTypes/skill";
import type {Game} from "../../Game-Files/gameTypes/game";
import {ResourceActionCounter} from "./ResourceActionCounter";

export class EtaMagic extends ResourceSkillWithoutMastery {
    protected runeCostQuantityMap: Map<Item, number>;
    private game: Game;
    private consumptionID: any;
    private productionID: any;

    constructor(game: Game, magic: AltMagic, action: any, settings: Settings) {
        const args: [Game, any, any, Settings] = [game, magic, action, settings];
        super(...args);
        this.game = game;
        // @ts-ignore
        this.consumptionID = AltMagicConsumptionID;
        // @ts-ignore
        this.productionID = AltMagicProductionID;
        this.runeCostQuantityMap = new Map<Item, number>();
    }

    actionXP(): number {
        let xp = this.action.baseExperience;
        if (this.action.produces === this.productionID.MagicXP && this.skill.selectedConversionItem) {
            xp += this.skill.selectedConversionItem.sellsFor * 0.03;
        }
        return this.modifyXP(xp);
    }

    get runePreservationChance() {
        const runePreservation = this.modifiers.increasedRunePreservation
            - this.modifiers.decreasedRunePreservation
            + this.modifiers.increasedAltMagicRunePreservation
            - this.modifiers.decreasedAltMagicRunePreservation;
        if (runePreservation < 0) {
            return 0;
        }
        if (runePreservation > 100) {
            return 1;
        }
        return runePreservation / 100;
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
            this.remainingResources.items.set(item, game.bank.getQty(item));
        });
        // flag to check if target was already reached
        this.resourcesReached = false;
    }

    attemptsToResourceCheckpoint() {
        const attemptsToRuneCheckpoint: number[] = [];
        this.runeCostQuantityMap.forEach((quantity: number, item: Item) => {
            const itemCost = this.costQuantityMap.get(item) ?? 0;
            quantity = quantity * (1 - this.runePreservationChance) + itemCost;
            attemptsToRuneCheckpoint.push((this.remainingResources.items.get(item) ?? 0) / quantity);
        });
        const runeSets = Math.min(...attemptsToRuneCheckpoint);
        if (runeSets <= 0) {
            return 0;
        }
        // apply preservation
        return Math.ceil(Math.min(
            super.attemptsToResourceCheckpoint(),
            runeSets,
        ));
    }

    addCost(counter: ResourceActionCounter, attempts: number, preservation: number) {
        super.addCost(counter, attempts, preservation);
        // no need to compute rune preservation before adding xp, since there is no pool or mastery bonus to worry about
        const resourceSetsUsed = attempts * (1 - this.runePreservationChance);
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
        // @ts-ignore
        const costs = new Costs({});
        // rune costs
        this.game.combat.player.getRuneCosts(this.action).forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        return costs;
    }

    getRecipeCosts() {
        // @ts-ignore
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
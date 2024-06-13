import type {AltMagic} from "../../Game-Files/gameTypes/altMagic";
import {Settings} from "./Settings";
import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import type {Item} from "../../Game-Files/gameTypes/item";
import type {Game} from "../../Game-Files/gameTypes/game";
import {ResourceActionCounter} from "./ResourceActionCounter";
import {EtaCosts} from "./EtaCosts";
import {ResourceRates} from "./ResourceRates";
import {Currency} from "../../Game-Files/gameTypes/currency";

export class EtaMagic extends ResourceSkillWithoutMastery {
    private game: Game;
    private consumptionID: any;
    private productionID: any;
    protected originalRuneCosts: EtaCosts;
    protected currentRuneCosts: EtaCosts;
    private AltMagicConsumptionID: any;

    constructor(game: Game, magic: AltMagic, action: any, settings: Settings) {
        const args: [Game, any, any, Settings] = [game, magic, action, settings];
        super(...args);
        this.game = game;
        // @ts-ignore
        this.consumptionID = AltMagicConsumptionID;
        // @ts-ignore
        this.productionID = AltMagicProductionID;
        this.originalRuneCosts = new EtaCosts();
        this.currentRuneCosts = new EtaCosts();
        // @ts-ignore
        this.AltMagicConsumptionID = AltMagicConsumptionID;
    }

    skip() {
        return this.action !== this.skill.selectedSpell;
    }

    get runePreservationChance() {
        let preserveChance = this.modifiers.getRunePreservationChance();
        preserveChance += this.game.modifiers.altMagicRunePreservationChance;
        return Math.min(preserveChance, 80) / 100;
    }

    actionXP(): number {
        let xp = this.action.baseExperience;
        if (this.action.produces === this.productionID.MagicXP && this.skill.selectedConversionItem) {
            xp += this.skill.selectedConversionItem.sellsFor.quantity * 0.03;
        }
        return this.modifyXP(xp);
    }

    init(game: Game) {
        super.init(game);

        // set up rune costs
        this.originalRuneCosts = this.getCurrentRecipeRuneCosts();
        this.currentRuneCosts = this.getCurrentRecipeRuneCosts();

        // populate
        this.originalRuneCosts.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
            this.actionsTaken.active.items.set(cost.item, 0);
            this.remainingResources.items.set(cost.item, game.bank.getQty(cost.item));
        });

        // flag to check if target was already reached
        this.resourcesReached = false;
    }

    attemptsToResourceCheckpoint() {
        const attemptsToCheckpoint: number[] = [];
        this.currentRuneCosts.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
            // @ts-ignore
            const itemCost = this.currentCosts._items.get(cost.item) ?? 0;
            const quantity = cost.quantity * (1 - this.runePreservationChance) + itemCost;
            attemptsToCheckpoint.push((this.remainingResources.items.get(cost.item) ?? 0) / quantity);
        })
        const runeSets = Math.min(...attemptsToCheckpoint, Infinity);
        if (runeSets <= 0) {
            return 0;
        }
        //
        return Math.ceil(Math.min(
            super.attemptsToResourceCheckpoint(),
            runeSets,
        ));
    }

    addCost(counter: ResourceActionCounter, attempts: number, preservation: number) {
        super.addCost(counter, attempts, preservation);
        // no need to compute rune preservation before adding xp, since there is no pool or mastery bonus to worry about
        const resourceSetsUsed = attempts * (1 - this.runePreservationChance);
        this.currentRuneCosts.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
            const amt = counter.items.get(cost.item) ?? 0;
            counter.items.set(cost.item,  amt + cost.quantity * resourceSetsUsed);
        })
    }

    getPreservationChance(chance: number): number {
        return 0;
    }

    getXPModifier() {
        let modifier = super.getXPModifier();
        modifier += this.game.modifiers.altMagicSkillXP + this.game.modifiers.nonCombatSkillXP;
        return modifier;
    }

    getCurrentRecipeRuneCosts() {
        const costs = new EtaCosts();
        // rune costs
        this.game.combat.player.getRuneCosts(this.action).forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        return costs;
    }

    getCurrentRecipeCosts() {
        const costs = new EtaCosts();
        switch (this.action.specialCost.type) {
            case this.AltMagicConsumptionID.AnyItem:
            case this.AltMagicConsumptionID.JunkItem:
            case this.AltMagicConsumptionID.AnySuperiorGem:
            case this.AltMagicConsumptionID.AnyNormalFood:
                if (this.skill.selectedConversionItem !== undefined)
                    costs.addItem(this.skill.selectedConversionItem, this.action.specialCost.quantity);
                break;
            case this.AltMagicConsumptionID.BarIngredientsWithCoal:
                if (this.skill.selectedSmithingRecipe !== undefined)
                    return this.skill.getSuperheatBarCosts(this.skill.selectedSmithingRecipe, true, this.action.specialCost.quantity);
                break;
            case this.AltMagicConsumptionID.BarIngredientsWithoutCoal:
                if (this.skill.selectedSmithingRecipe !== undefined)
                    return this.skill.getSuperheatBarCosts(this.skill.selectedSmithingRecipe, false, this.action.specialCost.quantity);
                break;
            case this.AltMagicConsumptionID.None:
                break;
        }
        // Add Fixed Item costs
        this.action.fixedItemCosts.forEach((cost: { item: Item, quantity: number }) => {
            costs.addItem(cost.item, cost.quantity);
        });
        return costs;
    }
}
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceRates} from "./ResourceRates";
import {ETASettings} from "./Settings";
import {EtaSkill} from "./EtaSkill";
import {Game} from "../../Game-Files/built/game";
import {Item} from "../../Game-Files/built/item";

export class ResourceEtaSkill extends EtaSkill {
    public actionsTaken: ResourceRates;
    public timeTaken: ResourceRates;
    public resourcesReached: boolean;
    public remainingResources: ResourceRates;

    constructor(game: Game, skill: any, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: ETASettings) {
        super(game, skill, action, modifiers, astrology, settings);
        this.actionsTaken = ResourceRates.emptyRates;
        this.timeTaken = ResourceRates.emptyRates;
        this.remainingResources = ResourceRates.emptyRates;
        this.resourcesReached = false;
    }

    get itemCosts() {
        return this.action.itemCosts;
    }

    get gpCost() {
        return this.action.gpCost;
    }

    get scCost() {
        return this.action.scCost;
    }

    init() {
        super.init();
        // actions performed
        this.actionsTaken = ResourceRates.emptyRates;
        // time taken to perform actions
        this.timeTaken = ResourceRates.emptyRates;
        // set up remaining resources
        this.remainingResources = ResourceRates.emptyRates;
        this.remainingResources.gp = this.game.gp.amount;
        this.remainingResources.sc = this.game.slayerCoins.amount
        this.remainingResources.items = this.itemCosts.map((cost: { item: Item, quantity: number }) =>
            ({item: cost.item, quantity: this.game.bank.getQty(cost.item)}));
        // flag to check if target was already reached
        this.resourcesReached = false;
    }

    actionsToCheckpoint(gainsPerAction: ResourceRates) {
        return Math.ceil(Math.min(
            super.actionsToCheckpoint(gainsPerAction),
            this.actionsToResourceCheckpoint(),
        ));
    }

    actionsToResourceCheckpoint() {
        const actionsToCheckpoint = this.itemCosts.map((cost: { item: Item, quantity: number }, idx: number) =>
            this.remainingResources.items[idx].quantity / cost.quantity
        );
        if (this.gpCost) {
            actionsToCheckpoint.push(this.remainingResources.gp / this.gpCost);
        }
        if (this.scCost) {
            actionsToCheckpoint.push(this.remainingResources.sc / this.scCost);
        }
        return Math.ceil(Math.min(...actionsToCheckpoint));
    }

    addActions(gainsPerAction: ResourceRates, actions: number) {
        super.addActions(gainsPerAction, actions);
        this.itemCosts.map((cost: { item: Item, quantity: number }, idx: number) =>
            this.remainingResources.items[idx].quantity -= cost.quantity * actions
        );
        this.remainingResources.gp -= this.gpCost * actions
        this.remainingResources.sc -= this.scCost * actions
    }

    setFinalValues() {
        super.setFinalValues();
        if (!this.resourcesReached && this.actionsToResourceCheckpoint() === 0) {
            this.actionsTaken.resources = this.actionsTaken.ms;
            this.timeTaken.resources = this.timeTaken.ms;
            this.resourcesReached = true;
        }
    }
}
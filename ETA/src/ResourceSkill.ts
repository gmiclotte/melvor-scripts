import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceRates} from "./ResourceRates";
import {ETASettings} from "./Settings";
import {EtaSkill} from "./EtaSkill";
import {Game} from "../../Game-Files/built/game";
import {Item} from "../../Game-Files/built/item";
import {ResourceActionCounterWrapper} from "./ActionCounter";

export class ResourceSkill extends EtaSkill {
    public actionsTaken: ResourceActionCounterWrapper;
    public resourcesReached: boolean;
    public remainingResources: ResourceRates;

    constructor(game: Game, skill: any, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: ETASettings) {
        super(game, skill, action, modifiers, astrology, settings);
        this.actionsTaken = new ResourceActionCounterWrapper();
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

    get resourcesCompleted() {
        return !this.resourcesReached && this.actionsToResourceCheckpoint() === 0;
    }

    init(game: Game) {
        super.init(game);
        // actions performed
        this.actionsTaken.reset();
        // set up remaining resources
        this.remainingResources = ResourceRates.emptyRates;
        this.remainingResources.gp = game.gp.amount;
        this.remainingResources.sc = game.slayerCoins.amount
        this.remainingResources.items = this.itemCosts.map((cost: { item: Item, quantity: number }) =>
            ({item: cost.item, quantity: game.bank.getQty(cost.item)}));
        // flag to check if target was already reached
        this.resourcesReached = false;
    }

    actionsToCheckpoint(gainsPerAction: ResourceRates) {
        const resourceActions = this.actionsToResourceCheckpoint();
        if (resourceActions === 0) {
            // ran out of resources, now check other targets
            return super.actionsToCheckpoint(gainsPerAction);
        }
        return Math.ceil(Math.min(
            super.actionsToCheckpoint(gainsPerAction),
            resourceActions,
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
        const resourceSets = Math.min(...actionsToCheckpoint);
        if (resourceSets <= 0) {
            return 0;
        }
        // apply preservation
        return Math.ceil(resourceSets / (1 - this.getPreservationChance(0) / 100));
    }

    addActions(gainsPerAction: ResourceRates, actions: number) {
        super.addActions(gainsPerAction, actions);
        const resourceSetsUsed = actions * (1 - this.getPreservationChance(0) / 100);
        this.itemCosts.map((cost: { item: Item, quantity: number }, idx: number) =>
            this.remainingResources.items[idx].quantity -= cost.quantity * resourceSetsUsed
        );
        this.remainingResources.gp -= this.gpCost * resourceSetsUsed;
        this.remainingResources.sc -= this.scCost * resourceSetsUsed;
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.resourcesCompleted) {
            this.actionsTaken.resources = this.actionsTaken.active.clone();
            this.resourcesReached = true;
        }
    }

    getPreservationChance(chance: number): number {
        chance += this.modifiers.increasedGlobalPreservationChance
            - this.modifiers.decreasedGlobalPreservationChance;
        +this.modifiers.getSkillModifierValue('increasedSkillPreservationChance', this);
        -this.modifiers.getSkillModifierValue('decreasedSkillPreservationChance', this);
        return Math.min(chance, this.getPreservationCap());
    }

    getPreservationCap() {
        const baseCap = 80;
        return baseCap
            + this.modifiers.getSkillModifierValue('increasedSkillPreservationCap', this)
            - this.modifiers.getSkillModifierValue('decreasedSkillPreservationCap', this);
    }
}
import {PlayerModifiers} from "../../Game-Files/built/modifier";
import {Astrology} from "../../Game-Files/built/astrology";
import {ResourceRates} from "./ResourceRates";
import {Settings} from "./Settings";
import {EtaSkill} from "./EtaSkill";
import {Game} from "../../Game-Files/built/game";
import {Item} from "../../Game-Files/built/item";
import {ResourceActionCounter, ResourceActionCounterWrapper} from "./ResourceActionCounter";

export class ResourceSkill extends EtaSkill {
    public actionsTaken: ResourceActionCounterWrapper;
    public resourcesReached: boolean;
    public remainingResources: ResourceActionCounter;

    constructor(game: Game, skill: any, action: any, modifiers: PlayerModifiers, astrology: Astrology, settings: Settings) {
        super(game, skill, action, modifiers, astrology, settings);
        this.actionsTaken = new ResourceActionCounterWrapper();
        this.remainingResources = ResourceActionCounter.emptyCounter;
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
        return !this.resourcesReached && this.actionsToResourceCheckpoint() <= 0;
    }

    init(game: Game) {
        super.init(game);
        // actions performed
        this.actionsTaken.reset();
        this.actionsTaken.active.items = this.itemCosts.map((cost: { item: Item, quantity: number }) =>
            ({item: cost.item, quantity: 0}));
        // set up remaining resources
        this.remainingResources = ResourceActionCounter.emptyCounter;
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
        this.addCost(this.remainingResources, -actions);
        this.addCost(this.actionsTaken.active, actions);
    }

    addCost(counter: ResourceActionCounter, actions: number) {
        const resourceSetsUsed = actions * (1 - this.getPreservationChance(0) / 100);
        this.itemCosts.forEach((cost: { item: Item, quantity: number }, idx: number) => {
            counter.items[idx].quantity += cost.quantity * resourceSetsUsed;
        });
        counter.gp += this.gpCost * resourceSetsUsed;
        counter.sc += this.scCost * resourceSetsUsed;
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
        chance = Math.min(chance, this.getPreservationCap());
        if (chance < 0) {
            return 0;
        }
        return chance;
    }

    getPreservationCap() {
        const baseCap = 80;
        return baseCap
            + this.modifiers.getSkillModifierValue('increasedSkillPreservationCap', this)
            - this.modifiers.getSkillModifierValue('decreasedSkillPreservationCap', this);
    }
}
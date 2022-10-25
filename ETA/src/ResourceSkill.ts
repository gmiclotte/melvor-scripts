import {ResourceRates} from "./ResourceRates";
import {Settings} from "./Settings";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Game} from "../../Game-Files/built/game";
import {Item} from "../../Game-Files/built/item";
import {Costs} from "../../Game-Files/built/skill";
import {ResourceActionCounter, ResourceActionCounterWrapper} from "./ResourceActionCounter";

export class ResourceSkill extends EtaSkillWithMastery {
    public actionsTaken: ResourceActionCounterWrapper;
    public resourcesReached: boolean;
    public remainingResources: ResourceActionCounter;
    protected costs: Costs;
    protected costQuantityArray: { item: Item, quantity: number }[];

    constructor(game: Game, skill: any, action: any, settings: Settings) {
        super(game, skill, action, settings);
        this.actionsTaken = new ResourceActionCounterWrapper();
        this.remainingResources = ResourceActionCounter.emptyCounter;
        this.resourcesReached = false;
        this.costs = new Costs(undefined);
        this.costQuantityArray = [];
    }

    get completed() {
        return super.completed && this.noResourceCheckpointLeft;
    }

    get noResourceCheckpointLeft() {
        return this.actionsToResourceCheckpoint() <= 0;
    }

    get resourcesCompleted() {
        return !this.resourcesReached && this.noResourceCheckpointLeft;
    }

    init(game: Game) {
        super.init(game);
        this.costs = this.getRecipeCosts();
        this.costQuantityArray = this.costs.getItemQuantityArray();
        // actions performed
        this.actionsTaken.reset();
        this.actionsTaken.active.items = this.costQuantityArray.map((cost: { item: Item, quantity: number }) =>
            ({item: cost.item, quantity: 0}));
        // set up remaining resources
        this.remainingResources = ResourceActionCounter.emptyCounter;
        this.remainingResources.gp = game.gp.amount;
        this.remainingResources.sc = game.slayerCoins.amount
        this.remainingResources.items = this.costQuantityArray.map((cost: { item: Item, quantity: number }) =>
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
        const actionsToCheckpoint = this.costQuantityArray.map((cost: { item: Item, quantity: number }, idx: number) =>
            this.remainingResources.items[idx].quantity / cost.quantity
        );
        if (this.costs.gp) {
            actionsToCheckpoint.push(this.remainingResources.gp / this.costs.gp);
        }
        if (this.costs.sc) {
            actionsToCheckpoint.push(this.remainingResources.sc / this.costs.sc);
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
        this.costQuantityArray.forEach((cost: { item: Item, quantity: number }, idx: number) => {
            counter.items[idx].quantity += cost.quantity * resourceSetsUsed;
        });
        counter.gp += this.costs.gp * resourceSetsUsed;
        counter.sc += this.costs.sc * resourceSetsUsed;
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
        +this.getSkillModifierValue('increasedSkillPreservationChance');
        -this.getSkillModifierValue('decreasedSkillPreservationChance');
        chance = Math.min(chance, this.getPreservationCap());
        if (chance < 0) {
            return 0;
        }
        return chance;
    }

    getPreservationCap() {
        const baseCap = 80;
        return baseCap
            + this.getSkillModifierValue('increasedSkillPreservationCap')
            - this.getSkillModifierValue('decreasedSkillPreservationCap');
    }

    getRecipeCosts() {
        const costs = new Costs(undefined);
        this.action.itemCosts.forEach((cost: { item: Item, quantity: number }) => {
            const quantity = this.modifyItemCost(cost.item, cost.quantity);
            if (quantity > 0) {
                costs.addItem(cost.item, cost.quantity);
            }
        });
        if (this.action.gpCost > 0) {
            costs.addGP(this.modifyGPCost());
        }
        if (this.action.scCost > 0) {
            costs.addSlayerCoins(this.modifySCCost());
        }
        return costs;
    }

    modifyItemCost(_: Item, quantity: number) {
        return quantity;
    }

    modifyGPCost() {
        return this.action.gpCost;
    }

    modifySCCost() {
        return this.action.scCost;
    }
}
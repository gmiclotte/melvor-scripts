import {ResourceRates} from "./ResourceRates";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Game} from "../../Game-Files/built/game";
import {Item} from "../../Game-Files/built/item";
import {Costs} from "../../Game-Files/built/skill";
import {ResourceActionCounter, ResourceActionCounterWrapper} from "./ResourceActionCounter";
import {EtaSkill, etaSkillConstructor} from "./EtaSkill";

export function ResourceSkill<BaseSkill extends etaSkillConstructor>(baseSkill: BaseSkill) {
    return class extends baseSkill {
        public actionsTaken: ResourceActionCounterWrapper;
        public resourcesReached: boolean;
        public remainingResources: ResourceActionCounter;
        public finalXpMap: Map<string, number>;
        protected costs: Costs;
        protected costQuantityMap: Map<Item, number>;

        constructor(...args: any[]) {
            super(...args);
            this.actionsTaken = new ResourceActionCounterWrapper();
            this.remainingResources = ResourceActionCounter.emptyCounter;
            this.resourcesReached = false;
            this.costs = new Costs(undefined);
            this.costQuantityMap = new Map<Item, number>();
            this.finalXpMap = new Map<string, number>();
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
            this.costQuantityMap = new Map<Item, number>();
            this.costs.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
                this.costQuantityMap.set(cost.item, cost.quantity);
            });
            // actions performed
            this.actionsTaken.reset();
            this.costQuantityMap.forEach((_: number, item: Item) => {
                this.actionsTaken.active.items.set(item, 0);
            });
            // set up remaining resources
            this.remainingResources = ResourceActionCounter.emptyCounter;
            this.remainingResources.gp = game.gp.amount;
            this.remainingResources.sc = game.slayerCoins.amount;
            this.costQuantityMap.forEach((_: number, item: Item) => {
                const amt = this.remainingResources.items.get(item) ?? 0;
                this.remainingResources.items.set(item, amt + game.bank.getQty(item));
            });
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
            const actionsToCheckpoint: number[] = [];
            this.costQuantityMap.forEach((quantity: number, item: Item) => {
                actionsToCheckpoint.push((this.remainingResources.items.get(item) ?? 0) / quantity);
            });
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
            // compute preservation before increasing the stats
            const preservation = this.getPreservationChance(0);
            super.addActions(gainsPerAction, actions);
            this.addCost(this.remainingResources, -actions, preservation);
            this.addCost(this.actionsTaken.active, actions, preservation);
        }

        addCost(counter: ResourceActionCounter, actions: number, preservation: number) {
            const resourceSetsUsed = actions * (1 - preservation / 100);
            this.costQuantityMap.forEach((quantity: number, item: Item) => {
                const amt = counter.items.get(item) ?? 0;
                counter.items.set(item, amt + quantity * resourceSetsUsed);
            });
            counter.gp += this.costs.gp * resourceSetsUsed;
            counter.sc += this.costs.sc * resourceSetsUsed;
        }

        setFinalValues() {
            super.setFinalValues();
            if (this.resourcesCompleted) {
                this.actionsTaken.resources = this.actionsTaken.active.clone();
                this.finalXpMap = this.getXpMap();
                this.resourcesReached = true;
            }
        }

        getPreservationChance(chance: number): number {
            chance += this.modifiers.increasedGlobalPreservationChance
                - this.modifiers.decreasedGlobalPreservationChance
                + this.getSkillModifierValue('increasedSkillPreservationChance')
                - this.getSkillModifierValue('decreasedSkillPreservationChance');
            chance = Math.min(chance, this.getPreservationCap());
            if (chance < 0) {
                return 0;
            }
            return chance;
        }

        getPreservationCap() {
            const baseCap = 80;
            let modifier = 0;
            modifier += this.getSkillModifierValue('increasedSkillPreservationCap');
            modifier -= this.getSkillModifierValue('decreasedSkillPreservationCap');
            return baseCap + modifier;
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
}

export class ResourceSkillWithMastery extends ResourceSkill(EtaSkillWithMastery) {
}

export class ResourceSkillWithoutMastery extends ResourceSkill(EtaSkill) {
}
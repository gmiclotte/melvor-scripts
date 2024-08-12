import {ResourceRates} from "./ResourceRates";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import type {Game} from "../../Game-Files/gameTypes/game";
import type {Item} from "../../Game-Files/gameTypes/item";
import {ResourceActionCounter, ResourceActionCounterWrapper} from "./ResourceActionCounter";
import {EtaSkill, etaSkillConstructor} from "./EtaSkill";
import type {Currency} from "../../Game-Files/gameTypes/currency";
import {EtaCosts} from "./EtaCosts";
import type {Realm} from "../../Game-Files/gameTypes/realms";

export function ResourceSkill<BaseSkill extends etaSkillConstructor>(baseSkill: BaseSkill) {
    return class extends baseSkill {
        public actionsTaken: ResourceActionCounterWrapper;
        public resourcesReached: boolean;
        public remainingResources: ResourceActionCounter;
        public finalXpMap: Map<string, number>;
        protected originalCosts: EtaCosts;
        protected currentCosts: EtaCosts;

        constructor(...args: any[]) {
            super(...args);
            this.actionsTaken = new ResourceActionCounterWrapper();
            this.remainingResources = ResourceActionCounter.emptyCounter;
            this.resourcesReached = false;
            this.originalCosts = new EtaCosts();
            this.currentCosts = new EtaCosts();
            this.finalXpMap = new Map<string, number>();
        }

        get noResourceCheckpointLeft() {
            return this.attemptsToResourceCheckpoint() <= 0;
        }

        get resourcesCompleted() {
            return !this.resourcesReached && this.noResourceCheckpointLeft;
        }

        activeRealm(): Realm {
            return this.skill.selectedRecipe.realm;
        }

        skip() {
            return this.action !== this.skill.selectedRecipe || !this.actionIsInActiveRealm;
        }

        completed() {
            return super.completed() && this.noResourceCheckpointLeft;
        }

        init(game: Game) {
            super.init(game);
            this.originalCosts = this.getCurrentRecipeCosts();

            // set up total costs
            this.currentCosts = this.getCurrentRecipeCosts();

            // set up actions performed
            this.actionsTaken.reset();

            // set up remaining resources
            this.remainingResources = ResourceActionCounter.emptyCounter;

            // populate
            this.originalCosts.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
                this.actionsTaken.active.items.set(cost.item, 0);
                this.remainingResources.items.set(cost.item, game.bank.getQty(cost.item));
            });
            this.originalCosts.getCurrencyQuantityArray().forEach((cost: { currency: Currency, quantity: number }) => {
                this.actionsTaken.active.currencies.set(cost.currency, cost.quantity);
                // @ts-ignore
                this.remainingResources.currencies.set(cost.currency, game.currencies.getObjectByID(cost.currency.id).amount);
            })

            // flag to check if target was already reached
            this.resourcesReached = false;
        }

        attemptsToCheckpoint(gainsPerAction: ResourceRates) {
            const resourceActions = this.attemptsToResourceCheckpoint();
            if (resourceActions === 0) {
                // ran out of resources, now check other targets
                return super.attemptsToCheckpoint(gainsPerAction);
            }
            return Math.ceil(Math.min(
                super.attemptsToCheckpoint(gainsPerAction),
                resourceActions,
            ));
        }

        attemptsToResourceCheckpoint() {
            const attemptsToCheckpoint: number[] = [];
            this.currentCosts.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
                attemptsToCheckpoint.push((this.remainingResources.items.get(cost.item) ?? 0) / cost.quantity);
            })
            this.currentCosts.getCurrencyQuantityArray().forEach((cost: { currency: Currency, quantity: number }) => {
                attemptsToCheckpoint.push((this.remainingResources.currencies.get(cost.currency) ?? 0) / cost.quantity);
            })
            const resourceSets = Math.floor(Math.min(...attemptsToCheckpoint, Infinity));
            if (resourceSets <= 0) {
                return 0;
            }
            // apply preservation
            return Math.floor(resourceSets / (1 - this.getPreservationChance(0) / 100));
        }

        addAttempts(gainsPerAction: ResourceRates, attempts: number) {
            // compute preservation before increasing the stats
            const preservation = this.getPreservationChance(0);
            super.addAttempts(gainsPerAction, attempts);
            this.addCost(this.remainingResources, -attempts, preservation);
            this.addCost(this.actionsTaken.active, attempts, preservation);
        }

        addCost(counter: ResourceActionCounter, attempts: number, preservation: number) {
            // set resourceSetsUsed to at most -1 for negative and at least 1 for positive values
            let resourceSetsUsed = attempts * (1 - preservation / 100);
            if (-1 < resourceSetsUsed && resourceSetsUsed < 0) {
                resourceSetsUsed = -1;
            }
            if (0 < resourceSetsUsed && resourceSetsUsed < 1) {
                resourceSetsUsed = 1;
            }

            this.currentCosts.getItemQuantityArray().forEach((cost: { item: Item, quantity: number }) => {
                const amt = counter.items.get(cost.item) ?? 0;
                counter.items.set(cost.item, amt + cost.quantity * resourceSetsUsed);
            })
            this.currentCosts.getCurrencyQuantityArray().forEach((cost: { currency: Currency, quantity: number }) => {
                const amt = counter.currencies.get(cost.currency) ?? 0;
                counter.currencies.set(cost.currency, amt + cost.quantity * resourceSetsUsed);
            })
        }

        setFinalValues() {
            super.setFinalValues();
            if (this.resourcesCompleted) {
                this.actionsTaken.resources = this.actionsTaken.active.clone();
                this.finalXpMap = this.getXpMap();
                this.resourcesReached = true;
            }
            this.originalCosts = this.getCurrentRecipeCosts();
        }

        getPreservationChance(chance: number): number {
            chance += this.modifiers.getValue(
                "melvorD:skillPreservationChance" /* ModifierIDs.skillPreservationChance */,
                this.getActionModifierQuery()
            );
            if (this.skill.game.currentGamemode.disablePreservation) {
                chance = 0;
            }
            chance += this.modifiers.bypassGlobalPreservationChance;
            chance = Math.min(chance, this.getPreservationCap());
            if (chance < 0) {
                return 0;
            }
            return chance;
        }

        getPreservationCap() {
            const baseCap = 80;
            const modifier = this.modifiers.getValue(
                "melvorD:skillPreservationCap" /* ModifierIDs.skillPreservationCap */,
                this.getActionModifierQuery()
            );
            return baseCap + modifier;
        }

        getCurrentRecipeCosts() {
            return this.getRecipeCosts();
        }

        getRecipeCosts() {
            // @ts-ignore
            const costs = new Costs(undefined);
            this.action.itemCosts.forEach((cost: { item: Item, quantity: number }) => {
                let quantity = this.modifyItemCost(cost.item, cost.quantity);
                if (quantity > 0) {
                    costs.addItem(cost.item, quantity);
                }
            });
            this.action.currencyCosts.forEach((cost: { currency: Currency, quantity: number }) => {
                let quantity = this.modifyCurrencyCost(cost.currency, cost.quantity);
                if (quantity > 0) {
                    costs.addCurrency(cost.currency, quantity);
                }
            });
            return costs;
        }

        getUncappedCostReduction(item: Item | undefined) {
            return this.modifiers.getValue("melvorD:skillCostReduction", // ModifierIDs.skillCostReduction
                this.getActionModifierQuery()
            );
        }

        getCostReduction(item: Item | undefined = undefined) {
            return Math.min(80, this.getUncappedCostReduction(item));
        }

        getFlatCostReduction(item: Item | undefined) {
            return 0;
        }

        modifyItemCost(item: Item, quantity: number) {
            const costReduction = this.getCostReduction(item);
            quantity *= 1 - costReduction / 100;
            quantity = Math.ceil(quantity);
            quantity -= this.getFlatCostReduction(item);
            return Math.max(1, quantity);
        }

        modifyCurrencyCost(currency: Currency, quantity: number) {
            const costReduction = this.getCostReduction();
            quantity *= 1 - costReduction / 100;
            quantity = Math.ceil(quantity);
            quantity -= this.getFlatCostReduction(undefined);
            return Math.max(1, quantity);
        }
    }
}

export class ResourceSkillWithMastery extends ResourceSkill(EtaSkillWithMastery) {
}

export class ResourceSkillWithoutMastery extends ResourceSkill(EtaSkill) {
}
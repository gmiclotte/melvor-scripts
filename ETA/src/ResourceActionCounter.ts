import {ActionCounter, ActionCounterWrapper} from "./ActionCounter";
import type {Item} from "../../Game-Files/gameTypes/item";
import type {Currency, CurrencyEvents} from "../../Game-Files/gameTypes/currency";

export class ResourceActionCounterWrapper extends ActionCounterWrapper {
    public active!: ResourceActionCounter;
    public skill!: ResourceActionCounter;
    public mastery!: ResourceActionCounter;
    public pool!: ResourceActionCounter;
    public resources: ResourceActionCounter;

    constructor() {
        super();
        this.resources = this.empty;
    }

    get empty() {
        return ResourceActionCounter.emptyCounter;
    }

    reset() {
        super.reset();
        this.resources = this.empty;
    }
}

export class ResourceActionCounter extends ActionCounter {
    public items: Map<Item, number>;
    public currencies : Map<Currency, number>

    constructor(items: Map<Item, number>, currencies: Map<Currency, number>,
                ms: number, actions: number, unit: number) {
        super(ms, actions, unit);
        this.items = items;
        this.currencies = currencies;
    }

    static get emptyCounter(): ResourceActionCounter {
        return new ResourceActionCounter(new Map<Item, number>(), new Map<Currency, number>(), 0, 0, 1);
    }

    clone(): ResourceActionCounter {
        const items = new Map<Item, number>();
        this.items.forEach((quantity: number, item: Item) => {
            items.set(item, quantity);
        });
        const currencies = new Map<Currency, number>();
        this.currencies.forEach((quantity: number, currency: Currency) => {
            currencies.set(currency, quantity);
        });
        return new ResourceActionCounter(
            items,
            currencies,
            this.ms,
            this.actions,
            this.unit,
        );
    }
}
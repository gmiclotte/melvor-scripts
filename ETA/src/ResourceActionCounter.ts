import {ActionCounter, ActionCounterWrapper} from "./ActionCounter";
import type {Item} from "../../Game-Files/gameTypes/item";

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
    public gp: number;
    public sc: number;

    constructor(items: Map<Item, number>, gp: number, sc: number,
                ms: number, actions: number, unit: number) {
        super(ms, actions, unit);
        this.items = items;
        this.gp = gp;
        this.sc = sc;
    }

    static get emptyCounter(): ResourceActionCounter {
        return new ResourceActionCounter(new Map<Item, number>(), 0, 0, 0, 0, 1);
    }

    clone(): ResourceActionCounter {
        const items = new Map<Item, number>();
        this.items.forEach((quantity: number, item: Item) => {
            items.set(item, quantity);
        });
        return new ResourceActionCounter(
            items,
            this.gp,
            this.sc,
            this.ms,
            this.actions,
            this.unit,
        );
    }
}
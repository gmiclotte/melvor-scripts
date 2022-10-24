import {ActionCounter, ActionCounterWrapper} from "./ActionCounter";
import {Item} from "../../Game-Files/built/item";

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
    public items: { item: Item, quantity: number }[];
    public gp: number;
    public sc: number;

    constructor(items: { item: Item, quantity: number }[], gp: number, sc: number,
                ms: number, actions: number, unit: number) {
        super(ms, actions, unit);
        this.items = items;
        this.gp = gp;
        this.sc = sc;
    }

    static get emptyCounter(): ResourceActionCounter {
        return new ResourceActionCounter([], 0, 0, 0, 0, 1);
    }

    clone(): ResourceActionCounter {
        return new ResourceActionCounter(
            this.items.map(x => ({item: x.item, quantity: x.quantity})),
            this.gp,
            this.sc,
            this.ms,
            this.actions,
            this.unit,
        );
    }
}
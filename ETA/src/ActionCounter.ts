export class ActionCounterWrapper {
    public active: ActionCounter;
    public skill: ActionCounter;
    public mastery: ActionCounter;
    public pool: ActionCounter;

    constructor() {
        this.active = this.empty;
        this.skill = this.empty;
        this.mastery = this.empty;
        this.pool = this.empty;
    }

    get empty() {
        return ActionCounter.emptyCounter
    }

    reset() {
        this.active = this.empty;
        this.skill = this.empty;
        this.mastery = this.empty;
        this.pool = this.empty;
    }
}

export class ResourceActionCounterWrapper extends ActionCounterWrapper {
    public resources: ActionCounter;

    constructor() {
        super();
        this.resources = this.empty;
    }

    get empty() {
        return ResourceActionCounter.emptyCounter
    }

    reset() {
        this.resources = this.empty;
    }
}

export class ActionCounter {
    public ms: number;
    public actions: number;
    public readonly unit: number; // time unit, in number of milliseconds
    constructor(ms: number, actions: number, unit: number) {
        this.ms = ms;
        this.actions = actions;
        this.unit = unit;
    }

    static get emptyCounter(): ActionCounter {
        return new ActionCounter(0, 0, 1);
    }

    clone(): ActionCounter {
        return new ActionCounter(this.ms, this.actions, this.unit);
    }
}

export class ResourceActionCounter extends ActionCounter {
    public items: { item: string, quantity: number }[];
    public gp: number;
    public sc: number;

    constructor(items: { item: string, quantity: number }[], gp: number, sc: number,
                ms: number, actions: number, unit: number) {
        super(ms, actions, unit);
        this.items = items;
        this.gp = gp;
        this.sc = sc;
    }

    static get emptyCounter(): ResourceActionCounter {
        return new ResourceActionCounter([], 0, 0, 0, 0, 1);
    }

    clone(): ActionCounter {
        return new ResourceActionCounter(this.items, this.gp, this.sc, this.ms, this.actions, this.unit);
    }
}
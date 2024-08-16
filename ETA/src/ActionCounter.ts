export class ActionCounterWrapper {
    public active: ActionCounter;
    public skill: ActionCounter;
    public nextSkill: ActionCounter;
    public nextMilestone: ActionCounter;
    public mastery: ActionCounter;
    public pool: ActionCounter;
    public count: ActionCounter;

    constructor() {
        this.active = this.empty;
        this.skill = this.empty;
        this.nextSkill = this.empty;
        this.nextMilestone = this.empty;
        this.mastery = this.empty;
        this.pool = this.empty;
        this.count = this.empty;
    }

    get empty() {
        return ActionCounter.emptyCounter;
    }

    reset() {
        this.active = this.empty;
        this.skill = this.empty;
        this.nextSkill = this.empty;
        this.nextMilestone = this.empty;
        this.mastery = this.empty;
        this.pool = this.empty;
        this.count = this.empty;
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
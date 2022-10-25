import {RatesWithMastery} from "./RatesWithMastery";

export class ResourceRates extends RatesWithMastery {
    public items: { item: string, quantity: number }[];
    public gp: number;
    public sc: number;

    constructor(xp: number, mastery: number, pool: number,
                items: { item: string, quantity: number }[], gp: number, sc: number,
                ms: number, unit: number) {
        super(xp, mastery, pool, ms, unit);
        this.items = items;
        this.gp = gp;
        this.sc = sc;
    }

    static get emptyRates(): ResourceRates {
        return new ResourceRates(0, 0, 0, [], 0, 0, 0, 1);
    }

    scaledRates(unit: number): RatesWithMastery {
        const factor = unit / this.unit;
        return new ResourceRates(
            this.xp * factor,
            this.mastery * factor,
            this.pool * factor,
            this.items.map(x => ({item: x.item, quantity: x.quantity * factor})),
            this.gp * factor,
            this.sc * factor,
            this.ms,
            unit,
        )
    }
}
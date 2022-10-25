import {Rates} from "./Rates";

export class RatesWithMastery extends Rates {
    public mastery: number;
    public pool: number;

    constructor(xp: number, mastery: number, pool: number, ms: number, unit: number) {
        super(xp, ms, unit);
        this.mastery = mastery;
        this.pool = pool;
    }

    static get emptyRates(): RatesWithMastery {
        return new RatesWithMastery(0, 0, 0, 0, 1);
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    scaledRates(unit: number): RatesWithMastery {
        const factor = unit / this.unit;
        return new RatesWithMastery(
            this.xp * factor,
            this.mastery * factor,
            this.pool * factor,
            this.ms,
            unit,
        )
    }
}
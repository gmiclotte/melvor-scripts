import {Rates} from "./Rates";
import {RatesWithMastery} from "./RatesWithMastery";

export class RatesWithCount extends RatesWithMastery {
    public count: number;

    constructor(xp: number, mastery: number, pool: number, count: number, successRate: number, ms: number, unit: number) {
        super(xp, mastery, pool, successRate, ms, unit);
        this.count = count;
    }

    static get emptyRates(): RatesWithCount {
        return new RatesWithCount(0, 0, 0, 0, 1, 0, 1);
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    static addCountToRates(rates: RatesWithMastery, count: number): RatesWithCount {
        return new RatesWithCount(
            rates.xp,
            rates.mastery,
            rates.pool,
            count,
            rates.successRate,
            rates.ms,
            rates.unit,
        );
    }

    scaledRates(unit: number): RatesWithCount {
        const factor = unit / this.unit;
        return new RatesWithCount(
            this.xp * factor,
            this.mastery * factor,
            this.pool * factor,
            this.count * factor,
            this.successRate,
            this.ms,
            unit,
        )
    }
}
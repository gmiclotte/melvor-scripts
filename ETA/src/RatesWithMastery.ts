import {Rates} from "./Rates";
import {RatesWithPool} from "./RatesWithPool";

export class RatesWithMastery extends RatesWithPool {
    public mastery: number;

    constructor(xp: number, mastery: number, pool: number, successRate: number, ms: number, unit: number) {
        super(xp, pool, successRate, ms, unit);
        this.mastery = mastery;
    }

    static get emptyRates(): RatesWithMastery {
        return new RatesWithMastery(0, 0, 0, 1, 0, 1);
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    static addMasteryToRates(rates: RatesWithPool, mastery: number): RatesWithMastery {
        return new RatesWithMastery(
            rates.xp,
            mastery,
            rates.pool,
            rates.successRate,
            rates.ms,
            rates.unit,
        );
    }

    scaledRates(unit: number): RatesWithMastery {
        const factor = unit / this.unit;
        return new RatesWithMastery(
            this.xp * factor,
            this.mastery * factor,
            this.pool * factor,
            this.successRate,
            this.ms,
            unit,
        )
    }
}
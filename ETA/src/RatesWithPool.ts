import {Rates} from "./Rates";

export class RatesWithPool extends Rates {
    public pool: number;

    constructor(xp: number, pool: number, successRate: number, ms: number, unit: number) {
        super(xp, successRate, ms, unit);
        this.pool = pool;
    }

    static get emptyRates(): RatesWithPool {
        return new RatesWithPool(0, 0, 1, 0, 1);
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    static addPoolToRates(rates: Rates, pool: number): RatesWithPool {
        return new RatesWithPool(
            rates.xp,
            pool,
            rates.successRate,
            rates.ms,
            rates.unit,
        );
    }

    scaledRates(unit: number): RatesWithPool {
        const factor = unit / this.unit;
        return new RatesWithPool(
            this.xp * factor,
            this.pool * factor,
            this.successRate,
            this.ms,
            unit,
        )
    }
}
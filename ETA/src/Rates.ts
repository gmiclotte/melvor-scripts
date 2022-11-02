export class Rates {
    public xp: number;
    public successRate: number;
    public ms: number;
    public readonly unit: number; // time unit, in number of milliseconds

    constructor(xp: number, successRate: number, ms: number, unit: number) {
        this.xp = xp;
        this.successRate = successRate;
        this.ms = ms;
        this.unit = unit;
    }

    static get emptyRates(): Rates {
        return new Rates(0, 1, 0, 1);
    }

    static get hourUnit() {
        return 3600 * 1000
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    scaledRates(unit: number): Rates {
        const factor = unit / this.unit;
        return new Rates(
            this.xp * factor,
            this.successRate,
            this.ms,
            unit,
        )
    }
}
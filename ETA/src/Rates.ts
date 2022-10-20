export class Rates {
    public xp: number;
    public ms: number;
    public unit: number; // time unit, in number of milliseconds

    constructor(xp: number = 0, ms: number = 0, unit: number = 1) {
        this.xp = xp;
        this.ms = ms;
        this.unit = unit;
    }

    static get emptyRates(): Rates {
        return new Rates(0, 0, 0);
    }

    static get hourUnit() {
        return 3600 * 1000
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    scaledRates(unit: number): Rates {
        return new Rates(
            this.xp / this.unit * unit,
            this.ms,
            unit,
        )
    }
}
export class Rates {
    public xp: number;
    public mastery: number;
    public pool: number;
    public ms: number;
    public readonly unit: number; // time unit, in number of milliseconds

    constructor(xp: number, mastery: number, pool: number, ms: number, unit: number) {
        this.xp = xp;
        this.mastery = mastery;
        this.pool = pool;
        this.ms = ms;
        this.unit = unit;
    }

    static get emptyRates(): Rates {
        return new Rates(0, 0, 0, 0, 1);
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
            this.mastery * factor,
            this.pool * factor,
            this.ms,
            unit,
        )
    }
}
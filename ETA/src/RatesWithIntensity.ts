import {Rates} from "./Rates";
import {RatesWithMastery} from "./RatesWithMastery";

export class RatesWithIntensity extends RatesWithMastery {
    public intensity: number;

    constructor(xp: number, mastery: number, pool: number, intensity: number, successRate: number, ms: number, unit: number) {
        super(xp, mastery, pool, successRate, ms, unit);
        this.intensity = intensity;
    }

    static get emptyRates(): RatesWithIntensity {
        return new RatesWithIntensity(0, 0, 0, 0, 1, 0, 1);
    }

    get hourlyRates() {
        return this.scaledRates(Rates.hourUnit)
    }

    static addIntensityToRates(rates: RatesWithMastery, intensity: number): RatesWithIntensity {
        return new RatesWithIntensity(
            rates.xp,
            rates.mastery,
            rates.pool,
            intensity,
            rates.successRate,
            rates.ms,
            rates.unit,
        );
    }

    scaledRates(unit: number): RatesWithIntensity {
        const factor = unit / this.unit;
        return new RatesWithIntensity(
            this.xp * factor,
            this.mastery * factor,
            this.pool * factor,
            this.intensity * factor,
            this.successRate,
            this.ms,
            unit,
        )
    }
}
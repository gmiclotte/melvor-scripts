import {RatesWithMastery} from "./RatesWithMastery";

export class MultiRates extends RatesWithMastery {
    public rateMap: Map<string, RatesWithMastery>;

    constructor(rateMap: Map<string, RatesWithMastery>, xp: number, mastery: number, pool: number, ms: number, unit: number) {
        super(xp, mastery, pool, ms, unit);
        this.rateMap = rateMap;
    }
}
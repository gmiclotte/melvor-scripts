import {RatesWithMastery} from "./RatesWithMastery";

export class MultiRates extends RatesWithMastery {
    public rateMap: Map<string, RatesWithMastery>;

    constructor(rateMap: Map<string, RatesWithMastery>, xp: number, mastery: number, pool: number, successRate: number, ms: number, unit: number) {
        super(xp, mastery, pool, successRate, ms, unit);
        this.rateMap = rateMap;
    }
}
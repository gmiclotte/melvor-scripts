import type {Harvesting, HarvestingProduct} from "../../Game-Files/gameTypes/harvesting";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {RatesWithCount} from "./RatesWithCount";
import {TargetsWithIntensity} from "./TargetsWithIntensity";

export class EtaHarvesting extends EtaSkillWithMastery {
    // trackers
    public intensity: number;

    // initial and target
    public initial: RatesWithCount;
    // @ts-ignore
    public targets: TargetsWithIntensity;
    // current rates
    public currentRates: RatesWithCount;
    // targets reached
    public intensityReached: boolean;
    public readonly intensityMilestones: number[];
    // other
    private readonly products: HarvestingProduct[];
    private readonly intensityWeights: number[];
    private totalWeight: number;

    constructor(game: Game, Harvesting: Harvesting, action: any, settings: Settings) {
        super(game, Harvesting, action, settings);
        this.products = this.action.products;
        this.intensityMilestones = this.products.map((product: HarvestingProduct) => product.minIntensityPercent);
        this.intensityWeights = this.products.map((product: HarvestingProduct) => product.weight);
        this.totalWeight = this.intensityWeights.reduce((a, b) => a + b, 0);
        this.intensity = 0;
        this.currentRates = RatesWithCount.emptyRates;
        this.initial = RatesWithCount.emptyRates;
        // flag to check if target was already reached
        this.intensityReached = false;
    }

    get intensityCompleted() {
        return !this.intensityReached && this.targets.intensityCompleted();
    }

    get nextIntensityMilestone() {
        const current = this.intensity / this.veinMaxIntensity * 100;
        for (let i = 0; i < this.intensityMilestones.length; i++) {
            if (current < this.intensityMilestones[i]) {
                return this.intensityMilestones[i];
            }
        }
        return Infinity;
    }

    get intensityPercentage() {
        return Math.min(this.intensity / this.veinMaxIntensity * 100, 100);
    }

    get veinMaxIntensity() {
        let veinIntensityModifier = this.modifiers.getValue(
            "melvorItA:maxHarvestingIntensity" /* ModifierIDs.maxHarvestingIntensity */,
            this.getActionModifierQuery());
        veinIntensityModifier -= this.changeInMasteryLevel * 0.2;
        let veinIntensity = this.skill.baseVeinIntensity;
        veinIntensity *= 1 + veinIntensityModifier / 100;
        veinIntensity = Math.floor(veinIntensity);
        return Math.max(veinIntensity, 1);
    }

    get veinIntensityGainPerAction() {
        let increase = 1 + this.modifiers.flatHarvestingIntensity;
        let doubleHarvestingIntensityChance = this.modifiers.doubleHarvestingIntensityChance;
        if (this.isAbyssalPoolTierActive(1)) {
            doubleHarvestingIntensityChance += 10;
        }
        increase *= 1 + doubleHarvestingIntensityChance / 100;
        return increase;
    }

    get successRate() {
        let weight = 0;
        this.products.forEach((product: HarvestingProduct, index: number) => {
            if (product.minIntensityPercent <= this.intensityPercentage) {
                weight += product.weight;
            }
        });
        return weight / this.totalWeight;
    }

    getTargets() {
        return new TargetsWithIntensity(this, this.settings);
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.intensityCompleted) {
            this.actionsTaken.count = this.actionsTaken.active.clone();
            this.intensityReached = true;
        }
    }

    init(game: Game) {
        super.init(game);
        this.intensity = this.action.currentIntensity;
        // initial
        this.initial = RatesWithCount.addCountToRates(
            this.initial,
            this.intensity,
        );
        // flag to check if target was already reached
        this.intensityReached = false;
    }

    intensityForMilestone(milestone: number) {
        return milestone / 100 * this.veinMaxIntensity;
    }

    attemptsToCheckpoint(gainsPerAction: RatesWithCount) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const nextMilestone = this.nextIntensityMilestone;
        const nextIntensity = this.intensityForMilestone(nextMilestone);
        const requiredForIntensityCheckPoint = nextIntensity - this.intensity;
        const attemptsToIntensityCheckpoint = requiredForIntensityCheckPoint / gainsPerAction.count;
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            attemptsToIntensityCheckpoint,
        ));
    }

    addAttempts(gainsPerAction: RatesWithCount, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.intensity += gainsPerAction.count * attempts;
    }

    gainsPerAction() {
        return RatesWithCount.addCountToRates(
            super.gainsPerAction(),
            this.veinIntensityGainPerAction,
        );
    }

    setCurrentRatesNoCheck(gains: RatesWithCount): RatesWithCount {
        return this.currentRates = RatesWithCount.addCountToRates(
            super.setCurrentRatesNoCheck(gains),
            gains.count / gains.ms,
        );
    }
}
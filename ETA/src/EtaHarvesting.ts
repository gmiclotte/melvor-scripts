import {Harvesting, HarvestingProduct} from "../../Game-Files/gameTypes/harvesting";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import type {Game} from "../../Game-Files/gameTypes/game";
import {RatesWithIntensity} from "./RatesWithIntensity";
import {TargetsWithIntensity} from "./TargetsWithIntensity";

export class EtaHarvesting extends EtaSkillWithMastery {
    // trackers
    public intensity: number;

    // initial and target
    public initial: RatesWithIntensity;
    public targets: TargetsWithIntensity;
    // current rates
    public currentRates: RatesWithIntensity;
    // targets reached
    public intensityReached: boolean;
    public readonly intensityMilestones: number[];
    // other
    private readonly products: HarvestingProduct[];
    private readonly intensityWeights: number[];

    constructor(game: Game, Harvesting: Harvesting, action: any, settings: Settings) {
        super(game, Harvesting, action, settings);
        this.products = this.action.products;
        this.intensityMilestones = this.products.map((product: HarvestingProduct) => product.minIntensityPercent);
        this.intensityWeights = this.products.map((product: HarvestingProduct) => product.weight);
        this.intensity = 0;
        this.targets = this.getTargets();
        this.currentRates = RatesWithIntensity.emptyRates;
        this.initial = RatesWithIntensity.emptyRates;
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
        return 40 / 100;
    }

    getTargets() {
        return new TargetsWithIntensity(this, this.settings);
    }

    setFinalValues() {
        super.setFinalValues();
        if (this.intensityCompleted) {
            this.actionsTaken.intensity = this.actionsTaken.active.clone();
            this.intensityReached = true;
        }
    }

    init(game: Game) {
        super.init(game);
        this.intensity = this.action.currentIntensity;
        // initial
        this.initial = RatesWithIntensity.addIntensityToRates(
            this.initial,
            this.intensity,
        );
        // flag to check if target was already reached
        this.intensityReached = false;
    }

    intensityForMilestone(milestone: number) {
        return milestone / 100 * this.veinMaxIntensity;
    }

    attemptsToCheckpoint(gainsPerAction: RatesWithIntensity) {
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const nextMilestone = this.nextIntensityMilestone;
        const nextIntensity = this.intensityForMilestone(nextMilestone);
        const requiredForIntensityCheckPoint = nextIntensity - this.intensity;
        const attemptsToIntensityCheckpoint = requiredForIntensityCheckPoint / gainsPerAction.intensity;
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            attemptsToIntensityCheckpoint,
        ));
    }

    addAttempts(gainsPerAction: RatesWithIntensity, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.intensity += gainsPerAction.intensity * attempts;
    }

    gainsPerAction() {
        return RatesWithIntensity.addIntensityToRates(
            super.gainsPerAction(),
            this.veinIntensityGainPerAction,
        );
    }

    setCurrentRatesNoCheck(gains: RatesWithIntensity): RatesWithIntensity {
        return this.currentRates = RatesWithIntensity.addIntensityToRates(
            super.setCurrentRatesNoCheck(gains),
            gains.intensity / gains.ms,
        );
    }

    /*
    xp() {

        if (veinItem.minIntensityPercent <= vein.intensityPercent) {
            const baseQuantity = vein.baseQuantity * this.getVeinBaseRewardQuantity(vein);
            let veinQty = this.modifyPrimaryProductQuantity(veinItem.item, baseQuantity, vein);
            veinQty *= impDevilMult;
            if (veinQty > 0) {
                rewards.addItem(veinItem.item, veinQty);
                this.game.stats.Harvesting.add(2, // HarvestingStats.PrimaryItemsGained
            veinQty);
                this.addCurrencyFromPrimaryProductGain(rewards, veinItem.item, veinQty, vein);
            }
            actionEvent.productQuantity = veinQty;
            rewards.addXP(this, vein.baseExperience, vein);
            rewards.addAbyssalXP(this, vein.baseAbyssalExperience, vein);
            this.addCommonRewards(rewards, vein);
        }
    }
*/

}
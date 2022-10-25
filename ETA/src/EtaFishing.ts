import {Fish, Fishing, FishingArea} from "../../Game-Files/built/fishing";
import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Settings} from "./Settings";
import {Game} from "../../Game-Files/built/game";

export class EtaFishing extends EtaSkillWithMastery {
    // @ts-ignore
    public area: FishingArea;

    constructor(game: Game, fishing: Fishing, action: any, settings: Settings) {
        super(game, fishing, action, settings);
        this.skill.areas.forEach((area: FishingArea) => {
            area.fish.forEach((fish: Fish) => {
                if (fish === action) {
                    this.area = area;
                }
            });
        });
    }

    get actionInterval() {
        const minTicks = this.getMinFishInterval() / this.TICK_INTERVAL;
        const maxTicks = this.getMaxFishInterval() / this.TICK_INTERVAL;
        return this.TICK_INTERVAL * (minTicks + maxTicks) / 2;
    }

    getMinFishInterval() {
        return this.modifyInterval(this.action.baseMinInterval);
    }

    getMaxFishInterval() {
        return this.modifyInterval(this.action.baseMaxInterval);
    }

    getMasteryXPModifier() {
        let modifier = super.getMasteryXPModifier();
        if (this.isPoolTierActive(0)) {
            modifier += 5;
        }
        return modifier;
    }

    /***
     * Compute junk (1 xp) and no-junk (base xp) chances
     */
    getJunkChance(): number {
        // Mastery Pool Tier 2: No longer catch junk
        // Mastery Level 65: No longer catch junk
        if (this.isPoolTierActive(1) || this.masteryLevel >= 65) {
            return 0;
        }
        // get junk chance
        let junkChance = this.area.junkChance;
        junkChance -= this.modifiers.increasedBonusFishingSpecialChance;
        // Mastery Level 50: +3% bonus to special chance from junk chance
        if (this.masteryLevel >= 50) {
            junkChance -= 3;
        }
        if (junkChance <= 0) {
            return 0;
        }
        return junkChance;
    }

    modifyXP(amount: number) {
        // apply junk chance
        const junkChance = this.getJunkChance();
        amount = (amount * (100 - junkChance) + junkChance) / 100;
        return super.modifyXP(amount);
    }
}

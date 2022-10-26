import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {DisplayWithPool} from "./DisplayWithPool";

export class DisplayWithMastery extends DisplayWithPool {
    injectRateElement(result: EtaSkillWithMastery) {
        this.element.style.display = 'block';
        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        this.element.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp))
                + "\r\nMXp/h: " + this.formatNumber(Math.floor(rates.mastery))
                + `\r\nPool/h: ${result.computePoolProgress(rates.pool).toFixed(2)}%`
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            this.element.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }
    }

    tooltipContent(result: EtaSkillWithMastery, now: Date) {
        return super.tooltipContent(result, now)
            + this.masteryToolTip(result, now)
            + this.poolToolTip(result, now);
    }

    masteryToolTip(result: EtaSkillWithMastery, now: Date) {
        const finalLevel = result.xpToLevel(result.masteryXp)
        const levelProgress = this.getPercentageInLevel(result, result.masteryXp, result.masteryLevel, "mastery");
        return this.finalLevelElement(
            'Final Mastery',
            this.formatLevel(finalLevel, levelProgress) + ' / 99',
            'success',
        ) + this.tooltipSection(result.actionsTaken.mastery, now, result.targets.masteryLevel, '');
    }

    getPercentageInLevel(result: EtaSkillWithMastery, currentXp: number, level: number, type: string): number {
        const currentLevel = level;
        if (currentLevel >= 99 && type === "mastery") {
            // mastery is capped at 99
            return 0;
        }
        return super.getPercentageInLevel(result, currentXp, level, type);
    }
}
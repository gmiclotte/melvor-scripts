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
                + `\r\nPool/h: ${result.poolXpToPercent(rates.pool).toFixed(2)}%`
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            this.element.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }
    }

    tooltipContent(result: EtaSkillWithMastery, now: Date) {
        return this.skillToolTip(result, now)
            + this.masteryToolTip(result, now)
            + this.poolToolTip(result, now);
    }

    masteryToolTip(result: EtaSkillWithMastery, now: Date) {
        return this.finalLevelElement(
            'Final Mastery',
            this.formatLevel(this.finalMastery(result)) + ' / 99',
            'success',
        ) + this.tooltipSection(result.actionsTaken.mastery, now, result.targets.masteryLevel, '');
    }

    finalMastery(result: EtaSkillWithMastery) {
        return result.masteryLevel + this.getProgressInLevel(result, result.masteryXp, result.masteryLevel, "mastery");
    }

    getProgressInLevel(result: EtaSkillWithMastery, currentXp: number, level: number, type: string): number {
        if (level >= 99 && type === "mastery") {
            // mastery is capped at 99
            return 0;
        }
        return super.getProgressInLevel(result, currentXp, level, type);
    }
}
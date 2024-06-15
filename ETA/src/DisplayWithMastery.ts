import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {DisplayWithPool} from "./DisplayWithPool";

export class DisplayWithMastery extends DisplayWithPool {
    injectRates(result: EtaSkillWithMastery) {
        super.injectRates(result);
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += "\r\nMXp/h: " + this.formatNumber(Math.floor(result.currentRates.hourlyRates.mastery));
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
            this.formatLevel(this.finalMastery(result)),
            'success',
        ) + this.tooltipSection(result.actionsTaken.mastery, now, result.targets.masteryLevel, '');
    }

    finalMastery(result: EtaSkillWithMastery) {
        return result.virtualMasteryLevel + this.getProgressInMasteryLevel(result, result.masteryXp, result.virtualMasteryLevel, "mastery");
    }

    getProgressInMasteryLevel(result: EtaSkillWithMastery, currentXp: number, level: number, type: string): number {
        const currentLevel = level;
        const currentLevelXp = result.masteryLevelToXp(currentLevel);
        const nextLevelXp = result.masteryLevelToXp(currentLevel + 1);
        // progress towards next level
        return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    }
}
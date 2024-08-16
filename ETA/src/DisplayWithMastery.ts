import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {DisplayWithPool} from "./DisplayWithPool";

export class DisplayWithMastery extends DisplayWithPool {
    protected result!: EtaSkillWithMastery;

    setResult(result: EtaSkillWithMastery) {
        this.result = result;
    }

    injectRates() {
        super.injectRates();
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += "\r\nMXp/h: " + this.formatNumber(Math.floor(this.result.currentRates.hourlyRates.mastery));
        }
    }

    tooltipContent(now: Date) {
        return this.skillToolTip(now)
            + this.masteryToolTip(now)
            + this.poolToolTip(now);
    }

    masteryToolTip(now: Date) {
        return this.finalLevelElement(
            'Final Mastery',
            this.formatLevel(this.finalMastery()),
            'info',
        ) + this.tooltipSection(this.result.actionsTaken.mastery, now, this.result.targets.masteryLevel, '');
    }

    finalMastery() {
        return this.result.virtualMasteryLevel + this.getProgressInMasteryLevel(this.result.masteryXp, this.result.virtualMasteryLevel);
    }
}
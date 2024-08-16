import {EtaHarvesting} from "./EtaHarvesting";
import {DisplayWithMastery} from "./DisplayWithMastery";

export class DisplayWithIntensity extends DisplayWithMastery {
    protected result!: EtaHarvesting;

    setResult(result: EtaHarvesting) {
        this.result = result;
    }

    injectRates() {
        super.injectRates();
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += "\r\nIntensity/h: " + this.formatNumber(Math.floor(this.result.currentRates.hourlyRates.count));
        }
    }

    tooltipContent(now: Date) {
        return this.skillToolTip(now)
            + this.masteryToolTip(now)
            + this.poolToolTip(now)
            + this.intensityToolTip(now);
    }

    intensityToolTip(now: Date) {
        return this.finalLevelElement(
            'Final Intensity',
            this.finalIntensity(),
            'success',
        ) + this.tooltipSection(this.result.actionsTaken.count, now, this.result.targets.intensityMilestone, '');
    }

    finalIntensity() {
        return `${this.result.intensityPercentage.toFixed(2)}%`;
    }
}
import {EtaHarvesting} from "./EtaHarvesting";
import {DisplayWithMastery} from "./DisplayWithMastery";

export class DisplayWithIntensity extends DisplayWithMastery {
    injectRates(result: EtaHarvesting) {
        super.injectRates(result);
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += "\r\nIntensity/h: " + this.formatNumber(Math.floor(result.currentRates.hourlyRates.intensity));
        }
    }

    tooltipContent(result: EtaHarvesting, now: Date) {
        return this.skillToolTip(result, now)
            + this.masteryToolTip(result, now)
            + this.poolToolTip(result, now)
            + this.intensityToolTip(result, now);
    }

    intensityToolTip(result: EtaHarvesting, now: Date) {
        return this.finalLevelElement(
            'Final Intensity',
            this.finalIntensity(result),
            'success',
        ) + this.tooltipSection(result.actionsTaken.intensity, now, result.targets.intensityMilestone, '');
    }

    finalIntensity(result: EtaHarvesting) {
        return `${result.intensityPercentage.toFixed(2)}%`;
    }

    getProgressInLevel(result: EtaHarvesting, currentXp: number, level: number, type: string): number {
        return super.getProgressInLevel(result, currentXp, level, type);
    }
}
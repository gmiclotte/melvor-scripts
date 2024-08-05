import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Display} from "./Display";
import {EtaSkillWithPool} from "./EtaSkillWithPool";

export class DisplayWithPool extends Display {
    injectRates(result: EtaSkillWithPool) {
        super.injectRates(result);
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += `\r\nPool/h: ${result.poolXpToPercent(result.currentRates.hourlyRates.pool).toFixed(2)}%`;
        }
    }

    tooltipContent(result: EtaSkillWithMastery, now: Date) {
        return super.tooltipContent(result, now)
            + this.poolToolTip(result, now);
    }

    poolToolTip(result: EtaSkillWithMastery, now: Date) {
        const tooltip = this.finalLevelElement(
            'Final Pool',
            this.formatLevel(this.finalPool(result)) + '%',
            'warning',
        )
        let prepend = ''
        /* TODO implement mastery tokens
        const tokens = Math.round(result.tokens);
        if (tokens > 0) {
            prepend += `Final token count: ${tokens}`;
            if (ms.pool > 0) {
                prepend += '<br>';
            }
        }
         */
        return tooltip + this.tooltipSection(result.actionsTaken.pool, now, `${result.targets.poolPercent}%`, prepend);
    }

    finalPool(result: EtaSkillWithPool) {
        return result.getMasteryPoolProgress;
    }
}
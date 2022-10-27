import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {Display} from "./Display";
import {EtaSkillWithPool} from "./EtaSkillWithPool";

export class DisplayWithPool extends Display {
    injectRateElement(result: EtaSkillWithPool) {
        this.element.style.display = 'block';
        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        this.element.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp))
                + `\r\nPool/h: ${result.poolXpToPercent(rates.pool).toFixed(2)}%`
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            this.element.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }
    }

    tooltipContent(result: EtaSkillWithMastery, now: Date) {
        return super.tooltipContent(result, now)
            + this.poolToolTip(result, now);
    }

    poolToolTip(result: EtaSkillWithMastery, now: Date) {
        const tooltip = this.finalLevelElement(
            'Final Pool XP',
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
        return result.poolProgress;
    }
}
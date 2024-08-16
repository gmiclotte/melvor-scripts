import {Display} from "./Display";
import {EtaSkillWithPool} from "./EtaSkillWithPool";

export class DisplayWithPool extends Display {
    protected result!: EtaSkillWithPool;

    setResult(result: EtaSkillWithPool) {
        this.result = result;
    }

    injectRates() {
        super.injectRates();
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += `\r\nPool/h: ${this.result.poolXpToPercent(this.result.currentRates.hourlyRates.pool).toFixed(2)}%`;
        }
    }

    tooltipContent(now: Date) {
        return super.tooltipContent(now)
            + this.poolToolTip(now);
    }

    poolToolTip(now: Date) {
        const tooltip = this.finalLevelElement(
            'Final Pool',
            this.formatLevel(this.finalPool()) + '%',
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
        return tooltip + this.tooltipSection(this.result.actionsTaken.pool, now, `${this.result.targets.poolPercent}%`, prepend);
    }

    finalPool() {
        return this.result.getMasteryPoolProgress;
    }
}
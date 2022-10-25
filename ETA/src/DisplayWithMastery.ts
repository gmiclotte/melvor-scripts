import {EtaSkillWithMastery} from "./EtaSkillWithMastery";
import {ActionCounter} from "./ActionCounter";
import {Display} from "./Display";

export class DisplayWithMastery extends Display {
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

    poolToolTip(result: EtaSkillWithMastery, now: Date) {
        const tooltip = this.finalLevelElement(
            'Final Pool XP',
            result.poolProgress.toFixed(2) + '%',
            'warning',
        )
        let prepend = ''
        /* TODO
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

    getPercentageInLevel(result: EtaSkillWithMastery, currentXp: number, level: number, type: string): number {
        const currentLevel = level;
        if (currentLevel >= 99 && type === "mastery") {
            // mastery is capped at 99
            return 0;
        }
        return super.getPercentageInLevel(result, currentXp, level, type);
    }

    tooltipSection(resources: ActionCounter, now: Date, target: number | string, prepend = '') {
        // final level and time to target level
        if (resources.ms > 0) {
            return this.wrapTimeLeft(
                prepend + this.timeLeftToHTML(
                    resources,
                    target,
                    this.msToHms(resources.ms),
                    this.dateFormat(now, this.addMSToDate(now, resources.ms)),
                ),
            );
        } else if (prepend !== '') {
            return this.wrapTimeLeft(
                prepend,
            );
        }
        return '';
    }
}
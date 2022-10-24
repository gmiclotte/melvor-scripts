import {Display} from "./Display";
import {ResourceActionCounter} from "./ResourceActionCounter";
import {ResourceSkill} from "./ResourceSkill";
import {EtaSkill} from "./EtaSkill";

export class ResourceDisplay extends Display {

    injectHTML(result: ResourceSkill, now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.element.style.display = 'block';

        ////////////////
        // rates part //
        ////////////////

        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        this.element.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp));
            if (result.skill.hasMastery) {
                this.element.textContent += "\r\nMXp/h: " + this.formatNumber(Math.floor(rates.mastery))
                    + `\r\nPool/h: ${result.computePoolProgress(rates.pool).toFixed(2)}%`
            }
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            this.element.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }

        ///////////////////
        // resource part //
        ///////////////////
        const resourceActionsTaken = result.actionsTaken.resources;
        if (resourceActionsTaken.actions === 0) {
            this.element.textContent += "\r\nNo resources!";
        } else {
            this.element.textContent += "\r\nActions: " + this.formatNumber(resourceActionsTaken.actions)
                + "\r\nTime: " + this.msToHms(resourceActionsTaken.ms)
                + "\r\nETA: " + this.dateFormat(now, this.addMSToDate(now, resourceActionsTaken.ms));
        }

        //////////////////
        // product part //
        //////////////////
        this.injectProductCountElement(result);
        this.element.style.display = "block";
        if (this.element.textContent.length === 0) {
            this.element.textContent = "Melvor ETA";
        }
        this.generateTooltips(result, now);
        return this.element;
    }


    injectProductCountElement(_: EtaSkill) {
    }

    tooltipSection(resources: ResourceActionCounter, now: Date, target: number | string, prepend = '') {
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

    timeLeftToHTML(resources: ResourceActionCounter, target: number | string, time: string, finish: string) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}` + this.resourcesLeftToHTML(resources);
    }

    resourcesLeftToHTML(resources: ResourceActionCounter) {
        if (this.settings.get('HIDE_REQUIRED')) {
            return '';
        }
        let req = '';
        resources.items.forEach(used => {
                req += `<span>${this.formatNumber(Math.ceil(used.quantity))}</span><img class="skill-icon-xs mr-2" src="${used.item.media}">`;
            }
        )
        if (resources.sc > 0) {
            req += `<span>${this.formatNumber(Math.ceil(resources.sc))}</span><img class="skill-icon-xs mr-2" src="assets/media/main/slayer_coins.svg">`;
        }
        if (resources.gp > 0) {
            req += `<span>${this.formatNumber(Math.ceil(resources.gp))}</span><img class="skill-icon-xs mr-2" src="assets/media/main/coins.svg">`;
        }
        return `<br/>Requires: ${req}`;
    }
}
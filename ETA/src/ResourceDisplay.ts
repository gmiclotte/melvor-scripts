import {Display} from "./Display";
import {ResourceActionCounter} from "./ResourceActionCounter";
import {ResourceSkill} from "./ResourceSkill";

export class ResourceDisplay extends Display {

    injectHTML(result: ResourceSkill, now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.injectRateElement(result);
        this.injectResourceTimeElement(result, now);
        this.generateTooltips(result, now);
        this.showElement();
    }

    injectResourceTimeElement(result: ResourceSkill, now: Date) {
        const resourceActionsTaken = result.actionsTaken.resources;
        if (resourceActionsTaken.actions === 0) {
            this.element.textContent += "\r\nNo resources!";
        } else {
            this.element.textContent += "\r\nActions: " + this.formatNumber(resourceActionsTaken.actions)
                + "\r\nTime: " + this.msToHms(resourceActionsTaken.ms)
                + "\r\nETA: " + this.dateFormat(now, this.addMSToDate(now, resourceActionsTaken.ms));
        }
    }

    timeLeftToHTML(resources: ResourceActionCounter, target: number | string, time: string, finish: string) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}` + this.resourcesLeftToHTML(resources);
    }

    resourcesLeftToHTML(resources: ResourceActionCounter) {
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
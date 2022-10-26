import {DisplayWithMastery} from "./DisplayWithMastery";
import {ResourceActionCounter} from "./ResourceActionCounter";
import {ResourceSkillWithoutMastery} from "./ResourceSkill";
import {Display, displayConstructor} from "./Display";
import {Item} from "../../Game-Files/built/item";

function ResourceDisplay<BaseDisplay extends displayConstructor>(baseDisplay: BaseDisplay) {

    return class extends baseDisplay {
        injectHTML(result: ResourceSkillWithoutMastery, now: Date) {
            if (this.element === null) {
                return undefined;
            }
            this.injectRateElement(result);
            this.injectResourceTimeElement(result, now);
            this.generateTooltips(result, now);
            this.showElement();
        }

        injectResourceTimeElement(result: ResourceSkillWithoutMastery, now: Date) {
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
            resources.items.forEach((quantity: number, item: Item) => {
                    req += `<span>${this.formatNumber(Math.ceil(quantity))}</span><img class="skill-icon-xs mr-2" src="${item.media}">`;
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
}

export class ResourceDisplayWithMastery extends ResourceDisplay(DisplayWithMastery) {
}

export class ResourceDisplayWithoutMastery extends ResourceDisplay(Display) {
}
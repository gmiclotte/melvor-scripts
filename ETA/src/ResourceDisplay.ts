import {DisplayWithMastery} from "./DisplayWithMastery";
import {ResourceActionCounter} from "./ResourceActionCounter";
import {ResourceSkillWithMastery, ResourceSkillWithoutMastery} from "./ResourceSkill";
import {Display, displayConstructor} from "./Display";
import type {Currency} from "../../Game-Files/gameTypes/currency";
import type {Item} from "../../Game-Files/gameTypes/item";

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
            if (!resourceActionsTaken) {
                return;
            }
            if (resourceActionsTaken.actions === 0) {
                this.element.textContent += "\r\nNo resources!";
            } else {
                this.element.textContent += "\r\nActions left: " + this.formatNumber(resourceActionsTaken.actions)
                    + "\r\nTime left: " + this.msToHms(resourceActionsTaken.ms)
                    + "\r\nETA: " + this.dateFormat(now, this.addMSToDate(now, resourceActionsTaken.ms));
            }
        }

        timeLeftToHTML(resources: ResourceActionCounter, target: number | string, time: string, finish: string) {
            return super.timeLeftToHTML(resources, target, time, finish) + this.resourcesLeftToHTML(resources);
        }

        resourcesLeftToHTML(resources: ResourceActionCounter) {
            let req = '';
            if (resources.items !== undefined) {
                resources.items.forEach((quantity: number, item: Item) => {
                        req += this.requiresItemHTML(item.media, quantity); // `<span>${this.formatNumber(Math.ceil(quantity))}</span><img class="skill-icon-xs mr-2" src="${item.media}">`;
                    }
                )
            }
            if (resources.currencies !== undefined) {
                resources.currencies.forEach((quantity: number, currency: Currency) => {
                        req += this.requiresItemHTML(currency.media, quantity); // `<span>${this.formatNumber(Math.ceil(quantity))}</span><img class="skill-icon-xs mr-2" src="${currency.media}">`;
                    }
                )
            }
            if (req.length === 0) {
                return '';
            }
            console.log(req)
            return this.requiresHTML(req);
        }

        requiresItemHTML(media: string, quantity: number) {
            return `
            <div class="btn-light pointer-enabled mr-3 mb-1 info-icon">
                <img class="skill-icon-xs" src="${media}">
                <div class="font-size-sm text-white text-center">
                    <small class="badge-pill bg-secondary">${this.formatNumber(Math.ceil(quantity))}</small>
                </div>
            </div>
            `
        }

        requiresHTML(requirements: string) {
            return `
            <div class="row justify-content-center">
                ${requirements}
            </div>
            `
        }

        finalLevel(result: ResourceSkillWithMastery) {
            if (result.finalXpMap === undefined) {
                return super.finalLevel(result);
            }
            const skillXp = result.finalXpMap.get('skillXp')!;
            const skillLevel = result.xpToLevel(skillXp);
            return skillLevel + this.getProgressInLevel(result, skillXp, skillLevel, 'skill');

        }

        finalPool(result: ResourceSkillWithMastery) {
            if (result.finalXpMap === undefined) {
                return result.getMasteryPoolProgress;
            }
            return result.poolXpToPercentWithModifiers(result.finalXpMap.get('poolXp')!);
        }

        finalMastery(result: ResourceSkillWithMastery) {
            if (result.finalXpMap === undefined) {
                return result.virtualMasteryLevel + this.getProgressInMasteryLevel(result, result.masteryXp, result.virtualMasteryLevel, "mastery");
            }
            const masteryXp = result.finalXpMap.get('masteryXp')!;
            const masteryLevel = result.masteryXpToLevel(masteryXp);
            return masteryLevel + this.getProgressInMasteryLevel(result, masteryXp, masteryLevel, 'mastery');
        }
    }
}

export class ResourceDisplayWithMastery extends ResourceDisplay(DisplayWithMastery) {
}

export class ResourceDisplayWithoutMastery extends ResourceDisplay(Display) {
}
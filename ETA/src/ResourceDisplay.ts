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
            if (resources.items === undefined) {
                return '';
            }
            let req = '';
            resources.items.forEach((quantity: number, item: Item) => {
                    req += `<span>${this.formatNumber(Math.ceil(quantity))}</span><img class="skill-icon-xs mr-2" src="${item.media}">`;
                }
            )
            resources.currencies.forEach((quantity: number, currency: Currency) => {
                    req += `<span>${this.formatNumber(Math.ceil(quantity))}</span><img class="skill-icon-xs mr-2" src="${currency.media}">`;
                }
            )
            return `<br/>Requires: ${req}`;
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
                return result.virtualMasteryLevel + this.getProgressInLevel(result, result.masteryXp, result.virtualMasteryLevel, "mastery");
            }
            const masteryXp = result.finalXpMap.get('masteryXp')!;
            const masteryLevel = result.masteryXpToLevel(masteryXp);
            if (masteryLevel >= 99) {
                return 99;
            }
            return masteryLevel + this.getProgressInLevel(result, masteryXp, masteryLevel, 'mastery');
        }
    }
}

export class ResourceDisplayWithMastery extends ResourceDisplay(DisplayWithMastery) {
}

export class ResourceDisplayWithoutMastery extends ResourceDisplay(Display) {
}
import {ActionCounter} from "./ActionCounter";
import {DisplayWithMastery} from "./DisplayWithMastery";
import {EtaMining} from "./EtaMining";

export class MiningDisplay extends DisplayWithMastery {
    protected result!: EtaMining;

    injectHTML(now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.injectRateElement();
        this.injectResourceTimeElement(now);
        this.generateTooltips(now);
        this.showElement();
    }

    setResult(result: EtaMining) {
        this.result = result;
    }

    injectResourceTimeElement(now: Date) {
        if (this.result.nodeHP === Infinity) {
            return;
        }
        const miningActionsTaken = this.result.actionsTaken.count;
        if (!miningActionsTaken) {
            return;
        }
        if (miningActionsTaken.actions === 0) {
            this.element.textContent += "\r\nNo resources!";
        } else {
            this.element.textContent += "\r\nActions left: " + this.formatNumber(miningActionsTaken.actions) + "\r\nTime left: " + this.msToHms(miningActionsTaken.ms) + "\r\nETA: " + this.dateFormat(now, this.addMSToDate(now, miningActionsTaken.ms));
        }
    }

    timeLeftToHTML(resources: ActionCounter, target: number | string, time: string, finish: string) {
        return super.timeLeftToHTML(resources, target, time, finish) + this.resourcesLeftToHTML(resources);
    }

    resourcesLeftToHTML(resources: ActionCounter) {
        if (this.result.nodeHP === Infinity) {
            return '';
        }
        let req = '';
        if (resources.actions > 0) {
            req += this.requiresNodeHPHTML(this.result.action.media, resources.actions * this.result.nodeHPPerAction);
        }
        if (req.length === 0) {
            return '';
        }
        return this.requiresHTML(req);
    }

    requiresNodeHPHTML(media: string, quantity: number) {
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

    finalLevel() {
        if (this.result.finalXpMap === undefined) {
            return super.finalLevel();
        }
        const skillXp = this.result.finalXpMap.get('skillXp')!;
        const skillLevel = this.result.xpToLevel(skillXp);
        return skillLevel + this.getProgressInLevel(skillXp, skillLevel);
    }

    finalPool() {
        if (this.result.finalXpMap === undefined) {
            return super.finalPool();
        }
        return this.result.poolXpToPercentWithModifiers(this.result.finalXpMap.get('poolXp')!);
    }

    finalMastery() {
        if (this.result.finalXpMap === undefined) {
            return super.finalMastery();
        }
        const masteryXp = this.result.finalXpMap.get('masteryXp')!;
        const masteryLevel = this.result.masteryXpToLevel(masteryXp);
        return masteryLevel + this.getProgressInMasteryLevel(masteryXp, masteryLevel);
    }
}
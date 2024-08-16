import {EtaSkill} from "./EtaSkill";
import {ActionCounter} from "./ActionCounter";
import {DisplayManager} from "./DisplayManager";
import {Settings} from "./Settings";
import type {Bank} from "../../Game-Files/gameTypes/bank2";
import type {ItemRegistry} from "../../Game-Files/gameTypes/namespaceRegistry";

export type displayConstructor<BaseDisplay = Display> = new(...args: any[]) => Display;

export class Display {
    public readonly container!: HTMLElement;
    public readonly element!: HTMLElement;
    protected readonly manager: DisplayManager;
    protected readonly settings: Settings;
    protected readonly bank: Bank;
    protected readonly items: ItemRegistry;
    protected result!: EtaSkill;

    constructor(...[manager, settings, bank, items, id]:
                    [DisplayManager, Settings, Bank, ItemRegistry, string]) {
        this.manager = manager;
        this.settings = settings;
        this.bank = bank;
        this.items = items;
        // create and store container
        this.container = this.displayContainer(id);

        this.element = this.container.firstChild as HTMLElement;
    }

    get isHookedUp() {
        return this.container.parentElement !== null;
    }

    setResult(result: EtaSkill) {
        this.result = result;
    }

    formatNumber(n: any): string {
        // @ts-ignore
        return formatNumber(n, 0);
    }

    addMSToDate(date: Date, ms: number) {
        return new Date(date.getTime() + ms);
    }

    sameYear(now: Date, then: Date) {
        const format: { year: "2-digit" } = {year: "2-digit"};
        return now.toLocaleString(undefined, format) === then.toLocaleString(undefined, format);
    }

    // Format date 24-hour clock
    dateFormat(now: Date, then: Date, is12h = this.settings.get('IS_12H_CLOCK')) {
        // create the date
        const format: { weekday: "short", month: "short", day: "numeric", year: "2-digit" | undefined }
            = {weekday: "short", month: "short", day: "numeric", year: undefined};
        if (!this.sameYear(now, then)) {
            format.year = "2-digit";
        }
        let date = then.toLocaleString(undefined, format);
        if (date === now.toLocaleString(undefined, format)) {
            date = "";
        } else {
            date += " at ";
        }
        // create the time of day
        let hours: number | string = then.getHours();
        let minutes: number | string = then.getMinutes();
        // convert to 12h clock if required
        let amOrPm = '';
        if (is12h) {
            amOrPm = hours >= 12 ? 'pm' : 'am';
            hours = (hours % 12) || 12;
        } else {
            // only pad 24h clock hours
            hours = hours < 10 ? '0' + hours : hours;
        }
        // pad minutes
        minutes = minutes < 10 ? '0' + minutes : minutes;
        // concat and return remaining time
        return date + hours + ':' + minutes + amOrPm;
    }

    injectHTML(now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.injectRateElement();
        this.injectProductCountElement();
        this.generateTooltips(now);
        this.showElement();
    }

    showElement() {
        this.element.style.display = "block";
        if (this.element.textContent!.length === 0) {
            this.element.textContent = "Melvor ETA";
        }
    }

    injectRateElement() {
        this.element.style.display = 'block';
        this.element.textContent = "";
        this.injectRates();
        this.injectActions();
    }

    injectRates() {
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent += "Xp/h: " + this.formatNumber(Math.floor(this.result.currentRates.hourlyRates.xp));
        }
    }

    injectActions() {
        if (this.settings.get('SHOW_ACTION_TIME') && this.result.attemptsPerHour > 0) {
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * this.result.attemptsPerHour) / 100);
            // this.element.textContent += "\r\nSuccesses/h: " + this.formatNumber(Math.round(100 * 3.6e6 / result.currentRates.hourlyRates.ms) / 100);
        }
    }

    injectProductCountElement() {
        const youHaveElementId = this.element.id + "-YouHave";
        const youHaveElement = document.getElementById(youHaveElementId);
        if (this.result.action.product !== undefined && youHaveElement !== null) {
            youHaveElement.style.display = 'block';
            while (youHaveElement.lastChild) {
                youHaveElement.removeChild(youHaveElement.lastChild);
            }
            const span = document.createElement('span');
            span.textContent = `You have: ${this.formatNumber(this.bank.getQty(this.result.action.product))}`;
            youHaveElement.appendChild(span);
            const img = document.createElement('img');
            img.classList.add('skill-icon-xs');
            img.classList.add('mr-2');
            img.src = this.result.action.product.media;
            youHaveElement.appendChild(img);
        }
    }

    generateTooltips(now: Date, flags = {
        noSkill: false,
        noMastery: false,
        noPool: false
    }) {
        // Generate progression Tooltips
        // @ts-ignore
        if (this.element._tippy === undefined) {
            // @ts-ignore
            tippy(this.element, {
                allowHTML: true,
                interactive: false,
                animation: false,
            });
        }
        // wrap and return
        const tooltip = this.tooltipContent(now);
        // @ts-ignore
        this.element._tippy.setContent(`<div id="${this.result.skill.id}-${this.result.action.id}-tooltip">${tooltip}</div>`);
    }

    tooltipContent(now: Date) {
        return this.skillToolTip(now);
    }

    skillToolTip(now: Date) {
        let elt = this.finalLevelElement(
            'Final Level',
            this.formatLevel(this.finalLevel()),
            'success',
        );
        const result = this.result;
        const nextLevelIsMilestone = result.nextMilestone === result.initialVirtualLevel + 1;
        if (this.settings.get('SHOW_LEVEL_NEXT')
            // don't show +1 if next level is a milestone
            && !(this.settings.get('SHOW_LEVEL_MILESTONE') && nextLevelIsMilestone)
        ) {
            elt += this.tooltipSection(result.actionsTaken.nextSkill, now, `+1 (${result.initialVirtualLevel + 1})`, '');
        }
        if (this.settings.get('SHOW_LEVEL_MILESTONE') && result.nextMilestone !== Infinity) {
            let msHtml = '';
            if (this.settings.get('SHOW_LEVEL_NEXT') && nextLevelIsMilestone) {
                msHtml += '+1 '
            }
            result.milestoneMedia.forEach((media: string) => {
                msHtml += `<img class="skill-icon-xs mr-2" src="${media}">`;
            });
            elt += this.tooltipSection(result.actionsTaken.nextMilestone, now, `${msHtml} (${result.nextMilestone})`, '');
        }
        if (this.settings.get('SHOW_LEVEL_TARGET')
            && !result.targets.hideSkillTarget
            // don't show target if it is the next level
            && !(this.settings.get('SHOW_LEVEL_NEXT') && result.targets.skillLevelTarget === result.initialVirtualLevel + 1)
            // don't show target if it is the next milestone
            && !(this.settings.get('SHOW_LEVEL_MILESTONE') && result.targets.skillLevelTarget === result.nextMilestone)
        ) {
            elt += this.tooltipSection(result.actionsTaken.skill, now, result.targets.skillLevelTarget, '');
        }
        return elt;
    }

    finalLevel() {
        return this.result.skillLevel + this.getProgressInLevel(this.result.skillXp, this.result.skillLevel);
    }

    getProgressInLevel(currentXp: number, level: number): number {
        const currentLevel = level;
        const currentLevelXp = this.result.levelToXp(currentLevel);
        const nextLevelXp = this.result.levelToXp(currentLevel + 1);
        // progress towards next level
        return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    }

    getProgressInMasteryLevel(currentXp: number, level: number): number {
        const currentLevel = level;
        const currentLevelXp = this.result.masteryLevelToXp(currentLevel);
        const nextLevelXp = this.result.masteryLevelToXp(currentLevel + 1);
        // progress towards next level
        return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
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

    finalLevelElement(finalName: string, finalTarget: string, label: string) {
        return '<div class="row no-gutters justify-content-center">'
            + `    <span class="col-10 p-1 font-size-sm bg-${label} rounded" style="text-align:center">`
            + `        ${finalName}: ${finalTarget}`
            + '    </span>'
            + '</div>';
    }

    timeLeftToHTML(resources: ActionCounter, target: number | string, time: string, finish: string) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}`;
    }

    wrapTimeLeft(s: string) {
        return ''
            + '<div class="row no-gutters">'
            + '	<span class="font-size-sm col-12 m-1" style="padding:0 1.25rem 0.125rem 1.25rem;min-height:2.5rem;font-size:0.875rem;line-height:1.25rem;text-align:center">'
            + s
            + '	</span>'
            + '</div>';
    }

    formatLevel(level: number) {
        const levelString = level.toFixed(2);
        if (levelString.endsWith('.00') || levelString.endsWith(',00')) {
            return level.toFixed(0);
        }
        return levelString;
    }

    // Convert milliseconds to years/hours/minutes/seconds and format them
    msToHms(ms: number, limit: number = 2) {
        let seconds = Number(ms / 1000);
        // split seconds in years, days, hours, minutes and seconds
        let y = Math.floor(seconds / 31536000);
        let d = Math.floor(seconds % 31536000 / 86400)
        let h = Math.floor(seconds % 86400 / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        let s = Math.floor(seconds % 60);
        // append h/hour/hours etc depending, then concat and return
        return [
            this.appendName(y, "year"),
            this.appendName(d, "day"),
            this.appendName(h, "hour"),
            this.appendName(m, "minute"),
            this.appendName(s, "second"),
        ]
            .filter(x => x.length)
            .slice(0, limit)
            .join(' ');
    }

    // help function for time display
    appendName(t: number, name: string) {
        if (t === 0) {
            return "";
        }
        return t + name[0];
    }

    private displayContainer(id: string) {
        const displayContainer = document.createElement('div');
        displayContainer.classList.add('font-size-base');
        displayContainer.classList.add('font-w600');
        displayContainer.classList.add('text-center');
        displayContainer.classList.add('text-muted');
        const display = document.createElement('small');
        display.id = id;
        display.classList.add('mb-2');
        display.style.display = 'block';
        display.style.clear = 'both'
        display.style.whiteSpace = 'pre-line';
        // @ts-ignore
        display.dataToggle = 'tooltip';
        // @ts-ignore
        display.dataPlacement = 'top';
        // @ts-ignore
        display.dataHtml = 'true';
        display.title = '';
        // @ts-ignore
        display.dataOriginalTitle = '';
        displayContainer.appendChild(display);
        const displayAmt = document.createElement('small');
        displayAmt.id = `${id + '-YouHave'}`;
        display.classList.add('mb-2');
        display.style.display = 'block';
        display.style.clear = 'both'
        display.style.whiteSpace = 'pre-line';
        displayContainer.appendChild(displayAmt);
        return displayContainer;
    }
}
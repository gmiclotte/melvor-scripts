import {EtaSkill} from "./EtaSkill";
import {ActionCounter} from "./ActionCounter";
import {DisplayManager} from "./DisplayManager";
import {Settings} from "./Settings";
import {Bank} from "../../Game-Files/built/bank2";
import {ItemRegistry} from "../../Game-Files/built/namespaceRegistry";

export type displayConstructor<BaseDisplay = Display> = new(...args: any[]) => Display;

export class Display {
    public readonly container!: HTMLElement;
    public readonly element!: HTMLElement;
    protected readonly manager: DisplayManager;
    protected readonly settings: Settings;
    protected readonly bank: Bank;
    protected readonly items: ItemRegistry;
    protected readonly formatNumber: (_: any) => string;

    constructor(...[manager, settings, bank, items, id]:
                    [DisplayManager, Settings, Bank, ItemRegistry, string]) {
        this.manager = manager;
        this.settings = settings;
        this.bank = bank;
        this.items = items;
        // create and store container
        this.container = this.displayContainer(id);

        this.element = this.container.firstChild as HTMLElement;
        // @ts-ignore
        this.formatNumber = formatNumber;
    }

    addMSToDate(date: Date, ms: number) {
        return new Date(date.getTime() + ms);
    }

    // Format date 24 hour clock
    dateFormat(now: Date, then: Date, is12h = this.settings.get('IS_12H_CLOCK')) {
        let format = {weekday: "short", month: "short", day: "numeric"};
        // @ts-ignore
        let date = then.toLocaleString(undefined, format);
        // @ts-ignore
        if (date === now.toLocaleString(undefined, format)) {
            date = "";
        } else {
            date += " at ";
        }
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

    injectHTML(result: EtaSkill, now: Date) {
        if (this.element === null) {
            return undefined;
        }
        this.injectRateElement(result);
        this.injectProductCountElement(result);
        this.generateTooltips(result, now);
        this.showElement();
    }

    showElement() {
        this.element.style.display = "block";
        if (this.element.textContent!.length === 0) {
            this.element.textContent = "Melvor ETA";
        }
    }

    injectRateElement(result: EtaSkill) {
        this.element.style.display = 'block';
        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        this.element.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            this.element.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp));
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            this.element.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            this.element.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }
    }

    injectProductCountElement(result: EtaSkill) {
        const youHaveElementId = this.element.id + "-YouHave";
        const youHaveElement = document.getElementById(youHaveElementId);
        if (result.action.product !== undefined && youHaveElement !== null) {
            youHaveElement.style.display = 'block';
            while (youHaveElement.lastChild) {
                youHaveElement.removeChild(youHaveElement.lastChild);
            }
            const span = document.createElement('span');
            span.textContent = `You have: ${this.formatNumber(this.bank.getQty(result.action.product))}`;
            youHaveElement.appendChild(span);
            const img = document.createElement('img');
            img.classList.add('skill-icon-xs');
            img.classList.add('mr-2');
            img.src = result.action.product.media;
            youHaveElement.appendChild(img);
            // add perfect item for cooking // TODO refactor
            const perfectID = result.action.product.id + '_Perfect';
            const perfectItem = this.items.getObjectByID(perfectID);
            if (perfectItem !== undefined) {
                const perfectSpan = document.createElement('span');
                perfectSpan.textContent = `You have: ${this.formatNumber(this.bank.getQty(perfectItem))}`;
                youHaveElement.appendChild(perfectSpan);
                const perfectImg = document.createElement('img');
                img.classList.add('skill-icon-xs');
                img.classList.add('mr-2');
                perfectImg.src = perfectItem.media;
                youHaveElement.appendChild(perfectImg);
            }
        }
    }

    generateTooltips(result: EtaSkill, now: Date, flags = {
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
        // @ts-ignore
        this.element._tippy.setContent(`<div>${this.tooltipContent(result, now)}</div>`);
    }

    tooltipContent(result: EtaSkill, now: Date) {
        return this.skillToolTip(result, now);
    }

    skillToolTip(result: EtaSkill, now: Date) {
        const finalLevel = result.xpToLevel(result.skillXp)
        const levelProgress = this.getPercentageInLevel(result, result.skillXp, result.skillLevel, "skill");
        return this.finalLevelElement(
            'Final Level',
            this.formatLevel(finalLevel, levelProgress) + ' / 99',
            'success',
        ) + this.tooltipSection(result.actionsTaken.skill, now, result.targets.skillLevel, '');
    }

    getPercentageInLevel(result: EtaSkill, currentXp: number, level: number, type: string): number {
        const currentLevel = level;
        const currentLevelXp = result.levelToXp(currentLevel);
        const nextLevelXp = result.levelToXp(currentLevel + 1);
        // progress towards next level
        return (currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100;
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
        return ''
            + '<div class="row no-gutters">'
            + '  <div class="col-6" style="white-space: nowrap;">'
            + '    <h3 class="font-size-base m-1" style="color:white;" >'
            + `      <span class="p-1" style="text-align:center; display: inline-block;line-height: normal;color:white;">`
            + finalName
            + '      </span>'
            + '    </h3>'
            + '  </div>'
            + '  <div class="col-6" style="white-space: nowrap;">'
            + '    <h3 class="font-size-base m-1" style="color:white;" >'
            + `      <span class="p-1 bg-${label} rounded" style="text-align:center; display: inline-block;line-height: normal;width: 100px;color:white;">`
            + finalTarget
            + '      </span>'
            + '    </h3>'
            + '  </div>'
            + '</div>';
    }

    timeLeftToHTML(resources: ActionCounter, target: number | string, time: string, finish: string) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}`;
    }

    wrapTimeLeft(s: string) {
        return ''
            + '<div class="row no-gutters">'
            + '	<span class="col-12 m-1" style="padding:0.5rem 1.25rem;min-height:2.5rem;font-size:0.875rem;line-height:1.25rem;text-align:center">'
            + s
            + '	</span>'
            + '</div>';
    }

    formatLevel(level: number, progress: number) {
        progress = Math.floor(progress);
        if (progress !== 0) {
            return (level + progress / 100).toFixed(2);
        }
        return level;
    }

    // Convert milliseconds to hours/minutes/seconds and format them
    msToHms(ms: number) {
        let seconds = Number(ms / 1000);
        // split seconds in days, hours, minutes and seconds
        let d = Math.floor(seconds / 86400)
        let h = Math.floor(seconds % 86400 / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        let s = Math.floor(seconds % 60);
        // append h/hour/hours etc depending, then concat and return
        return [
            this.appendName(d, "day"),
            this.appendName(h, "hour"),
            this.appendName(m, "minute"),
            this.appendName(s, "second"),
        ].filter(x => x.length).join(' ');
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
import {SkillWithMastery} from "../../Game-Files/built/skill";
import {Bank} from "../../Game-Files/built/bank2";
import {Game} from "../../Game-Files/built/game";
import {ItemRegistry} from "../../Game-Files/built/namespaceRegistry";
import {CurrentSkill} from "./CurrentSkill";
import {ETASettings} from "./Settings";

export class EtaDisplayManager {
    private displays: Map<string, boolean>;
    private settings: ETASettings;
    private bank: Bank;
    private items: ItemRegistry;
    private readonly formatNumber: (_: any) => string;

    constructor(game: Game, settings: ETASettings) {
        this.displays = new Map<string, boolean>()
        this.settings = settings;
        this.bank = game.bank;
        this.items = game.items;
        // @ts-ignore
        this.formatNumber = formatNumber;
    }

    createDisplay(skill: SkillWithMastery, id: string): HTMLElement | null {
        let displayID = `etaTime${skill.name}`;
        if (id !== undefined) {
            displayID += `-${id}`;
        }
        displayID = displayID.replace(' ', '-');
        this.displays.set(displayID, true);
        let display = document.getElementById(displayID);
        if (display !== null) {
            // display already exists
            return display;
        }
        // other containers
        let node = null;
        const wrapperID = `${displayID}Wrapper`;
        let wrapper = undefined;
        switch (skill.name) {
            // @ts-ignore
            case game.mining.name:
                node = document.getElementById(`mining-ores-container`);
                if (node === null) {
                    return null;
                }
                const index = skill.actions.allObjects.findIndex((action: any) => action.id === id);
                node = node.children[index].childNodes[1].childNodes[1].childNodes[1].childNodes[8];
                const parent = node.parentNode;
                if (parent === null) {
                    return null;
                }
                display = parent.insertBefore(this.displayContainer(displayID), node);
                break;
        }
        return display ? (display.firstChild as HTMLElement) : null;
    }

    displayContainer(id: string) {
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

    addMSToDate(date: Date, ms: number) {
        return new Date(date.getTime() + ms);
    }

    injectHTML(result: CurrentSkill, now: Date) {
        const timeLeftElement = this.createDisplay(result.skill, result.action.id);
        if (timeLeftElement === null) {
            return undefined;
        }
        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        let finishedTime = this.addMSToDate(now, result.timeMs);
        timeLeftElement.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            timeLeftElement.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp));
            /*
            if (skill.hasMastery) {
                timeLeftElement.textContent += "\r\nMXp/h: " + formatNumber(Math.floor(results.currentRates.mastery))
                    + `\r\nPool/h: ${results.currentRates.pool.toFixed(2)}%`
            }
             */
        }
        if (this.settings.get('SHOW_ACTION_TIME')) {
            timeLeftElement.textContent += "\r\nAction time: " + this.formatNumber(Math.ceil(rates.ms) / 1000) + 's';
            timeLeftElement.textContent += "\r\nActions/h: " + this.formatNumber(Math.round(100 * 3.6e6 / rates.ms) / 100);
        }
        const itemID = result.action.product.id;
        const item = this.items.getObjectByID(itemID);
        const youHaveElementId = timeLeftElement.id + "-YouHave";
        const youHaveElement = document.getElementById(youHaveElementId);
        if (item !== undefined && youHaveElement !== null) {
            while (youHaveElement.lastChild) {
                youHaveElement.removeChild(youHaveElement.lastChild);
            }
            const span = document.createElement('span');
            span.textContent = `You have: ${this.formatNumber(this.bank.getQty(item))}`;
            youHaveElement.appendChild(span);
            const img = document.createElement('img');
            img.classList.add('skill-icon-xs');
            img.classList.add('mr-2');
            img.src = item.media;
            youHaveElement.appendChild(img);
            // add perfect item for cooking // TODO refactor
            const perfectID = itemID + '_Perfect';
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
        timeLeftElement.style.display = "block";
        if (timeLeftElement.textContent.length === 0) {
            timeLeftElement.textContent = "Melvor ETA";
        }
        return timeLeftElement;
    }
}
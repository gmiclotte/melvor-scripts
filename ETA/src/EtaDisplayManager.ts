import {SkillWithMastery} from "../../Game-Files/built/skill";
import {Bank} from "../../Game-Files/built/bank2";
import {Game} from "../../Game-Files/built/game";
import {ItemRegistry} from "../../Game-Files/built/namespaceRegistry";
import {CurrentSkill} from "./CurrentSkill";
import {ETASettings} from "./Settings";
import {FishingArea} from "../../Game-Files/built/fishing";

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
        let index;
        switch (skill.name) {
            // @ts-ignore
            case game.fishing.name:
                node = document.getElementById('fishing-area-menu-container');
                if (node === null) {
                    return null;
                }
                // @ts-ignore
                index = game.fishing.areas.allObjects.findIndex((area: FishingArea) =>
                    area.fish.find((fish: any) => fish.id === id) !== undefined);
                node = node.children[index].children[0].children[0].children[3].children[0].children[1].children[1];
                display = node.appendChild(this.displayContainer(displayID));
                break;
            // @ts-ignore
            case game.mining.name:
                node = document.getElementById(`mining-ores-container`);
                if (node === null) {
                    return null;
                }
                index = skill.actions.allObjects.findIndex((action: any) => action.id === id);
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

    hideHTML(skill: SkillWithMastery, actionID: string) {
        // disable time left element
        const timeLeftElement = this.createDisplay(skill, actionID);
        if (timeLeftElement === null) {
            return undefined;
        }
        timeLeftElement.style.display = 'none';
        // disable item amount element
        const youHaveElementId = timeLeftElement.id + "-YouHave";
        const youHaveElement = document.getElementById(youHaveElementId);
        if (youHaveElement !== null) {
            youHaveElement.style.display = 'none';
        }
    }

    injectHTML(result: CurrentSkill, now: Date) {
        const timeLeftElement = this.createDisplay(result.skill, result.action.id);
        if (timeLeftElement === null) {
            return undefined;
        }
        timeLeftElement.style.display = 'block';
        const rates = this.settings.get('CURRENT_RATES') ? result.currentRates.hourlyRates : result.averageRates.hourlyRates;
        let finishedTime = this.addMSToDate(now, result.timeTaken.ms);
        timeLeftElement.textContent = "";
        if (this.settings.get('SHOW_XP_RATE')) {
            timeLeftElement.textContent = "Xp/h: " + this.formatNumber(Math.floor(rates.xp));
            if (result.skill.hasMastery) {
                timeLeftElement.textContent += "\r\nMXp/h: " + this.formatNumber(Math.floor(rates.mastery))
                    + `\r\nPool/h: ${result.computePoolProgress(rates.pool).toFixed(2)}%`
            }
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
            youHaveElement.style.display = 'block';
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
        this.generateTooltips(result, timeLeftElement, now);
        return timeLeftElement;
    }

    generateTooltips(result: CurrentSkill, timeLeftElement: HTMLElement, now: Date, flags = {
        noSkill: false,
        noMastery: false,
        noPool: false
    }) {
        // Generate progression Tooltips
        // @ts-ignore
        if (timeLeftElement._tippy === undefined) {
            // @ts-ignore
            tippy(timeLeftElement, {
                allowHTML: true,
                interactive: false,
                animation: false,
            });
        }
        let tooltip = '';
        // level tooltip
        if (!flags.noSkill) {
            const finalLevel = result.xpToLevel(result.skillXp)
            const levelProgress = this.getPercentageInLevel(result, result.skillLevel, "skill");
            tooltip += this.finalLevelElement(
                'Final Level',
                this.formatLevel(finalLevel, levelProgress) + ' / 99',
                'success',
            ) + this.tooltipSection(result, now, result.timeTaken.xp, result.targets.skillLevel, new Map<string, number>(), '');
        }
        // mastery tooltip
        if (!flags.noMastery) {
            const finalLevel = result.xpToLevel(result.masteryXp)
            const levelProgress = this.getPercentageInLevel(result, result.skillLevel, "skill");
            tooltip += this.finalLevelElement(
                'Final Level',
                this.formatLevel(finalLevel, levelProgress) + ' / 99',
                'success',
            ) + this.tooltipSection(result, now, result.timeTaken.mastery, result.targets.masteryLevel, new Map<string, number>(), '');
        }
        // pool tooltip
        if (!flags.noPool) {
            tooltip += this.finalLevelElement(
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
            tooltip += this.tooltipSection(result, now, result.timeTaken.pool, `${result.targets.poolPercent}%`, new Map<string, number>(), prepend);
        }
        // wrap and return
        // @ts-ignore
        timeLeftElement._tippy.setContent(`<div>${tooltip}</div>`);
    }

    getPercentageInLevel(result: CurrentSkill, level: number, type: string): number {
        const currentLevel = level;
        if (currentLevel >= 99 && type === "mastery") {
            // mastery is capped at 99
            return 0;
        }
        const currentLevelXp = result.levelToXp(currentLevel);
        const nextLevelXp = result.levelToXp(currentLevel + 1);
        // progress towards next level
        return (result.skillXp - currentLevelXp) / (nextLevelXp - currentLevelXp) * 100;
    }

    tooltipSection(result: CurrentSkill, now: Date, ms: number, target: number | string, resources: Map<string, number>, prepend = '') {
        // final level and time to target level
        if (ms > 0) {
            return this.wrapTimeLeft(
                prepend + this.timeLeftToHTML(
                    result,
                    target,
                    this.msToHms(ms),
                    this.dateFormat(now, this.addMSToDate(now, ms)),
                    resources,
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

    timeLeftToHTML(result: CurrentSkill, target: number | string, time: string, finish: string, resources: Map<string, number>) {
        return `Time to ${target}: ${time}<br>ETA: ${finish}` + this.resourcesLeftToHTML(result, resources);
    }

    resourcesLeftToHTML(result: CurrentSkill, resources: Map<string, number>) {
        // TODO: update this
        if (this.settings.get('HIDE_REQUIRED') || result.isGathering || resources.size === 0) {
            return '';
        }
        let req = '';
        resources.forEach((amt: number, id: string) => {
                let src;
                if (id === "-5") {
                    src = "assets/media/main/slayer_coins.svg"
                }
                if (id === "-4") {
                    src = "assets/media/main/coins.svg"
                }
                const item = this.items.getObjectByID(id);
                if (item !== undefined) {
                    src = item.media;
                }
                req += `<span>${this.formatNumber(amt)}</span><img class="skill-icon-xs mr-2" src="${src}">`;
            }
        )
        return `<br/>Requires: ${req}`;
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
        if (!this.settings.get('SHOW_PARTIAL_LEVELS')) {
            return level;
        }
        progress = Math.floor(progress);
        if (progress !== 0) {
            return (level + progress / 100).toFixed(2);
        }
        return level;
    }

    // Convert milliseconds to hours/minutes/seconds and format them
    msToHms(ms: number, isShortClock = this.settings.get('IS_SHORT_CLOCK')) {
        let seconds = Number(ms / 1000);
        // split seconds in days, hours, minutes and seconds
        let d = Math.floor(seconds / 86400)
        let h = Math.floor(seconds % 86400 / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        let s = Math.floor(seconds % 60);
        // no comma in short form
        // ` and ` if hours and minutes or hours and seconds
        // `, ` if hours and minutes and seconds
        let dDisplayComma = " ";
        if (!isShortClock && d > 0) {
            let count = 0;
            if (h > 0) {
                count++;
            }
            if (m > 0) {
                count++;
            }
            if (s > 0) {
                count++;
            }
            if (count === 1) {
                dDisplayComma = " and ";
            } else if (count > 1) {
                dDisplayComma = ", ";
            }
        }
        let hDisplayComma = " ";
        if (!isShortClock && h > 0) {
            let count = 0;
            if (m > 0) {
                count++;
            }
            if (s > 0) {
                count++;
            }
            if (count === 1) {
                hDisplayComma = " and ";
            } else if (count > 1) {
                hDisplayComma = ", ";
            }
        }
        // no comma in short form
        // ` and ` if minutes and seconds
        let mDisplayComma = " ";
        if (!isShortClock && m > 0) {
            if (s > 0) {
                mDisplayComma = " and ";
            }
        }
        // append h/hour/hours etc depending on isShortClock, then concat and return
        return appendName(d, "day", isShortClock) + dDisplayComma
            + appendName(h, "hour", isShortClock) + hDisplayComma
            + appendName(m, "minute", isShortClock) + mDisplayComma
            + appendName(s, "second", isShortClock);

        // help function for time display
        function appendName(t: number, name: string, isShortClock: boolean) {
            if (t === 0) {
                return "";
            }
            if (isShortClock) {
                return t + name[0];
            }
            let result = t + " " + name;
            if (t === 1) {
                return result;
            }
            return result + "s";
        }
    }
}
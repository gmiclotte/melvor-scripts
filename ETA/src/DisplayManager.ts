import type {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import type {Game} from "../../Game-Files/gameTypes/game";
import {Settings} from "./Settings";
import type {FishingArea} from "../../Game-Files/gameTypes/fishing";
import {DisplayWithMastery} from "./DisplayWithMastery";
import {Display} from "./Display";
import {ResourceDisplayWithMastery, ResourceDisplayWithoutMastery} from "./ResourceDisplay";
import type {MasteryAction} from "../../Game-Files/gameTypes/mastery2";
import type {CookingCategory} from "../../Game-Files/gameTypes/cooking";
import type {ThievingArea} from "../../Game-Files/gameTypes/thieving2";
import {DisplayWithPool} from "./DisplayWithPool";
import {EtaSkill} from "./EtaSkill";

export class DisplayManager {
    private readonly game: Game;
    private readonly displays: Map<string, Display>;
    private readonly settings: Settings;
    private readonly npcAreaMap: Map<string, ThievingArea>;

    constructor(game: Game, settings: Settings, npcAreaMap: Map<string, ThievingArea>) {
        this.displays = new Map<string, Display>()
        this.settings = settings;
        this.game = game;
        this.npcAreaMap = npcAreaMap;
    }

    removeAllDisplays() {
        this.displays.forEach(display => {
            display.container.remove();
        });
        this.displays.clear();
    }

    public getDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, ...actionIDs: string[]): Display {
        const displayID = this.getDisplayID(skill, ...actionIDs);
        let display = this.displays.get(displayID);
        if (display) {
            // display already exists
            return display;
        }
        // create new display
        if (actionIDs.length === 1) {
            display = this.createDisplay(skill, actionIDs[0]);
        } else {
            display = this.createMultiDisplay(skill);
        }
        this.displays.set(displayID, display);
        return display;
    }

    public getDisplayID(skill: SkillWithMastery<MasteryAction, MasterySkillData>, ...actionIDs: string[]): string {
        // @ts-ignore
        const skillID = skill.id;
        return `etaTime${skillID}${actionIDs.sort().join('-')}`
            .replace(' ', '-');
    }

    hideHTML(skill: SkillWithMastery<MasteryAction, MasterySkillData>, ...actionIDs: string[]) {
        // disable time left element
        const display = this.getDisplay(skill, ...actionIDs);
        display.container.style.display = 'none';
    }

    injectHTML(result: EtaSkill, now: Date) {
        const display = this.getDisplay(result.skill, result.action.id);
        display.container.style.display = 'block';
        display.injectHTML(result, now);
        result.isComputing = false;
    }

    private createArtisanDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string, eltID: string) {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const container = document.getElementById(eltID);
        if (container === null) {
            return display;
        }
        const parent = container.children[0].children[0].children[0].children[0].children[1];
        const node = parent.children[0];
        if (node === null) {
            return display;
        }
        parent.insertBefore(display.container, node.nextSibling);
        return display;
    }

    private createWoodcuttingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementsByClassName('progress-bar bg-woodcutting');
        if (node === null) {
            return display;
        }
        const index = this.game.woodcutting.actions.allObjects.findIndex((action: any) => action.id === actionID);
        node = node[index + 1].parentNode;
        node!.parentNode!.insertBefore(display.container, node!.nextSibling);
        return display;
    }

    private createFishingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById('fishing-area-menu-container');
        if (node === null) {
            return display;
        }
        const index = this.game.fishing.areas.allObjects.findIndex((area: FishingArea) =>
            area.fish.find((fish: any) => fish.id === actionID) !== undefined);
        node = node.children[index].children[0].children[0].children[3].children[0].children[1].children[1];
        node.appendChild(display.container);
        return display;
    }

    private createMiningDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById(`mining-ores-container`);
        if (node === null) {
            return display;
        }
        const index = skill.actions.allObjects.findIndex((action: any) => action.id === actionID);
        node = node.children[index].childNodes[1].childNodes[1].childNodes[1].childNodes[8];
        const parent = node.parentNode;
        parent!.insertBefore(display.container, node);
        return display;
    }

    private createFiremakingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById('firemaking-bonfire-button');
        if (node === null) {
            return display;
        }
        node.parentNode!.parentNode!.parentNode!.appendChild(display.container);
        return display;
    }

    private createCookingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const category = this.game.cooking.actions.getObjectByID(actionID).category;
        const index = this.game.cooking.categories.allObjects.findIndex((c: CookingCategory) => c === category);
        const node = document.getElementById(`cooking-menu-container`)!.children[index].firstChild!.firstChild!.firstChild!.firstChild!.childNodes[2].firstChild!;
        node.insertBefore(display.container, node.childNodes[1]);
        return display;
    }

    private createThievingDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const area = this.npcAreaMap.get(actionID);
        // @ts-ignore
        const node = document.getElementById(`thieving-area-panel-${area!.id}`)!.firstChild!.firstChild!.childNodes[2].firstChild!;
        node.insertBefore(display.container, node.childNodes[1]);
        return display;
    }

    private createAgilityDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const category = this.game.agility.actions.getObjectByID(actionID).category;
        const parent = document.getElementById(`skill-content-container-20`)!.childNodes[category].childNodes[1].childNodes[3].childNodes[3].childNodes[3];
        const node = parent.childNodes[4]
        parent.insertBefore(display.container, node);
        return display;
    }

    private createAstrologyDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const index = this.game.astrology.actions.allObjects.findIndex((action: any) => action.id === actionID)
        const parent = document.getElementById(`astrology-container-content`)!.children[index].children[0].children[0].children[4];
        parent.appendChild(display.container);
        return display;
    }

    private createMagicDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplayWithoutMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const node = document.getElementById('magic-screen-cast')!.children[0].children[1];
        node.appendChild(display.container);
        return display;
    }

    private createDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): Display {
        // create new display
        // standard processing container
        if ([
            this.game.smithing,
            this.game.fletching,
            this.game.crafting,
            this.game.runecrafting,
            this.game.herblore,
        ].includes(skill)) {
            return this.createArtisanDisplay(skill, actionID, `${skill.constructor.name.toLowerCase()}-artisan-container`);
        }
        // other containers
        // @ts-ignore
        switch (skill.id) {
            case this.game.woodcutting.id:
                return this.createWoodcuttingDisplay(skill, actionID);
            case this.game.fishing.id:
                return this.createFishingDisplay(skill, actionID);
            case this.game.firemaking.id:
                return this.createFiremakingDisplay(skill, actionID);
            case this.game.cooking.id:
                return this.createCookingDisplay(skill, actionID);
            case this.game.mining.id:
                return this.createMiningDisplay(skill, actionID);
            case this.game.thieving.id:
                return this.createThievingDisplay(skill, actionID);
            case this.game.agility.id:
                return this.createAgilityDisplay(skill, actionID);
            case this.game.summoning.id:
                return this.createArtisanDisplay(skill, actionID, `summoning-creation-element`);
            case this.game.astrology.id:
                return this.createAstrologyDisplay(skill, actionID);
            case this.game.altMagic.id:
                return this.createMagicDisplay(skill, actionID);
        }
        const displayID = this.getDisplayID(skill, actionID);
        return new Display(this, this.settings, this.game.bank, this.game.items, displayID);
    }

    private createWoodcuttingMultiDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>): Display {
        const displayID = this.getDisplayID(skill);
        const display = new DisplayWithPool(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementsByClassName('progress-bar bg-woodcutting');
        if (node === null) {
            return display;
        }
        node = node[0].parentNode;
        node!.parentNode!.insertBefore(display.container, node!.nextSibling);
        return display;
    }

    private createAgilityMultiDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>): Display {
        const displayID = this.getDisplayID(skill);
        const node = document.getElementById('agility-breakdown-items');
        const display = new DisplayWithPool(this, this.settings, this.game.bank, this.game.items, displayID);
        if (node === null) {
            return display;
        }
        node.appendChild(display.container);
        return display;
    }

    private createMultiDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>): Display {
        // @ts-ignore
        switch (skill.id) {
            case this.game.woodcutting.id:
                return this.createWoodcuttingMultiDisplay(skill);
            case this.game.agility.id:
                return this.createAgilityMultiDisplay(skill);
        }
        const displayID = this.getDisplayID(skill);
        return new Display(this, this.settings, this.game.bank, this.game.items, displayID);
    }
}
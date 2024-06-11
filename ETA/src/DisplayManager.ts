import type {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import type {Game} from "../../Game-Files/gameTypes/game";
import {Settings} from "./Settings";
import {DisplayWithMastery} from "./DisplayWithMastery";
import {Display} from "./Display";
import {ResourceDisplayWithMastery, ResourceDisplayWithoutMastery} from "./ResourceDisplay";
import type {MasteryAction} from "../../Game-Files/gameTypes/mastery2";
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

    public getCachedDisplay (skill: SkillWithMastery<MasteryAction, MasterySkillData>, ...actionIDs: string[]): Display|undefined {
        const displayID = this.getDisplayID(skill, ...actionIDs);
        return this.displays.get(displayID)
    }

    public getDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, ...actionIDs: string[]): Display|undefined {
        let display = this.getCachedDisplay(skill, ...actionIDs);
        if (display && display.isHookedUp) {
            // display already exists
            return display;
        }
        // create new display
        if (actionIDs.length === 1) {
            display = this.createDisplay(skill, actionIDs[0]);
        } else {
            display = this.createMultiDisplay(skill);
        }
        if (display) {
            const displayID = this.getDisplayID(skill, ...actionIDs);
            this.displays.set(displayID, display);
        }
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
        const display = this.getCachedDisplay(skill, ...actionIDs);
        if (display === undefined) {
            return;
        }
        display.container.style.display = 'none';
    }

    injectHTML(display: Display, result: EtaSkill, now: Date) {
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

    private createSkillDisplayAtMasteryBar(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): DisplayWithMastery|undefined {
        let display;
        // @ts-ignore
        const query = `[data-skill-id="${skill.id}"][data-action-id="${actionID}"]`;
        const node = document.querySelector(query);
        if (node !== null) {
            const displayID = this.getDisplayID(skill, actionID);
            display = new DisplayWithMastery(this, this.settings, this.game.bank, this.game.items, displayID);
            node!.parentNode!.insertBefore(display.container, node);
        }
        return display
    }

    private createMagicDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplayWithoutMastery(this, this.settings, this.game.bank, this.game.items, displayID);
        const node = document.getElementById('magic-screen-cast')!.children[0].children[1];
        node.appendChild(display.container);
        return display;
    }

    private createDisplay(skill: SkillWithMastery<MasteryAction, MasterySkillData>, actionID: string): Display|undefined {
        // create new display
        // @ts-ignore
        if (skill.id === this.game.altMagic.id) {
            return this.createMagicDisplay(skill, actionID);
        }
        return this.createSkillDisplayAtMasteryBar(skill, actionID);
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
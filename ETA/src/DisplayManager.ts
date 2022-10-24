import {SkillWithMastery} from "../../Game-Files/built/skill";
import {Game} from "../../Game-Files/built/game";
import {Settings} from "./Settings";
import {FishingArea} from "../../Game-Files/built/fishing";
import {Display} from "./Display";
import {EtaSkill} from "./EtaSkill";
import {ResourceDisplay} from "./ResourceDisplay";

export class DisplayManager {
    private readonly game: Game;
    private readonly displays: Map<string, Display>;
    private readonly settings: Settings;

    constructor(game: Game, settings: Settings) {
        this.displays = new Map<string, Display>()
        this.settings = settings;
        this.game = game;
    }

    removeAllDisplays() {
        this.displays.forEach(display => {
            display.container.remove();
        });
        this.displays.clear();
    }

    public getDisplay(skill: SkillWithMastery, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        let display = this.displays.get(displayID);
        if (display) {
            // display already exists
            return display;
        }
        // create new display
        display = this.createDisplay(skill, actionID);
        this.displays.set(displayID, display);
        return display;
    }

    public getDisplayID(skill: SkillWithMastery, actionID: string): string {
        let displayID = `etaTime${skill.name}`;
        if (actionID !== undefined) {
            displayID += actionID;
        }
        return displayID.replace(' ', '-');
    }

    hideHTML(skill: SkillWithMastery, actionID: string) {
        // disable time left element
        const display = this.getDisplay(skill, actionID);
        display.container.style.display = 'none';
    }

    injectHTML(result: EtaSkill, now: Date) {
        const display = this.getDisplay(result.skill, result.action.id);
        display.container.style.display = 'block';
        display.injectHTML(result, now);
    }

    private createArtisanDisplay(skill: SkillWithMastery, actionID: string, eltID: string) {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplay(this, this.settings, this.game.bank, this.game.items, displayID);
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
        // @ts-ignore
        if (skill.activeRecipe.id !== actionID) {
            display.container.style.display = 'none';
        }
        return display;
    }

    private createFishingDisplay(skill: SkillWithMastery, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new Display(this, this.settings, this.game.bank, this.game.items, displayID);
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

    private createMiningDisplay(skill: SkillWithMastery, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new Display(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById(`mining-ores-container`);
        if (node === null) {
            return display;
        }
        const index = skill.actions.allObjects.findIndex((action: any) => action.id === actionID);
        node = node.children[index].childNodes[1].childNodes[1].childNodes[1].childNodes[8];
        const parent = node.parentNode;
        if (parent === null) {
            return display;
        }
        parent.insertBefore(display.container, node);
        return display;
    }

    private createFiremakingDisplay(skill: SkillWithMastery, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        const display = new ResourceDisplay(this, this.settings, this.game.bank, this.game.items, displayID);
        let node;
        node = document.getElementById('firemaking-bonfire-button');
        if (node === null) {
            return display;
        }
        node = node.parentNode;
        if (node === null) {
            return display;
        }
        node = node.parentNode
        if (node === null) {
            return display;
        }
        const parent = node.parentNode
        if (parent === null) {
            return display;
        }
        parent.appendChild(display.container);
        // @ts-ignore
        if (skill.activeRecipe.id !== actionID) {
            display.container.style.display = 'none';
        }
        return display;
    }

    private createDisplay(skill: SkillWithMastery, actionID: string): Display {
        const displayID = this.getDisplayID(skill, actionID);
        // create new display
        // standard processing container
        if ([
            this.game.smithing,
            this.game.fletching,
            this.game.crafting,
            this.game.runecrafting,
            this.game.herblore,
        ].includes(skill)) {
            return this.createArtisanDisplay(skill, actionID, `${skill.name.toLowerCase()}-artisan-container`);
        }
        // other containers
        switch (skill.name) {
            // case this.game.woodcutting.name:
            case this.game.fishing.name:
                return this.createFishingDisplay(skill, actionID);
            case this.game.firemaking.name:
                return this.createFiremakingDisplay(skill, actionID);
            // case this.game.cooking.name:
            case this.game.mining.name:
                return this.createMiningDisplay(skill, actionID);
            // case this.game.thieving.name:
            // case this.game.agility.name:
            case this.game.summoning.name:
                return this.createArtisanDisplay(skill, actionID, `${skill.name.toLowerCase()}-creation-element`);
            // case this.game.astrology.name:
            // case this.game.altMagic.name:
        }
        return new Display(this, this.settings, this.game.bank, this.game.items, displayID);
    }
}
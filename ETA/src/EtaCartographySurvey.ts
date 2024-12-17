import type {Realm} from "../../Game-Files/gameTypes/realms";
import type {Game} from "../../Game-Files/gameTypes/game";
import {Rates} from "./Rates";
import {ResourceSkillWithoutMastery} from "./ResourceSkill";

export class EtaCartographySurvey extends ResourceSkillWithoutMastery {
    public queueAction: any;
    public surveyXP: number = 0;
    public hex: any;

    get actionInterval() {
        return this.modifyInterval(this.skill.BASE_SURVEY_INTERVAL);
    }

    get noResourceCheckpointLeft() {
        return this.hex === undefined;
    }

    get levelReqReached(): boolean {
        return true;
    }

    init(game: Game) {
        this.queueAction = this.skill.surveyQueue._head;
        this.updateAction();
        if (this.hex === undefined) {
            // not surveying from queue

            return;
        }
        this.surveyXP = this.hex.surveyXP;
        super.init(game);
    }

    iterate(game: Game): void {
        this.init(game);
        this.targets = this.getTargets();
        // store the current gains per action
        const gainsPerAction = this.gainsPerAction();
        this.iterateInner();
        this.setCurrentRates(gainsPerAction);
    }

    completed() {
        return this.noResourceCheckpointLeft;
    }

    updateAction() {
        if (this.queueAction === undefined) {
            this.hex = undefined;
            return;
        }
        this.hex = this.queueAction.obj;
    }

    updateSurveyXP(toAdd: number): any {
        if (toAdd <= 0) {
            return;
        }
        const currSurveyXP = this.surveyXP;
        // @ts-ignore
        const maxSurveyXP = Hex.getXPFromLevel(this.hex.maxLevel);
        const diff = maxSurveyXP - currSurveyXP;
        // if we add more than the diff until max level, then we need to update the hex
        if (toAdd >= diff) {
            this.queueAction = this.queueAction.next;
            this.updateAction();
            if (this.hex === undefined) {
                return;
            }
            this.surveyXP = this.hex.surveyXP;
            toAdd -= diff;
            return this.updateSurveyXP(toAdd);
        }
        // if we are here, then we are still on the same hex
        this.surveyXP += toAdd;
    }

    actionXP(realmID: string): number {
        if (this.hex === undefined) {
            return 0;
        }
        const baseXP = this.skill.getSkillXPForHexSurveyAction(this.hex);
        if (realmID === "melvorD:Melvor" /* RealmIDs.Melvor */) {
            return this.modifyMelvorXP(baseXP);
        } else if (realmID === "melvorItA:Abyssal" /* RealmIDs.Abyssal */) {
            return this.modifyAbyssalXP(baseXP);
        }
        return 0;
    }

    getRecipeCosts() {
        // @ts-ignore
        return new Costs(undefined);
    }

    attemptsToCheckpoint(gainsPerAction: Rates) {
        if (this.hex === undefined) {
            return 0;
        }
        // if current rates is not set, then we are in the first iteration, and we can set it
        this.setCurrentRates(gainsPerAction);
        const currSurveyXP = this.surveyXP;
        // @ts-ignore
        const maxSurveyXP = Hex.getXPFromLevel(this.hex.maxLevel);
        const attemptsToSurveyCheckpoint = maxSurveyXP - currSurveyXP;
        return Math.ceil(Math.min(
            super.attemptsToCheckpoint(gainsPerAction),
            attemptsToSurveyCheckpoint,
        ));
    }

    addAttempts(gainsPerAction: Rates, attempts: number) {
        super.addAttempts(gainsPerAction, attempts);
        this.updateSurveyXP(attempts);
    }

    activeRealm(): Realm {
        return this.skill.currentRealm;
    }

    actionRealm() {
        return this.skill.currentRealm;
    }

    skip() {
        return !this.actionIsInActiveRealm;
    }
}
import {TinyMod} from "../../TinyMod/src/TinyMod";
import type {Game} from "../../Game-Files/gameTypes/game";
import {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import {MasteryAction} from "../../Game-Files/gameTypes/mastery2";
import {ExperienceCalculator} from "../../Game-Files/gameTypes/utils";
import {TabCard} from "../../TinyMod/src/TabCard";
import {Realm} from "../../Game-Files/gameTypes/realms";

export class SpendPool extends TinyMod {

    private game: Game;
    private exp: ExperienceCalculator;
    private skillTargetCard!: TabCard;

    constructor(ctx: any, game: Game, exp: ExperienceCalculator, tag: string = 'SpendPool') {
        super(ctx, tag);
        this.game = game;
        this.exp = exp;
        this.createSettingsMenu();
    }

    xpTillNextMastery(skill: SkillWithMastery<MasteryAction, MasterySkillData>, action: MasteryAction): number {
        let mastery = skill.actionMastery.get(action);
        if (mastery === undefined) {
            skill.addMasteryXP(action, 0);
            mastery = skill.actionMastery.get(action)!;
        }
        if (mastery.level >= 99) {
            return Infinity;
        }
        const nextXp = this.exp.levelToXP(mastery.level + 1) + 1;
        return Math.ceil(nextXp - mastery.xp);
    }

    masteryTokenValue(skill: SkillWithMastery<MasteryAction, MasterySkillData>, realm: Realm) {
        const tokens = skill.masteryTokens.get(realm);
        if (tokens === undefined) {
            return 0;
        }
        return tokens.reduce((value, token) =>
                value + this.game.bank.getQty(token) * token.percent,
            0,
        );
    }

    spendMasteryTokens(skill: SkillWithMastery<MasteryAction, MasterySkillData>, realm: Realm) {
        const tokens = skill.masteryTokens.get(realm);
        if (tokens === undefined) {
            return;
        }
        tokens.forEach(token => this.game.bank.claimMasteryTokenOnClick(token, Infinity));
    }

    spendMastery(skill: SkillWithMastery<MasteryAction, MasterySkillData>, realm: Realm, cutoff: number, verbose: boolean) {
        cutoff = Math.max(0, cutoff);
        const basePool = skill.getBaseMasteryPoolCap(realm);
        const poolBank = cutoff / 100 * basePool;
        let poolXp = skill._masteryPoolXP.get(realm);
        const available = poolXp + this.masteryTokenValue(skill, realm) / 100 * basePool;
        let toSpend = Math.floor(available - poolBank);
        // gather actions that are affordable
        const actions: { [key: number]: MasteryAction[] } = {};
        let min = Infinity;
        skill.actions.registeredObjects.forEach((x: MasteryAction) => {
            // @ts-ignore
            if (x.realm !== realm) {
                return;
            }
            const tillNext = this.xpTillNextMastery(skill, x);
            if (tillNext > toSpend) {
                return;
            }
            actions[tillNext] = actions[tillNext] ?? []
            actions[tillNext].push(x);
            min = Math.min(min, tillNext);
        });
        // if we did not find any affordable actions, return false to stop the loop
        if (min === Infinity || actions[min] === undefined) {
            return false;
        }
        // spend xp
        for (const x of actions[min]) {
            // don't overspend
            if (toSpend < min) {
                break;
            }
            toSpend -= min;
            // don't drop below 0 pool Xp
            if (poolXp < min) {
                break;
            }
            poolXp -= min;
            // spend the pool xp
            const oldMastery = skill.actionMastery.get(x)!.level;
            skill.exchangePoolXPForActionXP(x, min);
            const newMastery = skill.actionMastery.get(x)!.level;
            if (verbose) {
                // @ts-ignore
                console.log(`spent ${min} pool xp on ${x.id} mastery ${oldMastery}->${newMastery}`);
            }
        }
        if (verbose) {
            console.log(`remaining pool after spending: ${skill._masteryPoolXP.get(realm)} pool xp`);
        }
        // claim tokens
        this.spendMasteryTokens(skill, realm);
        // stop the loop if we reached the spending limit, otherwise go another round
        return toSpend > min;
    }

    spendAllMastery(skill: SkillWithMastery<MasteryAction, MasterySkillData>, realm: Realm, cutoff = 95, verbose = false) {
        while (this.spendMastery(skill, realm, cutoff, verbose)) {
        }
    }

    createSettingsMenu(): void {
        super.createSettingsMenu([
            // add target card
            () => this.addTargetInputs(),
        ]);
    }

    addTargetInputs() {
        this.skillTargetCard = new TabCard(this.idManager, 'SkillSpendPool', true, this.tag, this.content, '', '', true);
        this.game.skills.forEach((skill: SkillWithMastery<MasteryAction, MasterySkillData>) => {
            if (skill.getRealmsWithMastery === undefined
                || skill.getRealmsWithMastery() === undefined
                || skill.getRealmsWithMastery().length === 0) {
                return;
            }
            // @ts-ignore
            const skillID = skill.id;
            const card = this.skillTargetCard.addTab(skillID, skill.media, '', '', undefined);
            skill.getRealmsWithMastery().forEach((realm: Realm) => {
                if (!realm.isUnlocked) {
                    return;
                }
                // @ts-ignore
                const realmID = realm.id;
                card.addSectionTitle(`${skill.name} ${realm.name}`);
                [0, 10, 25, 50, 95].forEach(target => {
                    card.addButton(
                        `${target}% Pool`,
                        `${skillID}-${realmID}-${target}`,
                        () => this.spendAllMastery(skill, realm, target, false),
                    );
                });
            });
        });
    }
}
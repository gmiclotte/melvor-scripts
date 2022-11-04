import {MasterySkillData, SkillWithMastery} from "../../Game-Files/built/skill";
import {MasteryAction} from "../../Game-Files/built/mastery2";
import {Bank} from "../../Game-Files/built/bank2";
import {TokenItem} from "../../Game-Files/built/item";

function removePoolLimit(ctx: any) {
    // Do not cap mastery xp
    ctx.patch(SkillWithMastery, "addMasteryPoolXP").replace(function (this: SkillWithMastery<MasteryAction, MasterySkillData>, _: any, xp: number) {
        const oldBonusLevel = this.getMasteryCheckPointLevel(this.masteryPoolXP);
        // @ts-ignore TS2341 private field
        this._masteryPoolXP += xp;
        const newBonusLevel = this.getMasteryCheckPointLevel(this.masteryPoolXP);
        if (oldBonusLevel !== newBonusLevel) {
            this.onMasteryPoolBonusChange(oldBonusLevel, newBonusLevel);
        }
        this.renderQueue.masteryPool = true;
    });

    // Do not cap mastery token claim quantity to tokens required to fill the pool
    ctx.patch(Bank, "claimItemOnClick").replace(function (this: Bank, original: (item: TokenItem, quantity: number) => void, item: TokenItem, quantity: number) {
        if (item.modifiers.masteryToken !== undefined) {
            const skill = item.modifiers.masteryToken[0].skill;
            if (!(skill instanceof SkillWithMastery) || !skill.hasMastery) {
                throw new Error(`Error claiming token. Mastery Token skill does not have mastery.`);
            }
            // compute xp to add
            const tokenPercent = item.modifiers.masteryToken[0].value;
            const xpPerToken = Math.floor(skill.baseMasteryPoolCap * tokenPercent / 100);
            const totalXpToAdd = xpPerToken * quantity;
            // add the exp and remove the tokens
            skill.addMasteryPoolXP(totalXpToAdd);
            this.removeItemQuantity(item, quantity, true);
            // @ts-ignore
            notifyPlayer(skill, templateLangString('TOASTS', 'POOL_XP_GRANTED', {xp: numberWithCommas(totalXpToAdd)}), 'success');
            // @ts-ignore
            $('#mastery-pool-spend-token-qty').text(numberWithCommas(this.getQty(item)));
        } else {
            // if item is not a mastery token, then execute original behaviour
            original(item, quantity);
        }
    });
}

export const removePoolLimitSetting = {
    function: removePoolLimit,
    setting: {
        type: 'switch',
        name: 'removePoolLimit',
        label: 'Remove pool limit',
        hint: 'Remove pool limit',
        default: false,
    },
    toggles: [],
}
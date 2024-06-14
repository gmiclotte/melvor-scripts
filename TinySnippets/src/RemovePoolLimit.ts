import type {MasterySkillData, SkillWithMastery} from "../../Game-Files/gameTypes/skill";
import type {MasteryAction} from "../../Game-Files/gameTypes/mastery2";
import type {Bank} from "../../Game-Files/gameTypes/bank2";
import type {TokenItem} from "../../Game-Files/gameTypes/item";
import type {Realm} from "../../Game-Files/gameTypes/realms";

function removePoolLimit(ctx: any) {
    // Adds Mastery Pool XP to the given realm
    // Patch: do not cap mastery xp
    // @ts-ignore
    ctx.patch(SkillWithMastery, "addMasteryPoolXP").replace(function (this: SkillWithMastery<MasteryAction, MasterySkillData>, realm: Realm, xp: number) {
        const oldXP = this._masteryPoolXP.get(realm);
        // Do not cap mastery xp
        /*
        const xpCap = this.getMasteryPoolCap(realm);
        const newXP = Math.min(oldXP + xp, xpCap);
         */
        const newXP = oldXP + xp;
        this._masteryPoolXP.set(realm, newXP);
        // Check for changes in Mastery Pool Bonuses
        const oldBonusLevel = this.getActiveMasteryPoolBonusCount(realm, oldXP);
        const newBonusLevel = this.getActiveMasteryPoolBonusCount(realm, newXP);
        if (oldBonusLevel !== newBonusLevel) {
            this.onMasteryPoolBonusChange(realm, oldBonusLevel, newBonusLevel);
        }
        this.renderQueue.masteryPool.add(realm);
    });

    // Callback function for when the claim token button is clicked for a Mastery Token
    // Patch: do not cap mastery token claim quantity to tokens required to fill the pool
    // @ts-ignore
    ctx.patch(Bank, "claimMasteryTokenOnClick").replace(function (this: Bank, original: (item: TokenItem, quantity: number) => void, item: TokenItem, quantity: number) {
        const bankItem = this.items.get(item);
        if (bankItem === undefined)
            return;
        quantity = Math.min(bankItem.quantity, quantity);
        // @ts-ignore
        const skill = item.skill;
        // @ts-ignore
        const tokenPercent = item.percent + this.game.modifiers.xpFromMasteryTokens;
        if (!skill.hasMastery) {
            throw new Error(`Error claiming mastery token. Mastery Token skill does not have mastery.`);
        }
        // @ts-ignore
        const basePoolCap = skill.getBaseMasteryPoolCap(item.realm);
        const xpPerToken = Math.floor((basePoolCap * tokenPercent) / 100);
        // Do not cap quantity at tokens required to fill the pool
        /*
        const xpRemaining = skill.getMasteryPoolCap(item.realm) - skill.getMasteryPoolXP(item.realm);
        const tokensToFillPool = Math.floor(xpRemaining / xpPerToken);
        quantity = Math.min(quantity, tokensToFillPool);
         */
        // Reward the pool XP to the skill
        const totalXpToAdd = xpPerToken * quantity;
        // @ts-ignore
        skill.addMasteryPoolXP(item.realm, totalXpToAdd);
        /*
        if (quantity === tokensToFillPool) {
            // @ts-ignore
            notifyPlayer(skill, templateLangString('TOASTS_MAX_POOL_TOKENS', { count: `${tokensToFillPool}` }), 'info', 0);
        }
         */
        // @ts-ignore
        notifyPlayer(skill, templateLangString('TOASTS_POOL_XP_GRANTED', {xp: numberWithCommas(totalXpToAdd)}), 'success', 0);
        this.removeItemQuantity(item, quantity, true);
        // @ts-ignore
        $('#mastery-pool-spend-token-qty').text(numberWithCommas(this.getQty(item)));
    });
}

export const removePoolLimitSetting = {
    object: null,
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
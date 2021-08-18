
/////////////////////
//don't cap pool xp//
/////////////////////
eval(addMasteryXPToPool.toString()
    .replace('MASTERY[skill].pool>getMasteryPoolTotalXP(skill)', 'false')
    .replace(/^function (\w+)/, "window.$1 = function")
);

////////////////////////////
//don't cap token claiming//
////////////////////////////
eval(claimToken.toString()
    .replace('qty>=tokensToFillPool', 'false')
    .replace(/^function (\w+)/, "window.$1 = function")
);

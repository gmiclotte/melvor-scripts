// fix perform skill process
eval(performSkillProcess.toString().replace(
    'if(!confirmedAdded&&!offline)return false;',
    'if (!confirmedAdded && !ignoreBankFull && !offline) return false;'
).replace(
    /^function (\w+)/,
    'window.$1 = function'
));

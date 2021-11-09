// ==UserScript==
// @name         Melvor Unlimited Offline
// @version      0.0.1
// @description  Offline progress is no longer limited to 18h
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com/*
// @grant        none
// @namespace    http://tampermonkey.net/
// @noframes
// ==/UserScript==

setTimeout(() => {
    function patchCode(code, match, replacement) {
        const codeString = code
            .toString()
            .replace(match, replacement)
            .replace(/^function (\w+)/, "window.$1 = function");
        eval(codeString);
    }

    // remove limit from getOfflineTimeDiff function then overwrite
    patchCode(
        getOfflineTimeDiff,
        '64800000',
        'Infinity',
    );
    // "fix" issue with sample_from_binomial
    patchCode(
        sample_from_binomial,
        /(let binomial[^;]+;)/,
        "$1if (binomial.length > numberTrials) return Math.floor(numberTrials * chance);"
    );
}, 100);

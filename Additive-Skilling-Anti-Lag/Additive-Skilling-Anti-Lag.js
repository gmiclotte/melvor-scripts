// ==UserScript==
// @name         Melvor additive skilling anti-lag
// @version      0.2.0
// @description  Adjusts game speed to compensate for lag so that the original intervals match realtime. Based on anti-lag by 8992
// @author       GMiclotte
// @match        https://*.melvoridle.com/*
// @exclude      https://wiki.melvoridle.com/*
// @grant        none
// @namespace    http://tampermonkey.net/
// @noframes
// ==/UserScript==

function script() {
    const skillFunctions = [
        cutTree,
        startFishing,
        burnLog,
        startCooking,
        mineRock,
        rockReset,
        startSmithing,
        pickpocket,
        startFletching,
        startCrafting,
        startRunecrafting,
        startHerblore,
        startAgility,
        createSummon,
        castMagic,
    ];

    class ASAL {
        constructor(name) {
            this.name = name;
            this.lagDifference = {};
            this.intervalLog = {};
            this.lagKeyIncrement = 0;
        }

        log(...args) {
            console.log('Melvor Additive Skilling Anti-Lag', ...args)
        }

        patchCode(code, match, replacement) {
            return code
                .toString()
                .replace(match, replacement)
                .replace(/^function (\w+)/, "window.$1 = function");
        }

        editInterval(code, skip = []) {
            const name = code.match(/(?<=^window\.)[^ =]+/)[0];
            const arr = code.split("setTimeout");
            //loop through array backwards to avoid problems with nested setTimeouts
            for (let i = arr.length - 1; i > 0; i--) {
                let b = 0;
                let index = 0;
                let found = -1;
                arr[i].replace(/./gs, (char) => {
                    char === "(" ? b++ : char === ")" ? b-- : 0;
                    if (found < 0 && b === 0) {
                        found = index;
                    }
                    index++;
                    return char;
                });
                //insert interval recording
                let part = arr[i].slice(0, found);
                const close = `${this.name}.recordInterval(KEY, false, null, "${name}"),`;
                if (part.includes(name)) {
                    part = part.replace(
                        new RegExp(`(?<!${close.replace(/([()])/g, (m, $1) => `\\${$1}`)})(${name}\\()`, "g"),
                        (m, $1) => `${close}${$1}`
                    );
                } else if (!skip.includes(i)) {
                    part = part.replace(
                        /(}[^}]*$)/s,
                        (m, $1) => `${this.name}.recordInterval(KEY, false, null, "${name}");${$1}`
                    );
                }
                let edited = 'setTimeout';
                if (!skip.includes(i)) {
                    edited += part.replace(
                        /,([^,]*$)/s,
                        (m, $1) => `,${this.name}.recordInterval(KEY, true, (${$1}), "${name}")`
                    );
                } else {
                    edited += part;
                }
                edited += arr[i].slice(found);
                arr[i - 1] += edited;
            }
            return arr[0].replace("(KEY, true)", `(KEY, true, null, "${name}")`);
        }

        recordInterval(KEY, open, baseInterval = null, thread) {
            if (open && baseInterval != null) {
                try {
                    this.intervalLog[thread].timestamps[KEY].I = baseInterval;
                    return baseInterval - this.lagDifference[thread];
                } catch {
                    return baseInterval;
                }
            } else if (open) {
                try {
                    this.intervalLog[thread].timestamps[KEY] = {T: new Date()};
                } catch {
                    this.intervalLog[thread] = {timestamps: [], results: []};
                    this.intervalLog[thread].timestamps[KEY] = {T: new Date()};
                    this.lagDifference[thread] = 0;
                }
            } else if (this.intervalLog[thread] !== undefined && this.intervalLog[thread].timestamps[KEY] !== undefined) {
                this.intervalLog[thread].results.push({
                    T: new Date() - this.intervalLog[thread].timestamps[KEY].T,
                    I: this.intervalLog[thread].timestamps[KEY].I,
                });
                delete this.intervalLog[thread].timestamps[KEY];
            }
        }

        calcLag() {
            for (let thread in this.intervalLog) {
                // sum measured and expected times
                const sum = this.intervalLog[thread].results.reduce(
                    (sum, a) => (a.T * a.I === 0 ? sum : {T: sum.T + a.T, I: sum.I + a.I}),
                    {T: 0, I: 0}
                );
                // nothing to adjust
                if (sum.T * sum.I === 0) continue;
                // compute lag difference
                const delays = this.intervalLog[thread].results.map(x => x.T - x.I);
                const remainingDifference = delays.reduce((sum, x) => sum + x, 0) / delays.length;
                this.lagDifference[thread] += remainingDifference;
                // reset this.intervalLog
                this.intervalLog[thread].results = [];
                this.intervalLog[thread].timestamps = [];
                this.lagKeyIncrement = 0;
            }
        }
    }

    function loadScript() {
        const name = 'asal';
        window[name] = new ASAL(name);
        const asal = window[name];
        asal.log('loading...');
        let codeStrings = skillFunctions
            .map(a => asal.patchCode(a, /{/, `{let KEY = ${asal.name}.lagKeyIncrement++;${asal.name}.recordInterval(KEY, true);`))
            .map((a, i) => asal.editInterval(a, i === 0 ? [1] : []));
        codeStrings.forEach(a => eval(a));
        setInterval(() => asal.calcLag(), 120000);
        asal.log('Loaded');
    }

    loadScript();
}

(function () {
    function injectScript(main) {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `try {(${main})();} catch (e) {console.log(e);}`;
        document.body.appendChild(scriptElement).parentNode.removeChild(scriptElement);
    }

    function loadScript() {
        if ((window.isLoaded && !window.currentlyCatchingUp)
            || (typeof unsafeWindow !== 'undefined' && unsafeWindow.isLoaded && !unsafeWindow.currentlyCatchingUp)) {
            // Only load script after game has opened
            clearInterval(scriptLoader);
            injectScript(script);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
})();
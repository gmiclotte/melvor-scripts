// ==UserScript==
// @name        Melvor Additive Skilling Anti-Lag
// @namespace   http://tampermonkey.net/
// @version     0.2.9
// @description Adjusts game speed to compensate for lag so that the original intervals match realtime. Based on anti-lag by 8992
// @author      GMiclotte
// @include		https://melvoridle.com/*
// @include		https://*.melvoridle.com/*
// @exclude		https://melvoridle.com/index.php
// @exclude		https://*.melvoridle.com/index.php
// @exclude		https://wiki.melvoridle.com/*
// @exclude		https://*.wiki.melvoridle.com/*
// @inject-into page
// @noframes
// @grant        none
// ==/UserScript==

((main) => {
    const script = document.createElement('script');
    script.textContent = `try { (${main})(); } catch (e) { console.log(e); }`;
    document.body.appendChild(script).parentNode.removeChild(script);
})(() => {

    class ASAL {
        constructor(name) {
            this.name = name;
            this.lagDifference = {};
            this.intervalLog = {};
            this.lagKeyIncrement = 0;
        }

        log(...args) {
            console.log('ASAL:', ...args)
        }

        warn(...args) {
            console.warn('ASAL:', ...args)
        }

        patchCode(code, match, replacement) {
            code = code.toString();
            if (match !== undefined && replacement !== undefined) {
                code = code.replace(match, replacement);
            }
            return code.replace(/^function (\w+)/, 'window.$1 = function');
        }

        editInterval(code, skip = []) {
            // get name and add startThread
            code = this.patchCode(code);
            const match = code.match(/(?<=^window\.)[^ =]+/);
            if (match === null) {
                this.warn('Some skill function could not be patched.');
                return;
            }
            const name = match[0];
            code = code.replace(/{/, `{let KEY = ${this.name}.startThread('${name}');`);
            // split around timeouts
            const arr = code.split('setTimeout');
            //loop through array backwards to avoid problems with nested setTimeouts
            for (let i = arr.length - 1; i > 0; i--) {
                let b = 0;
                let index = 0;
                let found = -1;
                arr[i].replace(/./gs, (char) => {
                    char === '(' ? b++ : char === ')' ? b-- : 0;
                    if (found < 0 && b === 0) {
                        found = index;
                    }
                    index++;
                    return char;
                });
                //insert interval recording
                let part = arr[i].slice(0, found);
                let edited = 'setTimeout';
                if (!skip.includes(i)) {
                    // default
                    part = part.replace(
                        /},([^,]*$)/s,
                        (m, $1, $2) => `${this.name}.recordCloseInterval(KEY, '${name}');},${this.name}.recordTimeout(KEY, (${$1}), '${name}')`
                    );
                }
                edited += part;
                edited += arr[i].slice(found);
                arr[i - 1] += edited;
            }
            return arr[0];
        }

        startThread(thread) {
            const KEY = this.lagKeyIncrement++;
            // this.log(`start function ${KEY} ${thread}`);
            if (this.intervalLog[thread] === undefined) {
                this.intervalLog[thread] = {timestamps: [], results: []};
                this.lagDifference[thread] = 0;
            }
            this.intervalLog[thread].timestamps[KEY] = {T: new Date()};
            return KEY;
        }

        recordTimeout(KEY, baseInterval, thread) {
            if (this.intervalLog[thread].timestamps[KEY] !== undefined) {
                this.intervalLog[thread].timestamps[KEY].I = baseInterval;
            }
            const interval = baseInterval - this.lagDifference[thread];
            // this.log(`start time out ${interval} ${KEY} ${thread}`);
            return interval;
        }

        recordCloseInterval(KEY, thread) {
            if (this.intervalLog[thread] === undefined || this.intervalLog[thread].timestamps[KEY] === undefined) {
                // log has been cleared, don't record this one
                return;
            }
            const expected = this.intervalLog[thread].timestamps[KEY].I;
            // measured time is limited to 1.5x expected time
            const measured = Math.min(
                new Date() - this.intervalLog[thread].timestamps[KEY].T,
                1.5 * expected,
            );
            this.intervalLog[thread].results.push({
                T: measured,
                I: expected,
            });
            delete this.intervalLog[thread].timestamps[KEY];
        }

        calcLag() {
            // this.log('calculate lag')
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

    function startASAL(skillFunctions) {
        const name = 'asal';
        window[name] = new ASAL(name);
        const asal = window[name];
        asal.log('loading...');
        asal.warn('Cooking is not supported.');
        asal.warn('Astrology is not supported.');
        let codeStrings = skillFunctions.map((a, i) => asal.editInterval(a, i === 0 ? [1] : [])).filter(x => x);
        codeStrings.forEach(a => eval(a));
        setInterval(() => asal.calcLag(), 2 * 60 * 1000);
        asal.log('Loaded');
    }

    function loadScript() {
        const skillFunctions = [
            startFishing,
            startFletching,
            startCrafting,
            startRunecrafting,
            startAgility,
            createSummon,
        ];
        if (skillFunctions.every((a) => a !== undefined)) {
            // Only load script after all functions have been defined
            clearInterval(scriptLoader);
            startASAL(skillFunctions);
        }
    }

    const scriptLoader = setInterval(loadScript, 200);
});
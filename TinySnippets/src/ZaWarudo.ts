import type {Game} from "../../Game-Files/gameTypes/game";
import {Snippet} from "./Snippets";

class ZaWarudo {
    public readonly name: string;
    public readonly tickInterval: number;
    public readonly ticksPerMinute: number;
    public readonly timeUnitToMS: { s: number; d: number; t: any; ms: number; h: number; y: number; m: number };
    public stored: HTMLSpanElement | undefined;
    private readonly ctx: any;
    private container: HTMLUListElement | undefined;
    private customButton: HTMLButtonElement | undefined;

    constructor(ctx: any) {
        this.ctx = ctx;
        this.name = 'zaWarudo';
        // @ts-ignore
        this.tickInterval = TICK_INTERVAL;
        // @ts-ignore
        this.ticksPerMinute = TICKS_PER_MINUTE;
        this.timeUnitToMS = {
            y: 365 * 24 * 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            h: 60 * 60 * 1000,
            m: 60 * 1000,
            s: 1000,
            t: this.tickInterval,
            ms: 1,
        }
    }

    compactTimeToMS(formattedTime: string) {
        const units = formattedTime.split(/[0-9]+/);
        units.shift();
        const values = formattedTime.split(/[a-z]+/);
        let ms = 0;
        units.forEach((u, i) => {
            // @ts-ignore
            if (this.timeUnitToMS[u]) {
                // @ts-ignore
                ms += values[i] * this.timeUnitToMS[u];
            }
        });
        return ms;
    }

    formatCompactTime(timeInMs: number) {
        // @ts-ignore
        const time = getMAsTime(timeInMs);
        const timePeriods = [];
        if (time.years > 0) {
            timePeriods.push(`${time.years}y`);
        }
        if (time.days > 0) {
            timePeriods.push(`${time.days}d`);
        }
        if (time.hours > 0) {
            timePeriods.push(`${time.hours}h`);
        }
        if (time.minutes > 0) {
            timePeriods.push(`${time.minutes}m`);
        }
        if (time.seconds > 0) {
            timePeriods.push(`${time.seconds}s`);
        }
        if (time.milliseconds >= 50) {
            timePeriods.push(`${Math.floor(time.milliseconds / 50)}t`);
            time.milliseconds %= 50;
        }
        if (time.milliseconds > 0) {
            timePeriods.push(`${time.milliseconds}ms`);
        }
        if (timePeriods.length === 0) {
            timePeriods.push(`0ms`);
        }
        return timePeriods.join('');
    }

    createContainers() {
        const oldContainer = document.getElementById('zaWarudo-main-container');
        if (oldContainer !== null) {
            oldContainer.remove();
        }
        const parent = document.getElementById('page-header');
        if (parent === null) {
            setTimeout(this.createUI, 1e3);
            return;
        }
        const container1 = document.createElement('div');
        container1.className = 'col-12';
        container1.id = 'zaWarudo-main-container';
        parent.appendChild(container1);
        const container2 = document.createElement('div');
        container2.className = 'block p-2';
        container1.appendChild(container2);
        const container3 = document.createElement('h5');
        container3.className = 'font-w600 text-info mb-0';
        container2.appendChild(container3);
        const unorderedList = document.createElement('ul');
        unorderedList.className = 'nav-main nav-main-horizontal nav-main-horizontal-override';
        container3.appendChild(unorderedList);
        this.container = unorderedList;
    }

    customClick() {
        // @ts-ignore
        game.progressMS(this.ctx.characterStorage.getItem('zaWarudoCustom'))
    }

    createCustomButton() {
        const customButton = document.createElement('button');
        customButton.className = 'btn btn-sm btn-outline-info';
        customButton.id = `zaWarudo-custom-btn`;
        customButton.onclick = this.customClick.bind(this);
        const custom = this.ctx.characterStorage.getItem('zaWarudoCustom');
        customButton.textContent = `${this.formatCompactTime(custom)}`;
        this.customButton = customButton;
        return customButton;
    }

    createPauseButton() {
        const pauseButton = document.createElement('button');
        pauseButton.className = 'btn btn-sm btn-outline-info';
        pauseButton.id = `zaWarudo-pause-btn`;
        // @ts-ignore
        pauseButton.onclick = () => game.stopMainLoop();
        pauseButton.textContent = 'Pause';
        return pauseButton;
    }

    createResumeButton() {
        const pauseButton = document.createElement('button');
        pauseButton.className = 'btn btn-sm btn-outline-info';
        pauseButton.id = `zaWarudo-resume-btn`;
        // @ts-ignore
        pauseButton.onclick = () => game.startMainLoop();
        pauseButton.textContent = 'Resume';
        return pauseButton;
    }

    createButtons() {
        const list = document.createElement('li');
        list.className = 'mr-2';
        list.textContent = 'Progress'
        this.container!.appendChild(list);
        const buttons = document.createElement('div');
        buttons.className = 'btn-group m-1';
        list.appendChild(buttons);
        buttons.appendChild(this.createCustomButton());
        [
            1,
            1000 / this.tickInterval,
            this.ticksPerMinute,
            60 * this.ticksPerMinute,
            24 * 60 * this.ticksPerMinute,
        ].forEach(ticks => {
            const ms = ticks * this.tickInterval;
            const button = document.createElement('button');
            button.className = 'btn btn-sm btn-outline-info';
            button.id = `zaWarudo-${ticks}-btn`;
            // @ts-ignore
            button.onclick = () => game.progressMS(ms);
            button.textContent = `${this.formatCompactTime(ms)}`;
            buttons.appendChild(button);
        });
        buttons.appendChild(this.createPauseButton());
        buttons.appendChild(this.createResumeButton());
    }

    inputHandler(event: any) {
        // @ts-ignore
        const custom = this.compactTimeToMS(event.target.value);
        // @ts-ignore
        this.ctx.characterStorage.setItem('zaWarudoCustom', custom);
        // @ts-ignore
        this.customButton.textContent = `${this.formatCompactTime(custom)}`;
    }

    createInput() {
        const list = document.createElement('li');
        list.className = 'mr-2';
        this.container!.appendChild(list);
        const inputs = document.createElement('div');
        inputs.className = 'm-1';
        list.appendChild(inputs);
        const input = document.createElement('input');
        input.style.width = '150px';
        input.addEventListener('input', this.inputHandler.bind(this));
        input.addEventListener('propertychange', this.inputHandler.bind(this));
        inputs.appendChild(input);
    }

    createDisplay() {
        const list = document.createElement('li');
        list.className = 'mr-2';
        this.container!.appendChild(list);
        const displays = document.createElement('div');
        displays.className = 'm-1';
        list.appendChild(displays);
        const stored = document.createElement('span');
        stored.className = 'font-w600';
        stored.id = 'zaWarudo-stored-time';
        // @ts-ignore
        const storedTime = mod.api.Tiny_Snippets.snippets.ctx.characterStorage.getItem('zaWarudo');
        stored.textContent = this.formatCompactTime(storedTime);
        displays.appendChild(stored);
        this.stored = stored;
    }

    createUI() {
        this.createContainers();
        if (this.container === null) {
            return;
        }
        this.createButtons();
        this.createInput();
        this.createDisplay();
    }

    addStoredTime(ms: number) {
        const storedTime = this.getStoredTime();
        const newStoredTime = storedTime + ms;
        this.ctx.characterStorage.setItem(this.name, newStoredTime);
        this.stored!.textContent = this.formatCompactTime(newStoredTime);
    }

    getStoredTimeFormat() {
        return this.formatCompactTime(this.getStoredTime());
    }

    getStoredTime() {
        return this.ctx.characterStorage.getItem(this.name) ?? 0;
    }
}

export function pauseOfflineProgress(ctx: any, game: Game, zaWarudo: ZaWarudo) {
    // create UI
    zaWarudo.createUI();

    // Patch: stop time if toggle is enabled
    // @ts-ignore
    window.onSaveDataLoad = () => {
        // @ts-ignore
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            yield updateWindow();
            // @ts-ignore
            if (!isLoaded) {
                throw new Error('updateWindow failed.');
            }
            $('#m-page-loader-test').attr('class', 'd-none');
            // @ts-ignore
            if (!confirmedLoaded && ctx.api().snippets.toggles.get(`${zaWarudo.name}GamePause`)) {
                // Game is not yet loaded and the game loop should not be started
                ctx.api().snippets.log('Stop time!');
            } else {
                // @ts-ignore
                if (!isCreatingSave) {
                    yield game.processOffline();
                }
                game.startMainLoop();
            }
            // @ts-ignore
            confirmedLoaded = true;
            // @ts-ignore
            yield mod.trigger.interfaceReady();
        });
    }

    // patch Game.processOffline
    // @ts-ignore
    ctx.patch(Game, 'processOffline').replace(function (
        this: Game,
        original: () => Promise<any>,
        proceed = false,
    ) {
        if (proceed) {
            return original();
        }
        return new Promise((resolve: any) => {
            // get offline time and update tickTimestamp
            // @ts-ignore
            const offlineTime = this.getOfflineTimeDiff().timeDiff;
            // @ts-ignore
            this.tickTimestamp = Date.now();
            // add offline time to stored offline time
            const storedTime = zaWarudo.getStoredTimeFormat();
            zaWarudo.addStoredTime(offlineTime);
            console.log(`Found ${storedTime}, `
                + `added ${zaWarudo.formatCompactTime(offlineTime)}, `
                + `stored ${zaWarudo.getStoredTimeFormat()}`);
            resolve();
            return;
        });
    });

    // add game.progressMS
    // @ts-ignore
    game.progressMS = function (
        msToGoBack: number | undefined,
    ) {
        // get the stored MS
        const storedMS: number = zaWarudo.getStoredTime();
        if (msToGoBack === undefined) {
            msToGoBack = storedMS;
        }
        msToGoBack = Math.min(storedMS, msToGoBack);
        msToGoBack = Math.max(0, msToGoBack);
        // @ts-ignore
        msToGoBack = roundToTickInterval(msToGoBack);
        if (msToGoBack === 0 || msToGoBack === undefined) {
            return;
        }
        // remove progressed time from stored offline time
        zaWarudo.addStoredTime(-msToGoBack);
        console.log(`progress ${zaWarudo.formatCompactTime(msToGoBack)}, ${zaWarudo.getStoredTimeFormat()} remaining`);
        // convert to hours
        // @ts-ignore
        return __awaiter(game, void 0, void 0, function* () {
            // track if game loop was running
            // @ts-ignore
            const loopStarted = game.loopStarted;
            if (loopStarted) {
                // if loop was started, then stop it
                game.stopMainLoop();
            } else {
                // if loop was not started, then add time to time bank
                yield game.processOffline();
            }
            // @ts-ignore
            game.tickTimestamp -= msToGoBack;
            // @ts-ignore
            saveData('all');
            // @ts-ignore
            yield game.processOffline(true);
            // restart loop if it was running, else keep it paused but force a render
            if (loopStarted) {
                game.startMainLoop();
            } else {
                // @ts-ignore
                setTimeout(() => game.render());
            }
        });
    };
}


export function pauseOfflineProgressSetting(ctx: any): Snippet {
    const zaWarudo = new ZaWarudo(ctx);
    return {
        object: zaWarudo,
        function: (ctx: any, game: Game) => pauseOfflineProgress(ctx, game, zaWarudo),
        setting: {
            type: 'switch',
            name: zaWarudo.name,
            label: 'Pause offline progress',
            hint: 'Pause offline progress',
            default: false,
        },
        toggles: [{
            type: 'switch',
            name: `${zaWarudo.name}GamePause`,
            label: 'Pause game',
            hint: 'Pause game',
            default: false,
        }],
    }
}
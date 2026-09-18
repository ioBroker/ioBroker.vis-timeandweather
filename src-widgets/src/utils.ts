/**
 * Helpers shared by all time and weather widgets.
 *
 * Widget attributes come out of the vis editor as strings (older projects even hold `'true'`/`'false'` for a
 * checkbox), so every value that is logically a boolean or a number has to be coerced before use - the vis-1
 * widget set did that inline everywhere, here it lives in one place.
 */

/** `true`, `'true'` and `1` are true; everything else is false */
export function isTrue(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
}

/** Parses a value that may be a number, a numeric string or empty. Returns `defaultValue` when it is not a number */
export function toNumber(value: unknown, defaultValue = 0): number {
    if (typeof value === 'number') {
        return isFinite(value) ? value : defaultValue;
    }
    if (typeof value !== 'string' || value.trim() === '') {
        return defaultValue;
    }
    const parsed = parseFloat(value.replace(',', '.'));
    return isFinite(parsed) ? parsed : defaultValue;
}

/** Like `toNumber`, but only an empty value falls back to the default - an unparsable one becomes 0, as in vis-1 */
export function toNumberOrZero(value: unknown, defaultValue: number): number {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    return toNumber(value, 0);
}

/** Pads a number to two digits */
export function pad2(num: number): string {
    return num < 10 ? `0${num}` : num.toString();
}

/**
 * Calls `cb` on every full second (or every `everyMs` milliseconds, aligned to the wall clock), so all clocks on a
 * view switch at the same moment instead of drifting against each other.
 *
 * Returns the function that stops the ticker.
 */
export function startTicker(cb: () => void, everyMs = 1000): () => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const schedule = (): void => {
        // +5 ms, so the callback runs after the second has changed and not a moment before it
        const delay = everyMs - (Date.now() % everyMs) + 5;
        timer = setTimeout(() => {
            timer = null;
            if (!stopped) {
                cb();
                schedule();
            }
        }, delay);
    };

    schedule();

    return (): void => {
        stopped = true;
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };
}

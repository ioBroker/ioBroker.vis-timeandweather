import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import { isTrue, pad2 } from './utils';
import { monthName, weekdayName } from './words';
import './styles.css';

interface TwSimpleDateRxData {
    showWeekDay: boolean;
    shortWeekDay: boolean;
    shortYear: boolean;
    prependZero: boolean;
    monthWord: boolean;
    shortMonth: boolean;
    americanOrder: boolean;
    noClass: boolean;
}

interface TwSimpleDateState extends VisRxWidgetState {
    today: number;
}

/** English ordinal suffix: 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st, 22nd, 23rd ... */
function ordinalSuffix(day: number): string {
    if (day % 100 >= 11 && day % 100 <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

/** The date text in the formats of the vis-1 widget */
export function formatSimpleDate(date: Date, data: Partial<TwSimpleDateRxData>, lang: string): string {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear().toString();

    let monthString = monthName(month, lang);
    if (isTrue(data.shortMonth)) {
        monthString = monthString.slice(0, 3);
    }

    const y = isTrue(data.shortYear) ? year.slice(2) : year;
    const d = isTrue(data.prependZero) ? pad2(day) : day.toString();
    const m = isTrue(data.prependZero) ? pad2(month + 1) : (month + 1).toString();
    const american = isTrue(data.americanOrder);

    let text = '';
    if (isTrue(data.showWeekDay)) {
        text += `${weekdayName(date.getDay(), lang, isTrue(data.shortWeekDay))}, `;
    }

    if (isTrue(data.monthWord)) {
        if (lang === 'en') {
            const dd = `${d}${ordinalSuffix(day)}`;
            text += american ? `${monthString} ${dd}, ${y}` : `${dd} ${monthString}, ${y}`;
        } else {
            text += `${d}. ${monthString} ${y}`;
        }
    } else if (lang === 'en') {
        text += american ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
    } else {
        text += `${d}.${m}.${y}`;
    }

    return text;
}

/**
 * `tplTwSimpleDate` - the date as text.
 *
 * English knows the American order and ordinal numbers, all other languages print `d.m.y` or `d. Month y`, like
 * vis-1 did for German and Russian. The text is refreshed right after midnight.
 */
export default class TwSimpleDate extends Generic<TwSimpleDateRxData, TwSimpleDateState> {
    private midnightTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        (this.state as TwSimpleDateState).today = Date.now();
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplTwSimpleDate',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visName: 'SimpleDate',
            visWidgetLabel: 'simple_date',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        { name: 'showWeekDay', label: 'showWeekDay', type: 'checkbox' },
                        {
                            name: 'shortWeekDay',
                            label: 'shortWeekDay',
                            type: 'checkbox',
                            hidden: '!data.showWeekDay || data.showWeekDay === "false"',
                        },
                        { name: 'shortYear', label: 'shortYear', type: 'checkbox' },
                        { name: 'prependZero', label: 'prependZero', type: 'checkbox', default: true },
                        { name: 'monthWord', label: 'monthWord', type: 'checkbox' },
                        {
                            name: 'shortMonth',
                            label: 'shortMonth',
                            type: 'checkbox',
                            hidden: '!data.monthWord || data.monthWord === "false"',
                        },
                        { name: 'americanOrder', label: 'americanOrder', type: 'checkbox' },
                        { name: 'noClass', label: 'noClass', type: 'checkbox', tooltip: 'noClass_tooltip' },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 134,
                height: 33,
            },
            visPrev: 'widgets/vis-2-widgets-timeandweather/img/prev_simple_date.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwSimpleDate.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.scheduleMidnight();
    }

    componentWillUnmount(): void {
        if (this.midnightTimer) {
            clearTimeout(this.midnightTimer);
            this.midnightTimer = null;
        }
        super.componentWillUnmount();
    }

    private scheduleMidnight(): void {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
        this.midnightTimer = setTimeout(() => {
            this.midnightTimer = null;
            this.setState({ today: Date.now() });
            this.scheduleMidnight();
        }, next.getTime() - now.getTime());
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const data = this.state.rxData;
        if (!isTrue(data.noClass)) {
            props.className = `${props.className} date tw-rx-date`;
        }

        return <>{formatSimpleDate(new Date(this.state.today), data, this.getLanguage())}</>;
    }
}

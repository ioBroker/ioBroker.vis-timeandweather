import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import { isTrue, pad2, startTicker } from './utils';
import './styles.css';

interface TwSimpleClockRxData {
    hideSeconds: boolean;
    blink: boolean;
    noClass: boolean;
}

interface TwSimpleClockState extends VisRxWidgetState {
    now: number;
}

/**
 * `tplTwSimpleClock` - the time as text, `hh:mm:ss` or `hh:mm`.
 *
 * Without seconds the colon can blink. The look comes from the class `clock` on the widget itself, exactly like in
 * vis-1: inline CSS of the widget still wins over it, and `noClass` drops the class for users who style the clock
 * with a class of their own.
 */
export default class TwSimpleClock extends Generic<TwSimpleClockRxData, TwSimpleClockState> {
    private stopTicker: (() => void) | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        (this.state as TwSimpleClockState).now = Date.now();
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplTwSimpleClock',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visSetIcon: 'widgets/vis-2-widgets-timeandweather/img/timeandweather.svg',
            visName: 'SimpleClock',
            visWidgetLabel: 'simple_clock',
            visHelp: 'help_simple_clock',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        { name: 'hideSeconds', label: 'hideSeconds', type: 'checkbox' },
                        { name: 'blink', label: 'blink', type: 'checkbox', tooltip: 'blink_tooltip' },
                        { name: 'noClass', label: 'noClass', type: 'checkbox', tooltip: 'noClass_tooltip' },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 316,
                height: 92,
            },
            visPrev: 'widgets/vis-2-widgets-timeandweather/img/prev_simple_clock.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwSimpleClock.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.stopTicker = startTicker(() => this.setState({ now: Date.now() }));
    }

    componentWillUnmount(): void {
        this.stopTicker?.();
        this.stopTicker = null;
        super.componentWillUnmount();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const data = this.state.rxData;
        if (!isTrue(data.noClass)) {
            props.className = `${props.className} clock tw-rx-clock`;
        }

        const now = new Date(this.state.now);
        const hours = pad2(now.getHours());
        const minutes = pad2(now.getMinutes());

        if (!isTrue(data.hideSeconds)) {
            return <>{`${hours}:${minutes}:${pad2(now.getSeconds())}`}</>;
        }

        // vis-1 emptied the separator on odd seconds but kept its width, so the minutes do not jump
        const hidden = isTrue(data.blink) && now.getSeconds() % 2 === 1;

        return (
            <>
                {hours}
                <span style={{ display: 'inline-block', visibility: hidden ? 'hidden' : 'visible' }}>:</span>
                {minutes}
            </>
        );
    }
}

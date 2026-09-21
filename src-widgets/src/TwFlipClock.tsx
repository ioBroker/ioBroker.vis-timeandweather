import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import FlipDigit from './Components/FlipDigit';
import { pad2, startTicker } from './utils';
import './styles.css';

type Face = 'TwentyFourHourClock' | 'TwelveHourClock';

interface TwFlipClockRxData {
    face: Face;
}

interface TwFlipClockState extends VisRxWidgetState {
    now: number;
}

/** The width vis-1 forced onto the widget for each face */
const WIDTHS: Record<Face, number> = {
    TwentyFourHourClock: 500,
    TwelveHourClock: 600,
};

function Divider(): React.JSX.Element {
    return (
        <span className="flip-clock-divider">
            <span className="flip-clock-label" />
            <span className="flip-clock-dot top" />
            <span className="flip-clock-dot bottom" />
        </span>
    );
}

/**
 * `tplTwFlipClock` - the flip clock of FlipClock.js (MIT), without jQuery and without the library.
 *
 * Only the two clock faces the vis-1 widget offered exist here. The widget has the fixed width of its face and
 * cannot be resized, as in vis-1.
 */
export default class TwFlipClock extends Generic<TwFlipClockRxData, TwFlipClockState> {
    private stopTicker: (() => void) | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        (this.state as TwFlipClockState).now = Date.now();
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplTwFlipClock',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visSetIcon: 'widgets/vis-2-widgets-timeandweather/img/timeandweather.svg',
            visName: 'FlipClock',
            visWidgetLabel: 'flip_clock',
            visHelp: 'help_flip_clock',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'face',
                            label: 'face',
                            type: 'select',
                            options: [
                                { value: 'TwentyFourHourClock', label: 'TwentyFourHourClock' },
                                { value: 'TwelveHourClock', label: 'TwelveHourClock' },
                            ],
                            default: 'TwentyFourHourClock',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 500,
                height: 110,
            },
            visResizable: false,
            visPrev: 'widgets/timeandweather/img/Prev_FlipClock.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwFlipClock.getWidgetInfo();
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

        const face: Face = this.state.rxData.face === 'TwelveHourClock' ? 'TwelveHourClock' : 'TwentyFourHourClock';
        props.style.width = WIDTHS[face];

        const now = new Date(this.state.now);
        let hours = now.getHours();
        if (face === 'TwelveHourClock') {
            // FlipClock.Time.getTime(): 0 -> 12, 13..23 -> 1..11, 12 stays 12
            hours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        }
        const digits = `${pad2(hours)}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`.split('');

        return (
            <div className={this.getRootClass('flip-clock-wrapper')}>
                <FlipDigit digit={digits[0]} />
                <FlipDigit digit={digits[1]} />
                <Divider />
                <FlipDigit digit={digits[2]} />
                <FlipDigit digit={digits[3]} />
                <Divider />
                <FlipDigit digit={digits[4]} />
                <FlipDigit digit={digits[5]} />
                {face === 'TwelveHourClock' ? (
                    <ul className="flip-clock-meridium">
                        <li>
                            <a>{now.getHours() >= 12 ? 'PM' : 'AM'}</a>
                        </li>
                    </ul>
                ) : null}
            </div>
        );
    }
}

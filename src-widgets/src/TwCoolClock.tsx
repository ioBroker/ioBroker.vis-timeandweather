import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import CoolClockCanvas from './Components/CoolClockCanvas';
import { isTrue } from './utils';
import './styles.css';

interface TwCoolClockRxData {
    theme: string;
    noSeconds: boolean;
    showDigital: boolean;
    showAmPm: boolean;
}

interface TwCoolClockState extends VisRxWidgetState {
    width: number;
    height: number;
}

/** The order of the vis-1 select */
const THEMES = [
    'fancy',
    'swissRail',
    'chunkySwiss',
    'machine',
    'simonbaird_com',
    'classic',
    'classicWhite',
    'modern',
    'simple',
    'securephp',
    'Tes2',
    'Lev',
    'Sand',
    'Sun',
    'Tor',
    'Cold',
    'Babosa',
    'Tumb',
    'Stone',
    'Disc',
    'watermelon',
];

/**
 * `tplTwCoolClock` - the analog canvas clock of CoolClock with its 21 skins.
 *
 * The clock is always round: its diameter is the smaller side of the widget, so it sits in the top left corner of
 * a widget that is not square - as in vis-1.
 */
export default class TwCoolClock extends Generic<TwCoolClockRxData, TwCoolClockState> {
    private readonly refRoot = React.createRef<HTMLDivElement>();

    private resizeObserver: ResizeObserver | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        (this.state as TwCoolClockState).width = 0;
        (this.state as TwCoolClockState).height = 0;
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplTwCoolClock',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visSetIcon: 'widgets/vis-2-widgets-timeandweather/img/timeandweather.svg',
            visName: 'CoolClock',
            visWidgetLabel: 'cool_clock',
            visHelp: 'help_cool_clock',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'theme',
                            label: 'theme',
                            type: 'select',
                            noTranslation: true,
                            options: THEMES,
                            default: 'classic',
                        },
                        { name: 'noSeconds', label: 'noSeconds', type: 'checkbox' },
                        { name: 'showDigital', label: 'showDigital', type: 'checkbox' },
                        { name: 'showAmPm', label: 'showAmPm', type: 'checkbox' },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 150,
                height: 150,
            },
            visResizeLocked: true,
            visPrev: 'widgets/timeandweather/img/Prev_CoolClock.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwCoolClock.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        if (this.refRoot.current) {
            this.resizeObserver = new ResizeObserver(() => this.measure());
            this.resizeObserver.observe(this.refRoot.current);
            this.measure();
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    private measure(): void {
        const el = this.refRoot.current;
        if (el && (el.clientWidth !== this.state.width || el.clientHeight !== this.state.height)) {
            this.setState({ width: el.clientWidth, height: el.clientHeight });
        }
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const data = this.state.rxData;
        // vis-1 fell back to 85 px when the size was not known yet
        const width = this.state.width || 85;
        const height = this.state.height || 85;
        const radius = Math.round(Math.min(width, height) / 2);

        return (
            <div
                ref={this.refRoot}
                className={this.getRootClass()}
            >
                {this.state.width ? (
                    <CoolClockCanvas
                        skin={data.theme || 'classic'}
                        radius={radius}
                        showSeconds={!isTrue(data.noSeconds)}
                        showDigital={isTrue(data.showDigital)}
                        showAmPm={isTrue(data.showAmPm)}
                    />
                ) : null}
            </div>
        );
    }
}

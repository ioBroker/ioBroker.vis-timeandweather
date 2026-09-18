import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import { isTrue, startTicker, toNumber } from './utils';
import './styles.css';

interface TwSvgClockRxData {
    quadSize: number;
    quadColor: string;
    quadTickColor: string;
    textSize: number;
    textColor: string;
    tickColor: string;
    isSeconds: boolean;
    handsColor: string;
    handsColorLine: string;
    handsSecColor: string;
    textFont: string;
}

interface TwSvgClockState extends VisRxWidgetState {
    now: number;
}

/** Radius of the ring of tick marks in the 900 x 900 view box */
const R = 360;

/** The defaults of vis-1 `createSvgClock` */
const DEFAULTS = {
    quadSize: 60,
    quadColor: '#333',
    quadTickColor: '#333',
    textSize: 30,
    textColor: '#555',
    tickColor: '#555',
    handsColor: '#111',
    handsColorLine: '#666',
    handsSecColor: '#be5639',
    textFont: 'verdana, sans-serif',
};

/**
 * `tplSvgClock` - an analog clock drawn as SVG.
 *
 * The geometry is the one of the vis-1 widget. Strokes keep their width in screen pixels
 * (`vector-effect: non-scaling-stroke`), the texts scale with the clock. The tick marks are drawn directly and not
 * via `<use href="#mark--major">` any more: those ids were global, so several SVG clocks on one view all used the
 * tick colours of the first one.
 */
export default class TwSvgClock extends Generic<TwSvgClockRxData, TwSvgClockState> {
    private stopTicker: (() => void) | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        (this.state as TwSvgClockState).now = Date.now();
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplSvgClock',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visName: 'Svg Clock',
            visWidgetLabel: 'svg_clock',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'quadSize',
                            label: 'quadSize',
                            type: 'slider',
                            min: 10,
                            max: 200,
                            step: 1,
                            default: DEFAULTS.quadSize,
                        },
                        { name: 'quadColor', label: 'quadColor', type: 'color', default: DEFAULTS.quadColor },
                        {
                            name: 'quadTickColor',
                            label: 'quadTickColor',
                            type: 'color',
                            default: DEFAULTS.quadTickColor,
                        },
                        {
                            name: 'textSize',
                            label: 'textSize',
                            type: 'slider',
                            min: 10,
                            max: 200,
                            step: 1,
                            default: DEFAULTS.textSize,
                        },
                        { name: 'textColor', label: 'textColor', type: 'color', default: DEFAULTS.textColor },
                        { name: 'tickColor', label: 'tickColor', type: 'color', default: DEFAULTS.tickColor },
                        { name: 'isSeconds', label: 'isSeconds', type: 'checkbox' },
                        { name: 'handsColor', label: 'handsColor', type: 'color', default: DEFAULTS.handsColor },
                        {
                            name: 'handsColorLine',
                            label: 'handsColorLine',
                            type: 'color',
                            default: DEFAULTS.handsColorLine,
                        },
                        {
                            name: 'handsSecColor',
                            label: 'handsSecColor',
                            type: 'color',
                            default: DEFAULTS.handsSecColor,
                            hidden: '!data.isSeconds || data.isSeconds === "false"',
                        },
                        { name: 'textFont', label: 'textFont', type: 'fontname' },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 100,
                height: 100,
            },
            visResizeLocked: true,
            visPrev: 'widgets/timeandweather/img/Prev_tplSvgClock.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwSvgClock.getWidgetInfo();
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

    // eslint-disable-next-line class-methods-use-this
    private renderTicks(data: TwSvgClockRxData): React.JSX.Element[] {
        const quadSize = toNumber(data.quadSize, 0) || DEFAULTS.quadSize;
        const textSize = toNumber(data.textSize, 0) || DEFAULTS.textSize;
        const font = data.textFont || DEFAULTS.textFont;
        const ticks: React.JSX.Element[] = [];

        for (let i = 0; i < 60; i++) {
            const angle = i * 6;
            const isMajor = i % 5 === 0;
            const isQuad = i % 15 === 0;

            ticks.push(
                <g key={i}>
                    {isMajor ? (
                        <text
                            transform={`rotate(${angle}) translate(0 -${1.05 * R}) rotate(${-angle})`}
                            style={{
                                dominantBaseline: 'middle',
                                textAnchor: 'middle',
                                fill: data.textColor || DEFAULTS.textColor,
                                font: `${textSize}px ${font}`,
                            }}
                        >
                            {i}
                        </text>
                    ) : null}
                    {isQuad ? (
                        <text
                            className="quad"
                            transform={`rotate(${angle}) translate(0 -${0.8 * R}) rotate(${-angle})`}
                            style={{
                                dominantBaseline: 'middle',
                                textAnchor: 'middle',
                                fill: data.quadColor || DEFAULTS.quadColor,
                                font: `700 ${quadSize}px ${font}`,
                            }}
                        >
                            {i / 5 || 12}
                        </text>
                    ) : null}
                    <line
                        className={isQuad ? 'major quad' : isMajor ? 'major' : undefined}
                        vectorEffect="non-scaling-stroke"
                        y1={isMajor ? 28.8 : 14.4}
                        transform={`rotate(${angle}) translate(0 -${R})`}
                        style={
                            isMajor
                                ? { strokeWidth: 7, stroke: data.quadTickColor || DEFAULTS.quadTickColor }
                                : { strokeWidth: 2, stroke: data.tickColor || DEFAULTS.tickColor }
                        }
                    />
                </g>,
            );
        }

        return ticks;
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const data = this.state.rxData;
        const handsColor = data.handsColor || DEFAULTS.handsColor;
        const handsColorLine = data.handsColorLine || DEFAULTS.handsColorLine;
        const showSeconds = isTrue(data.isSeconds);

        const now = new Date(this.state.now);
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();

        const secondAngle = s * 6;
        const minuteAngle = (m + s / 60) * 6;
        const hourAngle = ((h % 12) + m / 60) * 30;

        return (
            <svg
                viewBox="-450 -450 900 900"
                className={this.getRootClass('svg--clock')}
                style={{ display: 'block', minWidth: '5em', minHeight: '5em', width: '100%', height: '100%' }}
            >
                <g className="svg--ticks">{this.renderTicks(data)}</g>
                <g>
                    <g
                        className="hand--h"
                        transform={`rotate(${hourAngle})`}
                        style={{ strokeLinecap: 'round', strokeWidth: 7, stroke: handsColor }}
                    >
                        <line
                            vectorEffect="non-scaling-stroke"
                            y2={-234}
                        />
                        <line
                            vectorEffect="non-scaling-stroke"
                            y1={-136.8}
                            y2={-205.2}
                            style={{ strokeWidth: 3, stroke: handsColorLine }}
                        />
                    </g>
                    <g
                        className="hand--m"
                        transform={`rotate(${minuteAngle})`}
                        style={{ strokeLinecap: 'round', strokeWidth: 5, stroke: handsColor }}
                    >
                        <line
                            vectorEffect="non-scaling-stroke"
                            y2={-298.8}
                        />
                        <line
                            vectorEffect="non-scaling-stroke"
                            y1={-201.6}
                            y2={-270}
                            style={{ strokeWidth: 3, stroke: handsColorLine }}
                        />
                    </g>
                    {showSeconds ? (
                        <g
                            className="hand--s"
                            transform={`rotate(${secondAngle})`}
                            style={{ strokeWidth: 2, stroke: data.handsSecColor || DEFAULTS.handsSecColor }}
                        >
                            <line
                                vectorEffect="non-scaling-stroke"
                                y1={36}
                                y2={-342}
                            />
                        </g>
                    ) : null}
                    <g>
                        <circle
                            vectorEffect="non-scaling-stroke"
                            r={14.4}
                            style={{ fill: '#e18728' }}
                        />
                        <circle
                            vectorEffect="non-scaling-stroke"
                            r={7.2}
                            style={{ fill: '#e0a197' }}
                        />
                    </g>
                </g>
            </svg>
        );
    }
}

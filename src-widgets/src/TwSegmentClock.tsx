import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import Generic from './Generic';
import SegmentDisplay, {
    ROUNDED_CORNER,
    SQUARED_CORNER,
    SYMMETRIC_CORNER,
    type SegmentCount,
} from './Components/SegmentDisplay';
import { isTrue, pad2, startTicker, toNumber, toNumberOrZero } from './utils';
import './styles.css';

interface TwSegmentClockRxData {
    oid: string;
    text: string;
    clock: boolean;
    seconds: boolean;
    pattern: string;
    colorOn: string;
    colorOff: string;
    runStepInterval: number;
    segmentCount: number | string;
    displayAngle: number;
    digitHeight: number;
    digitWidth: number;
    digitDistance: number;
    segmentWidth: number;
    segmentDistance: number;
    cornerType: string;
}

interface TwSegmentClockState extends VisRxWidgetState {
    width: number;
    height: number;
    now: number;
    /** Position of the running text, see `nextStep` */
    step: number;
}

/**
 * The names of the vis-1 select and the corner type of the library they ended up as. They do not match - "pointed"
 * draws the rounded corners of the library and "rounded" the symmetric ones - but this is what the existing
 * projects look like, so it stays.
 */
const CORNER_TYPES: Record<string, number> = {
    SymmetricCorner: SYMMETRIC_CORNER,
    FlattenedCorner: SQUARED_CORNER,
    PointedCorner: ROUNDED_CORNER,
    RoundedCorner: SYMMETRIC_CORNER,
};

/** The running text of vis-1: shift left character by character, then come in again from the right */
export function runningText(value: string, step: number, patternLength: number): string {
    if (step < 0) {
        return ' '.repeat(-step) + value.substring(0, patternLength + step);
    }
    return value.substring(step);
}

export function nextStep(value: string, step: number, patternLength: number): number {
    return step >= value.length ? -(patternLength - 1) : step + 1;
}

interface SegmentCanvasProps {
    display: SegmentDisplay;
    value: string;
    width: number;
    height: number;
}

/** Draws a `SegmentDisplay` into a canvas of the given CSS size, in device pixels */
class SegmentCanvas extends React.Component<SegmentCanvasProps> {
    private readonly refCanvas = React.createRef<HTMLCanvasElement>();

    componentDidMount(): void {
        this.draw();
    }

    componentDidUpdate(): void {
        this.draw();
    }

    private draw(): void {
        const canvas = this.refCanvas.current;
        if (!canvas) {
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        const width = Math.round(this.props.width * ratio);
        const height = Math.round(this.props.height * ratio);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        this.props.display.value = this.props.value;
        this.props.display.draw(canvas);
    }

    render(): React.JSX.Element {
        return (
            <canvas
                ref={this.refCanvas}
                style={{ width: this.props.width, height: this.props.height, display: 'block' }}
            />
        );
    }
}

/**
 * `tplSegmentClock` - a 7, 14 or 16 segment display.
 *
 * It shows the value of `oid`, or else the fixed `text`, or else the time. Value and text can run through the
 * display (`runStepInterval`).
 */
export default class TwSegmentClock extends Generic<TwSegmentClockRxData, TwSegmentClockState> {
    private readonly refRoot = React.createRef<HTMLDivElement>();

    private resizeObserver: ResizeObserver | null = null;

    private stopClock: (() => void) | null = null;

    private runTimer: ReturnType<typeof setInterval> | null = null;

    private runInterval = 0;

    /** The value the running text belongs to - a new value starts at the beginning again */
    private runValue = '';

    constructor(props: VisRxWidgetProps) {
        super(props);
        const state = this.state as TwSegmentClockState;
        state.width = 0;
        state.height = 0;
        state.now = Date.now();
        state.step = 0;
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplSegmentClock',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visSetIcon: 'widgets/vis-2-widgets-timeandweather/img/timeandweather.svg',
            visName: 'Segment Clock',
            visWidgetLabel: 'segment_clock',
            visHelp: 'help_segment_clock',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        { name: 'oid', label: 'oid', type: 'id' },
                        { name: 'text', label: 'text', hidden: '!!data.oid && data.oid !== "nothing_selected"' },
                    ],
                },
                {
                    name: 'clock',
                    label: 'group_clock',
                    fields: [
                        { name: 'clock', label: 'clock', type: 'checkbox', default: true, tooltip: 'clock_tooltip' },
                        { name: 'seconds', label: 'seconds', type: 'checkbox', default: true },
                    ],
                },
                {
                    name: 'style',
                    label: 'group_style',
                    fields: [
                        { name: 'pattern', label: 'pattern', default: '##:##:##', tooltip: 'pattern_tooltip' },
                        { name: 'colorOn', label: 'colorOn', type: 'color', default: 'rgba(0, 0, 0, 1)' },
                        { name: 'colorOff', label: 'colorOff', type: 'color', default: 'rgba(0, 0, 0, 0.1)' },
                        {
                            name: 'runStepInterval',
                            label: 'runStepInterval',
                            type: 'slider',
                            min: 0,
                            max: 5000,
                            step: 100,
                            default: 0,
                        },
                        {
                            name: 'segmentCount',
                            label: 'segmentCount',
                            type: 'select',
                            noTranslation: true,
                            options: ['7', '14', '16'],
                            default: '7',
                        },
                        {
                            name: 'displayAngle',
                            label: 'displayAngle',
                            type: 'slider',
                            min: 0,
                            max: 30,
                            step: 1,
                            default: 9,
                        },
                        {
                            name: 'digitHeight',
                            label: 'digitHeight',
                            type: 'slider',
                            min: 0,
                            max: 60,
                            step: 1,
                            default: 20,
                        },
                        {
                            name: 'digitWidth',
                            label: 'digitWidth',
                            type: 'slider',
                            min: 0,
                            max: 60,
                            step: 1,
                            default: 12,
                        },
                        {
                            name: 'digitDistance',
                            label: 'digitDistance',
                            type: 'slider',
                            min: 0,
                            max: 60,
                            step: 1,
                            default: 2,
                        },
                        {
                            name: 'segmentWidth',
                            label: 'segmentWidth',
                            type: 'slider',
                            min: 0,
                            max: 60,
                            step: 1,
                            default: 3,
                        },
                        {
                            name: 'segmentDistance',
                            label: 'segmentDistance',
                            type: 'slider',
                            min: 0,
                            max: 5,
                            step: 0.1,
                            default: 0.5,
                        },
                        {
                            name: 'cornerType',
                            label: 'cornerType',
                            type: 'select',
                            options: [
                                { value: 'SymmetricCorner', label: 'SymmetricCorner' },
                                { value: 'FlattenedCorner', label: 'FlattenedCorner' },
                                { value: 'PointedCorner', label: 'PointedCorner' },
                                { value: 'RoundedCorner', label: 'RoundedCorner' },
                            ],
                            default: 'PointedCorner',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: 100,
                height: 30,
            },
            visPrev: 'widgets/timeandweather/img/Prev_tplSegmentClock.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwSegmentClock.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        if (this.refRoot.current) {
            this.resizeObserver = new ResizeObserver(() => this.measure());
            this.resizeObserver.observe(this.refRoot.current);
            this.measure();
        }
        this.stopClock = startTicker(() => {
            if (this.getMode() === 'clock') {
                this.setState({ now: Date.now() });
            }
        });
        this.updateRunTimer();
    }

    componentDidUpdate(prevProps: VisRxWidgetProps, prevState: typeof this.state): void {
        super.componentDidUpdate(prevProps, prevState);
        this.updateRunTimer();
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.stopClock?.();
        this.stopClock = null;
        if (this.runTimer) {
            clearInterval(this.runTimer);
            this.runTimer = null;
        }
    }

    private measure(): void {
        const el = this.refRoot.current;
        if (el && (el.clientWidth !== this.state.width || el.clientHeight !== this.state.height)) {
            this.setState({ width: el.clientWidth, height: el.clientHeight });
        }
    }

    private getMode(): 'oid' | 'text' | 'clock' | 'none' {
        const data = this.state.rxData;
        if (data.oid && data.oid !== 'nothing_selected') {
            return 'oid';
        }
        if (data.text) {
            return 'text';
        }
        if (isTrue(data.clock)) {
            return 'clock';
        }
        return 'none';
    }

    private getPattern(): string {
        const data = this.state.rxData;
        const pattern = data.pattern || '##:##:##';
        if (pattern === '##:##:##' && !isTrue(data.seconds)) {
            return '##:##';
        }
        return pattern;
    }

    /** The full text of the display, before the running text cuts it */
    private getValue(): string {
        const data = this.state.rxData;
        switch (this.getMode()) {
            case 'oid': {
                const value = this.state.values[`${data.oid}.val`];
                return value === null || value === undefined ? '' : value.toString();
            }
            case 'text':
                return data.text.toString();
            case 'clock': {
                const now = new Date(this.state.now);
                let time = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
                if (isTrue(data.seconds)) {
                    time += `:${pad2(now.getSeconds())}`;
                }
                return time;
            }
            default:
                return 'no oid, no text, no clock';
        }
    }

    /** Starts, restarts or stops the running text whenever the interval or the value changes */
    private updateRunTimer(): void {
        const mode = this.getMode();
        const interval =
            mode === 'oid' || mode === 'text' ? Math.round(toNumber(this.state.rxData.runStepInterval, 0)) : 0;
        const value = interval ? this.getValue() : '';

        if (value !== this.runValue) {
            this.runValue = value;
            if (this.state.step !== 0) {
                this.setState({ step: 0 });
            }
        }

        if (interval === this.runInterval) {
            return;
        }
        this.runInterval = interval;
        if (this.runTimer) {
            clearInterval(this.runTimer);
            this.runTimer = null;
        }
        if (interval > 0) {
            this.runTimer = setInterval(
                () =>
                    this.setState(state => ({
                        step: nextStep(this.runValue, state.step, this.getPattern().length),
                    })),
                interval,
            );
        } else if (this.state.step !== 0) {
            this.setState({ step: 0 });
        }
    }

    private createDisplay(): SegmentDisplay {
        const data = this.state.rxData;
        const display = new SegmentDisplay();
        display.pattern = this.getPattern();
        display.segmentCount = (Math.round(toNumber(data.segmentCount, 0)) || 7) as SegmentCount;
        display.displayAngle = Math.trunc(toNumberOrZero(data.displayAngle, 9));
        display.digitHeight = Math.trunc(toNumber(data.digitHeight, 0)) || 20;
        display.digitWidth = Math.trunc(toNumber(data.digitWidth, 0)) || 12;
        display.digitDistance = Math.trunc(toNumberOrZero(data.digitDistance, 2));
        display.segmentWidth = Math.trunc(toNumber(data.segmentWidth, 0)) || 3;
        display.segmentDistance = toNumberOrZero(data.segmentDistance, 0.5);
        display.cornerType = CORNER_TYPES[data.cornerType] ?? SYMMETRIC_CORNER;
        display.colorOn = data.colorOn || 'rgba(0, 0, 0, 0.9)';
        display.colorOff = data.colorOff || 'rgba(0, 0, 0, 0.1)';
        return display;
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        let value = this.getValue();
        if (this.runInterval) {
            value = runningText(value, this.state.step, this.getPattern().length);
        }

        return (
            <div
                ref={this.refRoot}
                className={this.getRootClass()}
            >
                {this.state.width && this.state.height ? (
                    <SegmentCanvas
                        display={this.createDisplay()}
                        value={value}
                        width={this.state.width}
                        height={this.state.height}
                    />
                ) : null}
            </div>
        );
    }
}

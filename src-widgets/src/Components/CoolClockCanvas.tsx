import React from 'react';

import { COOL_CLOCK_SKINS, DEFAULT_SKIN, type CoolClockPart, type CoolClockSkin } from './coolClockSkins';
import { startTicker } from '../utils';

/** The skins are drawn for a face with this radius and scaled to the real size */
const RENDER_RADIUS = 100;
const DEFAULT_FONT = '15px sans-serif';

interface CoolClockCanvasProps {
    /** Name of the skin, see `coolClockSkins.ts` */
    skin: string;
    /** Radius of the clock on the screen in CSS pixels */
    radius: number;
    showSeconds: boolean;
    showDigital: boolean;
    showAmPm: boolean;
}

/**
 * The canvas analog clock of CoolClock (Simon Baird, MIT), rewritten as a React component.
 *
 * The drawing is the one of `coolclock.js`: the same skins, the same order of the parts, the same geometry. What is
 * gone is the class name parsing, the global clock registry, the `setTimeout` with a string and the IE branches;
 * what is new is that the canvas is drawn in device pixels, so the clock stays sharp on a HiDPI screen.
 */
export default class CoolClockCanvas extends React.Component<CoolClockCanvasProps> {
    private readonly refCanvas = React.createRef<HTMLCanvasElement>();

    private stopTicker: (() => void) | null = null;

    componentDidMount(): void {
        this.draw();
        this.restartTicker();
    }

    componentDidUpdate(prevProps: CoolClockCanvasProps): void {
        if (prevProps.showSeconds !== this.props.showSeconds) {
            this.restartTicker();
        }
        this.draw();
    }

    componentWillUnmount(): void {
        this.stopTicker?.();
        this.stopTicker = null;
    }

    /** Every second with a second hand, else every 15 seconds - the tick delays of CoolClock */
    private restartTicker(): void {
        this.stopTicker?.();
        this.stopTicker = startTicker(() => this.draw(), this.props.showSeconds ? 1000 : 15000);
    }

    private getSkin(): CoolClockSkin {
        return COOL_CLOCK_SKINS[this.props.skin] || COOL_CLOCK_SKINS[DEFAULT_SKIN];
    }

    private draw(): void {
        const canvas = this.refCanvas.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) {
            return;
        }

        const size = this.props.radius * 2;
        const ratio = window.devicePixelRatio || 1;
        const pixels = Math.round(size * ratio);
        if (canvas.width !== pixels || canvas.height !== pixels) {
            canvas.width = pixels;
            canvas.height = pixels;
        }

        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const sec = now.getSeconds();
        const skin = this.getSkin();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scale = (this.props.radius / RENDER_RADIUS) * ratio;
        ctx.scale(scale, scale);

        if (skin.outerBorder) {
            this.fullCircleAt(ctx, RENDER_RADIUS, RENDER_RADIUS, skin.outerBorder);
        }

        // the tick marks, every 5th one is a big one
        for (let i = 0; i < 60; i++) {
            const part = i % 5 ? skin.smallIndicator : skin.largeIndicator;
            if (part) {
                this.radialLineAtAngle(ctx, i / 60, part);
            }
        }

        if (this.props.showDigital) {
            this.drawTextAt(ctx, this.timeText(hour, min), RENDER_RADIUS, RENDER_RADIUS + RENDER_RADIUS / 2, skin);
        }

        const hourA = (hour % 12) * 5 + min / 12.0;
        const minA = min + sec / 60.0;

        if (skin.hourHand) {
            this.radialLineAtAngle(ctx, hourA / 60, skin.hourHand);
        }
        if (skin.minuteHand) {
            this.radialLineAtAngle(ctx, minA / 60, skin.minuteHand);
        }
        if (this.props.showSeconds && skin.secondHand) {
            this.radialLineAtAngle(ctx, sec / 60, skin.secondHand);
        }
        if (skin.hourDecoration) {
            this.radialLineAtAngle(ctx, hourA / 60, skin.hourDecoration);
        }
        if (skin.minDecoration) {
            this.radialLineAtAngle(ctx, minA / 60, skin.minDecoration);
        }
        if (this.props.showSeconds && skin.secondDecoration) {
            this.radialLineAtAngle(ctx, sec / 60, skin.secondDecoration);
        }
    }

    /**
     * The digital time. CoolClock never printed the seconds here: it asked `CoolClock.config.showSecondHand`,
     * which does not exist.
     */
    private timeText(hour: number, min: number): string {
        const h = this.props.showAmPm ? hour % 12 || 12 : hour;
        return `${h}:${min < 10 ? '0' : ''}${min}${this.props.showAmPm ? (hour < 12 ? ' am' : ' pm') : ''}`;
    }

    // eslint-disable-next-line class-methods-use-this
    private fullCircleAt(ctx: CanvasRenderingContext2D, x: number, y: number, part: CoolClockPart): void {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.lineWidth = part.lineWidth;
        ctx.beginPath();
        ctx.arc(x, y, part.radius || 0, 0, 2 * Math.PI, false);
        if (part.fillColor) {
            ctx.fillStyle = part.fillColor;
            ctx.fill();
        }
        if (part.color) {
            ctx.strokeStyle = part.color;
            ctx.stroke();
        }
        ctx.restore();
    }

    // eslint-disable-next-line class-methods-use-this
    private drawTextAt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, skin: CoolClockSkin): void {
        ctx.save();
        ctx.font = skin.font || DEFAULT_FONT;
        if (skin.fontColor) {
            ctx.fillStyle = skin.fontColor;
        }
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x - ctx.measureText(text).width / 2, y);
        ctx.restore();
    }

    /** Draws a radial line (or a circle, if the part has a radius) by rotating the canvas */
    private radialLineAtAngle(ctx: CanvasRenderingContext2D, angleFraction: number, part: CoolClockPart): void {
        ctx.save();
        ctx.translate(RENDER_RADIUS, RENDER_RADIUS);
        ctx.rotate(Math.PI * (2.0 * angleFraction - 0.5));
        ctx.globalAlpha = part.alpha;
        ctx.strokeStyle = part.color || '#000';
        ctx.lineWidth = part.lineWidth;

        if (part.radius) {
            this.fullCircleAt(ctx, part.startAt || 0, 0, part);
        } else {
            ctx.beginPath();
            ctx.moveTo(part.startAt || 0, 0);
            ctx.lineTo(part.endAt || 0, 0);
            ctx.stroke();
        }
        ctx.restore();
    }

    render(): React.JSX.Element {
        const size = this.props.radius * 2;
        return (
            <canvas
                ref={this.refCanvas}
                style={{ width: size, height: size, display: 'block' }}
            />
        );
    }
}

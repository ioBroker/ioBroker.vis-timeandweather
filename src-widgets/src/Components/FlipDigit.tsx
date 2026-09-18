import React from 'react';

interface FlipDigitProps {
    digit: string;
}

interface FlipDigitState {
    current: string;
    previous: string;
    /** Increases with every change; the keys of the two leaves are derived from it */
    seq: number;
    play: boolean;
}

/** The digit shown behind the first one before the first flip, like `FlipClock.List.getPrevDigit` */
function prevDigit(digit: string): string {
    const num = parseInt(digit, 10);
    if (isNaN(num)) {
        return digit;
    }
    return num === 0 ? '9' : (num - 1).toString();
}

function Leaf(props: { className: string; digit: string }): React.JSX.Element {
    return (
        <li className={props.className}>
            <a>
                <div className="up">
                    <div className="shadow" />
                    <div className="inn">{props.digit}</div>
                </div>
                <div className="down">
                    <div className="shadow" />
                    <div className="inn">{props.digit}</div>
                </div>
            </a>
        </li>
    );
}

/**
 * One flip card of the FlipClock, with the markup of `FlipClock.List`.
 *
 * The flip itself is pure CSS (`styles.css`): on a change the leaf that showed the old digit becomes
 * `flip-clock-before` and folds its upper half down, the new leaf becomes `flip-clock-active` and unfolds its lower
 * half. The keys make React keep the old leaf as the same DOM node - only its class changes, which is what restarts
 * the animation, exactly like the jQuery version did by moving the classes.
 */
export default class FlipDigit extends React.Component<FlipDigitProps, FlipDigitState> {
    constructor(props: FlipDigitProps) {
        super(props);
        this.state = {
            current: props.digit,
            previous: prevDigit(props.digit),
            seq: 1,
            play: false,
        };
    }

    static getDerivedStateFromProps(props: FlipDigitProps, state: FlipDigitState): Partial<FlipDigitState> | null {
        if (props.digit !== state.current) {
            return {
                previous: state.current,
                current: props.digit,
                seq: state.seq + 1,
                play: true,
            };
        }
        return null;
    }

    render(): React.JSX.Element {
        return (
            <ul className={this.state.play ? 'flip play' : 'flip'}>
                <Leaf
                    key={this.state.seq - 1}
                    className="flip-clock-before"
                    digit={this.state.previous}
                />
                <Leaf
                    key={this.state.seq}
                    className="flip-clock-active"
                    digit={this.state.current}
                />
            </ul>
        );
    }
}

import React from 'react';

import type {
    RxRenderWidgetProps,
    RxWidgetInfo,
    RxWidgetInfoAttributesField,
    RxWidgetInfoGroup,
    VisRxWidgetProps,
    VisRxWidgetState,
} from '@iobroker/types-vis-2';

import Generic from './Generic';
import { translateCondition } from './conditions';
import { pad2, startTicker } from './utils';
import { LANGUAGES, monthName, weatherWord, weekdayName } from './words';
import './styles.css';

/** Today and the six following days */
const DAYS = 7;

/** The group labels of the days. vis-1 labelled day 3..6 as "in 2 days" .. "in 5 days", one day too early */
const DAY_GROUPS = [
    'group_now',
    'group_tomorrow',
    'group_aftertomorrow',
    'group_in3days',
    'group_in4days',
    'group_in5days',
    'group_in6days',
];

/** Background of the weather box when no icon is set, one of the images of the vis-1 set */
const BACKGROUND = 'widgets/timeandweather/img/bg.jpg';

type TwWeatherRxData = Record<string, any>;

interface TwWeatherState extends VisRxWidgetState {
    /** Changes when the date or day/night changes - the forecast dates are relative to today */
    period: string;
}

interface ForecastDay {
    high: string;
    low: string;
    text: string;
    icon: string;
}

/** Degrees as a compass direction, like vis-1. A direction that already is text ("SW") stays as it is */
export function windDirection(direction: string): string {
    if (direction === '') {
        return '';
    }
    const degrees = Number(direction);
    if (isNaN(degrees) || degrees < 0 || degrees > 360) {
        return direction;
    }
    const names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return names[Math.floor(((degrees + 11.25) % 360) / 22.5)];
}

function getPeriod(): string {
    const now = new Date();
    const hours = now.getHours();
    return `${now.toDateString()}-${hours > 20 || hours < 7 ? 'night' : 'day'}`;
}

/**
 * `tplTwWeather` - the "WeatherCustom" widget: current weather and a forecast of up to six days, fed from any
 * states (for example of the daswetter, accuweather or weatherunderground adapter).
 *
 * The markup and the class names are the ones of `jquery.zweatherfeed.js`, so CSS a project added for
 * `.weatherForecastItem` and friends still applies. What is gone: the icons of the Yahoo! weather service, which no
 * longer exists, as the fallback for a missing icon, and the empty lines vis-1 printed for values that were not set
 * ("High: ° Low: °").
 */
export default class TwWeather extends Generic<TwWeatherRxData, TwWeatherState> {
    private stopTicker: (() => void) | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        (this.state as TwWeatherState).period = getPeriod();
    }

    static getWidgetInfo(): RxWidgetInfo {
        const dayGroups: RxWidgetInfoGroup[] = [];
        for (let i = 0; i < DAYS; i++) {
            const fields: RxWidgetInfoAttributesField[] = [];
            if (i === 0) {
                fields.push({ name: 'temperature-0-oid', label: 'temperature_oid', type: 'id' });
            }
            fields.push({ name: `condition-${i}-oid`, label: 'condition_oid', type: 'id' });
            if (i === 0) {
                fields.push({ name: 'humidity-0-oid', label: 'humidity_oid', type: 'id' });
            }
            fields.push({ name: `temperature-min-${i}-oid`, label: 'temperature_min_oid', type: 'id' });
            fields.push({ name: `temperature-max-${i}-oid`, label: 'temperature_max_oid', type: 'id' });
            if (i === 0) {
                fields.push({ name: 'wind-speed-0-oid', label: 'wind_speed_oid', type: 'id' });
                fields.push({ name: 'wind-dir-0-oid', label: 'wind_dir_oid', type: 'id' });
            }
            fields.push({ name: `icon-${i}-oid`, label: 'icon_oid', type: 'id' });

            dayGroups.push({ name: `day${i}`, label: DAY_GROUPS[i], fields });
        }

        return {
            id: 'tplTwWeather',
            visSet: 'timeandweather',
            visSetLabel: 'set_label',
            visName: 'WeatherCustom',
            visWidgetLabel: 'weather_custom',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        { name: 'city', label: 'city' },
                        {
                            name: 'language',
                            label: 'language',
                            type: 'select',
                            options: [
                                { value: '', label: 'lang_default' },
                                ...LANGUAGES.map(lang => ({ value: lang, label: `lang_${lang}` })),
                            ],
                            default: '',
                        },
                        { name: 'units_speed', label: 'units_speed', default: 'km/h' },
                    ],
                },
                ...dayGroups,
            ],
            visDefaultStyle: {
                width: 250,
                height: 107,
            },
            visPrev: 'widgets/timeandweather/img/Prev_YahooWeather.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return TwWeather.getWidgetInfo();
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.stopTicker = startTicker(() => {
            const period = getPeriod();
            if (period !== this.state.period) {
                this.setState({ period });
            }
        }, 60000);
    }

    componentWillUnmount(): void {
        this.stopTicker?.();
        this.stopTicker = null;
        super.componentWillUnmount();
    }

    /**
     * The value of one of the `-oid` attributes, as text.
     *
     * The attribute holds an object ID - or, like in vis-1, a binding `{...}`, which vis-2 has already calculated
     * into `rxData`.
     */
    private getValue(attr: string): string {
        const raw = (this.state.data as Record<string, any>)[attr];
        if (!raw || raw === 'nothing_selected') {
            return '';
        }

        let value: any;
        if (typeof raw === 'string' && raw.startsWith('{')) {
            value = this.state.rxData[attr];
        } else {
            value = this.state.values[`${this.state.rxData[attr]}.val`];
        }

        if (value === undefined || value === null || value === 'null') {
            return '';
        }
        return value.toString();
    }

    /** The days of the forecast, up to the first day that has neither temperatures nor a text */
    private getForecast(): ForecastDay[] {
        const days: ForecastDay[] = [];
        for (let i = 0; i < DAYS; i++) {
            const day: ForecastDay = {
                high: this.getValue(`temperature-max-${i}-oid`),
                low: this.getValue(`temperature-min-${i}-oid`),
                text: this.getValue(`condition-${i}-oid`),
                icon: this.getValue(`icon-${i}-oid`),
            };
            if (!day.high && !day.low && !day.text) {
                break;
            }
            days.push(day);
        }
        return days;
    }

    // eslint-disable-next-line class-methods-use-this
    private renderForecastDay(day: ForecastDay, index: number, lang: string): React.JSX.Element {
        const date = new Date();
        date.setDate(date.getDate() + index);

        // English kept the short names of the feed ("Fri", "18 Sep 2026"), the other languages spelled them out
        const isEnglish = lang === 'en';
        const dayName = weekdayName(date.getDay(), lang, isEnglish);
        const month = isEnglish ? monthName(date.getMonth(), 'en').slice(0, 3) : monthName(date.getMonth(), lang);
        const dateText = `${pad2(date.getDate())} ${month} ${date.getFullYear()}`;

        return (
            <div
                key={index}
                className="weatherForecastItem"
                style={day.icon ? { backgroundImage: `url(${day.icon})`, backgroundRepeat: 'no-repeat' } : undefined}
            >
                <div className="weatherForecastDay">{dayName}</div>
                <div className="weatherForecastDate">{dateText}</div>
                {day.text ? <div className="weatherForecastText">{translateCondition(day.text, lang)}</div> : null}
                {day.low || day.high ? (
                    <div className="weatherForecastRange">
                        {`${weatherWord('Temperature', lang)}: ${day.low}°-${day.high}°`}
                    </div>
                ) : null}
            </div>
        );
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        props.className = `${props.className} weatherFeed tw-rx-weather`;

        const data = this.state.rxData;
        const lang: string = data.language || this.getLanguage();

        const temp = this.getValue('temperature-0-oid');
        const text = this.getValue('condition-0-oid');
        const icon = this.getValue('icon-0-oid');
        const humidity = this.getValue('humidity-0-oid');
        const windSpeed = this.getValue('wind-speed-0-oid');
        const windDir = windDirection(this.getValue('wind-dir-0-oid'));
        const forecast = this.getForecast();
        const today = forecast[0];

        const daynight = this.state.period.endsWith('night') ? 'night' : 'day';

        const style: React.CSSProperties = icon
            ? { backgroundImage: `url(${icon})`, backgroundRepeat: 'no-repeat' }
            : { backgroundImage: `url(${BACKGROUND})`, backgroundRepeat: 'repeat-x' };

        return (
            <div
                className={`weatherItem odd ${daynight}`}
                style={style}
            >
                <div className="weatherCity">{data.city || ''}</div>
                {temp !== '' ? <div className="weatherTemp">{`${temp}°`}</div> : null}
                {text ? <div className="weatherDesc">{translateCondition(text, lang)}</div> : null}
                {today && (today.high || today.low) ? (
                    <div className="weatherRange">
                        {`${weatherWord('High', lang)}: ${today.high}° ${weatherWord('Low', lang)}: ${today.low}°`}
                    </div>
                ) : null}
                {windSpeed !== '' ? (
                    <div className="weatherWind">
                        {`${weatherWord('Wind', lang)}: ${windDir ? `${windDir} ` : ''}${windSpeed}${data.units_speed || 'km/h'}`}
                    </div>
                ) : null}
                {humidity !== '' ? (
                    <div className="weatherHumidity">{`${weatherWord('Humidity', lang)}: ${humidity}%`}</div>
                ) : null}
                {forecast.length ? (
                    <div className="weatherForecast">
                        {forecast.map((day, i) => this.renderForecastDay(day, i, lang))}
                    </div>
                ) : null}
            </div>
        );
    }
}

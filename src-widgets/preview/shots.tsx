/*
 * Scenes for the screenshots of the documentation (`docs/img/*.png`).
 *
 * Every `<section data-shot="name">` becomes one image: `screenshots.mjs` opens this page in a headless Chrome and
 * cuts the sections out. All values are fixed - and so is the time: `Date` is replaced before the widgets are
 * loaded, so every clock shows Thursday, 21 May 2026, 10:08:42 and the images only change when a widget changes.
 *
 * Not part of the widget set - excluded from lint and never built into `widgets/`.
 */
import React, { type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';

// puts the stub of `window.visRxWidget` in place - before the widgets are imported below
import { withDefaults } from './stub';
import { CLOUD, PARTLY, RAIN, SNOW, SUN, THUNDER } from './icons';

// ------------------------------------------------------------------------------------------- frozen time

const FIXED = new Date(2026, 4, 21, 10, 8, 42).getTime();
const RealDate = Date;
function FixedDate(this: any, ...args: any[]): any {
    if (!(this instanceof FixedDate)) {
        return new RealDate(FIXED).toString();
    }
    return args.length ? new (RealDate as any)(...args) : new RealDate(FIXED);
}
FixedDate.prototype = RealDate.prototype;
FixedDate.now = (): number => FIXED;
FixedDate.parse = RealDate.parse;
FixedDate.UTC = RealDate.UTC;
(window as any).Date = FixedDate;

const [
    { default: TwSimpleClock },
    { default: TwSimpleDate },
    { default: TwCoolClock },
    { default: TwFlipClock },
    { default: TwWeather },
    { default: TwSvgClock },
    { default: TwSegmentClock },
] = await Promise.all([
    import('../src/TwSimpleClock'),
    import('../src/TwSimpleDate'),
    import('../src/TwCoolClock'),
    import('../src/TwFlipClock'),
    import('../src/TwWeather'),
    import('../src/TwSvgClock'),
    import('../src/TwSegmentClock'),
]);

// ------------------------------------------------------------------------------------------------ helpers

type Values = Record<string, any>;

/** States, `{ 'a.b': 1 }` -> `{ 'a.b.val': 1, 'a.b.ack': true }` */
function states(map: Record<string, any>): Values {
    const values: Values = {};
    for (const [id, val] of Object.entries(map)) {
        values[`${id}.val`] = val;
        values[`${id}.ack`] = true;
    }
    return values;
}

/** Dark theme and language of the current section */
const Scene = React.createContext({ dark: false, lang: 'en' });

/** One widget with the attributes the vis editor would store for it */
function W(props: {
    type: any;
    data?: Record<string, any>;
    values?: Values;
    style?: Record<string, any>;
    lang?: string;
}): React.JSX.Element {
    const scene = React.useContext(Scene);
    const Type = props.type;
    const context = React.useMemo(
        () => ({ socket: {}, themeType: scene.dark ? 'dark' : 'light', lang: props.lang || scene.lang }),
        [scene.dark, scene.lang, props.lang],
    );
    const data = React.useMemo(() => withDefaults(Type, props.data || {}), [Type, props.data]);
    const style = React.useMemo(() => props.style || {}, [props.style]);
    return (
        <Type
            context={context}
            editMode={false}
            view="view"
            id="w1"
            values={props.values || {}}
            rxStyle={style}
            rxData={data}
        />
    );
}

/** One screenshot */
function Shot(props: {
    name: string;
    dark?: boolean;
    lang?: string;
    style?: CSSProperties;
    children: React.ReactNode;
}): React.JSX.Element {
    const scene = React.useMemo(() => ({ dark: !!props.dark, lang: props.lang || 'en' }), [props.dark, props.lang]);
    return (
        <Scene.Provider value={scene}>
            <section
                data-shot={props.name}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    gap: 16,
                    width: 'max-content',
                    maxWidth: 1400,
                    padding: 16,
                    boxSizing: 'border-box',
                    background: props.dark ? '#23272e' : '#fafafa',
                    color: props.dark ? '#dfe3e8' : '#333',
                    ...props.style,
                }}
            >
                {props.children}
            </section>
        </Scene.Provider>
    );
}

/** Room for one widget of the given size, with a caption below */
function Item(props: {
    w: number;
    h: number;
    pad?: [number, number, number, number];
    caption?: string;
    children: React.ReactNode;
}): React.JSX.Element {
    const [top, right, bottom, left] = props.pad || [8, 8, 8, 8];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: `${top}px ${right}px ${bottom}px ${left}px` }}>
                <div style={{ width: props.w, height: props.h, position: 'relative' }}>{props.children}</div>
            </div>
            {props.caption ? (
                <code style={{ fontSize: 12, opacity: 0.7, marginTop: 4, whiteSpace: 'pre', textAlign: 'center' }}>
                    {props.caption}
                </code>
            ) : null}
        </div>
    );
}

/** Absolutely placed widget, like on a vis view */
function At(props: { x: number; y: number; w: number; h: number; children: React.ReactNode }): React.JSX.Element {
    return (
        <div style={{ position: 'absolute', left: props.x, top: props.y, width: props.w, height: props.h }}>
            {props.children}
        </div>
    );
}

const size = (w: number, h: number, extra?: Record<string, any>): Record<string, any> => ({
    width: `${w}px`,
    height: `${h}px`,
    ...extra,
});

// ------------------------------------------------------------------------------------------------ weather

const WEATHER_VALUES = states({
    'w.temp': 19,
    'w.text': 'Partly cloudy',
    'w.humidity': 64,
    'w.windSpeed': 11,
    'w.windDir': 255,
    'w.icon': PARTLY,
    'w.min0': 11,
    'w.max0': 21,
    'w.text1': 'Rain',
    'w.min1': 10,
    'w.max1': 16,
    'w.icon1': RAIN,
    'w.text2': 'Thunderstorms',
    'w.min2': 13,
    'w.max2': 22,
    'w.icon2': THUNDER,
    'w.text3': 'Sunny',
    'w.min3': 12,
    'w.max3': 24,
    'w.icon3': SUN,
    'w.text4': 'Cloudy',
    'w.min4': 9,
    'w.max4': 17,
    'w.icon4': CLOUD,
    'w.text5': 'Snow',
    'w.min5': -2,
    'w.max5': 3,
    'w.icon5': SNOW,
});

function weatherData(days: number, extra?: Record<string, any>): Record<string, any> {
    const data: Record<string, any> = {
        city: 'Karlsruhe',
        'temperature-0-oid': 'w.temp',
        'condition-0-oid': 'w.text',
        'humidity-0-oid': 'w.humidity',
        'wind-speed-0-oid': 'w.windSpeed',
        'wind-dir-0-oid': 'w.windDir',
        'icon-0-oid': 'w.icon',
        'temperature-min-0-oid': 'w.min0',
        'temperature-max-0-oid': 'w.max0',
    };
    for (let i = 1; i < days; i++) {
        data[`condition-${i}-oid`] = `w.text${i}`;
        data[`temperature-min-${i}-oid`] = `w.min${i}`;
        data[`temperature-max-${i}-oid`] = `w.max${i}`;
        data[`icon-${i}-oid`] = `w.icon${i}`;
    }
    return { ...data, ...extra };
}

const WEATHER_SHORT = weatherData(1);
const WEATHER_FULL = weatherData(6);
const WEATHER_OVERVIEW = weatherData(4);
const WEATHER_DE = weatherData(4, { language: 'de', city: 'München' });

// ------------------------------------------------------------------------------------------------ scenes

const COOL_SKINS = [
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
const COOL_DATA = Object.fromEntries(COOL_SKINS.map(theme => [theme, { theme }]));
const COOL_STYLE = size(110, 110);

const SEGMENT_STYLE = size(240, 70);

const D = {
    clock: {},
    clockNoSeconds: { hideSeconds: true },
    clockOwn: { noClass: true },
    date: {},
    dateWeekDay: { showWeekDay: true },
    dateWord: { showWeekDay: true, monthWord: true },
    dateShort: { showWeekDay: true, shortWeekDay: true, monthWord: true, shortMonth: true, shortYear: true },
    dateUs: { americanOrder: true },
    dateUsWord: { monthWord: true, americanOrder: true },
    cool: { theme: 'chunkySwiss' },
    coolNoSeconds: { theme: 'swissRail', noSeconds: true },
    coolDigital: { theme: 'classic', showDigital: true },
    coolAmPm: { theme: 'classic', showDigital: true, showAmPm: true },
    flip24: {},
    flip12: { face: 'TwelveHourClock' },
    svg: {},
    svgSeconds: { isSeconds: true },
    svgColors: {
        isSeconds: true,
        quadColor: '#1d3b8b',
        quadTickColor: '#1d3b8b',
        textColor: '#7a8699',
        tickColor: '#9aa6b8',
        handsColor: '#1d3b8b',
        handsColorLine: '#8fb3ff',
        handsSecColor: '#e53935',
        textFont: 'Georgia, serif',
    },
    svgBig: { quadSize: 110, textSize: 10 },
    segClock: {},
    segNoSeconds: { seconds: false },
    segText14: {
        text: 'HELLO',
        pattern: '#####',
        segmentCount: '14',
        colorOn: '#18c418',
        colorOff: 'rgba(24, 196, 24, 0.12)',
    },
    segValue16: {
        oid: 'seg.value',
        pattern: '##.##',
        segmentCount: '16',
        colorOn: '#ff6a00',
        colorOff: 'rgba(255, 106, 0, 0.12)',
    },
    segBlue: {
        pattern: '##:##',
        seconds: false,
        displayAngle: 0,
        colorOn: '#00b7ff',
        colorOff: 'rgba(0, 183, 255, 0.1)',
    },
};

const SEG_VALUES = states({ 'seg.value': '21.5C' });

const CORNERS = ['SymmetricCorner', 'FlattenedCorner', 'PointedCorner', 'RoundedCorner'];
const CORNER_DATA = Object.fromEntries(
    CORNERS.map(cornerType => [
        cornerType,
        {
            cornerType,
            pattern: '##:##',
            seconds: false,
            displayAngle: 0,
            digitHeight: 24,
            digitWidth: 14,
            segmentWidth: 4,
            segmentDistance: 0.6,
        },
    ]),
);

const FLIP_STYLE = size(500, 110);
const FLIP12_STYLE = size(600, 110);

function Scenes(): React.JSX.Element {
    return (
        <>
            <Shot
                name="overview"
                style={{ display: 'block', width: 1010, height: 470, position: 'relative', padding: 0 }}
            >
                <At x={20} y={10} w={316} h={92}>
                    <W type={TwSimpleClock} data={D.clock} style={size(316, 92)} />
                </At>
                <At x={24} y={104} w={300} h={33}>
                    <W type={TwSimpleDate} data={D.dateWord} style={size(300, 33)} />
                </At>
                <At x={20} y={160} w={500} h={110}>
                    <W type={TwFlipClock} data={D.flip24} style={FLIP_STYLE} />
                </At>
                <At x={40} y={300} w={150} h={150}>
                    <W type={TwCoolClock} data={D.cool} style={size(150, 150)} />
                </At>
                <At x={220} y={300} w={150} h={150}>
                    <W type={TwSvgClock} data={D.svgSeconds} style={size(150, 150)} />
                </At>
                <At x={400} y={340} w={240} h={70}>
                    <W type={TwSegmentClock} data={D.segClock} style={SEGMENT_STYLE} />
                </At>
                <At x={700} y={10} w={280} h={450}>
                    <W type={TwWeather} data={WEATHER_OVERVIEW} values={WEATHER_VALUES} style={size(280, 450)} />
                </At>
            </Shot>

            <Shot name="simple-clock">
                <Item w={316} h={92} caption="default">
                    <W type={TwSimpleClock} data={D.clock} style={size(316, 92)} />
                </Item>
                <Item w={220} h={92} caption="hideSeconds">
                    <W type={TwSimpleClock} data={D.clockNoSeconds} style={size(220, 92)} />
                </Item>
                <Item w={240} h={92} caption={'noClass +\nfont, color of the widget CSS'}>
                    <W
                        type={TwSimpleClock}
                        data={D.clockOwn}
                        style={size(240, 92, {
                            'font-size': '44px',
                            'font-family': 'Georgia, serif',
                            color: '#1d3b8b',
                            'line-height': '92px',
                        })}
                    />
                </Item>
            </Shot>

            <Shot name="simple-date" style={{ alignItems: 'flex-start', width: 1040 }}>
                <Item w={300} h={36} caption="default (prependZero)">
                    <W type={TwSimpleDate} data={D.date} style={size(300, 36)} />
                </Item>
                <Item w={300} h={36} caption="showWeekDay">
                    <W type={TwSimpleDate} data={D.dateWeekDay} style={size(300, 36)} />
                </Item>
                <Item w={300} h={36} caption="showWeekDay, monthWord">
                    <W type={TwSimpleDate} data={D.dateWord} style={size(300, 36)} />
                </Item>
                <Item w={300} h={36} caption={'showWeekDay, shortWeekDay,\nmonthWord, shortMonth, shortYear'}>
                    <W type={TwSimpleDate} data={D.dateShort} style={size(300, 36)} />
                </Item>
                <Item w={300} h={36} caption="americanOrder">
                    <W type={TwSimpleDate} data={D.dateUs} style={size(300, 36)} />
                </Item>
                <Item w={300} h={36} caption="monthWord, americanOrder">
                    <W type={TwSimpleDate} data={D.dateUsWord} style={size(300, 36)} />
                </Item>
                <Item w={300} h={36} caption="vis-2 in German: default">
                    <W type={TwSimpleDate} data={D.date} style={size(300, 36)} lang="de" />
                </Item>
                <Item w={300} h={36} caption="German: showWeekDay, monthWord">
                    <W type={TwSimpleDate} data={D.dateWord} style={size(300, 36)} lang="de" />
                </Item>
                <Item w={300} h={36} caption="German: short">
                    <W type={TwSimpleDate} data={D.dateShort} style={size(300, 36)} lang="de" />
                </Item>
            </Shot>

            <Shot name="cool-clock-skins" style={{ width: 1000, alignItems: 'flex-start' }}>
                {COOL_SKINS.map(theme => (
                    <Item key={theme} w={110} h={110} caption={theme}>
                        <W type={TwCoolClock} data={COOL_DATA[theme]} style={COOL_STYLE} />
                    </Item>
                ))}
            </Shot>

            <Shot name="cool-clock-options">
                <Item w={150} h={150} caption="default (chunkySwiss)">
                    <W type={TwCoolClock} data={D.cool} style={size(150, 150)} />
                </Item>
                <Item w={150} h={150} caption="noSeconds">
                    <W type={TwCoolClock} data={D.coolNoSeconds} style={size(150, 150)} />
                </Item>
                <Item w={150} h={150} caption="showDigital">
                    <W type={TwCoolClock} data={D.coolDigital} style={size(150, 150)} />
                </Item>
                <Item w={150} h={150} caption="showDigital, showAmPm">
                    <W type={TwCoolClock} data={D.coolAmPm} style={size(150, 150)} />
                </Item>
            </Shot>

            <Shot name="flip-clock" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Item w={500} h={110} pad={[0, 30, 16, 0]} caption="TwentyFourHourClock">
                    <W type={TwFlipClock} data={D.flip24} style={FLIP_STYLE} />
                </Item>
                <Item w={600} h={110} pad={[0, 30, 16, 0]} caption="TwelveHourClock">
                    <W type={TwFlipClock} data={D.flip12} style={FLIP12_STYLE} />
                </Item>
            </Shot>

            <Shot name="flip-clock-dark" dark>
                <Item w={600} h={110} pad={[0, 30, 16, 0]} caption="TwelveHourClock, dark theme of vis-2">
                    <W type={TwFlipClock} data={D.flip12} style={FLIP12_STYLE} />
                </Item>
            </Shot>

            <Shot name="weather" style={{ alignItems: 'flex-start' }}>
                <Item w={250} h={107} caption="default size 250 x 107">
                    <W type={TwWeather} data={WEATHER_SHORT} values={WEATHER_VALUES} style={size(250, 107)} />
                </Item>
                <Item w={260} h={560} caption="with a forecast of 5 days">
                    <W type={TwWeather} data={WEATHER_FULL} values={WEATHER_VALUES} style={size(260, 560)} />
                </Item>
                <Item w={260} h={400} caption={'language = de\n("Rain" -> "Regen")'}>
                    <W type={TwWeather} data={WEATHER_DE} values={WEATHER_VALUES} style={size(260, 400)} />
                </Item>
            </Shot>

            <Shot name="svg-clock">
                <Item w={150} h={150} caption="default">
                    <W type={TwSvgClock} data={D.svg} style={size(150, 150)} />
                </Item>
                <Item w={150} h={150} caption="isSeconds">
                    <W type={TwSvgClock} data={D.svgSeconds} style={size(150, 150)} />
                </Item>
                <Item w={150} h={150} caption={'own colors,\ntextFont = Georgia'}>
                    <W type={TwSvgClock} data={D.svgColors} style={size(150, 150)} />
                </Item>
                <Item w={150} h={150} caption={'quadSize = 110,\ntextSize = 10'}>
                    <W type={TwSvgClock} data={D.svgBig} style={size(150, 150)} />
                </Item>
            </Shot>

            <Shot name="segment-clock" style={{ width: 800, alignItems: 'flex-start' }}>
                <Item w={240} h={70} caption="default: clock">
                    <W type={TwSegmentClock} data={D.segClock} style={SEGMENT_STYLE} />
                </Item>
                <Item w={240} h={70} caption={'seconds off, displayAngle = 0,\nown colors'}>
                    <W type={TwSegmentClock} data={D.segBlue} style={SEGMENT_STYLE} />
                </Item>
                <Item w={240} h={70} caption={'text, 14 segments'}>
                    <W type={TwSegmentClock} data={D.segText14} style={SEGMENT_STYLE} />
                </Item>
                <Item w={240} h={70} caption={'oid = "21.5C", 16 segments,\npattern ##.##'}>
                    <W type={TwSegmentClock} data={D.segValue16} values={SEG_VALUES} style={SEGMENT_STYLE} />
                </Item>
            </Shot>

            <Shot name="segment-corners">
                {CORNERS.map(corner => (
                    <Item key={corner} w={180} h={70} caption={corner}>
                        <W type={TwSegmentClock} data={CORNER_DATA[corner]} style={size(180, 70)} />
                    </Item>
                ))}
            </Shot>
        </>
    );
}

function App(): React.JSX.Element {
    React.useEffect(() => {
        // Ready once every image is there and the canvases had time to measure and draw
        const pending = Array.from(document.images)
            .filter(img => !img.complete)
            .map(
                img =>
                    new Promise(resolve => {
                        img.addEventListener('load', resolve, { once: true });
                        img.addEventListener('error', resolve, { once: true });
                    }),
            );
        void Promise.all(pending).then(() =>
            setTimeout(() => {
                (window as any).__shotsReady = true;
            }, 1500),
        );
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                gap: 24,
                padding: 24,
                width: 1800,
            }}
        >
            <Scenes />
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<App />);

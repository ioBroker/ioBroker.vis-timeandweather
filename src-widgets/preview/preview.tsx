/*
 * Development page for the time and weather widgets.
 *
 * It renders the widgets against a stub of the vis-2 `VisRxWidget` base class, so the whole set can be looked at
 * without a running ioBroker. The weather values are editable on the left and every widget reacts to them live.
 *
 * For the two widgets whose drawing code was ported from a vis-1 library (CoolClock and the segment display), the
 * original library is loaded from `widgets/timeandweather/js/` and drawn next to the React version - the two must
 * look the same.
 *
 * Not part of the widget set - excluded from lint and never built into `widgets/`.
 * Start with `npm run preview` in the root.
 */
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';

// puts the stub of `window.visRxWidget` in place - before the widgets are imported below
import './stub';
import { CLOUD, RAIN, SUN } from './icons';

// ---------------------------------------------------------------------------------------------- fake states

type Values = Record<string, any>;

const INITIAL_VALUES: Values = {
    'weather.0.temp.val': 19,
    'weather.0.text.val': 'Cloudy',
    'weather.0.humidity.val': 71,
    'weather.0.windSpeed.val': 11.3,
    'weather.0.windDir.val': 255,
    'weather.0.icon.val': CLOUD,
    'weather.0.min0.val': 14,
    'weather.0.max0.val': 20,
    'weather.0.text1.val': 'Rain',
    'weather.0.min1.val': 13,
    'weather.0.max1.val': 21,
    'weather.0.icon1.val': RAIN,
    'weather.0.text2.val': 'Sunny',
    'weather.0.min2.val': 15,
    'weather.0.max2.val': 24,
    'weather.0.icon2.val': SUN,
    'weather.0.text3.val': 'Partly cloudy',
    'weather.0.min3.val': 12,
    'weather.0.max3.val': 19,
    'weather.0.icon3.val': CLOUD,
    'test.0.segment.val': 'HELLO 42',
};

// The widgets extend `window.visRxWidget`, so they may only be imported after the stub above is in place
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

// ----------------------------------------------------------------------------------------- vis-1 libraries

const loaded: Record<string, Promise<void>> = {};
function loadScript(url: string): Promise<void> {
    loaded[url] ||= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Cannot load ${url}`));
        document.body.appendChild(script);
    });
    return loaded[url];
}

let legacyId = 0;

/** The vis-1 CoolClock, drawn by the original `coolclock.js` with the skins of `moreskins.js` */
function LegacyCoolClock(props: { skin: string; radius: number; seconds: boolean; digital: boolean; ampm: boolean }): React.JSX.Element {
    const ref = useRef<HTMLCanvasElement>(null);
    const [id] = useState(() => `legacy_cool_${legacyId++}`);
    useEffect(() => {
        let clock: any;
        loadScript('widgets/timeandweather/js/coolclock.js')
            .then(() => loadScript('widgets/timeandweather/js/moreskins.js'))
            .then(() => {
                const CoolClock = (window as any).CoolClock;
                clock = new CoolClock({
                    canvasId: id,
                    skinId: props.skin,
                    displayRadius: props.radius,
                    showSecondHand: props.seconds,
                    showDigital: props.digital,
                    showAmPm: props.ampm,
                });
            })
            .catch(e => console.error(e));
        return () => clock?.stop();
    }, [props.skin, props.radius, props.seconds, props.digital, props.ampm]);
    return <canvas id={id} ref={ref} />;
}

/** The vis-1 segment display, drawn by the original `segment-display.js` */
function LegacySegment(props: { settings: Record<string, any>; value: string; width: number; height: number }): React.JSX.Element {
    const [id] = useState(() => `legacy_seg_${legacyId++}`);
    useEffect(() => {
        loadScript('widgets/timeandweather/js/segment-display.js')
            .then(() => {
                const display = new (window as any).SegmentDisplay(id);
                Object.assign(display, props.settings);
                display.setValue(props.value);
            })
            .catch(e => console.error(e));
    });
    return (
        <canvas
            id={id}
            width={props.width}
            height={props.height}
        />
    );
}

// ---------------------------------------------------------------------------------------------- page parts

const panel: CSSProperties = {
    background: 'var(--panel)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: 12,
};

function Card(props: { title: string; tpl?: string; width: number; height: number; children: React.ReactNode }): React.JSX.Element {
    return (
        <div style={{ ...panel, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{props.title}</div>
            <div style={{ width: props.width, height: props.height, position: 'relative', outline: '1px dashed rgba(128,128,128,0.4)' }}>
                {props.children}
            </div>
            {props.tpl ? <code style={{ fontSize: 11, opacity: 0.55, marginTop: 12 }}>{props.tpl}</code> : null}
        </div>
    );
}

function Section(props: { title: string; children: React.ReactNode }): React.JSX.Element {
    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ margin: '8px 0 0 0', fontSize: 15 }}>{props.title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>{props.children}</div>
        </section>
    );
}

function Field(props: { label: string; value: any; onChange: (value: string) => void }): React.JSX.Element {
    return (
        <label style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, fontSize: 12, alignItems: 'center' }}>
            {props.label}
            <input
                value={props.value ?? ''}
                onChange={e => props.onChange(e.target.value)}
                style={{ fontSize: 12 }}
            />
        </label>
    );
}

const SKINS = [
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

const CORNERS: Record<string, number> = { SymmetricCorner: 0, FlattenedCorner: 1, PointedCorner: 2, RoundedCorner: 0 };

// ------------------------------------------------------------------------------------------------------ app

function App(): React.JSX.Element {
    const [values, setValues] = useState<Values>(INITIAL_VALUES);
    const [dark, setDark] = useState(false);
    const [lang, setLang] = useState('en');
    const [digital, setDigital] = useState(false);

    const set = (id: string, value: any): void => setValues(old => ({ ...old, [`${id}.val`]: value }));
    const val = (id: string): any => values[`${id}.val`];

    const context = useMemo(() => ({ themeType: dark ? 'dark' : 'light', lang, socket: {} }), [dark, lang]);
    const common = { context, values, view: 'view', id: 'w1' };

    // stable objects, the stub compares them by reference
    const data = useMemo(
        () => ({
            clock: {},
            clockBlink: { hideSeconds: true, blink: true },
            date1: { prependZero: true },
            date2: { showWeekDay: true, prependZero: true, monthWord: true },
            date3: { showWeekDay: true, shortWeekDay: true, monthWord: true, shortMonth: true, americanOrder: true },
            flip24: { face: 'TwentyFourHourClock' },
            flip12: { face: 'TwelveHourClock' },
            weather: {
                city: 'Karlsruhe',
                language: '',
                units_speed: 'km/h',
                'temperature-0-oid': 'weather.0.temp',
                'condition-0-oid': 'weather.0.text',
                'humidity-0-oid': 'weather.0.humidity',
                'temperature-min-0-oid': 'weather.0.min0',
                'temperature-max-0-oid': 'weather.0.max0',
                'wind-speed-0-oid': 'weather.0.windSpeed',
                'wind-dir-0-oid': 'weather.0.windDir',
                'icon-0-oid': 'weather.0.icon',
                'condition-1-oid': 'weather.0.text1',
                'temperature-min-1-oid': 'weather.0.min1',
                'temperature-max-1-oid': 'weather.0.max1',
                'icon-1-oid': 'weather.0.icon1',
                'condition-2-oid': 'weather.0.text2',
                'temperature-min-2-oid': 'weather.0.min2',
                'temperature-max-2-oid': 'weather.0.max2',
                'icon-2-oid': 'weather.0.icon2',
                'condition-3-oid': 'weather.0.text3',
                'temperature-min-3-oid': 'weather.0.min3',
                'temperature-max-3-oid': 'weather.0.max3',
                'icon-3-oid': 'weather.0.icon3',
            },
            svg: {},
            svgSeconds: { isSeconds: true, handsColor: '#1d3b8b', quadColor: '#1d3b8b', handsSecColor: '#e53935' },
            segClock: { clock: true, seconds: true, pattern: '##:##:##', colorOn: 'rgba(0, 0, 0, 1)', colorOff: 'rgba(0, 0, 0, 0.1)', segmentCount: '7', displayAngle: 9, digitHeight: 20, digitWidth: 12, digitDistance: 2, segmentWidth: 3, segmentDistance: 0.5, cornerType: 'PointedCorner' },
            segText: { text: 'IOBROKER TIME AND WEATHER', pattern: '########', runStepInterval: 400, segmentCount: '14', colorOn: '#18c418', colorOff: 'rgba(24, 196, 24, 0.12)', cornerType: 'FlattenedCorner' },
            segOid: { oid: 'test.0.segment', pattern: '########', segmentCount: '16', colorOn: '#ff6a00', colorOff: 'rgba(255, 106, 0, 0.12)', cornerType: 'SymmetricCorner' },
        }),
        [],
    );
    const coolData = useMemo(
        () => Object.fromEntries(SKINS.map(skin => [skin, { theme: skin, showDigital: digital }])),
        [digital],
    );
    const style = useMemo(
        () => ({
            clock: { width: '316px', height: '92px' },
            date: { width: '260px', height: '33px' },
            cool: { width: '120px', height: '120px' },
            flip: { width: '500px', height: '110px' },
            weather: { width: '250px', height: '430px' },
            svg: { width: '150px', height: '150px' },
            seg: { width: '220px', height: '60px' },
        }),
        [],
    );

    return (
        <div
            style={
                {
                    '--panel': dark ? '#2b3038' : '#ffffff',
                    '--line': dark ? '#3d434d' : '#e0e0e0',
                    background: dark ? '#22262e' : '#f0f0f0',
                    color: dark ? '#dfe3e8' : '#222',
                    minHeight: '100vh',
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr',
                    gap: 20,
                    padding: 20,
                    boxSizing: 'border-box',
                    fontFamily: 'system-ui, sans-serif',
                } as CSSProperties
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start', position: 'sticky', top: 20 }}>
                <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <b style={{ fontSize: 13 }}>Page</b>
                    <label>
                        <input
                            type="checkbox"
                            checked={dark}
                            onChange={e => setDark(e.target.checked)}
                        />{' '}
                        Dark theme
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={digital}
                            onChange={e => setDigital(e.target.checked)}
                        />{' '}
                        CoolClock digital
                    </label>
                    <label>
                        Language{' '}
                        <select
                            value={lang}
                            onChange={e => setLang(e.target.value)}
                        >
                            {['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'].map(l => (
                                <option
                                    key={l}
                                    value={l}
                                >
                                    {l}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <b style={{ fontSize: 13 }}>Weather</b>
                    <Field label="temperature" value={val('weather.0.temp')} onChange={v => set('weather.0.temp', v)} />
                    <Field label="condition" value={val('weather.0.text')} onChange={v => set('weather.0.text', v)} />
                    <Field label="humidity" value={val('weather.0.humidity')} onChange={v => set('weather.0.humidity', v)} />
                    <Field label="wind speed" value={val('weather.0.windSpeed')} onChange={v => set('weather.0.windSpeed', v)} />
                    <Field label="wind dir" value={val('weather.0.windDir')} onChange={v => set('weather.0.windDir', v)} />
                    <Field label="min today" value={val('weather.0.min0')} onChange={v => set('weather.0.min0', v)} />
                    <Field label="max today" value={val('weather.0.max0')} onChange={v => set('weather.0.max0', v)} />
                    <Field label="tomorrow" value={val('weather.0.text1')} onChange={v => set('weather.0.text1', v)} />
                    <b style={{ fontSize: 13, marginTop: 6 }}>Segment</b>
                    <Field label="value" value={val('test.0.segment')} onChange={v => set('test.0.segment', v)} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Section title="Text">
                    <Card title="SimpleClock" tpl="tplTwSimpleClock" width={316} height={92}>
                        <TwSimpleClock {...common} rxData={data.clock} rxStyle={style.clock} />
                    </Card>
                    <Card title="SimpleClock, no seconds, blink" tpl="tplTwSimpleClock" width={316} height={92}>
                        <TwSimpleClock {...common} rxData={data.clockBlink} rxStyle={style.clock} />
                    </Card>
                    <Card title="SimpleDate" tpl="tplTwSimpleDate" width={260} height={33}>
                        <TwSimpleDate {...common} rxData={data.date1} rxStyle={style.date} />
                    </Card>
                    <Card title="SimpleDate, week day, month word" tpl="tplTwSimpleDate" width={260} height={33}>
                        <TwSimpleDate {...common} rxData={data.date2} rxStyle={style.date} />
                    </Card>
                    <Card title="SimpleDate, short, American" tpl="tplTwSimpleDate" width={260} height={33}>
                        <TwSimpleDate {...common} rxData={data.date3} rxStyle={style.date} />
                    </Card>
                </Section>

                <Section title="FlipClock">
                    <Card title="24 hours" tpl="tplTwFlipClock" width={500} height={110}>
                        <TwFlipClock {...common} rxData={data.flip24} rxStyle={style.flip} />
                    </Card>
                    <Card title="12 hours" tpl="tplTwFlipClock" width={600} height={110}>
                        <TwFlipClock {...common} rxData={data.flip12} rxStyle={style.flip} />
                    </Card>
                </Section>

                <Section title="Weather, SVG clock">
                    <Card title="WeatherCustom" tpl="tplTwWeather" width={250} height={430}>
                        <TwWeather {...common} rxData={data.weather} rxStyle={style.weather} />
                    </Card>
                    <Card title="Svg Clock" tpl="tplSvgClock" width={150} height={150}>
                        <TwSvgClock {...common} rxData={data.svg} rxStyle={style.svg} />
                    </Card>
                    <Card title="Svg Clock, seconds, colours" tpl="tplSvgClock" width={150} height={150}>
                        <TwSvgClock {...common} rxData={data.svgSeconds} rxStyle={style.svg} />
                    </Card>
                </Section>

                <Section title="Segment clock - React (top) and vis-1 library (bottom)">
                    {(['segClock', 'segText', 'segOid'] as const).map(key => {
                        const d: any = data[key];
                        return (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <Card title={key} tpl="tplSegmentClock" width={220} height={60}>
                                    <TwSegmentClock {...common} rxData={d} rxStyle={style.seg} />
                                </Card>
                                {key === 'segOid' ? (
                                    <div style={{ ...panel }}>
                                        <LegacySegment
                                            width={220}
                                            height={60}
                                            value={String(val('test.0.segment'))}
                                            settings={{
                                                pattern: d.pattern,
                                                segmentCount: parseInt(d.segmentCount, 10),
                                                displayAngle: 9,
                                                digitHeight: 20,
                                                digitWidth: 12,
                                                digitDistance: 2,
                                                segmentWidth: 3,
                                                segmentDistance: 0.5,
                                                cornerType: CORNERS[d.cornerType],
                                                colorOn: d.colorOn,
                                                colorOff: d.colorOff,
                                            }}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </Section>

                <Section title="CoolClock - React (left) and vis-1 library (right), all skins">
                    {SKINS.map(skin => (
                        <div key={skin} style={{ ...panel, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{skin}</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ width: 120, height: 120, position: 'relative' }}>
                                    <TwCoolClock {...common} rxData={coolData[skin]} rxStyle={style.cool} />
                                </div>
                                <LegacyCoolClock skin={skin} radius={60} seconds digital={digital} ampm={false} />
                            </div>
                        </div>
                    ))}
                </Section>
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<App />);

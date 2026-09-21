/*
 * Checks the widget declarations against the vis-1 widget set.
 *
 * The React widgets only take over in vis-2 because they carry the SAME tpl id as the EJS templates in
 * `widgets/timeandweather.html` - vis-2 replaces a widget type when a React widget declares the same id. And because
 * the widget data of a project is stored per attribute name, every attribute the vis-1 template offered has to
 * exist here as well, or a migrated widget silently loses that setting.
 *
 * Run with `npm run check-widgets` in the root, or `node checkWidgets.mjs` in this folder.
 */
import { build } from 'vite';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'src');
const TMP = path.join(HERE, '.check');
const LEGACY_HTML = path.join(HERE, '..', 'widgets', 'timeandweather.html');

const WIDGETS = [
    'TwSimpleDate',
    'TwSimpleClock',
    'TwCoolClock',
    'TwFlipClock',
    'TwWeather',
    'TwSvgClock',
    'TwSegmentClock',
];

/**
 * Attributes the vis-1 template offered but never used, so the React version does not offer them either.
 * Existing values stay in the project untouched, they simply have no effect - as before.
 */
const DROPPED = {};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const entry = path.join(TMP, 'entry.ts');
writeFileSync(
    entry,
    `${WIDGETS.map(w => `import ${w} from '${SRC.replace(/\\/g, '/')}/${w}';`).join('\n')}
export default { ${WIDGETS.join(', ')} };
`,
);

await build({
    configFile: false,
    logLevel: 'error',
    build: {
        lib: { entry, formats: ['cjs'], fileName: () => 'bundle.cjs' },
        outDir: TMP,
        emptyOutDir: false,
        minify: false,
        rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
    },
});

// The widgets extend `window.visRxWidget`, which the vis-2 runtime provides
globalThis.window = { visRxWidget: class VisRxWidgetStub {} };

const mod = await import(pathToFileURL(path.join(TMP, 'bundle.cjs')).href);
const widgets = mod.default.default || mod.default;

// The templates of the Yahoo! widgets are commented out in the vis-1 set; they must not count
const legacyHtml = readFileSync(LEGACY_HTML, 'utf8').replace(/<!--[\s\S]*?-->/g, '');

/** All attribute names the vis-1 template of that tpl id offered */
function legacyAttrs(tpl) {
    const start = legacyHtml.indexOf(`id="${tpl}"`);
    if (start === -1) {
        return null;
    }
    const block = legacyHtml.substring(start, legacyHtml.indexOf('</script>', start));
    const names = new Set();
    for (const m of block.matchAll(/data-vis-attrs\d*="([^"]*)"/g)) {
        for (let part of m[1].split(';')) {
            part = part.trim();
            if (!part || part.startsWith('group.')) {
                continue;
            }
            // strip the type (`/id`, `/slider,0,10,1`, ...), the default (`[..]`) and the index range `(1-x)`
            const name = part
                .split('/')[0]
                .replace(/\[[^\]]*]/, '')
                .replace(/\([^)]*\)/, '');
            if (name) {
                names.add(name);
            }
        }
    }
    return names;
}

/**
 * The file behind an image URL of the widget info. Such URLs are relative to the vis root: the React build lands in
 * `widgets/vis-2-widgets-timeandweather/` and comes from `public/`, everything else under `widgets/` is the vis-1 set.
 */
function imageFile(url) {
    const own = 'widgets/vis-2-widgets-timeandweather/';
    if (url.startsWith(own)) {
        return path.join(HERE, 'public', url.substring(own.length));
    }
    return path.join(HERE, '..', url);
}

let problems = 0;
const ids = new Set();
const setIcons = new Set();
const en = JSON.parse(readFileSync(path.join(SRC, 'i18n', 'en.json'), 'utf8'));
const missingLabels = new Set();
const usedLabels = new Set();

for (const name of WIDGETS) {
    const info = widgets[name].getWidgetInfo();
    const prefix = `${name} (${info.id})`;

    if (ids.has(info.id)) {
        console.log(`ERROR ${prefix}: duplicate tpl id`);
        problems++;
    }
    ids.add(info.id);

    if (info.visSet !== 'timeandweather') {
        console.log(`ERROR ${prefix}: visSet is "${info.visSet}", must be "timeandweather"`);
        problems++;
    }
    if (!legacyHtml.includes(`id="${info.id}"`)) {
        console.log(`ERROR ${prefix}: no vis-1 template with this id - React would not replace anything`);
        problems++;
    }

    const legacy = legacyAttrs(info.id) || new Set();
    const own = new Set();
    const checkLabel = key => {
        if (key) {
            usedLabels.add(key);
            if (!en[key]) {
                missingLabels.add(key);
            }
        }
    };

    // the description in the tooltip of the palette
    if (!info.visHelp) {
        console.log(`ERROR ${prefix}: no visHelp - the palette shows no description`);
        problems++;
    }
    setIcons.add(info.visSetIcon);
    for (const url of [info.visPrev, info.visSetIcon]) {
        if (url && !existsSync(imageFile(url))) {
            console.log(`ERROR ${prefix}: image "${url}" does not exist`);
            problems++;
        }
    }

    checkLabel(info.visWidgetLabel);
    checkLabel(info.visHelp);
    checkLabel(info.visSetLabel);
    for (const group of info.visAttrs) {
        checkLabel(group.label);
        for (const field of group.fields) {
            if (!field.name) {
                console.log(`ERROR ${prefix}: field without name in group ${group.name}`);
                problems++;
            }
            if (own.has(field.name)) {
                console.log(`ERROR ${prefix}: field "${field.name}" is declared twice`);
                problems++;
            }
            own.add(field.name);
            checkLabel(field.label);
            checkLabel(field.tooltip);
            if (Array.isArray(field.options) && !field.noTranslation) {
                field.options.forEach(o => checkLabel(typeof o === 'string' ? o : o.label));
            }
        }
    }

    const dropped = DROPPED[info.id] || [];
    const missing = [...legacy].filter(a => !own.has(a) && !dropped.includes(a));
    if (missing.length) {
        console.log(`ERROR ${prefix}: vis-1 attributes are gone: ${missing.join(', ')}`);
        problems += missing.length;
    }
    const added = [...own].filter(a => !legacy.has(a));
    console.log(
        `OK    ${prefix}: ${info.visAttrs.length} groups, ${own.size} fields` +
            (added.length ? ` | new: ${added.join(', ')}` : ''),
    );
}

// the palette takes the icon of the set from any of its widgets, so all have to name the same one
if (setIcons.size !== 1 || setIcons.has(undefined)) {
    console.log(`\nERROR every widget needs the same visSetIcon, found: ${[...setIcons].join(', ')}`);
    problems++;
}

// '' is the "not set" entry of a select and needs no translation
const reallyMissing = [...missingLabels].filter(key => key !== '');
if (reallyMissing.length) {
    console.log(`\nERROR missing keys in i18n/en.json: ${reallyMissing.join(', ')}`);
    problems += reallyMissing.length;
}

// every language file must have exactly the keys of en.json
for (const file of ['de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn']) {
    const words = JSON.parse(readFileSync(path.join(SRC, 'i18n', `${file}.json`), 'utf8'));
    const lacking = Object.keys(en).filter(key => !words[key]);
    if (lacking.length) {
        console.log(`ERROR i18n/${file}.json misses: ${lacking.join(', ')}`);
        problems += lacking.length;
    }
}

const unused = Object.keys(en).filter(key => !usedLabels.has(key));
if (unused.length) {
    console.log(`\nWARN  keys in i18n/en.json that no widget uses: ${unused.join(', ')}`);
}

rmSync(TMP, { recursive: true, force: true });
console.log(problems ? `\n${problems} problem(s)` : '\nall widget declarations fine');
process.exit(problems ? 1 : 0);

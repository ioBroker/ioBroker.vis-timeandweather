# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

`iobroker.vis-timeandweather` is a **widget set for ioBroker.vis and vis-2**, not a running adapter.
`io-package.json` declares `"mode": "none"`, `"onlyWWW": true`, `"type": "visualization-widgets"` - there is **no
Node.js runtime code**. Everything ships in `widgets/` and runs in the browser inside vis.

Every widget exists **twice**, with the same widget ids and the same attribute names:

| | vis (vis-1) | vis-2 |
|---|---|---|
| source | `widgets/timeandweather.html` + `widgets/timeandweather/` (hand-maintained) | `src-widgets/src/*.tsx` |
| technique | EJS templates, jQuery, CoolClock, FlipClock.js, zWeatherFeed, segment-display.js | React + TypeScript, no third-party UI libs |
| shipped as | the same files | `widgets/vis-2-widgets-timeandweather/` (generated) |

vis-2 loads both and **a React widget replaces the EJS widget of the same id** (`visWidgetsCatalog.tsx`:
`visWidgetTypes.findIndex(item => item.name === widgetObj.name)` -> replace). That is the whole migration mechanism,
and it only works while three things hold:

1. `getWidgetInfo().id` equals the vis-1 `<script id="tplTw…">` (two of them are `tplSvgClock` and `tplSegmentClock`).
2. `getWidgetInfo().visSet` is `'timeandweather'`.
3. Every attribute name of the vis-1 template still exists - widget data is stored per attribute name, so a
   renamed field silently drops the user's setting. The weather widget has names like `temperature-min-3-oid`.

`npm run check-widgets` enforces all three; see below.

## Commands

```bash
npm run build          # sync version into the vis-1 set, then npm i + tsc + vite build + copy to widgets/
npm run tsc            # type-check src-widgets only
npm run check-widgets  # validate the widget declarations against the vis-1 templates (see below)
npm run preview        # vite dev server with a stub of vis-2 - shows all widgets without an ioBroker
npm run screenshots    # render the images of docs/img/ with a headless Chrome (see below)
npm run lint           # eslint with @iobroker/eslint-config
npm test               # mocha --exit -> test/testPackageFiles.js (package/io-package validation)
npm run npm            # install in root and src-widgets
npm run release-patch  # release-script; runs lint before the check and build before the commit
```

`npm run build` must not be replaced by a plain vite build: `tasks.js` deletes **only**
`widgets/vis-2-widgets-timeandweather` and `src-widgets/build`, never the whole `widgets/` folder - the vis-1 set
lives there and is maintained by hand.

### Version bumps

The version lives in `package.json`, `io-package.json` (both handled by `release-script`), plus two literals in
`widgets/timeandweather.html`: the header comment and the `version:` field of `vis.binds.timeandweather`. `tasks.js`
rewrites both (`version: "x.y.z"`) from `package.json` on every build (`node tasks --version` does only that).

### `npm run check-widgets`

`src-widgets/checkWidgets.mjs` bundles the widget sources for node, stubs `window.visRxWidget`, calls every
`getWidgetInfo()` and checks the three migration invariants above, that every widget has a `visHelp` (the
description in the palette tooltip), that all widgets name the same `visSetIcon` and that it and every `visPrev`
exist, that every `label`/`tooltip`/select option/`visHelp` exists in `src-widgets/src/i18n/en.json` and that every
other language file has all keys of `en.json`. The commented-out
templates of the vis-1 set (`tplTwHtcWeather`, `tplTwYahooWeather`) are ignored. Attributes the vis-1 template
offered but never used would go into its `DROPPED` map - it is empty today.

## Architecture of the vis-2 widget set (`src-widgets/`)

Vite + `@module-federation/vite`, federation name `visTimeAndWeather`, remote entry `customWidgets.js`. The exposed
component names and the URL are repeated in `io-package.json` under `common.visWidgets.visTimeAndWeather` - adding a
widget means touching `vite.config.ts` (`exposes`), that block **and** the `WIDGETS` list of `checkWidgets.mjs`.

`moduleFederationShared(pack)` from `@iobroker/types-vis-2` filters the shared modules by the dependencies in
`src-widgets/package.json`. React and `react/jsx-runtime` must stay shared, otherwise vis-2's
`visWidgetSetCompatibility.ts` refuses to load the set. There is no MUI: the widgets draw everything themselves.

`@swc/core` is pinned via `overrides` - `vite-plugin-top-level-await` fails on 1.16 with `missing field 'type'`.

### Widget classes

Every widget extends `Generic` (`src/Generic.tsx`), which extends `window.visRxWidget` provided by the vis-2
runtime, and declares `getI18nPrefix() === 'vis_timeandweather_'`. The JSON files under `src/i18n/` hold the keys
**without** the prefix and `src/translations.ts` adds it.

| widget | tpl id | notes |
|---|---|---|
| `TwSimpleClock` | `tplTwSimpleClock` | text; adds the classes `clock tw-rx-clock` to the widget root unless `noClass` |
| `TwSimpleDate` | `tplTwSimpleDate` | text; adds `date tw-rx-date`; refreshes after midnight |
| `TwCoolClock` | `tplTwCoolClock` | `Components/CoolClockCanvas.tsx` + `Components/coolClockSkins.ts` |
| `TwFlipClock` | `tplTwFlipClock` | `Components/FlipDigit.tsx`; fixed width per face, not resizable |
| `TwWeather` | `tplTwWeather` | markup and class names of zWeatherFeed; `conditions.ts` translates the texts |
| `TwSvgClock` | `tplSvgClock` | plain SVG |
| `TwSegmentClock` | `tplSegmentClock` | `Components/SegmentDisplay.ts` |

`words.ts` holds week days, months and the few runtime words of the weather widget for all eleven languages. They
are not in `i18n/`, because the weather widget has a `language` attribute of its own.

### Conventions that come from the vis-1 set

- **Attribute values arrive as strings.** Older projects even hold `'true'`/`'false'` for a checkbox. `utils.ts`
  has the coercions (`isTrue`, `toNumber`, `toNumberOrZero`); use them instead of comparing directly.
  `toNumberOrZero` reproduces the vis-1 pattern "empty -> default, unparsable -> 0" of the segment clock.
- **Class names and specificity are part of the contract.** Projects may carry own CSS for `.clock`, `.date`,
  `.weatherItem`, `.weatherForecastItem`, `.flip-clock-wrapper ul li …`. vis-2 appends the project CSS
  (`vis-user.css`, `vis-common-user.css`) to `<body>`, after the widget CSS, so a user rule wins as long as ours is
  not more specific. That is why the weather and flip clock rules in `styles.css` use the **vis-1 selectors
  unchanged** - do not put a scoping class in front of them. Only the widget roots (`.tw-rx-clock`, `.tw-rx-date`,
  `.tw-rx-weather`, `.tw-rx.flip-clock-wrapper`) and the theme-dependent rules are scoped. `:where()` is not an
  option: old wall tablets (Chrome < 88) drop the whole rule. The vis-1 stylesheets, which vis-2 also loads, have the
  same values, so both applying at once does no harm.
- **Where a class goes matters.** SimpleClock/SimpleDate/Weather put their class on the widget root itself via
  `props.className` in `renderWidgetBody` - exactly like vis-1 did with `$wid.addClass('clock')` - so the inline
  CSS of the widget still wins over it. That is what the `noClass` option is about.
- **The ported libraries must not drift.** The drawing code of `SegmentDisplay.ts` is the one of
  `widgets/timeandweather/js/segment-display.js` and the skins in `coolClockSkins.ts` are the ones of
  `moreskins.js`. The preview draws both originals next to the React versions; they must look the same.
- **Known vis-1 quirks that are kept on purpose:** the corner types of the segment clock map onto the library in a
  crossed way (`PointedCorner` -> rounded, `RoundedCorner` -> symmetric), CoolClock never printed seconds in the
  digital time, the FlipClock has a `margin: 1em`, the weather humidity line is larger than wind and range.
- **Dark theme.** `Generic.getRootClass()` adds `tw-rx-dark` when `context.themeType === 'dark'`. Only what lies on
  the view follows it (the dots and AM/PM of the flip clock); the faces of the clocks and the weather box keep their
  colors.
- Images are referenced relative to the vis root: `widgets/timeandweather/img/…` resolves to the vis-1 assets this
  package ships (backgrounds, palette previews).
- The adapter icon `admin/timeandweather.svg` is the Svg Clock at 4:35, drawn with the geometry of `TwSvgClock`
  and a white dial, so it stays visible in the dark admin theme. `admin/timeandweather.png` is the old icon.
  `src-widgets/public/img/timeandweather.svg` is a copy of it: the `visSetIcon` of every widget, which the vis-2
  palette shows in front of the set name. Change both together.

### `src-widgets/preview/` - the development page and the screenshots

`npm run preview` starts a vite dev server (port 4173, `strictPort`) with a page that renders all widgets against a
stub of `VisRxWidget`, with the weather values editable on the left, a language select and a dark toggle. A small
middleware serves `/widgets/**` and `/admin/**` from the repository, so the vis-1 images load and the original
`coolclock.js` and `segment-display.js` can be drawn next to the React widgets.

`preview/stub.tsx` (the `VisRxWidget` stub, which renders the widget root like vis-2 does) and `preview/icons.ts`
(inline weather icons) are shared by two pages: `index.html`, the interactive page above, and `shots.html`, fixed
scenes for the documentation. `shots.tsx` replaces `Date` before it loads the widgets, so every clock shows
Thursday, 21 May 2026, 10:08:42 and the images only change when a widget changes. Every
`<section data-shot="name">` becomes `docs/img/name.png`. `npm run screenshots` (`preview/screenshots.mjs`) starts
its own vite on port 4175 with its own cache dir, drives a local Chrome over the DevTools protocol (node 22
`WebSocket`, no puppeteer) and saves the sections at 2x. `npm run screenshots -- weather flip-clock` renders only
those. After changing how a widget looks, re-render the images and check the user documentation in
`docs/en/README.md` and `docs/de/README.md`. Both describe every setting of every vis-2 widget.

Not part of the widget set, excluded from lint, `dist/` and `.vite/` are git-ignored.

Note that the scripts of `src-widgets` have to be called with `npx` (`cd src-widgets && npx vite …`): `npm run`
only puts the `node_modules/.bin` of the **root** on the PATH.

## The vis-1 widget set (`widgets/`)

Still shipped and still maintained by hand; only touch it for fixes that vis (vis-1) users need.

- `widgets/timeandweather.html` - one `<script type="text/ejs" class="vis-tpl" id="…">` per widget plus
  `vis.binds.timeandweather`, which loads the libraries of `widgets/timeandweather/js/` on demand (`loadJS`).
  `tplTwHtcWeather` and `tplTwYahooWeather` are commented out: the Yahoo! weather API they used is gone.
- The `data-vis-attrs*` mini-DSL defines the editor fields (`;`-separated, `group.x` opens a group, `[default]`,
  `/type`). Attribute labels are translated through the `systemDictionary` block at the top of the file.

## Changelog

`README.md` carries the changelog; the release script moves the `### **WORK IN PROGRESS**` section into
`io-package.json` `common.news` with translations. Add entries as `* (author) description`.

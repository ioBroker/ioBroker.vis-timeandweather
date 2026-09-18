/*
 * Build of the vis-2 (React) widget set.
 *
 * Careful with the `widgets/` folder: unlike a pure vis-2 widget set it is NOT generated here. It also holds the
 * vis-1 widget set (`widgets/timeandweather.html` and `widgets/timeandweather/**`), which is maintained by hand and
 * still shipped for vis. Only the sub folder of the React build is deleted and rebuilt.
 */
const { deleteFoldersRecursive, buildReact, npmInstall, copyFiles } = require('@iobroker/build-tools');
const fs = require('node:fs');

/** Where the built React widget set ends up. Must match `common.visWidgets.*.url` in io-package.json. */
const TARGET = 'widgets/vis-2-widgets-timeandweather';

function copyAllFiles() {
    copyFiles(['src-widgets/build/**/*', '!src-widgets/build/index.html'], `${TARGET}/`);
}

/** Keeps the version in the vis-1 widget set in sync with package.json */
function syncLegacyVersion() {
    const pack = require('./package.json');

    const file = 'widgets/timeandweather.html';
    const content = fs.readFileSync(`${__dirname}/${file}`, 'utf8');
    // the header comment carries `version: "x.y.z"`, `vis.binds.timeandweather` carries `version: "x.y.z",`
    const updated = content.replace(/version: "\d+\.\d+\.\d+"/g, `version: "${pack.version}"`);
    if (content !== updated) {
        fs.writeFileSync(`${__dirname}/${file}`, updated);
        console.log(`${file} updated`);
    }
}

if (process.argv.includes('--copy-files')) {
    copyAllFiles();
} else if (process.argv.includes('--build')) {
    buildReact(`${__dirname}/src-widgets`, { rootDir: __dirname, vite: true }).catch(e => {
        console.error(`Error by build: ${e}`);
        process.exit(1);
    });
} else if (process.argv.includes('--version')) {
    syncLegacyVersion();
} else {
    syncLegacyVersion();
    deleteFoldersRecursive(`${__dirname}/src-widgets/build`);
    deleteFoldersRecursive(`${__dirname}/${TARGET}`);
    npmInstall('src-widgets')
        .then(() => buildReact(`${__dirname}/src-widgets`, { rootDir: __dirname, vite: true }))
        .then(() => copyAllFiles())
        .catch(e => {
            console.error(`Error by build: ${e}`);
            process.exit(1);
        });
}

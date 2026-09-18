/*
 * Config of the local widget preview (`npm run preview` in the root).
 *
 * It is deliberately separate from `src-widgets/vite.config.ts`: no module federation, no shared modules - the
 * page brings its own react and its own stub of `window.visRxWidget`, so the widgets can be looked at without a
 * running ioBroker.
 */
import react from '@vitejs/plugin-react';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath } from 'node:url';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(here, '..', '..');

const TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.css': 'text/css',
    '.js': 'text/javascript',
};

/**
 * Serves `/widgets/**` from the `widgets/` folder of the repository - the images of the vis-1 set, which the React
 * widgets reference relative to the vis root, and the vis-1 libraries the page draws next to the React widgets for
 * comparison - and `/admin/**` (the adapter icon).
 */
function serveRepository(): Plugin {
    return {
        name: 'serve-repository',
        configureServer(server) {
            for (const folder of ['widgets', 'admin']) {
                const dir = path.join(repoDir, folder);
                server.middlewares.use(`/${folder}`, (req, res, next) => {
                    const file = path.resolve(dir, `.${decodeURIComponent((req.url || '').split('?')[0])}`);
                    if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) {
                        next();
                        return;
                    }
                    res.setHeader(
                        'Content-Type',
                        TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
                    );
                    createReadStream(file).pipe(res);
                });
            }
        },
    };
}

export default {
    root: here,
    publicDir: false,
    plugins: [
        serveRepository(),
        // the preview imports the widgets with a top-level await, after the stub is on `window`
        topLevelAwait({ promiseExportName: '__tla', promiseImportName: (i: number) => `__tla_${i}` }),
        react(),
    ],
    build: { outDir: path.join(here, 'dist'), emptyOutDir: true, target: 'chrome100' },
    /*
     * Its own dependency cache, not the one of `src-widgets`. Two vite dev servers that share
     * `node_modules/.vite` overwrite each other's optimized dependencies, and the page then loads without any
     * error message and stays blank.
     */
    cacheDir: path.join(here, '.vite'),
    server: {
        port: 4173,
        // Rather fail with "Port 4173 is already in use" than quietly move to the next port
        strictPort: true,
    },
    base: './',
};

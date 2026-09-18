/*
 * Weather icons of the preview pages. A weather adapter delivers the URL of an image; these inline SVGs stand in for
 * them, so the pages need no network.
 */
const svg = (body: string): string =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50" height="50">${body}</svg>`,
    )}`;

const CLOUD_PATH = 'M15 36a8 8 0 0 1 0-16 11 11 0 0 1 21 3 7 7 0 0 1 0 13Z';
const HIGH_CLOUD_PATH = 'M15 30a8 8 0 0 1 0-16 11 11 0 0 1 21 3 7 7 0 0 1 0 13Z';

export const SUN = svg(
    '<circle cx="25" cy="25" r="10" fill="#ffd21f"/><g stroke="#ffd21f" stroke-width="3" stroke-linecap="round"><path d="M25 5v6M25 39v6M5 25h6M39 25h6M11 11l4 4M35 35l4 4M11 39l4-4M35 15l4-4"/></g>',
);

export const CLOUD = svg(`<path d="${CLOUD_PATH}" fill="#dfe6ee"/>`);

export const PARTLY = svg(
    '<circle cx="31" cy="17" r="8" fill="#ffd21f"/><g stroke="#ffd21f" stroke-width="2.5" stroke-linecap="round"><path d="M31 3v4M45 17h-4M41 7l-3 3M41 27l-3-3"/></g>' +
        `<path d="${CLOUD_PATH}" fill="#dfe6ee"/>`,
);

export const RAIN = svg(
    `<path d="${HIGH_CLOUD_PATH}" fill="#b8c4d0"/><g stroke="#4aa3ff" stroke-width="2.5" stroke-linecap="round"><path d="M18 34l-2 6M26 34l-2 6M34 34l-2 6"/></g>`,
);

export const THUNDER = svg(
    `<path d="${HIGH_CLOUD_PATH}" fill="#9aa6b2"/><path d="M26 31l-6 9h5l-3 8 9-11h-5l3-6Z" fill="#ffd21f"/>`,
);

export const SNOW = svg(
    `<path d="${HIGH_CLOUD_PATH}" fill="#dfe6ee"/><g fill="#ffffff"><circle cx="17" cy="37" r="2"/><circle cx="25" cy="41" r="2"/><circle cx="33" cy="37" r="2"/><circle cx="21" cy="45" r="2"/><circle cx="29" cy="45" r="2"/></g>`,
);

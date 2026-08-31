export interface MdiIcon {
  name: string;
  path?: string;
  svg?: string;
  set?: 'lucide' | 'fa6-solid' | 'mdi' | string;
  viewBox?: string;
}

export type MdiCategories = Record<string, MdiIcon[]>;

/**
 * Universal helper to generate valid, black-fill/stroke SVG markup for any icon
 */
export function getIconSvgMarkup(
  icon: { name: string; path?: string; svg?: string; set?: string; viewBox?: string },
  color: string = '#000000'
): string {
  const viewBox = icon.viewBox || '0 0 24 24';
  if (icon.svg) {
    if (icon.svg.trim().startsWith('<svg')) {
      return icon.svg
        .replace(/currentColor/g, color)
        .replace(/fill="none"/g, `fill="none" stroke="${color}"`);
    }
    if (icon.set === 'lucide') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="60" height="60" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="60" height="60" fill="${color}">${icon.svg}</svg>`;
  }

  const d = icon.path || '';
  if (icon.set === 'lucide') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="60" height="60" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="60" height="60"><path fill="${color}" d="${d}"/></svg>`;
}

/**
 * Converts SVG markup into a safe Base64 data URL compatible with all canvas and img elements
 */
export function svgToDataUrl(svgMarkup: string): string {
  try {
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgMarkup)))}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  }
}

export const MDI_OFFLINE: MdiCategories = {
  "Essentials & UI": [
    { name: "star", set: "lucide", svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    { name: "heart", set: "lucide", svg: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
    { name: "check", set: "lucide", svg: '<polyline points="20 6 9 17 4 12"/>' },
    { name: "alert-circle", set: "lucide", svg: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>' },
    { name: "info", set: "lucide", svg: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>' },
    { name: "bell", set: "lucide", svg: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' },
    { name: "calendar", set: "lucide", svg: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>' },
    { name: "clock", set: "lucide", svg: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    { name: "user", set: "lucide", svg: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { name: "mail", set: "lucide", svg: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
    { name: "phone", set: "lucide", svg: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' },
    { name: "settings", set: "lucide", svg: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' },
    { name: "thumbs-up", set: "fa6-solid", viewBox: "0 0 512 512", path: "M313.4 32.9c26 5.2 45.5 28 46.4 54.4l.2 4.7 0 36 64 0c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6l-50.7 135.2C457.5 407.2 444.6 416 430 416l-174 0c-17.7 0-32-14.3-32-32l0-170.8c0-8.5 3.4-16.6 9.4-22.6l108-108c10.5-10.5 25.1-16 40-14.7l2-.3zM128 416l-64 0c-17.7 0-32-14.3-32-32l0-192c0-17.7 14.3-32 32-32l64 0 0 256z" },
    { name: "bookmark", set: "fa6-solid", viewBox: "0 0 384 512", path: "M0 48C0 21.5 21.5 0 48 0l288 0c26.5 0 48 21.5 48 48l0 440c0 9-5 17.2-13 21.3s-17.6 3.4-24.9-1.8L192 397.8 37.9 507.5c-7.3 5.2-16.9 5.9-24.9 1.8S0 497 0 488L0 48z" }
  ],
  "Home Automation": [
    { name: "home", set: "mdi", path: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
    { name: "lightbulb", set: "mdi", path: "M12 2A7 7 0 0 0 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74A7 7 0 0 0 12 2M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1z" },
    { name: "power", set: "mdi", path: "M12 3a1 1 0 0 0-1 1v8a1 1 0 0 0 2 0V4a1 1 0 0 0-1-1zm5.36 2.05a1 1 0 0 0-1.42 1.41 8 8 0 1 1-7.88 0 1 1 0 0 0-1.42-1.41 10 10 0 1 0 10.72 0z" },
    { name: "router", set: "mdi", path: "M4 17h16v2H4zm12-4h2v2h-2zm-4 0h2v2h-2zM2 15h20V9H2z" },
    { name: "wifi", set: "mdi", path: "M12 3C7.95 3 4.21 4.34 1.2 6.6L3 9c2.51-1.89 5.62-3 9-3s6.49 1.11 9 3l1.8-2.4C19.79 4.34 16.05 3 12 3zm0 6c-2.98 0-5.7.99-7.88 2.66L6 14c1.69-1.26 3.75-2 6-2s4.31.74 6 2l1.88-2.34C17.7 9.99 14.98 9 12 9zm0 6c-1.95 0-3.72.66-5.14 1.77L12 21l5.14-4.23C15.72 15.66 13.95 15 12 15z" },
    { name: "thermometer", set: "mdi", path: "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 3A1 1 0 0 1 13 4V8H11V4A1 1 0 0 1 12 3Z" },
    { name: "lock", set: "mdi", path: "M12 17a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2m6-9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z" },
    { name: "tv", set: "lucide", svg: '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>' },
    { name: "sun", set: "lucide", svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    { name: "droplet", set: "lucide", svg: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>' },
    { name: "zap", set: "lucide", svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' }
  ],
  "Storage & Tools": [
    { name: "box", set: "mdi", path: "M3 3h18v4H3zm1 5h16v13H4zm6 2v2h4v-2z" },
    { name: "package", set: "lucide", svg: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>' },
    { name: "folder", set: "mdi", path: "M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" },
    { name: "wrench", set: "mdi", path: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.7 4.3C.6 6.7 1 9.7 3 11.7c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.4-.4.4-1.1 0-1.5z" },
    { name: "hammer", set: "lucide", svg: '<path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 3.26-1.25-1.25a2.41 2.41 0 0 0-3.41 0l-2.09 2.09a2.41 2.41 0 0 0 0 3.41l1.25 1.25"/><path d="m9.22 14.78 4.25-4.25"/>' },
    { name: "truck", set: "lucide", svg: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>' },
    { name: "archive", set: "mdi", path: "M3 3h18v4H3V3zm1 5h16v13H4V8zm6 3v2h4v-2h-4z" },
    { name: "barcode", set: "mdi", path: "M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4z" },
    { name: "tag", set: "mdi", path: "M5.5 7A1.5 1.5 0 0 1 4 5.5 1.5 1.5 0 0 1 5.5 4 1.5 1.5 0 0 1 7 5.5 1.5 1.5 0 0 1 5.5 7M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z" },
    { name: "database", set: "lucide", svg: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>' },
    { name: "server", set: "lucide", svg: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>' },
    { name: "cpu", set: "lucide", svg: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/>' },
    { name: "cubes", set: "fa6-solid", viewBox: "0 0 512 512", path: "M234.5 5.7c13.9-7.6 30.6-7.6 44.5 0l192 104.7c13.3 7.3 21 21.6 21 36.8l0 216c0 15.2-7.7 29.5-21 36.8l-192 104.7c-13.9 7.6-30.6 7.6-44.5 0l-192-104.7C28.7 392.7 21 378.4 21 363.2l0-216c0-15.2 7.7-29.5 21-36.8L234.5 5.7zM256 66.8L94.5 155 256 243.2l161.5-88.2L256 66.8zM69 205.2l0 147.6 155 84.5 0-147.6L69 205.2zm219 232.1l155-84.5 0-147.6-155 84.5 0 147.6z" }
  ],
  "Symbols & Labels": [
    { name: "flame", set: "lucide", svg: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
    { name: "shield", set: "lucide", svg: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' },
    { name: "trash-2", set: "lucide", svg: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>' },
    { name: "badge-check", set: "lucide", svg: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>' },
    { name: "gift", set: "lucide", svg: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>' },
    { name: "shopping-cart", set: "lucide", svg: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>' },
    { name: "sparkles", set: "lucide", svg: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>' },
    { name: "crosshair", set: "lucide", svg: '<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>' },
    { name: "scissors", set: "lucide", svg: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/>' },
    { name: "printer", set: "lucide", svg: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>' },
    { name: "recycle", set: "fa6-solid", viewBox: "0 0 512 512", path: "M280.4 148.9l-58.4 101.2 58.4 0c14.6 0 26.4 11.8 26.4 26.4c0 4.4-1.1 8.8-3.3 12.6L201.2 465.7c-4.4 7.6-12.5 12.3-21.2 12.3c-13.6 0-24.6-11-24.6-24.6l0-64.8-101.2 0c-14.6 0-26.4-11.8-26.4-26.4c0-4.4 1.1-8.8 3.3-12.6L133.5 173c4.4-7.6 12.5-12.3 21.2-12.3l125.7 0c0-3.9 0-7.8 0-11.8zm231.6 83.2L410.8 38.6C406.4 31 398.3 26.3 389.6 26.3c-13.6 0-24.6 11-24.6 24.6l0 64.8-101.2 0c-14.6 0-26.4 11.8-26.4 26.4c0 4.4 1.1 8.8 3.3 12.6L292.9 246.3c-4.4 7.6-12.5 12.3-21.2 12.3l-55.8 0 58.4 101.2 125.7 0c14.6 0 26.4-11.8 26.4-26.4c0-4.4-1.1-8.8-3.3-12.6L320.7 148.9l128 0 0-64.8 63.3 109.6z" }
  ]
};

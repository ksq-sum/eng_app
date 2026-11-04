const icons = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4Z"/>',
  chart: '<path d="M4 3v17h17M8 15v-4m5 4V7m5 8V4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3h.01"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play: '<path d="m9 5 10 7-10 7Z"/>',
  sound: '<path d="M11 4 6 8H3v8h3l5 4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  leaf: '<path d="M20 3C8 1 2 8 5 15s16 5 15-12ZM5 20 16 8"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  flame: '<path d="M13 2c1 6-6 6-3 11 1-2 2-3 4-4 6 6 3 12-2 12S2 17 5 11c1-2 3-4 4-6 0 4 3 3 4-3Z"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 8 15 8 15S25 10 20 5Z"/>',
};
export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.leaf}</svg>`;
export function coffeeArt() {
  return `<svg class="coffee-art" viewBox="0 0 240 240" aria-hidden="true"><ellipse cx="127" cy="193" rx="88" ry="17" fill="#d4ddbf"/><path d="M162 98h19c40 0 37 59-4 59h-13" fill="none" stroke="#fdfcf2" stroke-width="13"/><path d="M65 91h107l-8 76c-3 30-84 30-89 0Z" fill="#fdfcf2"/><ellipse cx="118" cy="91" rx="54" ry="17" fill="#f2f0dd"/><ellipse cx="118" cy="92" rx="44" ry="12" fill="#a27f55"/><path d="M90 92c20-16 37 16 54-2" fill="none" stroke="#d8bb8a" stroke-width="3"/><path d="M99 61c-17-15 9-21-2-38m30 37c-16-16 9-24-1-41m27 46c-13-10 4-18-1-28" fill="none" stroke="#b7c69d" stroke-width="3" stroke-linecap="round"/><path d="m37 137 12 3-4 23-12-3Z" fill="#b0bf8d"/><path d="m32 157 19 5-6 12-18-5Z" fill="#c6d3a7"/><path d="M184 52v18m-9-9h18" stroke="#9bb27a" stroke-width="2"/><circle cx="53" cy="76" r="3" fill="#c0cc9e"/><path d="m184 186 8 4 13-24-8-4Z" fill="#d4b58b"/></svg>`;
}

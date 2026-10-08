// Små hjælpere (kopieret og tilpasset fra Matematik-Zoo).

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Bland, men aldrig i den oprindelige rækkefølge (brikker, der allerede står rigtigt, er ingen opgave)
export function shuffleNot(arr) {
  if (arr.length < 2 || new Set(arr).size < 2) return arr.slice();
  for (let i = 0; i < 20; i++) { const s = shuffle(arr); if (s.join('|') !== arr.join('|')) return s; }
  return arr.slice().reverse();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function today(d = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function clock(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export const reducedMotion = () =>
  document.documentElement.classList.contains('rm') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

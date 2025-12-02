export const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  grey: '#808080',
  navy: '#001f3f',
  blue: '#1e3a8a',
  lightblue: '#60a5fa',
  red: '#ef4444',
  green: '#16a34a',
  beige: '#a8a894ff',
  lightbeige: '#929286ff',
  brown: '#8b4513',
  pink: '#ec4899',
  purple: '#8b5cf6',
  yellow: '#f59e0b',
  orange: '#f97316',
  cream: '#fffdd0',
  maroon: '#800000',
  olive: '#808000',
  teal: '#008080',
  cyan: '#06b6d4',
  magenta: '#d946ef',
  burgundy: '#800020',
};

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getColorHex(input: string | undefined | null): string {
  if (!input) return '#999999';
  const s = String(input).trim();
  // If developer already supplied hex
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return s;
  // Try mapped name (case-insensitive, ignoring spaces/symbols)
  const key = normalizeName(s);
  if (COLOR_MAP[key]) return COLOR_MAP[key];
  // As a fallback, return a neutral swatch
  return '#999999';
}

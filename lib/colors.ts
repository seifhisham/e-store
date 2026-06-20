export const STANDARD_COLORS = [
  // Neutrals
  'Black',
  'White',
  'Off White',
  'Ivory',
  'Cream',
  'Gray',
  'Charcoal',
  'Silver',
  // Earth tones
  'Beige',
  'Tan',
  'Taupe',
  'Khaki',
  'Sand',
  'Camel',
  'Brown',
  // Blues
  'Navy',
  'Blue',
  'Royal Blue',
  'Light Blue',
  'Sky Blue',
  'Denim',
  'Teal',
  'Cyan',
  // Greens
  'Green',
  'Sage Green',
  'Olive Green',
  'Mint',
  'Forest Green',
  // Yellows & oranges
  'Yellow',
  'Mustard',
  'Gold',
  'Orange',
  'Coral',
  'Peach',
  'Rust',
  // Reds & pinks
  'Red',
  'Burgundy',
  'Maroon',
  'Wine',
  'Pink',
  'Blush',
  'Rose',
  // Purples
  'Purple',
  'Lavender',
  'Magenta',
] as const

export const COLOR_MAP: Record<string, string> = {
  // Neutrals
  black: '#000000',
  white: '#ffffff',
  offwhite: '#FAF9F6',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  gray: '#808080',
  grey: '#808080',
  charcoal: '#36454F',
  silver: '#C0C0C0',
  // Earth tones
  beige: '#D4C4A8',
  tan: '#D2B48C',
  taupe: '#8B8589',
  khaki: '#C3B091',
  sand: '#C2B280',
  camel: '#C19A6B',
  brown: '#8B4513',
  lightbeige: '#E8E0D5',
  darkbrown: '#5C4033',
  // Blues
  navy: '#001F3F',
  blue: '#1E3A8A',
  royalblue: '#4169E1',
  lightblue: '#60A5FA',
  skyblue: '#87CEEB',
  denim: '#1560BD',
  teal: '#008080',
  cyan: '#06B6D4',
  darkblue: '#000080',
  // Greens
  green: '#16A34A',
  sagegreen: '#9CAF88',
  olivegreen: '#556B2F',
  olive: '#556B2F',
  mint: '#98FF98',
  forestgreen: '#228B22',
  darkgreen: '#006400',
  lightgreen: '#90EE90',
  // Yellows & oranges
  yellow: '#F59E0B',
  mustard: '#FFDB58',
  gold: '#D4AF37',
  orange: '#F97316',
  coral: '#FF7F50',
  peach: '#FFCBA4',
  rust: '#B7410E',
  // Reds & pinks
  red: '#EF4444',
  burgundy: '#800020',
  maroon: '#800000',
  wine: '#722F37',
  pink: '#EC4899',
  blush: '#DE5D83',
  rose: '#FF007F',
  darkred: '#8B0000',
  lightred: '#FFB6C1',
  // Purples
  purple: '#8B5CF6',
  lavender: '#E6E6FA',
  magenta: '#D946EF',
  darkpurple: '#800080',
  lightpurple: '#DDA0DD',
}

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function getColorHex(input: string | undefined | null): string {
  if (!input) return '#999999'
  const s = String(input).trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return s
  const key = normalizeName(s)
  if (COLOR_MAP[key]) return COLOR_MAP[key]
  return '#999999'
}

export const theme = Object.freeze({
  size: { width: 1280, height: 720 },
  frame: { left: 64, top: 48, width: 1152, height: 624 },
  color: {
    void: '#03030B',
    deep: '#08071A',
    surface: '#0E0D22',
    surfaceSoft: '#151330',
    white: '#F8F7FF',
    text: '#E6E3F5',
    muted: '#A7A2C1',
    faint: '#66617F',
    line: '#302B54',
    cyan: '#5CE1E6',
    blue: '#6EA8FF',
    violet: '#9D7BFF',
    magenta: '#D66BFF',
    rose: '#FF79AF',
  },
  type: {
    display: 'Aptos Display',
    body: 'Aptos',
    mono: 'Aptos Mono',
  },
  moduleAccents: [
    '#5CE1E6',
    '#6EA8FF',
    '#8C86FF',
    '#A879FF',
    '#C66FFF',
    '#E071D4',
    '#FF79AF',
  ],
});

export function titleSize(text, max = 44) {
  if (text.length > 58) return 36;
  if (text.length > 46) return 39;
  return max;
}

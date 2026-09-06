/** Build-time and render-time colour helpers; the stylesheets avoid color-mix() so Safari 15.4 and Chrome 108 stay supported. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new RangeError(`Invalid hex colour ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}
export const withAlpha = (hex: string, alpha: number) =>
  `rgba(${hexToRgb(hex).join(', ')}, ${alpha})`;
/** `weight` is the share of `hex`, matching `color-mix(in srgb, hex weight%, base)`. */
export function mixHex(hex: string, base: string, weight: number) {
  const a = hexToRgb(hex),
    b = hexToRgb(base);
  return `#${a
    .map((v, i) =>
      Math.round(v * weight + b[i] * (1 - weight))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

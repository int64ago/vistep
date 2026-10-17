/** Greedy bounded LZ77 tokenization; literal or (distance,length), with legal overlapping copy. */
export type LzToken =
  | { at: number; kind: 'literal'; value: string; length: 1 }
  | { at: number; kind: 'match'; distance: number; length: number };
export const LZ_TEXT = 'ABRACADABRA_ABRACADABRA';
export function lzEncode(text: string, window = 12, minMatch = 3, maxMatch = 18) {
  const chars = Array.from(text);
  if (
    chars.length > 96 ||
    !Number.isInteger(window) ||
    window < 1 ||
    window > 64 ||
    !Number.isInteger(minMatch) ||
    minMatch < 2 ||
    !Number.isInteger(maxMatch) ||
    maxMatch < minMatch ||
    maxMatch > 96
  )
    throw new RangeError('Invalid teaching bounds');
  const tokens: LzToken[] = [];
  for (let at = 0; at < chars.length;) {
    let length = 0,
      distance = 0;
    for (let d = 1; d <= Math.min(window, at); d++) {
      let n = 0;
      while (n < maxMatch && at + n < chars.length && chars[at + n] === chars[at + n - d]) n++;
      if (n > length) {
        length = n;
        distance = d;
      }
    }
    if (length >= minMatch) {
      tokens.push({ at, kind: 'match', distance, length });
      at += length;
    } else {
      tokens.push({ at, kind: 'literal', value: chars[at], length: 1 });
      at++;
    }
  }
  return { chars, tokens, window, minMatch, maxMatch };
}
export function lzDecode(tokens: readonly LzToken[], limit = Infinity) {
  const out: string[] = [];
  for (const token of tokens) {
    if (token.at !== out.length) throw new RangeError('Token position mismatch');
    if (token.kind === 'literal') {
      if (out.length < limit) out.push(token.value);
    } else {
      if (
        !Number.isInteger(token.distance) ||
        token.distance < 1 ||
        token.distance > out.length ||
        !Number.isInteger(token.length) ||
        token.length < 1
      )
        throw new RangeError('Invalid back reference');
      for (let i = 0; i < token.length && out.length < limit; i++)
        out.push(out[out.length - token.distance]);
    }
    if (out.length >= limit) break;
  }
  return out.join('');
}
export function lzFrame(run: ReturnType<typeof lzEncode>, index: number, copied = 0) {
  const i = Math.min(run.tokens.length - 1, Math.max(0, Math.floor(index))),
    token = run.tokens[i];
  if (!token) return { token: undefined, at: 0, history: '', copied: 0, source: -1 };
  const count = Math.max(0, Math.min(token.length, Math.floor(copied)));
  return {
    token,
    at: token.at,
    history: lzDecode(run.tokens, token.at + count),
    copied: count,
    source: token.kind === 'match' ? token.at - token.distance + count : -1,
  };
}

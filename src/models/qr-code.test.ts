import { describe, expect, it } from 'vitest';
import {
  QR_FORMAT_A,
  QR_FORMAT_B,
  QR_MAX_BYTES,
  qrBits,
  qrEncode,
  qrFormat,
  qrFunctionGrid,
  qrGenerator,
  qrGf,
  qrMask,
  qrPenalty,
  qrQuietGrid,
  qrRs,
  qrShot,
  qrStream,
  qrSvg,
  qrTracked,
  qrUtf8,
} from './qr-code';
// Validation-only reference: Project Nayuki qrcodegen 1.8.0, Python.
// ASCII byte mode; non-ASCII ECI 26 + UTF-8 byte mode. LOW, version 1, masks 0..7,
// boostecl=False. Codewords are captured from that encoder before placement.
// Matrix hashes cover 21 rows joined with LF, without a final newline.
const reference = [
  {
    text: 'https://vistep.ai',
    hashes: [
      '6bb5b624386b2830f6375fc26d04f25066ab6f5c2259256029dc5ceefd0985e8',
      '6b46ae6017356d32bb3ef300d3ce674a81bc5417cbd92708f15a17b6d58e8856',
      '61eaf412a7850f9821218818af5ebcd76981dadf66121cad793bf48a64a011b3',
      '02b27a6c0e64bd42ed4c63a96a6626599da4cc326f8556aa550ae89cf020abda',
      '421739738f4625e152dd40358890c2108ba3695425b999d18c334c26f730ee48',
      '7616bbc0b7b2a5512804bdf9706422a54d27c260e615d31e63df345be1c65785',
      '97675f45841eeb5b7510f61c4690b643d03231bc8b22743b340474dbd8138d97',
      'f207d703a5cd9ea2e5ba5646d1999a1d8be646bda7c9f1b99e7af6448a43a5de',
    ],
    scores: [1197, 1097, 1096, 1087, 1158, 1420, 1214, 1107],
    best: 3,
    codewords: [
      65, 22, 135, 71, 71, 7, 51, 162, 242, 247, 102, 151, 55, 70, 87, 2, 230, 22, 144, 210, 185,
      55, 43, 233, 81, 57,
    ],
  },
  {
    text: 'vistep.ai',
    hashes: [
      '0b41607ffdbbacc285ed9836ec03aa9890060165621a7e89ded51f849e3393ac',
      'bfdc5deca0d157eeafff042ea0ccfed00dffcbca745c5eff7803fd73d1b2524a',
      '81eab8cd579d33830047e93d05a0e5fdf12100687ed7d23790cf1a0a0e5c8f56',
      '45af0749ad4299f976ad94dd788895a17bb2369ccf6bfcf1899aead4384007c0',
      'ed4d4ededcfc5964c593ef4580b87282344aa25d0d051bf8b4c0e910ef9a1b8a',
      'c0263d39665745a1b5a1bb7e62216621c27e041983bb9c0fd530df97fdc87f4a',
      '6909bbba9fed7d2ce850ab5c1cd3c79f32404617991b89b06c03ac41ebd2f12b',
      'd66c5e9908944395522ed1af511fb4722174914d86ccb08fef8d61b076ba6306',
    ],
    scores: [1109, 1268, 1037, 1147, 1139, 1081, 1269, 1106],
    best: 2,
    codewords: [
      64, 151, 102, 151, 55, 70, 87, 2, 230, 22, 144, 236, 17, 236, 17, 236, 17, 236, 17, 187, 164,
      234, 114, 155, 63, 65,
    ],
  },
  {
    text: '你好',
    hashes: [
      '86c4e5752e6e5fe616da439ce1086b5df2659746a8a05ff6d9afc12cee6f7036',
      '9f87b529c32e1f845e712ab17a86680ed5a926cee31deac6914b00e557b3c871',
      '6b4ce5519a3434f51aeba652630cd9722e370394eba1ce65f1e0cc7b0fbb14a8',
      'fef035cb99e9cb3387a4d2d847e7ac826aa5483f88b7fcfb3f065a002cfa3f67',
      'ab93c6cee023cc59fdf804090660e04fc92dc8e479a0367d1c5e7018a8a5ba5b',
      '8d6c766d72aa26004ab22b74a2981aaf687885a841ebbe78c95d6fe1f0d66b31',
      '1707aca791f1a1bb860ae177652905e947d4bc645bd0fe168358a562720c4bfd',
      '6d9be6529ccdf6054da9bbcbb5ab1bfd7d1549c3a88d34d759e238ae781576eb',
    ],
    scores: [1170, 1091, 1141, 1114, 1092, 1216, 1184, 1105],
    best: 1,
    codewords: [
      113, 164, 6, 228, 189, 160, 229, 165, 189, 0, 236, 17, 236, 17, 236, 17, 236, 17, 236, 33,
      110, 65, 225, 133, 202, 155,
    ],
  },
  {
    text: '🙂🙂🙂🙂',
    hashes: [
      '62bb57a479c102f1ec76c7b4cf89f42e92dc23dac707dd83836e377649cb8822',
      '896ed5b91993dfe54d25575a051438d652d9371ae410a59815d6cf18cb84d0ef',
      '695f33a7fc342bb7b97602a1693259ef656cc806ae0a39d17f13041e9b2ddf73',
      'a00b1eba6b06d04565bd86b3544d7db5e9f56aee3b0d17dd93b9a7b761fa93c1',
      '2b839bd3fe32301db60d24f455f976f48c676895b41f97652969c62396dccbe2',
      'ed80690d888d0afa4519ba01d4a2d2cc3c64d55c4262c8bd6a098aefb68170fe',
      'b994ed0262f87f67ea8f12118d23cf43ed6fa391600a8475eb08bc21891560ae',
      '907d1bdca237ae37884e3f4847b2b10509a992028f5b76816a814da9772ffccf',
    ],
    scores: [1228, 1028, 1065, 1197, 1125, 1135, 1083, 1135],
    best: 1,
    codewords: [
      113, 164, 16, 240, 159, 153, 130, 240, 159, 153, 130, 240, 159, 153, 130, 240, 159, 153, 130,
      96, 102, 87, 151, 117, 224, 150,
    ],
  },
  {
    text: '12345678901234567',
    hashes: [
      '94108249ee2017f9873264a74622a062f97affbc2a3face8f8fccbcfffc33234',
      '28ab7b0e076ba113d6d8fb1e4a320dd740ef8ae54e43fa9e11c45acb6775515d',
      '983aec0a6aab9ed4e5b7d56659a17f7027c806a75a39587d3e619f7aa6e8f634',
      '96bae4a4ab229e89ada62a13d9b15c92ac47eab81e359b21660394a635ccde5c',
      'f70959d8b9f290d713781a2c3b66ec4bb748e93423694e5f290f6353bd19e9a2',
      '8e8106c12de6482ac125e7d5edd1167b359ffa7fc5ea9a71a1394c1483e15ad1',
      '36374b1f2f29194c8c52c81f8d5f1c380d66e89ce0182948f7c05cbd71a0bc85',
      '54babfab1c36670352658868993a31ff9887d1a19be79139aabf091215d70276',
    ],
    scores: [1142, 1332, 1074, 1041, 1176, 1148, 1187, 1074],
    best: 3,
    codewords: [
      65, 19, 19, 35, 51, 67, 83, 99, 115, 131, 147, 3, 19, 35, 51, 67, 83, 99, 112, 122, 31, 209,
      169, 95, 236, 236,
    ],
  },
];

function polynomialProduct(a: number, b: number) {
  let p = 0;
  for (let bit = 0; bit < 8; bit++) if (b & (1 << bit)) p ^= a << bit;
  for (let bit = 14; bit >= 8; bit--) if (p & (1 << bit)) p ^= 0x11d << (bit - 8);
  return p;
}
const polynomialAt = (coefficients: number[], at: number) =>
  coefficients.reduce((r, v) => qrGf(r, at) ^ v, 0);

describe('Version 1-L UTF-8 QR encoder', () => {
  it('matches independently generated codewords, all fixed-mask matrices, scores and winning masks', async () => {
    for (const r of reference) {
      const q = qrEncode(r.text);
      expect(q.codewords).toEqual(r.codewords);
      expect(q.best).toBe(r.best);
      for (const [mask, candidate] of q.candidates.entries()) {
        const rows = candidate.modules.map((row) => row.join('')).join('\n');
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rows));
        expect(
          [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''),
        ).toBe(r.hashes[mask]);
        expect(candidate.penalty.total).toBe(r.scores[mask]);
        expect(qrEncode(r.text, mask).modules).toEqual(candidate.modules);
      }
    }
  });
  it('uses declared headers, actual byte counts and exact terminator/alignment/EC-11 padding', () => {
    const q = qrEncode('https://vistep.ai');
    expect(q.stream.codewords).toEqual([
      65, 22, 135, 71, 71, 7, 51, 162, 242, 247, 102, 151, 55, 70, 87, 2, 230, 22, 144,
    ]);
    expect(q.stream.fields.slice(0, 2).map((f) => f.bits.join(''))).toEqual(['0100', '00010001']);
    expect(q.stream.fields.find((f) => f.kind === 'terminator')!.bits).toHaveLength(4);
    expect(q.stream.fields.find((f) => f.kind === 'align')!.bits).toHaveLength(0);
    expect(qrEncode('你好').stream.codewords[2]).toBe(6);
    for (let length = 1; length <= 17; length++) {
      const p = qrStream(Array(length).fill(65));
      expect(p.bits).toHaveLength(152);
      expect(p.codewords).toHaveLength(19);
    }
    const short = qrEncode('vistep.ai');
    expect(
      short.stream.fields.filter((f) => f.kind === 'pad').map((f) => parseInt(f.bits.join(''), 2)),
    ).toEqual([236, 17, 236, 17, 236, 17, 236, 17]);
    const full = qrEncode('🙂🙂🙂🙂');
    expect(
      full.stream.fields
        .filter((f) => ['terminator', 'align'].includes(f.kind))
        .flatMap((f) => f.bits),
    ).toHaveLength(0);
    expect(full.stream.fields.filter((f) => f.kind === 'pad')).toHaveLength(0);
  });
  it('matches independent carryless-polynomial arithmetic for all 65,536 byte pairs', () => {
    for (let a = 0; a < 256; a++)
      for (let b = 0; b < 256; b++) expect(qrGf(a, b)).toBe(polynomialProduct(a, b));
    expect(qrGf(128, 2)).toBe(0x1d);
  });
  it('builds the seven-root RS generator and leaves zero syndromes for the completed block', () => {
    expect(qrGenerator()).toEqual([1, 127, 122, 154, 164, 11, 68, 117]);
    for (const r of reference) {
      const q = qrEncode(r.text);
      let root = 1;
      for (let i = 0; i < 7; i++) {
        expect(polynomialAt(q.codewords, root)).toBe(0);
        root = qrGf(root, 2);
      }
      expect(q.rs.steps.at(-1)!.remainder).toEqual(q.rs.parity);
      expect(q.rs.parity).toEqual(r.codewords.slice(19));
      expect(q.rs.steps.map((s) => s.input)).toEqual(q.stream.codewords);
    }
  });
  it('has 233 function cells and a one-to-one 208-bit zigzag avoiding all reservations', () => {
    const { roles, path } = qrFunctionGrid();
    const count = (role: string) => roles.flat().filter((r) => r === role).length;
    expect([
      count('finder'),
      count('separator'),
      count('timing'),
      count('format'),
      count('dark'),
      count('data'),
    ]).toEqual([147, 45, 10, 30, 1, 208]);
    expect(path).toHaveLength(208);
    expect(new Set(path.map((p) => p.join(','))).size).toBe(208);
    expect(path.slice(0, 4)).toEqual([
      [20, 20],
      [19, 20],
      [20, 19],
      [19, 19],
    ]);
    for (const [x, y] of path) expect(roles[y][x]).toBe('data');
  });
  it('writes the correct BCH format twice and keeps timing, separators and finders unmasked', () => {
    const values = [0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976];
    const q = qrEncode('vistep.ai');
    q.candidates.forEach(({ modules, mask }) => {
      const format = qrFormat(mask);
      expect(format.value).toBe(values[mask]);
      for (const copy of [QR_FORMAT_A, QR_FORMAT_B])
        expect(copy.reduce((n, [x, y], i) => n | (modules[y][x] << i), 0)).toBe(format.value);
      expect(modules[13][8]).toBe(1);
      for (let y = 0; y < 21; y++)
        for (let x = 0; x < 21; x++)
          if (!['data', 'format'].includes(q.roles[y][x])) expect(modules[y][x]).toBe(q.base[y][x]);
    });
  });
  it('round-trips every placed bit through each reversible mask and preserves tracked identities', () => {
    const url = qrEncode('https://vistep.ai');
    expect(qrTracked(url, 8, 1)).toMatchObject({
      byteIndex: 8,
      bitIndex: 1,
      index: 77,
      codeword: 9,
      x: 13,
      y: 11,
      raw: 1,
      mask: 1,
      printed: 0,
    });
    expect(url.stream.payloadStart).toBe(12);
    for (let mask = 0; mask < 8; mask++) {
      const q = qrEncode('你好', mask);
      q.path.forEach(([x, y], i) =>
        expect(q.modules[y][x] ^ Number(qrMask(mask, x, y))).toBe(q.codeBits[i]),
      );
      for (let b = 0; b < q.payload.length; b++)
        for (let bit = 0; bit < 8; bit++) {
          const tracked = qrTracked(q, b, bit)!;
          expect(tracked.index).toBe(24 + b * 8 + bit);
          expect(tracked.codeword).toBe(3 + b);
          expect(tracked.raw).toBe(qrBits(q.payload[b])[bit]);
          expect(tracked.printed ^ tracked.mask).toBe(tracked.raw);
        }
    }
  });
  it('adds four clear modules on every side and exports an actual high-contrast SVG', () => {
    const q = qrEncode('vistep.ai'),
      quiet = qrQuietGrid(q.modules);
    expect(quiet).toHaveLength(29);
    for (let y = 0; y < 29; y++)
      for (let x = 0; x < 29; x++)
        expect(quiet[y][x]).toBe(x < 4 || y < 4 || x > 24 || y > 24 ? 0 : q.modules[y - 4][x - 4]);
    expect(qrSvg(q.modules)).toContain('viewBox="0 0 29 29"');
    expect(qrSvg(q.modules)).toContain('fill="#fff"');
    expect(qrSvg(q.modules)).toContain('fill="#111"');
  });
  it('selects the true minimum including all four penalty rules, breaking ties by the lowest mask', () => {
    for (const r of reference) {
      const q = qrEncode(r.text);
      for (const c of q.candidates) {
        const p = qrPenalty(c.modules);
        expect(p.total).toBe(p.runs + p.blocks + p.finders + p.balance);
      }
      const minimum = Math.min(...q.candidates.map((c) => c.penalty.total));
      expect(q.best).toBe(q.candidates.findIndex((c) => c.penalty.total === minimum));
    }
  });
  it('reconstructs every director state on direct, backward and shuffled seeks', () => {
    const frames = Array.from({ length: 801 }, (_, i) =>
      qrShot(Math.min(7, Math.floor(i / 100)), (i % 100) / 99),
    );
    for (let i = 800; i >= 0; i--)
      expect(qrShot(Math.min(7, Math.floor(i / 100)), (i % 100) / 99)).toEqual(frames[i]);
    for (let i = 0; i < 801; i++) {
      const j = (i * 317) % 801;
      expect(qrShot(Math.min(7, Math.floor(j / 100)), (j % 100) / 99)).toEqual(frames[j]);
    }
    expect(qrShot(4, 1).placed).toBe(208);
    expect(qrShot(7, 0.5).clean).toBe(true);
    expect(qrShot(NaN, NaN)).toEqual(qrShot(0, 0));
    expect(qrShot(5, 0.95).maskSettled).toBe(true);
    expect(qrShot(5, 0.85).maskSettled).toBe(false);
    expect(qrShot(7, 0.37).clean).toBe(false);
  });
  it('enforces byte rather than character limits and rejects malformed inputs without truncating', () => {
    expect(QR_MAX_BYTES).toBe(17);
    expect(qrUtf8('🙂🙂🙂🙂')).toHaveLength(16);
    expect(qrUtf8('你好')).toHaveLength(6);
    for (const value of ['', '123456789012345678', '🙂🙂🙂🙂a', '\ud800', '\udc00'])
      expect(() => qrEncode(value)).toThrow(RangeError);
    for (const mask of [-2, 8, NaN, 0.5]) expect(() => qrEncode('a', mask)).toThrow(RangeError);
    for (const n of [-1, 256, NaN, 0.5]) expect(() => qrGf(n, 2)).toThrow(RangeError);
    expect(() => qrRs([1, 2])).toThrow(RangeError);
    expect(() => qrStream([256])).toThrow(RangeError);
    const payload = Object.freeze([1, 2, 3]);
    qrStream(payload);
    expect(payload).toEqual([1, 2, 3]);
  });
});

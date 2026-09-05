import { hashBits, hashHex } from '../../models/hash';
import { t } from '../../i18n';

/** Eight exact words, shown as a compact ledger. Bit strokes encode values;
 * comparison strokes encode XOR, never a simulated particle path. */
export default function HashWords({
  words,
  other,
  labels = 'abcdefgh',
  digest = false,
}: {
  words: readonly number[];
  other?: readonly number[];
  labels?: string;
  digest?: boolean;
}) {
  return (
    <div className="hash-word-ledger" data-comparison={!!other} data-digest={digest}>
      {words.map((word, i) => (
        <div
          className="hash-word"
          key={i}
          role="group"
          aria-label={
            other
              ? t(
                  '字 {0}：{1}，对照 {2}',
                  digest ? `H${i}` : labels[i],
                  hashHex(word),
                  hashHex(other[i]),
                )
              : t('字 {0}：{1}', digest ? `H${i}` : labels[i], hashHex(word))
          }
        >
          <span>{digest ? `H${i}` : labels[i]}</span>
          <code>{hashHex(word)}</code>
          {other && <code className="hash-other-word">{hashHex(other[i])}</code>}
          <svg viewBox="0 0 128 9" aria-hidden="true" preserveAspectRatio="none">
            {hashBits(other ? word ^ other[i] : word).map((bit, j) => (
              <rect
                key={j}
                x={j * 4}
                y={bit ? 1 : 6}
                width="2"
                height={bit ? 7 : 2}
                rx=".7"
                fill={bit ? (other ? '#b68150' : '#5b747c') : '#dce4e5'}
              />
            ))}
          </svg>
        </div>
      ))}
    </div>
  );
}

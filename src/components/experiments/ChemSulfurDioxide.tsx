import { useId, useState } from 'react';
import { browserLocale } from '../../i18n';
import { useShowcase } from '../lab/FilmContext';
import { Range, Segments } from '../lab/Controls';
import {
  sulfurDissolution,
  sulfurDye,
  sulfurPink,
  sulfurDioxideDirector,
  sulfurAcidityProbe,
} from '../../models/chem-sulfur-dioxide';
import '../../styles/chem-sulfur-dioxide.css';
export default function ChemSulfurDioxide() {
  const film = useShowcase(),
    en = browserLocale() === 'en',
    say = (a: string, b: string) => (en ? b : a),
    uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState(film.variant === 'bleach-recovery' ? 'dye' : 'dissolution'),
    [extent, setExtent] = useState(0.7),
    [sealed, setSealed] = useState(false),
    [bleach, setBleach] = useState(1),
    [recovery, setRecovery] = useState(0);
  const d = film.watch
    ? sulfurDioxideDirector(film.chapter, film.chapterProgress)
    : {
        chapter:
          mode === 'dissolution' ? 0 : mode === 'acidity' ? 1 : mode === 'comparison' ? 4 : 2,
        progress: 1,
        mode,
        sealed,
        extent,
        bleaching: bleach,
        recovery,
        heating: recovery > 0,
        added: true,
      };
  const m = sulfurDissolution(d.extent, d.sealed),
    dye = sulfurDye(d.bleaching, d.recovery),
    top = 25,
    bottom = 235,
    water = bottom - (m.rise / m.height) * (bottom - top),
    cold = sulfurDye(1, 0),
    probe = sulfurAcidityProbe(d.progress);
  const tube = (x: number, colour: number, heated: boolean) => (
    <g transform={`translate(${x} 0)`}>
      <path
        d="M-44 263V95H-25M-57 263H-30M-28 92Q-32 104-23 106"
        fill="none"
        stroke="#b0b5a5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M-22 50V207Q-22 231 0 231Q22 231 22 207V50"
        fill="#e5eeed33"
        stroke="#93a5a4"
        strokeWidth="2"
      />
      <path
        d="M-19 136V207Q-19 228 0 228Q19 228 19 207V136Z"
        fill={sulfurPink(colour)}
        opacity=".8"
      />
      <ellipse cx="0" cy="136" rx="19" ry="3.5" fill={sulfurPink(colour)} opacity=".9" />
      <ellipse cx="0" cy="50" rx="22" ry="4" fill="#f4f6f3" stroke="#93a5a4" />
      <path d="M-16 63V195" stroke="white" opacity=".7" strokeWidth="3" />
      {heated && (
        <g>
          <path d="M-15 263Q-13 253 0 252Q13 253 15 263V278H-15Z" fill="#c9b59a" />
          <path d="M0 251Q-10 241 0 232Q9 241 0 251" fill="#c5aa7b" opacity=".75" />
          <path
            d="M-26 104q-6-10 0-20m52 20q6-10 0-20"
            fill="none"
            stroke="#b6a184"
            strokeWidth="1.5"
            opacity=".7"
          />
        </g>
      )}
    </g>
  );
  const title =
    d.mode === 'dissolution'
      ? say('倒置试管 · SO₂', 'Inverted tube · SO₂')
      : d.mode === 'acidity'
        ? say('同一溶液 · 酸性检验', 'Same solution · acidity')
        : d.mode === 'comparison'
          ? say('同样褪色的两份溶液', 'Two equally bleached samples')
          : d.heating
            ? say('加热后 · 颜色恢复', 'After heating · colour returns')
            : say('加入品红 · 观察颜色', 'Fuchsin added · observe colour');
  return (
    <section className="chem-sulfur-dioxide">
      <div className="chem-so2-title">{title}</div>
      <svg className="chem-so2-stage" viewBox="0 0 320 280" role="img" aria-label={title}>
        <defs>
          <clipPath id={`${uid}-tube`}>
            <path d="M129 235V47Q129 25 160 25Q191 25 191 47V235Z" />
          </clipPath>
          <linearGradient id={`${uid}-glass`}>
            <stop stopColor="#d6e4e2" stopOpacity=".3" />
            <stop offset=".45" stopColor="#fff" stopOpacity=".15" />
            <stop offset="1" stopColor="#9eafad" stopOpacity=".25" />
          </linearGradient>
        </defs>
        {d.mode === 'dissolution' ? (
          <>
            <path
              d="M45 190V250Q45 265 60 265H260Q275 265 275 250V190"
              fill={`url(#${uid}-glass)`}
              stroke="#96aaa8"
              strokeWidth="2"
            />
            <path
              d="M49 204H271V248Q271 261 258 261H62Q49 261 49 248Z"
              fill="#c5ddd9"
              opacity=".5"
            />
            <path
              d="M125 235V47Q125 21 160 21Q195 21 195 47V235"
              fill="#ffffff66"
              stroke="#869e9b"
              strokeWidth="2"
            />
            <rect
              x="129"
              y={water}
              width="62"
              height={235 - water}
              fill="#b5d7d2"
              opacity=".7"
              clipPath={`url(#${uid}-tube)`}
            />
            <line x1="130" x2="190" y1={water} y2={water} stroke="#8ab7af" strokeWidth="1.5" />
            <path d="M132 51V183" stroke="#fff" strokeWidth="3" opacity=".8" />
            {Array.from({ length: m.gasUnits }, (_, i) => (
              <circle
                key={`g${i}`}
                cx={138 + (i % 4) * 14}
                cy={38 + (Math.floor(i / 4) * Math.max(0, water - 50)) / 6}
                r="2.7"
                fill="none"
                stroke="#93a392"
                strokeWidth="1.1"
              />
            ))}
            {Array.from({ length: m.aqueousUnits }, (_, i) => (
              <circle
                key={`a${i}`}
                cx={70 + (i % 12) * 16}
                cy={219 + Math.floor(i / 12) * 20}
                r="2.5"
                fill="#9caf92"
                opacity=".6"
              />
            ))}
            {d.sealed ? (
              <path d="M121 231H199L194 246H126Z" fill="#baa58c" stroke="#9d8b75" />
            ) : (
              <path d="M218 221H264L260 233H222Z" fill="#baa58c" stroke="#9d8b75" />
            )}
          </>
        ) : d.mode === 'acidity' ? (
          <>
            {tube(95, 0, false)}
            <path
              d={`M${probe.x} ${probe.y}L${probe.endX} ${probe.endY}`}
              stroke="#a3b4b3"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect x="193" y="135" width="78" height="26" rx="2" fill="#e2d9b0" stroke="#b4ab8c" />
            <rect
              x="220"
              y="136"
              width="20"
              height="24"
              fill={probe.contacted ? '#cba079' : '#e2d9b0'}
            />
            <circle cx={probe.x} cy={probe.y} r={probe.contacted ? 0 : 3} fill="#a4c7c2" />
            <text x="232" y="195" textAnchor="middle" fontSize="23" fill="#8b6e4f">
              {probe.contacted ? 'pH < 7' : say('pH 试纸', 'pH paper')}
            </text>
          </>
        ) : d.mode === 'comparison' ? (
          <>
            {tube(95, cold.coloured, false)}
            {tube(225, sulfurDye(1, 1).coloured, false)}
          </>
        ) : (
          <>
            {tube(160, d.added ? dye.coloured : 0, d.heating)}
            {!d.heating && (
              <g>
                <path d="M191 34L211 46L195 75L185 76L185 66Z" fill="#d2dad3" stroke="#8fa39a" />
                <path d="M194 55L188 69" stroke="#a87284" strokeWidth="3" />
                <circle
                  cx="181"
                  cy={80 + Math.min(1, d.progress / 0.25) * 55}
                  r={d.progress < 0.26 ? 4 : 0}
                  fill="#b95177"
                />
              </g>
            )}
          </>
        )}
      </svg>
      {d.mode === 'comparison' && (
        <div className="chem-so2-comparison">
          <span>{say('未加热', 'Unheated')}</span>
          <span>{say('加热复色', 'Heated, recoloured')}</span>
        </div>
      )}
      {!film.watch && (
        <div className="chem-so2-controls">
          <Segments
            label={say('观察步骤', 'Observation')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'dissolution', label: say('溶解', 'Dissolution') },
              { value: 'acidity', label: say('酸性', 'Acidity') },
              { value: 'dye', label: say('品红', 'Fuchsin') },
              { value: 'comparison', label: say('对照', 'Comparison') },
            ]}
          />
          {mode === 'dissolution' && (
            <>
              <Segments
                label={say('试管口', 'Tube mouth')}
                value={sealed ? 'sealed' : 'open'}
                onChange={(v) => setSealed(v === 'sealed')}
                options={[
                  { value: 'sealed', label: say('塞住', 'Sealed') },
                  { value: 'open', label: say('水下开塞', 'Opened underwater') },
                ]}
              />
              <Range
                label={say('气体转入水中的程度', 'Gas transferred into water')}
                value={extent}
                min={0}
                max={1}
                step={0.01}
                onChange={setExtent}
              />
            </>
          )}
          {mode === 'dye' && (
            <>
              <Range
                label={say('褪色程度', 'Bleaching extent')}
                value={bleach}
                min={0}
                max={1}
                step={0.01}
                onChange={setBleach}
              />
              <Range
                label={say('加热复色程度', 'Colour recovery on heating')}
                value={recovery}
                min={0}
                max={1}
                step={0.01}
                onChange={setRecovery}
              />
            </>
          )}
          <details>
            <summary>{say('模型边界', 'Model limits')}</summary>
            <p>
              {say(
                '动画程度不是实际时间或用量。气体体积由理想气体与水柱压强平衡求出；小点只追踪含硫物质，不表示二氧化硫有颜色。pH试纸只作酸性证据，褪色与复色是教材的定性现象。该画面用于课堂机制说明，不是家庭操作步骤。',
                'Progress is not physical time or dose. Gas volume follows ideal-gas and water-column balances. Dots track sulfur-containing material; SO₂ is colourless. The paper only indicates acidity, while bleaching and recovery are qualitative textbook observations. This is a classroom mechanism model, not home operating instructions.',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

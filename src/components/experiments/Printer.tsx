import { useState } from 'react';
import { Range, Segments } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import PrinterStudio from '../three/PrinterStudio';
import { useShowcase } from '../lab/Showcase';
const stages = ['充电', '曝光', '显影', '转印', '定影', '清洁'];
const stageEnglish = ['CHARGE', 'EXPOSE', 'DEVELOP', 'TRANSFER', 'FUSE', 'CLEAN'];
const headlines = [
  '先准备一层看不见的底色。',
  '光，把电荷图案写在鼓面。',
  '让电荷的差别，变成碳粉的去留。',
  '这个像素，终于来到纸上。',
  '让暂时的吸附，成为牢固的印迹。',
  '擦净，准备下一个故事。',
];
const notes = [
  '充电辊让感光鼓均匀带负电。此时，图案还不存在。你选中的那个位置，和周围一样，等待一束光到来。',
  '激光扫描感光鼓。被照射的位置电位升高，变得没那么负；没被照到的地方保持原状。文字先以电荷差异的形式出现。',
  '显影辊带着细小的碳粉经过鼓面。在电场作用下，带负电的碳粉移向曝光区，电荷潜像第一次变成可见图案。',
  '纸张经过感光鼓下方。转印电场把碳粉从鼓面拉向纸张。此时碳粉只是附着在纸上，还没有真正固定。',
  '纸张穿过加热辊和压力辊之间。热使碳粉中的树脂软化，压力让它与纸纤维黏合。打印完成后，图案才不易擦掉。',
  '清洁刮片移去未转印的残粉，剩余电荷被消除。感光鼓恢复到可重新使用的状态，一圈又一圈地完成成像。',
];
const microNotes = [
  '均匀负电位 · 尚未成像',
  '曝光区电位升高 · 形成潜像',
  '碳粉只在选定区域聚集',
  '转印电场 · 鼓面 → 纸张',
  '加热与压力 · 树脂黏合',
  '残粉被移除 · 鼓面复位',
];
const patterns: Record<string, string[]> = {
  heart: [
    '01100110',
    '11111111',
    '11111111',
    '01111110',
    '00111100',
    '00011000',
    '00000000',
    '00000000',
  ],
  letter: [
    '01111110',
    '00011000',
    '00011000',
    '00011000',
    '00011000',
    '00011000',
    '01111110',
    '00000000',
  ],
  arrow: [
    '00010000',
    '00011000',
    '11111100',
    '11111110',
    '11111100',
    '00011000',
    '00010000',
    '00000000',
  ],
};
function MicroView({ stage }: { stage: number }) {
  return (
    <svg viewBox="0 0 240 80" fill="none" role="img" aria-label={microNotes[stage]}>
      {stage < 3 ? (
        <>
          <rect x="15" y="45" width="210" height="13" rx="1" fill="#adc2a0" />
          <path d="M15 59H225" stroke="#5e8451" />
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              {stage === 2 && i > 3 && i < 8 ? (
                <circle cx={24 + i * 17} cy={40} r="3" fill="#374a2e" />
              ) : (
                <path
                  d={`M${20 + i * 17} 39h7`}
                  stroke={stage > 0 && i > 3 && i < 8 ? '#dc8548' : '#6e8d58'}
                  strokeWidth="1.8"
                />
              )}
            </g>
          ))}
          {stage === 1 && (
            <>
              <path d="m104 8 10 19m22-19-10 19" stroke="#dc8548" strokeWidth="1.5" />
              <circle cx="120" cy="33" r="6" fill="#dc854828" />
            </>
          )}
        </>
      ) : stage === 3 ? (
        <>
          <path d="M18 18Q120 70 222 18" stroke="#779566" strokeWidth="12" />
          <path d="M15 65H225" stroke="#afbb9e" strokeWidth="4" />
          {[80, 100, 120, 140, 160].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy={i % 2 ? 54 : 47} r="3" fill="#425732" />
              <path d={`M${x - 3} 75h6m-3-3v6`} stroke="#839b68" />
            </g>
          ))}
        </>
      ) : stage === 4 ? (
        <>
          <rect x="27" y="9" width="186" height="27" rx="13.5" fill="#bf8550" />
          <rect x="27" y="45" width="186" height="25" rx="12.5" fill="#485c37" />
          <path d="M10 41H230" stroke="#b4c4a5" strokeWidth="4" />
          {[88, 109, 130, 151].map((x) => (
            <path key={x} d={`M${x} 25v11m-3-4 3 4 3-4`} stroke="#f5d6a1" />
          ))}
        </>
      ) : (
        <>
          <rect x="15" y="47" width="210" height="12" fill="#adc2a0" />
          <path d="m123 10-16 35h68" stroke="#506e40" strokeWidth="5" />
          {[155, 171, 188, 200].map((x, i) => (
            <circle key={x} cx={x} cy={37 - i * 3} r="3" fill="#7b9168" />
          ))}
        </>
      )}
    </svg>
  );
}
export default function Printer() {
  const demo = useShowcase();
  const [manualProgress, setProgress] = useState(0),
    [manualPlaying, setPlaying] = useState(false),
    [manualPattern, setPattern] = useState('heart'),
    [manualSelected, setSelected] = useState(11),
    [manualExploded, setExploded] = useState(true),
    [manualView, setView] = useState<'perspective' | 'top'>('perspective'),
    [manualFocus, setFocus] = useState(false);
  const pattern = demo.watch ? 'heart' : manualPattern,
    selected = demo.watch ? 11 : manualSelected;
  const progress = demo.watch ? Math.max(0, Math.min(5.99, (demo.time - 4) / 5)) : manualProgress;
  const playing = demo.watch ? demo.playing : manualPlaying;
  const exploded = demo.watch ? demo.time > 1.8 : manualExploded;
  const view = demo.watch ? (demo.time >= 9 && demo.time < 14 ? 'top' : 'perspective') : manualView;
  const focus = demo.watch ? demo.time >= 9 && demo.time < 19 : manualFocus;
  const host = useSimulation(
    (dt) =>
      setProgress((previous) => {
        if (previous + dt * 0.32 >= 5.99) {
          setPlaying(false);
          return 5.99;
        }
        return previous + dt * 0.32;
      }),
    playing && !demo.watch,
  );
  const stage = Math.min(5, Math.floor(progress)),
    bits = patterns[pattern].join('').split('');
  return (
    <div className="printer-study" ref={host}>
      <div className="printer-object-stage">
        <PrinterStudio
          progress={progress}
          exploded={exploded}
          pattern={patterns[pattern]}
          selected={selected}
          charges={stage < 3}
          view={view}
          focus={focus}
        />
        <div className="printer-stage-top">
          <span>INSIDE A LASER PRINTER</span>
          <div className="printer-view-controls">
            <button
              onClick={() => {
                setFocus(!focus);
                setExploded(true);
              }}
              aria-pressed={focus}
            >
              跟随近看
            </button>
            <button onClick={() => setExploded(!exploded)} aria-pressed={exploded}>
              {exploded ? '内部结构' : '完整外观'}
            </button>
            <button
              onClick={() => setView(view === 'top' ? 'perspective' : 'top')}
              aria-pressed={view === 'top'}
            >
              俯视光路
            </button>
          </div>
        </div>
        <div className="printer-annotation" key={`annotation-${stage}`}>
          <span>
            0{stage + 1} / {stageEnglish[stage]}
          </span>
          <h2>{stages[stage]}</h2>
          <p>{stage === 5 ? '选中的像素，已留在纸上。' : '橙色光点 · 正在追踪的像素'}</p>
        </div>
        <span className="printer-drag-note">拖动旋转 · 方向键同样可用</span>
      </div>
      <div className="printer-transport">
        <button
          className="transport-play"
          onClick={() => {
            if (progress >= 5.99) setProgress(0);
            setExploded(true);
            setPlaying(!playing);
          }}
          aria-label={playing ? '暂停打印' : '开始打印'}
        >
          {playing ? (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3h3v14H5zm7 0h3v14h-3z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="m5 2 13 8-13 8z" />
            </svg>
          )}
        </button>
        <Segments
          className="printer-filmstrip"
          label="打印阶段"
          value={String(stage)}
          options={stages.map((name, i) => ({
            value: String(i),
            label: (
              <>
                <small>0{i + 1}</small>
                <span>{name}</span>
              </>
            ),
          }))}
          onChange={(value) => {
            setProgress(Number(value));
            setPlaying(false);
            setExploded(true);
          }}
        />
        <button
          className="transport-reset"
          aria-label="重置打印"
          onClick={() => {
            setProgress(0);
            setPlaying(false);
          }}
        >
          ↻
        </button>
      </div>
      <div className="printer-explanation">
        <div className="printer-paper">
          <div className="printer-pixels" role="group" aria-label="选择要追踪的像素">
            {bits.map((bit, i) => (
              <button
                key={i}
                disabled={bit === '0'}
                aria-label={`追踪第 ${Math.floor(i / 8) + 1} 行第 ${(i % 8) + 1} 列像素`}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
                style={{
                  background: bit === '0' ? '#fff' : selected === i ? '#d8803f' : '#536744',
                }}
              />
            ))}
          </div>
          <div>
            <label>
              这次，打印什么？
              <select
                value={pattern}
                onChange={(e) => {
                  setPattern(e.target.value);
                  setSelected(patterns[e.target.value].join('').indexOf('1'));
                  setProgress(0);
                  setPlaying(false);
                }}
              >
                <option value="heart">一颗心</option>
                <option value="letter">字母 I</option>
                <option value="arrow">一个箭头</option>
              </select>
            </label>
            <button
              className="pixel-next"
              onClick={() => {
                const filled = bits.flatMap((b, i) => (b === '1' ? [i] : []));
                setSelected(filled[(filled.indexOf(selected) + 1) % filled.length]);
              }}
            >
              换一个像素 ↗
            </button>
          </div>
        </div>
        <div className="printer-stage-story" key={`story-${stage}`}>
          <span className="section-index">STEP 0{stage + 1} / 06</span>
          <h3>{headlines[stage]}</h3>
          <p>{notes[stage]}</p>
        </div>
        <div className="printer-micro" key={`micro-${stage}`}>
          <span className="section-index">SURFACE / 鼓面与纸面</span>
          <MicroView stage={stage} />
          <p>{microNotes[stage]}</p>
        </div>
      </div>
      <div className="printer-scrub">
        <span>慢慢看每一步</span>
        <Range
          label="打印进度"
          value={progress}
          min={0}
          max={5.99}
          step={0.01}
          onChange={(v) => {
            setProgress(v);
            setPlaying(false);
          }}
        />
        <span>
          像素 {Math.floor(selected / 8) + 1}:{(selected % 8) + 1}
        </span>
      </div>
      <p className="lab-caption">
        电子照相式单色激光打印机的教学剖面。结构比例与过程速度经过简化；采用负电荷、曝光区显影模型，实际部件布局与电位因机型而异。
      </p>
    </div>
  );
}

import { useState } from 'react';
import { t } from '../../i18n';
import { adderShot, fullAdder, inputSignal, rippleAdder, type Bit } from '../../models/adder';
import { Range, Segments } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { AdderCircuit, AdderColumns } from '../lab/AdderDrawing';
import '../../styles/adder.css';
export default function BinaryAdder() {
  const demo = useShowcase(),
    [a, setA] = useState(42),
    [b, setB] = useState(19),
    [progress, setProgress] = useState(100),
    [view, setView] = useState<'columns' | 'full'>('columns'),
    [cin, setCin] = useState<Bit>(0);
  const shot = adderShot(demo.chapter, demo.chapterProgress),
    kind = demo.watch ? shot.view : view,
    model = demo.watch ? shot.model : rippleAdder(a, b),
    single = demo.watch ? shot.single : fullAdder((a & 1) as Bit, (b & 1) as Bit, inputSignal(cin));
  const time = demo.watch
    ? shot.time
    : (progress / 100) *
      (kind === 'columns' ? model.settled : Math.max(single.sum.ready, single.cout.ready));
  return (
    <div className="adder-study" data-playing={demo.watch && demo.playing}>
      <div className="adder-topline">
        <span>BIT BY BIT</span>
        <span>{t(kind === 'half' ? '半加器' : kind === 'full' ? '全加器' : '二进制加法')}</span>
      </div>
      {kind === 'columns' ? (
        <AdderColumns
          model={model}
          time={time}
          signed={demo.watch && shot.signed}
          compareSigned={demo.watch && shot.compareSigned}
          truncate={demo.watch && shot.truncate}
        />
      ) : (
        <AdderCircuit key={kind} stage={single} time={time} half={kind === 'half'} />
      )}
      {!demo.watch && (
        <div className="adder-controls">
          <Segments
            label={t('查看计算方式')}
            value={view}
            options={[
              { value: 'columns', label: t('逐位相加') },
              { value: 'full', label: t('一个全加器') },
            ]}
            onChange={(v) => {
              setView(v);
              if (v === 'full') {
                setA(a & 1);
                setB(b & 1);
              }
              setProgress(100);
            }}
          />
          <div className="adder-operands">
            <Range label="A" value={a} min={0} max={view === 'full' ? 1 : 255} onChange={setA} />
            <Range label="B" value={b} min={0} max={view === 'full' ? 1 : 255} onChange={setB} />
          </div>
          {view === 'full' && (
            <Range
              label={t('上一级进位')}
              value={cin}
              min={0}
              max={1}
              onChange={(v) => setCin(v as Bit)}
            />
          )}
          <Range
            label={t('信号就绪进度')}
            value={progress}
            min={0}
            max={100}
            unit="%"
            onChange={setProgress}
          />
          <button
            className="btn"
            onClick={() => {
              setA(42);
              setB(19);
              setCin(0);
              setProgress(100);
              setView('columns');
            }}
          >
            {t('重置加法器')}
          </button>
        </div>
      )}
    </div>
  );
}

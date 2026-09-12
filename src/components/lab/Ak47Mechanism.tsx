import { t } from '../../i18n';
import { AK47_MODEL, type Ak47Sample } from '../../models/ak47';
export function Ak47Energy({ state }: { state: Ak47Sample }) {
  const budget = AK47_MODEL.input;
  const parts = [
    { label: '运动能量', value: state.kinetic, color: '#ac7546' },
    { label: '弹性储能', value: state.elastic, color: '#5f8576' },
    { label: '耗散', value: state.loss, color: '#aeb4a8' },
  ];
  return (
    <div className="ak47-energy">
      <div
        className="ak47-energy-track"
        role="img"
        aria-label={t('输入的能量分配到运动、弹性储存和耗散')}
      >
        {parts.map((p) => (
          <span
            key={p.label}
            style={{ width: `${(100 * p.value) / budget}%`, background: p.color }}
          />
        ))}
      </div>
      <div className="ak47-energy-legend">
        {parts.map((p) => (
          <span key={p.label}>
            <i style={{ background: p.color }} />
            {t(p.label)}
          </span>
        ))}
      </div>
    </div>
  );
}

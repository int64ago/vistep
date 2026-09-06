import { t } from '../../i18n';
import { EXCAVATOR, type Hydraulics, type Valve } from '../../models/excavator';

type Emphasis = 'none' | 'pressure' | 'force' | 'speed' | 'arm' | 'relief';
/**
 * Hydraulic readouts under the stage. One gauge carries the pressure story; the
 * remaining measures are typographic so the machine stays the main image.
 */
export default function ExcavatorInstruments({
  h,
  payload,
  flow,
  valve,
  anchored,
  emphasis,
  watch,
}: {
  h: Hydraulics;
  payload: number;
  flow: number;
  valve: Valve;
  anchored: boolean;
  emphasis: Emphasis;
  watch: boolean;
}) {
  const reliefMPa = EXCAVATOR.relief / 1e6,
    max = 42,
    mpa = h.pressure / 1e6;
  const angle = (v: number) => -120 + (240 * Math.min(max, Math.max(0, v))) / max;
  const arc = (from: number, to: number, r: number) => {
    const a = ((angle(from) - 90) * Math.PI) / 180,
      b = ((angle(to) - 90) * Math.PI) / 180;
    return `M${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}A${r} ${r} 0 ${
      to - from > max / 2 ? 1 : 0
    } 1 ${(60 + r * Math.cos(b)).toFixed(2)} ${(60 + r * Math.sin(b)).toFixed(2)}`;
  };
  const held = valve === 'hold';
  return (
    <div
      className="excavator-readout"
      data-emphasis={emphasis}
      data-relief={h.relief}
      data-watch={watch}
    >
      <div className="excavator-gauge" data-live={emphasis === 'pressure' || emphasis === 'relief'}>
        <svg viewBox="0 0 120 96" aria-hidden="true">
          <path d={arc(0, max, 46)} className="gauge-track" />
          <path d={arc(reliefMPa, max, 46)} className="gauge-relief" />
          <path d={arc(0, Math.min(max, mpa), 46)} className="gauge-fill" />
          <g transform={`rotate(${angle(mpa)} 60 60)`} className="gauge-needle">
            <path d="M60 22L62.4 60L57.6 60Z" />
            <circle cx="60" cy="60" r="4" />
          </g>
        </svg>
        <div className="excavator-gauge-value">
          <strong>
            {mpa.toFixed(1)} <small>MPa</small>
          </strong>
          <span>{t(h.relief ? '到达限压，溢流' : '无杆腔压力')}</span>
        </div>
      </div>
      <dl className="excavator-measures">
        <div data-key="force" data-live={emphasis === 'force' || emphasis === 'pressure'}>
          <dt>{t('每支活塞推力')}</dt>
          <dd>
            <strong>
              {(h.force / 1e3).toFixed(0)} <small>kN</small>
            </strong>
            <span>
              p × A = {mpa.toFixed(1)} MPa × {(h.area * 1e4).toFixed(0)} cm²
            </span>
          </dd>
        </div>
        <div data-key="speed" data-live={emphasis === 'speed'}>
          <dt>{t('供油与活塞速度')}</dt>
          <dd>
            <strong>
              {held || h.stalled ? '0.0' : (h.velocity * 100).toFixed(1)} <small>cm/s</small>
            </strong>
            <span>
              {held
                ? t('阀口关闭 · 油被封住')
                : h.relief
                  ? t('{0} L/min 经溢流回油箱', flow.toFixed(0))
                  : t('{0} L/min 分给两支缸', flow.toFixed(0))}
            </span>
          </dd>
        </div>
        <div data-key="arm" data-live={emphasis === 'arm'}>
          <dt>{t('斗内载荷 · 力臂')}</dt>
          <dd>
            <strong>
              {anchored && valve === 'lift' ? t('卡住') : payload.toFixed(0)}{' '}
              <small>{anchored && valve === 'lift' ? '' : 'kg'}</small>
            </strong>
            <span>
              {t('力臂')} d = {h.arm.toFixed(2)} m
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

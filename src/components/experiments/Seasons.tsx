import { useMemo, useState } from 'react';
import { t } from '../../i18n';
import {
  SEASONS,
  seasonAnnualCurve,
  seasonDailyCurve,
  seasonsShot,
  seasonsState,
  type DayRegime,
  type SeasonsState,
} from '../../models/seasons';
import { Range } from '../lab/Controls';
import { useShowcase } from '../lab/Showcase';
import { useCompact } from '../lab/useCompact';
import SeasonsGlobe from '../lab/SeasonsGlobe';
import { SeasonsBeam, SeasonsField, SeasonsOrbit } from '../lab/SeasonsObservatory';
import '../../styles/seasons.css';

const regimes: Record<DayRegime, string> = {
  ordinary: '白昼',
  'polar-day': '极昼',
  'polar-night': '极夜',
  horizon: '全天在地平线',
};
const formatHour = (hour: number) => {
  const minutes = Math.round(hour * 60) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

function DayRibbon({
  latitude,
  day,
  secondary = false,
}: {
  latitude: number;
  day: SeasonsState['day'];
  secondary?: boolean;
}) {
  return (
    <div className="seasons-day-row" data-secondary={secondary}>
      <span>
        {Math.abs(latitude).toFixed(0)}° {latitude < 0 ? 'S' : 'N'}
      </span>
      <div className="seasons-day-ribbon" aria-hidden="true">
        <i
          style={{
            left: `${50 - (day.daylight / 24) * 50}%`,
            width: `${(day.daylight / 24) * 100}%`,
          }}
        />
      </div>
      <span>
        <b>{day.daylight.toFixed(1)}</b> h <em>{t(regimes[day.regime])}</em>
      </span>
    </div>
  );
}

function EnergyTrace({
  state: s,
  annual,
  compact,
}: {
  state: SeasonsState;
  annual: boolean;
  compact: boolean;
}) {
  const width = compact ? 340 : 760,
    left = compact ? 14 : 24,
    right = width - (compact ? 14 : 24),
    top = 19,
    bottom = 83;
  const curves = useMemo(() => {
    if (annual)
      return {
        a: seasonAnnualCurve(s.latitude, s.tilt).map((v) => [v.longitude / 360, v.equivalentHours]),
        b: seasonAnnualCurve(-s.latitude, s.tilt).map((v) => [
          v.longitude / 360,
          v.equivalentHours,
        ]),
        zero: seasonAnnualCurve(s.latitude, 0).map((v) => [v.longitude / 360, v.equivalentHours]),
      };
    return {
      a: seasonDailyCurve(s.latitude, s.declination).map((v) => [v.hour / 24, v.incident]),
      b: seasonDailyCurve(-s.latitude, s.declination).map((v) => [v.hour / 24, v.incident]),
      zero: [],
    };
  }, [s.latitude, s.declination, s.tilt, annual]);
  const maximum = annual
    ? Math.max(12, ...curves.a.map((p) => p[1]), ...curves.b.map((p) => p[1]))
    : 1;
  const draw = (points: number[][]) =>
    points
      .map(
        ([x, y], i) =>
          `${i ? 'L' : 'M'}${left + x * (right - left)},${bottom - (y / maximum) * (bottom - top)}`,
      )
      .join('');
  const markerX = left + (annual ? s.longitude / 360 : s.hour / 24) * (right - left);
  const markerY =
    bottom - ((annual ? s.day.equivalentHours : s.solar.incident) / maximum) * (bottom - top);
  return (
    <div className="seasons-energy">
      <div className="seasons-energy-heading">
        <span>{t(annual ? '一年的几何日积分' : '一天中的水平面入射比例')}</span>
        <span>{annual ? 'Q / S₀ · h' : 'I / S₀'}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} 113`}
        role="img"
        aria-label={t(
          annual
            ? '南北半球的全年入射量，虚线为零倾角'
            : '南北纬圈的一日入射曲线，竖线是当前太阳时',
        )}
      >
        <path d={`M${left},${bottom}H${right}`} stroke="#91a5a1" strokeOpacity=".35" />
        <path d={draw(curves.b)} stroke="#97c8d4" strokeWidth="2" fill="none" strokeOpacity=".85" />
        <path
          d={`${draw(curves.a)}L${right},${bottom}L${left},${bottom}Z`}
          fill="#eccb88"
          fillOpacity=".07"
        />
        {annual && (
          <path
            d={draw(curves.zero)}
            fill="none"
            stroke="#d9dfd5"
            strokeOpacity=".7"
            strokeDasharray="4 5"
            strokeWidth="1.5"
          />
        )}
        <path d={draw(curves.a)} fill="none" stroke="#efcd8c" strokeWidth="2.5" />
        <path d={`M${markerX},${top}V${bottom}`} stroke="#e7d3a9" strokeOpacity=".4" />
        <circle cx={markerX} cy={markerY} r="4" fill="#ffe1a7" />
        {(annual
          ? [
              ['0°', 0],
              ['180°', 0.5],
              ['360°', 1],
            ]
          : [
              ['00', 0],
              ['12', 0.5],
              ['24', 1],
            ]
        ).map(([label, x]) => (
          <text
            key={label}
            x={left + Number(x) * (right - left)}
            y="108"
            textAnchor={x === 0 ? 'start' : x === 1 ? 'end' : 'middle'}
          >
            {label}
          </text>
        ))}
      </svg>
      <div className="seasons-trace-key">
        <span>
          <i />
          {Math.abs(s.latitude).toFixed(0)}° {s.latitude < 0 ? 'S' : 'N'}
        </span>
        <span>
          <i />
          {Math.abs(s.latitude).toFixed(0)}° {s.latitude > 0 ? 'S' : 'N'}
        </span>
        {annual && (
          <span>
            <i />
            {t('零倾角')}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Seasons() {
  const demo = useShowcase(),
    compact = useCompact();
  const [longitude, setLongitude] = useState(90),
    [latitude, setLatitude] = useState<number>(SEASONS.latitude),
    [tilt, setTilt] = useState<number>(SEASONS.tilt),
    [hour, setHour] = useState(12);
  const [manualView, setManualView] = useState<'field' | 'beam' | 'orbit'>('field');
  const shot = seasonsShot(demo.chapter, demo.chapterProgress);
  const s = demo.watch ? shot.state : seasonsState(longitude, latitude, tilt, hour);
  const view = demo.watch ? shot.view : manualView;
  const shadow = s.solar.shadow;
  return (
    <div
      className="seasons-study"
      data-view={view}
      data-watch={demo.watch}
      data-chapter={demo.chapter}
    >
      <div className="seasons-heading">
        <span>{t('太阳观测台')}</span>
        <span>
          {t('地轴倾角')} <b>{s.tilt.toFixed(2)}°</b>
        </span>
      </div>
      <div className="seasons-observatory">
        <div className="seasons-planet-column">
          <SeasonsGlobe state={s} />
          <div className="seasons-day-pair" aria-label={t('两个纬圈的几何白昼时长')}>
            <DayRibbon latitude={s.latitude} day={s.day} />
            <DayRibbon latitude={-s.latitude} day={s.opposite} secondary />
          </div>
        </div>
        <div className="seasons-field-column">
          <div className="seasons-instrument-title">
            <span>
              {t(
                view === 'orbit'
                  ? '地轴的方向留在空间里'
                  : view === 'beam'
                    ? '同一束光，铺开多大？'
                    : '纬度观测场',
              )}
            </span>
            <b>{view === 'orbit' ? `${s.longitude.toFixed(0)}°` : formatHour(s.hour)}</b>
          </div>
          {view === 'orbit' ? (
            <SeasonsOrbit state={s} compact={compact} />
          ) : view === 'beam' ? (
            <SeasonsBeam state={s} compact={compact} />
          ) : (
            <SeasonsField state={s} compact={compact} />
          )}
          <div className="seasons-reading-line">
            {view === 'orbit' ? (
              <>
                <span>
                  {t('圆轨道半径')} <b>1 AU</b>
                </span>
                <span>{t('固定地轴，不朝着太阳转')}</span>
              </>
            ) : view === 'beam' ? (
              <>
                <span>
                  {t('水平面入射')} <b>{(s.solar.incident * 100).toFixed(1)}%</b>
                </span>
                <span>{t('以垂直光束为 100%')}</span>
              </>
            ) : (
              <>
                <span>
                  {t('太阳高度')} <b>{s.solar.altitude.toFixed(1)}°</b>
                </span>
                <span>
                  {t('影长')}{' '}
                  <b>
                    {shadow
                      ? `${shadow.length > 10000 ? shadow.length.toExponential(1) : shadow.length.toFixed(2)} m`
                      : '—'}
                  </b>
                </span>
              </>
            )}
          </div>
          {view === 'orbit' ? (
            <div className="seasons-orbit-key">
              {['三月分点', '六月至点', '九月分点', '十二月至点'].map((label, i) => (
                <span key={label}>
                  {i * 90}° · {t(label)}
                </span>
              ))}
            </div>
          ) : (
            <p className="seasons-instrument-note">
              {t(
                view === 'beam'
                  ? '金线间的垂直宽度相同；地面接收面积随角度改变。'
                  : shadow && shadow.length > 3.1
                    ? '影子超出刻度盘；读数保留完整长度。'
                    : '太阳时 12:00 为当地正午。',
              )}
            </p>
          )}
        </div>
      </div>
      <EnergyTrace state={s} annual={view === 'year' || !demo.watch} compact={compact} />
      <div className="seasons-ledger">
        <span>
          {t('日积分 / S₀')} <b>{s.day.equivalentHours.toFixed(2)} h</b>
        </span>
        <span>{t('几何入射量，不代表气温或天气。')}</span>
      </div>
      {!demo.watch && (
        <div className="seasons-explore">
          <div className="seasons-view-switch" role="group" aria-label={t('选择观测仪器')}>
            {(['field', 'beam', 'orbit'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={manualView === v}
                onClick={() => setManualView(v)}
              >
                {t(v === 'field' ? '观测场' : v === 'beam' ? '等宽光束' : '公转轨道')}
              </button>
            ))}
          </div>
          <div className="seasons-controls">
            <Range
              label={t('太阳黄经（从三月分点起）')}
              value={longitude}
              min={0}
              max={360}
              unit="°"
              onChange={setLongitude}
            />
            <Range
              label={t('观测纬度（北正南负）')}
              value={latitude}
              min={-90}
              max={90}
              unit="°"
              onChange={setLatitude}
            />
            <Range
              label={t('地轴倾角')}
              value={tilt}
              min={0}
              max={45}
              step={0.01}
              unit="°"
              onChange={setTilt}
            />
            <Range
              label={t('当地太阳时')}
              value={hour}
              min={0}
              max={24}
              step={0.1}
              unit="h"
              onChange={setHour}
            />
          </div>
          <div className="seasons-presets">
            <button
              type="button"
              onClick={() => {
                setLongitude(90);
                setLatitude(SEASONS.latitude);
                setTilt(SEASONS.tilt);
                setHour(12);
                setManualView('field');
              }}
            >
              {t('重置四季实验')}
            </button>
            <button type="button" onClick={() => setTilt(tilt < 0.01 ? SEASONS.tilt : 0)}>
              {t(tilt < 0.01 ? '恢复地球倾角' : '把地轴扶正')}
            </button>
            <button
              type="button"
              onClick={() => {
                setLongitude((longitude + 180) % 360);
              }}
            >
              {t('前进半年')}
            </button>
            <button
              type="button"
              onClick={() => {
                setLatitude(75);
                setLongitude(90);
                setTilt(SEASONS.tilt);
                setHour(0);
              }}
            >
              {t('北纬 75° 的午夜')}
            </button>
          </div>
        </div>
      )}
      <details className="seasons-method">
        <summary>{t('模型约定与读图方法')}</summary>
        <p>
          {t(
            '圆轨道、平行阳光、几何地平线；忽略大气折射与太阳圆面大小。分点的极点另作地平线边界处理。',
          )}
        </p>
        <p>
          {t(
            '球面金色点与立杆是同一观测位置。虚线表示球体背面的纬圈；近景相机跟随日照方向，轨道图保持空间方向固定。',
          )}
        </p>
        <p>
          {t(
            '日积分 / S₀ 表示把入射比例累加一天，单位是等效正入射小时。这里没有大气、地表吸收、蓄热或气象计算。',
          )}
        </p>
        <p>{t('光束截面图在很低的太阳高度截断超出画幅的光斑；精确入射比例仍来自模型。')}</p>
        <a href="https://spaceplace.nasa.gov/seasons/en/" target="_blank" rel="noreferrer">
          NASA · {t('季节与地轴')}
        </a>
        <a href="https://gml.noaa.gov/grad/solcalc/solareqns.PDF" target="_blank" rel="noreferrer">
          NOAA · {t('太阳位置方程')}
        </a>
      </details>
    </div>
  );
}

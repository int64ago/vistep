import { t } from '../../i18n';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Metric, Range } from '../lab/Controls';
import { useSimulation } from '../lab/useSimulation';
import { useShowcase } from '../lab/Showcase';
import { fixedReplay } from '../../models/replay';
import { newTraffic, stepTraffic, defaultTraffic, type Vehicle } from '../../models/traffic';
export default function Traffic() {
  const demo = useShowcase(),
    braked = useRef(false),
    fixed = useRef(0);
  const [manualCount, setCount] = useState(36),
    [manualHeadway, setHeadway] = useState(1.2),
    [manualDesired, setDesired] = useState(22),
    [manualPlaying, setPlaying] = useState(false),
    [selected, setSelected] = useState(0),
    [stats, setStats] = useState({ average: 0, slow: 0, time: 0 });
  const episode = demo.chapter < 8 ? 0 : demo.chapter === 8 ? 8 : demo.chapter < 11 ? 9 : 11;
  const count = demo.watch ? (episode === 8 ? 24 : 36) : manualCount,
    headway = demo.watch ? (episode === 9 ? 1.8 : 1.2) : manualHeadway,
    desired = demo.watch ? 22 : manualDesired;
  const playing = demo.watch ? demo.playing : manualPlaying;
  const params = { ...defaultTraffic, headway, desiredSpeed: desired },
    cars = useRef<Vehicle[]>(newTraffic(count, params)),
    canvas = useRef<HTMLCanvasElement>(null),
    chart = useRef<HTMLCanvasElement>(null),
    history = useRef<
      {
        position: number;
        speed: number;
      }[][]
    >([]),
    clock = useRef(0),
    refresh = useRef(0);
  const color = (speed: number) => (speed < 2 ? '#e17e66' : speed < 7 ? '#eab474' : '#83b7c9');
  const draw = () => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const w = el.clientWidth,
      h = el.clientHeight,
      dpr = Math.min(devicePixelRatio, 2);
    if (el.width !== w * dpr || el.height !== h * dpr) {
      el.width = w * dpr;
      el.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const rx = w * 0.4,
      ry = h * 0.36,
      cx = w * 0.5,
      cy = h * 0.53;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#33465d';
    ctx.lineWidth = w < 500 ? 15 : 25;
    ctx.stroke();
    ctx.setLineDash([7, 10]);
    ctx.strokeStyle = '#63738a';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    cars.current.forEach((c, i) => {
      const a = (c.position / params.length) * Math.PI * 2,
        x = cx + rx * Math.cos(a),
        y = cy + ry * Math.sin(a);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)));
      const pixelsPerMetre =
        (Math.hypot(rx * Math.sin(a), ry * Math.cos(a)) * Math.PI * 2) / params.length;
      const length = 4.5 * pixelsPerMetre,
        width = Math.max(2.8, length * 0.48);
      ctx.fillStyle = i === selected ? '#e8bd78' : color(c.speed);
      ctx.beginPath();
      ctx.roundRect(-length / 2, -width / 2, length, width, Math.min(2, width * 0.3));
      ctx.fill();
      if (i === selected) {
        ctx.strokeStyle = '#f7e8bf';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = '#12203380';
      ctx.fillRect(length * 0.1, -width * 0.32, length * 0.22, width * 0.64);
      ctx.restore();
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8e4f4';
    ctx.font = '500 24px sans-serif';
    ctx.fillText(
      demo.watch
        ? demo.chapter < 2
          ? t('匀速前进')
          : demo.chapter === 2
            ? t('一次轻刹')
            : demo.chapter >= 8
              ? t('观察速度变化')
              : t('减速波向后')
        : t('一个小扰动'),
      cx,
      cy - 5,
    );
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#8098b8';
    ctx.fillText(
      demo.watch
        ? `${count} · ${headway.toFixed(1)} s · ${t('车辆向前 →')}`
        : t('会在哪里停下来？'),
      cx,
      cy + 20,
    );
    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    ctx.fillText('RING ROAD / 500 m', 20, 29);
    const c = chart.current,
      cc = c?.getContext('2d');
    if (c && cc) {
      const cw = c.clientWidth,
        ch = c.clientHeight;
      if (c.width !== cw * dpr || c.height !== ch * dpr) {
        c.width = cw * dpr;
        c.height = ch * dpr;
      }
      cc.setTransform(dpr, 0, 0, dpr, 0, 0);
      cc.clearRect(0, 0, cw, ch);
      history.current.forEach((snapshot, j) =>
        snapshot.forEach((v) => {
          cc.fillStyle = color(v.speed);
          cc.fillRect((v.position / 500) * cw, (j / 140) * ch, 3, ch / 140 + 1);
        }),
      );
    }
  };
  const host = useSimulation((dt) => {
    if (playing && !demo.watch) {
      fixed.current += dt * 4;
      while (fixed.current >= 1 / 60) {
        stepTraffic(cars.current, 1 / 60, params);
        clock.current += 1 / 60;
        fixed.current -= 1 / 60;
      }
      refresh.current += dt;
      if (refresh.current > 0.075) {
        refresh.current = 0;
        history.current.push(cars.current.map((c) => ({ ...c })));
        if (history.current.length > 140) history.current.shift();
        setStats({
          average: cars.current.reduce((s, c) => s + c.speed, 0) / count,
          slow: cars.current.filter((c) => c.speed < 2).length,
          time: clock.current,
        });
      }
    }
    draw();
  });
  const reset = (n = count, h = headway, v = desired) => {
    cars.current = newTraffic(n, { ...defaultTraffic, headway: h, desiredSpeed: v });
    clock.current = 0;
    fixed.current = 0;
    braked.current = false;
    history.current = [];
    setSelected(0);
    setStats({ average: cars.current[0].speed, slow: 0, time: 0 });
    setPlaying(false);
  };
  const brakeAt = demo.watch
    ? episode === 0
      ? (demo.chapters[2].at - demo.chapters[0].at) * 2
      : 6
    : 0;
  const replay = useMemo(
    () =>
      fixedReplay(
        () => ({
          cars: newTraffic(count, { ...defaultTraffic, headway, desiredSpeed: desired }),
          history: [] as Vehicle[][],
          time: 0,
        }),
        (s, dt, tick) => {
          if (tick === Math.round(brakeAt * 60)) s.cars[0].brake = 1.5;
          stepTraffic(s.cars, dt, { ...defaultTraffic, headway, desiredSpeed: desired });
          s.time += dt;
          if (tick % 18 === 0) {
            s.history.push(s.cars.map((c) => ({ ...c })));
            if (s.history.length > 140) s.history.shift();
          }
        },
      ),
    [count, headway, desired, episode, demo.run, brakeAt],
  );
  useEffect(() => {
    if (!demo.watch) {
      reset();
      return;
    }
  }, [demo.watch, demo.run]);
  useEffect(() => {
    if (!demo.watch) return;
    const state = replay((demo.time - demo.chapters[episode].at) * 2);
    cars.current = state.cars;
    history.current = state.history;
    clock.current = state.time;
    setStats({
      average: state.cars.reduce((s, c) => s + c.speed, 0) / count,
      slow: state.cars.filter((c) => c.speed < 2).length,
      time: state.time,
    });
    draw();
  }, [demo.watch, demo.time, demo.run, replay]);
  const brake = () => {
    cars.current[selected].brake = 1.5;
    setPlaying(true);
  };
  const pick = (e: PointerEvent<HTMLCanvasElement>) => {
    if (demo.watch) return;
    const rect = e.currentTarget.getBoundingClientRect(),
      x =
        (e.clientX - rect.left - e.currentTarget.clientWidth * 0.5) /
        (e.currentTarget.clientWidth * 0.4),
      y =
        (e.clientY - rect.top - e.currentTarget.clientHeight * 0.53) /
        (e.currentTarget.clientHeight * 0.36);
    let a = Math.atan2(y, x);
    if (a < 0) a += Math.PI * 2;
    const pos = (a / (Math.PI * 2)) * 500;
    const dist = (v: number) => Math.min(Math.abs(v - pos), 500 - Math.abs(v - pos));
    setSelected(
      cars.current.reduce(
        (best, c, i) => (dist(c.position) < dist(cars.current[best].position) ? i : best),
        0,
      ),
    );
  };
  return (
    <div ref={host}>
      <div className="lab-toolbar">
        <h2>{t('没有路口，也没有事故。')}</h2>
        <div className="lab-actions">
          <button className="btn primary" onClick={brake}>
            {t('让')}
            {selected + 1}
            {t('号车轻踩刹车')}
          </button>
          <button className="btn" onClick={() => setPlaying(!playing)}>
            {playing ? t('Ⅱ 暂停') : t('▷ 运行')}
          </button>
          <button className="btn" onClick={() => reset()}>
            {t('↻ 重置')}
          </button>
        </div>
      </div>
      <div className="lab-grid">
        <div className="traffic-scene">
          <canvas
            ref={canvas}
            className="traffic-canvas"
            role="img"
            aria-label={t(
              '环形道路上的车辆，蓝色较快，橙色较慢，红色接近停止；可用选择车辆滑块代替点击',
            )}
            onPointerDown={pick}
          />
          <div className="traffic-chart">
            {t('时空图：横轴是道路位置，纵轴是时间 ↓')}
            <canvas ref={chart} role="img" aria-label={t('车辆位置随时间变化，速度由颜色表示')} />
          </div>
        </div>
        <div className="lab-controls">
          <Range
            label={t('道路上的车辆')}
            value={count}
            min={12}
            max={45}
            unit={t('辆')}
            onChange={(v) => {
              setCount(v);
              reset(v);
            }}
          />
          <Range
            label={t('期望跟车时距')}
            value={headway}
            min={0.6}
            max={2.4}
            step={0.1}
            unit="s"
            onChange={(v) => {
              setHeadway(v);
              reset(count, v);
            }}
          />
          <Range
            label={t('自由行驶期望速度')}
            value={desired}
            min={10}
            max={30}
            unit="m/s"
            onChange={(v) => {
              setDesired(v);
              reset(count, headway, v);
            }}
          />
          <Range
            label={t('选择车辆')}
            value={selected + 1}
            min={1}
            max={count}
            unit={t('号')}
            onChange={(v) => setSelected(v - 1)}
          />
          <div className="lab-callout">
            {t(
              '先让车流平稳运行，再轻踩刹车。观察：车向前开，低速区域却可能向后移动。增加车流密度，再试一次。',
            )}
          </div>
        </div>
      </div>
      <div className="metrics">
        <Metric label={t('车流平均速度')} value={(stats.average * 3.6).toFixed(1)} unit="km/h" />
        <Metric label={t('速度低于 2 m/s')} value={stats.slow} unit={t('辆')} />
        <Metric label={t('模拟时间')} value={stats.time.toFixed(1)} unit="s" />
      </div>
      <p className="lab-caption">
        {t('使用')}
        <strong>{t('IDM 智能驾驶员模型')}</strong>
        {t(
          '，同参数下从相同的均匀稳态起步。车辆长度 4.5 m，禁止超车；刹车扰动持续 1.5 秒。跟车时距是期望间隔，并不等同于显式反应延迟。',
        )}
      </p>
    </div>
  );
}

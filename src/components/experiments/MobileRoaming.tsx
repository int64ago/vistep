import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { browserLocale, t } from '../../i18n';
import { useShowcase } from '../lab/Showcase';
import { Range, Segments } from '../lab/Controls';
import MobileRoamingMap, { MR_COLORS as C, mrLayout } from '../lab/MobileRoamingMap';
import {
  Ladder,
  MrDataPanel,
  MrIdentityPanel,
  MrLaneHeads,
  MrProvePanel,
  MrRecordCard,
  MrSelectPanel,
  mrCallLabels,
  type LadderRow,
} from '../lab/MobileRoamingPanels';
import {
  MR_HOME,
  MR_MSIN,
  MR_PATH,
  MR_RECORD_BEFORE,
  MR_VISITED,
  mrCallRoute,
  mrDataRoute,
  mrRunAka,
  mrSelectNetwork,
  mrUpdateLocation,
  type Breakout,
  type Caller,
  type Destination,
  type Tamper,
  type VisitedOperator,
} from '../../models/mobile-roaming';
import { mrSettled, mrShot, type MrView } from '../../models/mobile-roaming-film';
import '../../styles/mobile-roaming.css';

type ExploreView = 'select' | 'prove' | 'data' | 'call';
type Manual = 'auto' | VisitedOperator['id'];
/** The film's "one wrong bit" example: a single flip of K bit 42 (byte 5). */
const FILM_KEY_BIT = 42;

const NOTES: Record<MrView, string> = {
  select: '信号数值为示意；真实选网还要看接入技术和手机设置。',
  identity: '编号为测试或虚构值。5G 手机会先把 IMSI 加密成 SUCI 再发送。',
  ask: '以 4G 的 Diameter S6a 为例；5G 由 AUSF 和 UDM 完成同一件事。',
  prove: '真实 MILENAGE 计算；K、RAND 等取自 3GPP 公开测试数据。',
  record: '以 4G 的 HSS 为例；5G 中对应的是 UDM。',
  data: '往返时间为模型估算：光纤每毫秒约 204 km，线路绕行 1.4 倍，无线段 25 ms。',
  call: '以电路交换来电为例（需 2G/3G 或 CSFB）；VoLTE 同样先经过归属网络。',
};

export default function MobileRoaming() {
  const film = useShowcase(),
    host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(880);
  const [mode, setMode] = useState<ExploreView>('select'),
    [manual, setManual] = useState<Manual>('auto'),
    [roaming, setRoaming] = useState(true),
    [aHere, setAHere] = useState(true),
    [tamper, setTamper] = useState<Tamper>('none'),
    [keyBit, setKeyBit] = useState(FILM_KEY_BIT),
    [destination, setDestination] = useState<Destination>('local'),
    [distance, setDistance] = useState(MR_PATH.defaultDistanceKm),
    [route, setRoute] = useState<Breakout>('home-routed'),
    [caller, setCaller] = useState<Caller>('home');
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([e]) =>
      setWidth(Math.max(240, Math.floor(e.contentRect.width))),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  const watch = film.watch;
  // Beat windows follow the recorded speech of the page language.
  const shot = mrShot(film.chapter, film.chapterProgress, browserLocale());
  const view: MrView = watch ? shot.view : mode;
  const b = watch ? shot.beats : mrSettled(view);
  const layout = mrLayout(width);
  const narrow = layout.narrow;

  const selection = useMemo(
    () =>
      watch
        ? mrSelectNetwork({})
        : mrSelectNetwork({
            found: aHere ? MR_VISITED : MR_VISITED.filter((o) => o.id !== 'A'),
            manual: manual === 'auto' ? null : manual,
            roamingEnabled: roaming,
          }),
    [watch, aHere, manual, roaming],
  );
  const serving = selection.registered;
  const servingPlmn = (serving ?? MR_VISITED[0]).plmn;
  const run = useMemo(
    () =>
      watch
        ? mrRunAka({ serving: servingPlmn })
        : mrRunAka({ tamper, keyBit, serving: servingPlmn }),
    [watch, tamper, keyBit, servingPlmn],
  );
  const flipped = useMemo(
    () => mrRunAka({ tamper: 'key', keyBit: FILM_KEY_BIT, serving: servingPlmn }),
    [servingPlmn],
  );
  const dest = watch ? 'local' : destination;
  const dist = watch ? MR_PATH.defaultDistanceKm : distance;
  const routes = useMemo(
    () => [mrDataRoute('home-routed', dest, dist), mrDataRoute('local-breakout', dest, dist)],
    [dest, dist],
  );
  // In the film the local friend's call takes over the ladder once that sentence starts.
  const who: Caller = watch ? (view === 'call' && b.local > 0 ? 'visited' : 'home') : caller;
  const call = mrCallRoute(who);
  const location = mrUpdateLocation(MR_RECORD_BEFORE, servingPlmn, watch ? true : roaming);

  // One stable panel height per breakpoint during the film, so the transport never moves.
  // Exploration of the phone "verify" step lists every row and may grow.
  const panelH = !narrow
    ? 280
    : !watch && view === 'prove'
      ? tamper === 'replay'
        ? 526
        : 392
      : 386;
  const chosenForMap =
    view === 'select' && watch ? (b.choose > 0 ? selection.registered : null) : serving;
  const keyGlowSim =
    view === 'prove'
      ? Math.max(0, 1 - Math.abs(b.mac + b.res - 1)) * (b.mac > 0 ? 1 : 0)
      : view === 'identity' && watch
        ? Math.sin(Math.PI * Math.min(1, b.key * 1.4)) * 0.6 + (b.key > 0 ? 0.4 : 0)
        : 0;
  const keyGlowHome = view === 'ask' ? Math.sin(Math.PI * b.gen) : 0;

  const status = (() => {
    if (!watch) {
      if (view === 'prove')
        return run.outcome === 'success'
          ? ['ok', '认证通过']
          : run.outcome === 'sync-failure'
            ? ['warn', '序号过旧']
            : ['bad', '认证失败'];
      return serving ? ['ok', t('已注册 · 当地 {0}', serving.id)] : ['bad', '仅限紧急呼叫'];
    }
    if (view === 'select')
      return b.choose > 0.5 ? ['ok', t('选定 当地 {0}', 'A')] : ['wait', '正在搜索网络'];
    if (view === 'identity' || view === 'ask') return ['wait', '正在注册'];
    if (view === 'prove') return b.compare >= 1 ? ['ok', '认证通过'] : ['wait', '正在认证'];
    if (view === 'record')
      return b.accept >= 1 ? ['ok', t('已注册 · 当地 {0}', 'A')] : ['wait', '正在登记位置'];
    return ['ok', t('已注册 · 当地 {0}', 'A')];
  })();

  let panel: ReactNode = null;
  if (view === 'select')
    panel = (
      <MrSelectPanel layout={layout} b={b} selection={selection} watch={watch} height={panelH} />
    );
  else if (view === 'identity') panel = <MrIdentityPanel layout={layout} b={b} height={panelH} />;
  else if (view === 'prove')
    panel = (
      <MrProvePanel
        layout={layout}
        b={b}
        run={run}
        flipped={flipped}
        watch={watch}
        height={panelH}
      />
    );
  else if (view === 'ask') {
    const rows: LadderRow[] = [
      {
        key: 'attach',
        from: 0,
        to: 1,
        label: t(narrow ? '附着请求' : '附着请求：我是这个 IMSI'),
        sub: narrow ? 'IMSI' : undefined,
        p: b.attach,
        color: C.mcc,
      },
      {
        key: 'air',
        from: 1,
        to: 3,
        label: t(narrow ? '请求认证数据' : '认证信息请求 AIR：IMSI + 002-01'),
        sub: narrow ? t('经 IPX 转发') : undefined,
        p: b.air,
        color: C.ipx,
        tag: narrow ? undefined : { text: t('漫游伙伴 ✓'), p: b.agree, color: C.ipx },
      },
      {
        key: 'gen',
        from: 3,
        to: 3,
        label: t(narrow ? '用 K 生成向量' : '用 K 生成一组认证向量'),
        p: b.gen,
        color: C.key,
      },
      {
        key: 'aia',
        from: 3,
        to: 1,
        label: t(narrow ? '认证向量' : '认证向量 AIA'),
        sub: narrow ? 'RAND AUTN XRES' : 'RAND · AUTN · XRES · K_ASME',
        p: b.aia,
        color: C.key,
      },
    ];
    panel = (
      <svg
        className="mr-panel"
        viewBox={`0 0 ${width} ${panelH}`}
        role="img"
        aria-label={t('当地网络经 IPX 向归属网络请求认证向量')}
      >
        <Ladder
          layout={layout}
          rows={rows}
          rowH={narrow ? 78 : 66}
          top={narrow ? 14 : 12}
          height={panelH}
        />
        {!narrow && (
          <text
            x={layout.lanes[3] + 16}
            y={12 + 3 * 66 + 66 * 0.56 + 5}
            className="mr-sub"
            opacity={b.aia >= 1 ? 1 : 0}
          >
            {t('K 从未离开归属网络')}
          </text>
        )}
      </svg>
    );
  } else if (view === 'record') {
    const rows: LadderRow[] = [
      {
        key: 'ulr',
        from: 1,
        to: 3,
        label: t(narrow ? '位置更新' : '位置更新 ULR：我在 002-01'),
        p: b.ulr,
        color: C.ipx,
      },
      {
        key: 'cancel',
        from: 3,
        to: 3,
        label: t(narrow ? '注销旧位置' : '通知家乡旧 MME：注销'),
        p: b.cancel,
        color: C.bad,
      },
      {
        key: 'ula',
        from: 3,
        to: 1,
        label: t(narrow ? '签约数据' : '签约数据：允许哪些业务'),
        p: b.ula,
        color: C.key,
      },
      {
        key: 'accept',
        from: 1,
        to: 0,
        label: t(narrow ? '注册成功' : '附着接受'),
        p: b.accept,
        color: C.ok,
      },
    ];
    const rowH = narrow ? 58 : 38;
    panel = (
      <svg
        className="mr-panel"
        viewBox={`0 0 ${width} ${panelH}`}
        role="img"
        aria-label={t('归属网络登记你所在的网络并下发签约数据')}
      >
        <Ladder
          layout={layout}
          rows={watch || location.accepted ? rows : rows.slice(0, 1)}
          rowH={rowH}
          top={4}
          height={rowH * 4 + 8}
          pillH={narrow ? 34 : 26}
        />
        <MrRecordCard
          layout={layout}
          b={b}
          y={rowH * 4 + (narrow ? 22 : 14)}
          accepted={location.accepted}
          serving={serving}
        />
      </svg>
    );
  } else if (view === 'data') {
    const scaleMs = watch
      ? 300
      : Math.max(
          300,
          Math.ceil(routes[0].rttMs / 100) * 100,
          Math.ceil(routes[1].rttMs / 100) * 100,
        );
    panel = (
      <MrDataPanel
        layout={layout}
        routes={routes}
        reveal={watch ? [b.hrRtt, b.lboRtt] : [1, 1]}
        destination={dest}
        height={panelH}
        scaleMs={scaleMs}
      />
    );
  } else {
    const labels = mrCallLabels(who, narrow);
    const rows: LadderRow[] = call.steps.map((s) => ({
      key: s.id,
      from: s.id === 'dial' && who === 'home' ? 'right' : s.from,
      to: s.to,
      label: t(labels[s.id]),
      p: b[s.id],
      color: s.id === 'msrn' ? C.key : s.id === 'prn' ? C.mnc : s.id === 'page' ? C.ok : C.mcc,
    }));
    const rowH = narrow ? 52 : 40;
    const legs = watch ? (b.local > 0 ? 2 : 1) : call.internationalVoiceLegs;
    panel = (
      <svg
        className="mr-panel"
        viewBox={`0 0 ${width} ${panelH}`}
        role="img"
        aria-label={t('来电先到归属网络，再转到你所在的网络')}
      >
        <Ladder layout={layout} rows={rows} rowH={rowH} top={2} height={rowH * 6 + 6} />
        <g opacity={watch ? Math.max(b.page, b.local) : 1}>
          <text
            x={width / 2}
            y={rowH * 6 + (narrow ? 38 : 30)}
            textAnchor="middle"
            fill={legs === 2 ? C.bad : C.ink}
          >
            {t(
              legs === 2
                ? narrow
                  ? '身边朋友来电：跨国两次'
                  : '身边的当地朋友来电：语音也要先回家，跨国两次'
                : narrow
                  ? '家人来电：跨国一次'
                  : '家人来电：语音跨国一次',
            )}
          </text>
        </g>
      </svg>
    );
  }

  return (
    <section className="mr-study" data-view={view} data-watch={watch}>
      <header className="mr-heading">
        <span className="mr-identity" aria-label={t('跟踪的身份：IMSI')}>
          <small>IMSI</small>
          <b>
            <span style={{ color: C.mcc }}>{MR_HOME.mcc}</span>
            <span style={{ color: C.mnc }}>{MR_HOME.mnc}</span>
            <span>{MR_MSIN}</span>
          </b>
        </span>
        <span className="mr-status" data-state={status[0]}>
          <i />
          {t(status[1])}
        </span>
      </header>
      <div ref={host} className="mr-main">
        <MobileRoamingMap
          layout={layout}
          state={{
            view,
            b,
            time: film.time,
            chosen: chosenForMap,
            scanReveal: watch
              ? view === 'select'
                ? Math.max(b.scan, 0) * (1 - b.choose * 0.8)
                : 0
              : 0,
            keyGlowSim,
            keyGlowHome,
            caller: watch ? undefined : caller,
            dataRoutes: watch ? undefined : [route],
          }}
        />
        <MrLaneHeads layout={layout} />
        <div className="mr-panel-box" style={{ height: panelH }}>
          {panel}
        </div>
      </div>
      <p className="mr-note">{t(NOTES[view]).replace(/(\d) (km|ms)/g, '$1\u00a0$2')}</p>
      {!watch && (
        <div className="mr-controls">
          <Segments
            label={t('漫游观察步骤')}
            value={mode}
            onChange={setMode}
            className="mr-steps"
            options={[
              { value: 'select', label: t('选网') },
              { value: 'prove', label: t('认证') },
              { value: 'data', label: t('上网') },
              { value: 'call', label: t('来电') },
            ]}
          />
          {mode === 'select' && (
            <>
              <Segments
                label={t('选网方式')}
                value={manual}
                onChange={setManual}
                options={[
                  { value: 'auto', label: t('自动') },
                  { value: 'A', label: t('手动 A') },
                  { value: 'B', label: t('手动 B') },
                  { value: 'C', label: t('手动 C') },
                ]}
              />
              <button
                className="mr-toggle"
                aria-pressed={roaming}
                onClick={() => setRoaming((v) => !v)}
              >
                {t(roaming ? '套餐已开通国际漫游' : '套餐未开通国际漫游')}
              </button>
              <button
                className="mr-toggle"
                aria-pressed={aHere}
                onClick={() => setAHere((v) => !v)}
              >
                {t(aHere ? '机场里能收到 A' : '机场里收不到 A')}
              </button>
            </>
          )}
          {mode === 'prove' && (
            <>
              <Segments
                label={t('认证情形')}
                value={tamper}
                onChange={setTamper}
                options={[
                  { value: 'none', label: t('正常') },
                  { value: 'key', label: t('K 错一位') },
                  { value: 'rand', label: t('途中改 RAND') },
                  { value: 'replay', label: t('重放旧向量') },
                ]}
              />
              {tamper === 'key' && (
                <Range
                  label={t('翻转 K 的第几位')}
                  value={keyBit}
                  min={0}
                  max={127}
                  step={1}
                  onChange={setKeyBit}
                />
              )}
            </>
          )}
          {mode === 'data' && (
            <>
              <Segments
                label={t('要访问的网站')}
                value={destination}
                onChange={setDestination}
                options={[
                  { value: 'local', label: t('当地网站') },
                  { value: 'home', label: t('家乡网站') },
                ]}
              />
              <Segments
                label={t('地图上显示的路径')}
                value={route}
                onChange={setRoute}
                options={[
                  { value: 'home-routed', label: t('绕回家') },
                  { value: 'local-breakout', label: t('当地出口') },
                ]}
              />
              <Range
                label={t('两国之间的距离')}
                value={distance}
                min={MR_PATH.minDistanceKm}
                max={MR_PATH.maxDistanceKm}
                step={100}
                unit="km"
                onChange={setDistance}
              />
            </>
          )}
          {mode === 'call' && (
            <Segments
              label={t('谁打来')}
              value={caller}
              onChange={setCaller}
              options={[
                { value: 'home', label: t('家乡的家人') },
                { value: 'visited', label: t('身边的当地朋友') },
              ]}
            />
          )}
          <button
            className="mr-reset"
            onClick={() => {
              setManual('auto');
              setRoaming(true);
              setAHere(true);
              setTamper('none');
              setKeyBit(FILM_KEY_BIT);
              setDestination('local');
              setDistance(MR_PATH.defaultDistanceKm);
              setRoute('home-routed');
              setCaller('home');
            }}
          >
            {t('恢复初始设置')}
          </button>
          <details className="mr-notes">
            <summary>{t('漫游模型边界')}</summary>
            <p>
              {t(
                '身份全部是示例：001-01 是 3GPP 测试网络代码，002 和三家当地运营商是虚构的。K 与 OP 取自 3GPP TS 35.208 的公开测试集，真实 SIM 的密钥从不公开。',
              )}
            </p>
            <p>
              {t(
                '认证使用真实的 MILENAGE 算法（AES-128）计算 RES、AUTN 与 K_ASME，并通过官方测试数据校验；省略了 NAS 安全模式、加密与完整性保护的后续步骤。',
              )}
            </p>
            <p>
              {t(
                '选网按 TS 23.122 的优先顺序：家乡网络、SIM 优选名单、其余信号好的网络。标准规定信号好的那一组随机排序，这里按信号排序以便重现。',
              )}
            </p>
            <p>
              {t(
                '往返时间只计入光在光纤中的传播、1.4 倍绕行、25 ms 无线段和每个网关 2 ms，不含拥塞与服务器处理，不代表任何真实线路的测量。',
              )}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

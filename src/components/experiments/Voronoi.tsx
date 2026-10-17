import { useId, useState } from 'react';
import { t } from '../../i18n';
import {
  voronoiCells,
  voronoiCircumcenter,
  voronoiOwners,
  voronoiSites,
  voronoiWallRoute,
  type VoronoiPoint,
} from '../../models/voronoi';
import { useShowcase } from '../lab/FilmContext';
import '../../styles/voronoi.css';
const palette = ['#d8e3ce', '#e7d5cd', '#d7dfed', '#e5dfbc'];
export default function Voronoi() {
  const d = useShowcase(),
    id = useId(),
    [sites, setSites] = useState(voronoiSites.map((s) => ({ ...s }))),
    [selected, setSelected] = useState(0),
    [query, setQuery] = useState<VoronoiPoint>({ x: 135, y: 100 }),
    [wall, setWall] = useState(false);
  const c = d.watch ? Math.min(6, d.chapter) : 2,
    p = d.watch ? d.chapterProgress : 1,
    hasWall = d.watch ? c === 6 : wall;
  const activeSites = d.watch
    ? (c === 1 || c === 6 ? voronoiSites.slice(0, 2) : voronoiSites).map((s, i) =>
        c === 3 && i === 3
          ? {
              ...s,
              x: s.x + (200 - s.x) * Math.min(1, p / 0.45),
              y: s.y + (125 - s.y) * Math.min(1, p / 0.45),
            }
          : c === 5 && i === 1
            ? { ...voronoiSites[0], id: s.id }
            : s,
      )
    : sites;
  const q = d.watch
    ? c === 1
      ? { x: 140 + p * 65, y: 140 }
      : c === 3
        ? { x: 240, y: 75 }
        : c === 4
          ? p < 0.5
            ? { x: 175, y: 112.5 }
            : voronoiCircumcenter(voronoiSites[0], voronoiSites[1], voronoiSites[2])!
          : c === 6
            ? { x: 135, y: 145 }
            : { x: 135, y: 100 }
    : query;
  const cells = voronoiCells(activeSites),
    nearest = voronoiOwners(q, activeSites),
    routes = activeSites.map((s) => ({ id: s.id, ...voronoiWallRoute(q, s) })),
    bestRoute = Math.min(...routes.map((r) => r.distance));
  const tie = nearest.owners.length > 1,
    duplicate = activeSites.some((s, i) =>
      activeSites.slice(0, i).some((other) => other.x === s.x && other.y === s.y),
    );
  const moveSite = (key: 'x' | 'y', value: number) =>
    setSites((previous) => previous.map((s, i) => (i === selected ? { ...s, [key]: value } : s)));
  return (
    <section
      className="voronoi-study"
      data-watch={d.watch}
      aria-label={t('Voronoi 最近站点与距离前提实验')}
    >
      <header>
        <span>VORONOI / NEAREST</span>
        <b>{hasWall ? t('区域仍按直线距离') : t('平面欧氏距离')}</b>
      </header>
      <div className="voronoi-map" role="group" aria-label={t('真实半平面裁剪的最近站点区域')}>
        <svg viewBox="0 0 360 260" aria-hidden="true">
          {!(d.watch && c === 0) &&
            cells.map((cell, i) => (
              <polygon
                key={cell.id}
                points={cell.polygon.map((p) => `${p.x},${p.y}`).join(' ')}
                fill={palette[i]}
              />
            ))}
          {hasWall ? (
            <>
              <path className="voronoi-wall" d="M100 20V240" />
              {routes.map((route) => (
                <path
                  key={route.id}
                  className="voronoi-route"
                  data-best={Math.abs(route.distance - bestRoute) < 1e-8}
                  d={route.points
                    .map((point, i) => `${i ? 'L' : 'M'}${point.x} ${point.y}`)
                    .join(' ')}
                />
              ))}
            </>
          ) : (
            activeSites.map((site) => (
              <path
                className="voronoi-distance"
                key={site.id}
                data-nearest={nearest.owners.includes(site.id)}
                d={`M${q.x} ${q.y}L${site.x} ${site.y}`}
              />
            ))
          )}
          {d.watch && c === 4 && (
            <circle className="voronoi-equal" cx={q.x} cy={q.y} r={nearest.minimum} />
          )}
        </svg>
        {activeSites.map((site, i) => {
          if (activeSites.slice(0, i).some((s) => s.x === site.x && s.y === site.y)) return null;
          const names = activeSites
            .filter((s) => s.x === site.x && s.y === site.y)
            .map((s) => s.id)
            .join('/');
          return (
            <button
              key={site.id}
              className="voronoi-site"
              style={{
                left: `${(site.x / 360) * 100}%`,
                top: `${(site.y / 260) * 100}%`,
                background: palette[i],
              }}
              aria-label={t('选择站点 {0}', names)}
              disabled={d.watch}
              aria-pressed={!d.watch && selected === i}
              onClick={() => setSelected(i)}
            >
              {names}
            </button>
          );
        })}
        <span
          className="voronoi-query"
          style={{ left: `${(q.x / 360) * 100}%`, top: `${(q.y / 260) * 100}%` }}
        >
          Q
        </span>
      </div>
      {hasWall ? (
        <div className="voronoi-routes">
          <span>{t('站点')}</span>
          <span>{t('直线')}</span>
          <span>{t('绕墙最短')}</span>
          {routes.map((route) => (
            <div key={route.id} data-best={Math.abs(route.distance - bestRoute) < 1e-8}>
              <b>{route.id}</b>
              <span>{nearest.distances.find((v) => v.id === route.id)!.distance.toFixed(1)}</span>
              <span>{route.distance.toFixed(1)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="voronoi-measures">
          {nearest.distances.map((v) => (
            <span key={v.id} data-nearest={nearest.owners.includes(v.id)}>
              {v.id}
              <b>{v.distance.toFixed(1)}</b>
            </span>
          ))}
        </div>
      )}
      <p className="voronoi-owner">
        {hasWall
          ? t(
              '直线最近 {0}；绕墙最近 {1}。',
              nearest.owners.join('/'),
              routes
                .filter((r) => Math.abs(r.distance - bestRoute) < 1e-8)
                .map((r) => r.id)
                .join('/'),
            )
          : tie
            ? t('等距最近：{0}', nearest.owners.join(' / '))
            : t('最近：{0}', nearest.owners[0])}
      </p>
      {duplicate && (
        <p className="voronoi-note">{t('重合站点的几何归属不唯一，填色按顺序打破平局。')}</p>
      )}
      {!d.watch && (
        <div className="voronoi-controls">
          <div className="voronoi-choose">
            {sites.map((s, i) => (
              <button key={s.id} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                {s.id}
              </button>
            ))}
          </div>
          <label htmlFor={`${id}-x`}>
            {t('所选站点 x')} · {sites[selected].x}
            <input
              id={`${id}-x`}
              type="range"
              min="32"
              max="328"
              value={sites[selected].x}
              onChange={(e) => moveSite('x', +e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-y`}>
            {t('所选站点 y')} · {sites[selected].y}
            <input
              id={`${id}-y`}
              type="range"
              min="32"
              max="228"
              value={sites[selected].y}
              onChange={(e) => moveSite('y', +e.target.value)}
            />
          </label>
          <label htmlFor={`${id}-qx`}>
            {t('查询点 x')} · {query.x}
            <input
              id={`${id}-qx`}
              type="range"
              min="18"
              max="342"
              value={query.x}
              onChange={(e) => setQuery((v) => ({ ...v, x: +e.target.value }))}
            />
          </label>
          <label htmlFor={`${id}-qy`}>
            {t('查询点 y')} · {query.y}
            <input
              id={`${id}-qy`}
              type="range"
              min="18"
              max="242"
              value={query.y}
              onChange={(e) => setQuery((v) => ({ ...v, y: +e.target.value }))}
            />
          </label>
          <button aria-pressed={wall} onClick={() => setWall(!wall)}>
            {t('加入有限墙，比较绕行距离')}
          </button>
        </div>
      )}
      <details>
        <summary>{t('最近必须先说明距离与平局规则')}</summary>
        <p>
          {t(
            '普通图按平面欧氏距离，以各站点对的垂直平分半平面求交，再裁到显示矩形；矩形不是自然边界。共享边界可有两个最近站点，顶点可有三个或更多。重合站点在整个对应区域等距，填色顺序只为确定绘制，不证明唯一归属。墙是端点可绕过的零厚度有限线段，绕行只比较此单墙的最短折线；填色没有改成路径距离图。不包含道路、拥堵、服务容量或真实地图投影。',
          )}
        </p>
      </details>
    </section>
  );
}

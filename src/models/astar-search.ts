export type AstarGrid = {
  width: number;
  height: number;
  cost: number[];
  blocked: number[];
  start: number;
  goal: number;
};
export type AstarCandidate = { id: number; g: number; h: number; f: number };
export type AstarFrame = {
  current: number | null;
  g: number[];
  open: AstarCandidate[];
  closed: number[];
  path: number[];
};
export function astarLessonGrid(sealed = false): AstarGrid {
  const width = 9,
    height = 5,
    cost = Array(width * height).fill(1);
  cost[13] = 6;
  return {
    width,
    height,
    cost,
    blocked: sealed ? [4, 13, 22, 31, 40] : [22, 31],
    start: 18,
    goal: 26,
  };
}
export const astarPoint = (grid: AstarGrid, id: number) => ({
  x: id % grid.width,
  y: Math.floor(id / grid.width),
});
export function astarNeighbors(grid: AstarGrid, id: number) {
  const { x, y } = astarPoint(grid, id);
  return [
    [x, y - 1],
    [x + 1, y],
    [x, y + 1],
    [x - 1, y],
  ]
    .filter(([a, b]) => a >= 0 && a < grid.width && b >= 0 && b < grid.height)
    .map(([a, b]) => b * grid.width + a)
    .filter((i) => !grid.blocked.includes(i));
}
function validate(grid: AstarGrid, weight: number) {
  const n = grid.width * grid.height;
  if (
    !Number.isInteger(grid.width) ||
    !Number.isInteger(grid.height) ||
    grid.width < 1 ||
    grid.height < 1 ||
    n > 256 ||
    grid.cost.length !== n ||
    grid.cost.some((v) => !Number.isFinite(v) || v < 1 || v > 1e6) ||
    grid.blocked.some((i) => !Number.isInteger(i) || i < 0 || i >= n) ||
    ![grid.start, grid.goal].every(
      (i) => Number.isInteger(i) && i >= 0 && i < n && !grid.blocked.includes(i),
    ) ||
    !Number.isFinite(weight) ||
    weight < 0 ||
    weight > 10
  )
    throw new RangeError('Invalid grid or heuristic weight');
}
export function astarTrace(grid: AstarGrid, weight = 1) {
  validate(grid, weight);
  const n = grid.cost.length,
    g = Array(n).fill(Infinity),
    parents = Array(n).fill(-1),
    open = new Set([grid.start]),
    closed = new Set<number>(),
    frames: AstarFrame[] = [];
  g[grid.start] = 0;
  const goal = astarPoint(grid, grid.goal);
  const h = (id: number) => {
    const p = astarPoint(grid, id);
    return (Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y)) * weight;
  };
  const candidates = () =>
    [...open]
      .map((id) => ({ id, g: g[id], h: h(id), f: g[id] + h(id) }))
      .sort((a, b) => a.f - b.f || a.h - b.h || a.id - b.id);
  const pathTo = (id: number) => {
    const path = [id];
    while (parents[path[0]] >= 0) path.unshift(parents[path[0]]);
    return path;
  };
  const save = (current: number | null) =>
    frames.push({
      current,
      g: [...g],
      open: candidates(),
      closed: [...closed],
      path: current === null ? [] : pathTo(current),
    });
  save(null);
  let pops = 0,
    found = false;
  while (open.size) {
    const current = candidates()[0].id;
    open.delete(current);
    closed.add(current);
    pops++;
    if (current === grid.goal) {
      found = true;
      save(current);
      break;
    }
    for (const next of astarNeighbors(grid, current)) {
      const tentative = g[current] + grid.cost[next];
      if (tentative < g[next]) {
        g[next] = tentative;
        parents[next] = current;
        closed.delete(next);
        open.add(next);
      }
    }
    save(current);
  }
  return {
    frames,
    found,
    cost: found ? g[grid.goal] : Infinity,
    path: found ? pathTo(grid.goal) : [],
    pops,
    weight,
    guaranteed: weight <= 1,
  };
}
export function astarPathCost(grid: AstarGrid, path: readonly number[]) {
  if (!path.length) return Infinity;
  if (
    path[0] !== grid.start ||
    path[path.length - 1] !== grid.goal ||
    path.slice(1).some((v, i) => !astarNeighbors(grid, path[i]).includes(v))
  )
    throw new RangeError('Invalid grid path');
  return path.slice(1).reduce((sum, id) => sum + grid.cost[id], 0);
}

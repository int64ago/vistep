import { useEffect, useState } from 'react';
import {
  chFieldSet,
  chLayout,
  chRoute,
  chSimulate,
  type ChFieldSet,
  type ChParams,
  type ChRect,
  type ChRun,
} from '../../models/cell-handover';

export type ChFieldRequest = { isdM: number; sigmaDb: number; step: number; rect?: ChRect };
type Job = { kind: 'field'; request: ChFieldRequest } | { kind: 'run'; params: ChParams };
type Result = ChFieldSet | ChRun;

const cache = new Map<string, Result>();
const waiting = new Map<string, ((r: Result) => void)[]>();
const jobs = new Map<string, Job>();
let worker: Worker | null = null,
  users = 0,
  broken = false;

function finish(key: string, value: Result) {
  cache.set(key, value);
  if (cache.size > 16) cache.delete(cache.keys().next().value!);
  for (const resolve of waiting.get(key) ?? []) resolve(value);
  waiting.delete(key);
  jobs.delete(key);
}
function computeHere(key: string) {
  const job = jobs.get(key);
  if (!job) return;
  if (job.kind === 'field') {
    const r = job.request;
    finish(key, chFieldSet(r.isdM, r.sigmaDb, r.step, r.rect));
  } else finish(key, chSimulate(job.params));
}
type RunData = Omit<ChRun, 'layout' | 'route'>;
function send(key: string) {
  if (broken || typeof Worker === 'undefined') {
    setTimeout(() => computeHere(key), 0);
    return;
  }
  try {
    if (!worker) {
      worker = new Worker(new URL('../../workers/cell-handover.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (e: MessageEvent<{ id: string; set?: ChFieldSet; run?: RunData }>) => {
        const { id, set, run } = e.data;
        if (!waiting.has(id)) return;
        if (set) finish(id, set);
        else if (run) finish(id, { ...run, layout: chLayout(), route: chRoute() });
        else computeHere(id);
      };
      worker.onerror = () => {
        // Runtime Worker failure: finish every pending job on the main thread.
        broken = true;
        worker?.terminate();
        worker = null;
        for (const key of [...waiting.keys()]) computeHere(key);
      };
    }
    const job = jobs.get(key)!;
    worker.postMessage(
      job.kind === 'field'
        ? { kind: 'field', id: key, ...job.request }
        : { kind: 'run', id: key, params: job.params },
    );
  } catch {
    broken = true;
    setTimeout(() => computeHere(key), 0);
  }
}

function useWorkerResult<T extends Result>(job: Job | null, delayMs = 0) {
  const key = job ? JSON.stringify(job) : '';
  const [state, setState] = useState<{ key: string; value: T } | null>(() => {
    const hit = key ? cache.get(key) : undefined;
    return hit ? { key, value: hit as T } : null;
  });
  useEffect(() => {
    users++;
    return () => {
      users--;
      if (!users && worker) {
        worker.terminate();
        worker = null;
        waiting.clear();
        jobs.clear();
      }
    };
  }, []);
  useEffect(() => {
    if (!key || !job) return;
    const hit = cache.get(key);
    if (hit) {
      setState({ key, value: hit as T });
      return;
    }
    let live = true;
    const resolve = (value: Result) => {
      if (live) setState({ key, value: value as T });
    };
    // Coalesce rapid slider moves: only the settled value is computed.
    const timer = setTimeout(() => {
      const list = waiting.get(key);
      if (list) list.push(resolve);
      else {
        waiting.set(key, [resolve]);
        jobs.set(key, job);
        send(key);
      }
    }, delayMs);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key]);
  return { value: state?.value ?? null, current: !!state && state.key === key };
}

/**
 * A best-server field with vector boundaries, computed in a Worker (or locally if Workers fail) and
 * cached by its inputs. While a new one is computing, the previous one stays visible.
 */
export function useCellHandoverField(request: ChFieldRequest | null) {
  const { value } = useWorkerResult<ChFieldSet>(request ? { kind: 'field', request } : null);
  return { set: value, field: value?.field ?? null };
}

/** A connected-mode route simulation for exploration, off the main thread and debounced. */
export function useCellHandoverRun(params: ChParams, fallback: ChRun) {
  const { value, current } = useWorkerResult<ChRun>({ kind: 'run', params }, 120);
  return { run: value ?? fallback, pending: !current };
}

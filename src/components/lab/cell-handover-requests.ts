import { ByteCache } from '../../models/byte-cache';
import {
  chFieldSetBytes,
  chFieldSetSteps,
  chLayout,
  chRoute,
  chRunBytes,
  chSimulateSteps,
  type ChFieldSet,
  type ChParams,
  type ChRect,
  type ChRun,
} from '../../models/cell-handover';

export type ChFieldRequest = { isdM: number; sigmaDb: number; step: number; rect?: ChRect };
export type ChJob = { kind: 'field'; request: ChFieldRequest } | { kind: 'run'; params: ChParams };
export type ChResult = ChFieldSet | ChRun;
export type ChReply = {
  id: number;
  set?: ChFieldSet;
  run?: Omit<ChRun, 'layout' | 'route'>;
  error?: string;
};
type Subscription = {
  key: string;
  job: ChJob;
  ready: boolean;
  fulfilled: boolean;
  receive: (value: ChResult) => void;
  fail: (message: string) => void;
  timer: ReturnType<typeof setTimeout> | null;
};
type Active = { id: number; key: string; job: ChJob; steps?: Generator<void, ChResult, void> };
type Options = {
  createWorker?: () => Worker;
  compute?: (job: ChJob) => Generator<void, ChResult, void>;
  budgetBytes?: number;
  measure?: (value: ChResult) => number;
};
const compute = (job: ChJob): Generator<void, ChResult, void> =>
  job.kind === 'field'
    ? chFieldSetSteps(job.request.isdM, job.request.sigmaDb, job.request.step, job.request.rect)
    : chSimulateSteps(job.params);
export const CH_RESULT_CACHE_BYTES = 24 * 1024 * 1024;

/** One calculation in flight, with one replaceable request per hook. Independent map layers and
 * route runs keep separate subscriptions; only identical inputs share a computation. */
export class CellHandoverRequests {
  private subscriptions = new Map<symbol, Subscription>();
  private active: Active | null = null;
  private worker: Worker | null = null;
  private localTimer: ReturnType<typeof setTimeout> | null = null;
  private broken = false;
  private owners = 0;
  private serial = 0;
  private readonly cache: ByteCache<string, ChResult>;
  private readonly createWorker: () => Worker;
  private readonly compute: (job: ChJob) => Generator<void, ChResult, void>;

  constructor(options: Options = {}) {
    this.cache = new ByteCache(
      options.budgetBytes ?? CH_RESULT_CACHE_BYTES,
      options.measure ??
        ((value) => ('field' in value ? chFieldSetBytes(value) : chRunBytes(value))),
    );
    this.compute = options.compute ?? compute;
    this.createWorker =
      options.createWorker ??
      (() =>
        new Worker(new URL('../../workers/cell-handover.worker.ts', import.meta.url), {
          type: 'module',
        }));
  }

  peek(job: ChJob) {
    return this.cache.get(JSON.stringify(job));
  }

  /** The hook's lifetime owns the Worker, including render updates between subscriptions. */
  retain() {
    this.owners++;
    let retained = true;
    return () => {
      if (!retained) return;
      retained = false;
      if (--this.owners === 0) this.dispose();
    };
  }

  subscribe(
    job: ChJob,
    receive: (value: ChResult) => void,
    fail: (message: string) => void = () => {},
    delayMs = 120,
  ) {
    const token = Symbol(),
      key = JSON.stringify(job);
    const subscription: Subscription = {
      key,
      job,
      receive,
      fail,
      ready: false,
      fulfilled: false,
      timer: null,
    };
    this.subscriptions.set(token, subscription);
    const hit = this.cache.get(key);
    if (hit) {
      subscription.fulfilled = true;
      receive(hit);
    } else {
      subscription.timer = setTimeout(() => {
        subscription.timer = null;
        subscription.ready = true;
        this.pump();
      }, delayMs);
    }
    return () => {
      const current = this.subscriptions.get(token);
      if (!current) return;
      if (current.timer !== null) clearTimeout(current.timer);
      this.subscriptions.delete(token);
      // A fallback batch is cancellable between timer turns. A Worker reply still owns the one
      // in-flight slot until it arrives, so stale native work cannot create a second queued job.
      if (this.active?.steps && !this.needed(this.active.key)) {
        if (this.localTimer !== null) clearTimeout(this.localTimer);
        this.localTimer = null;
        this.active = null;
      }
      this.pump();
    };
  }

  private needed(key: string) {
    return [...this.subscriptions.values()].some((s) => s.key === key && !s.fulfilled);
  }

  private pump() {
    if (this.active) return;
    const next = [...this.subscriptions.values()].find((s) => s.ready && !s.fulfilled);
    if (!next) return;
    const hit = this.cache.get(next.key);
    this.active = { id: ++this.serial, key: next.key, job: next.job };
    if (hit) {
      this.finish(this.active.id, hit);
      return;
    }
    if (this.broken) {
      this.startLocal();
      return;
    }
    try {
      if (!this.worker) {
        this.worker = this.createWorker();
        const instance = this.worker;
        this.worker.onmessage = ({ data }: MessageEvent<ChReply>) => {
          if (this.worker !== instance) return;
          if (data.id !== this.active?.id) return;
          if (data.error) this.finish(data.id, undefined, data.error);
          else if (data.set) this.finish(data.id, data.set);
          else if (data.run)
            this.finish(data.id, { ...data.run, layout: chLayout(), route: chRoute() });
          else this.useLocal();
        };
        this.worker.onerror = (event) => {
          if (this.worker !== instance) return;
          event.preventDefault();
          this.useLocal();
        };
      }
      const { job, id } = this.active;
      this.worker.postMessage(
        job.kind === 'field'
          ? { kind: 'field', id, ...job.request }
          : { kind: 'run', id, params: job.params },
      );
    } catch {
      this.useLocal();
    }
  }

  private closeWorker() {
    if (!this.worker) return;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.terminate();
    this.worker = null;
  }

  private useLocal() {
    this.broken = true;
    this.closeWorker();
    if (this.active && !this.needed(this.active.key)) this.active = null;
    if (this.active) this.startLocal();
    else this.pump();
  }

  private startLocal() {
    const task = this.active;
    if (!task) return;
    task.steps = this.compute(task.job);
    const advance = () => {
      this.localTimer = null;
      if (this.active !== task || !this.needed(task.key)) {
        if (this.active === task) this.active = null;
        this.pump();
        return;
      }
      try {
        // Timer turns yield to paint/input; arithmetic and seeded randomness remain ordered.
        const started = performance.now();
        for (let segment = 0; segment < 4; segment++) {
          const part = task.steps!.next();
          if (part.done) {
            this.finish(task.id, part.value);
            return;
          }
          if (performance.now() - started >= 6) break;
        }
        this.localTimer = setTimeout(advance, 0);
      } catch (error) {
        this.finish(task.id, undefined, error instanceof Error ? error.message : String(error));
      }
    };
    this.localTimer = setTimeout(advance, 0);
  }

  private finish(id: number, value?: ChResult, error?: string) {
    const task = this.active;
    if (!task || task.id !== id) return;
    this.active = null;
    if (value && this.needed(task.key)) this.cache.set(task.key, value);
    for (const subscription of [...this.subscriptions.values()]) {
      if (subscription.key !== task.key || subscription.fulfilled) continue;
      subscription.fulfilled = true;
      if (subscription.timer !== null) clearTimeout(subscription.timer);
      subscription.timer = null;
      if (value) subscription.receive(value);
      else subscription.fail(error ?? 'Cellular computation failed');
    }
    this.pump();
  }

  /** End the whole page session, including Worker listeners, queued timers and local batches. */
  dispose() {
    this.closeWorker();
    if (this.localTimer !== null) clearTimeout(this.localTimer);
    this.localTimer = null;
    for (const s of this.subscriptions.values()) {
      if (s.timer !== null) clearTimeout(s.timer);
    }
    this.subscriptions.clear();
    this.active = null;
    this.broken = false;
    this.cache.clear();
  }
}

import { chFieldSet, chSimulate, type ChParams, type ChRect } from '../models/cell-handover';

type Request =
  | { kind: 'field'; id: number; isdM: number; sigmaDb: number; step: number; rect?: ChRect }
  | { kind: 'run'; id: number; params: ChParams };

/** Fields and route simulations are the scene's heavy work; keep them off the main thread. */
self.onmessage = (e: MessageEvent<Request>) => {
  const r = e.data;
  const post = (data: unknown, transfer: Transferable[]) =>
    (self as unknown as Worker).postMessage(data, transfer);
  try {
    if (r.kind === 'field') {
      const set = chFieldSet(r.isdM, r.sigmaDb, r.step, r.rect);
      post({ id: r.id, set }, [
        set.field.best.buffer,
        set.field.bestDbm.buffer,
        set.field.marginDb.buffer,
        set.cellEdges.buffer,
        set.taEdges.buffer,
      ]);
    } else {
      // Copy the typed arrays: the cached run in this worker must stay intact.
      const run = chSimulate(r.params);
      const data = {
        params: run.params,
        count: run.count,
        speed: run.speed,
        dt: run.dt,
        cells: run.cells,
        truth: run.truth.slice(),
        filtered: run.filtered.slice(),
        serving: run.serving.slice(),
        sinr: run.sinr.slice(),
        trigger: run.trigger.slice(),
        candidate: run.candidate.slice(),
        events: run.events,
        handovers: run.handovers,
        pingPongs: run.pingPongs,
        failures: run.failures,
      };
      post({ id: r.id, run: data }, [
        data.truth.buffer,
        data.filtered.buffer,
        data.serving.buffer,
        data.sinr.buffer,
        data.trigger.buffer,
        data.candidate.buffer,
      ]);
    }
  } catch (error) {
    post({ id: r.id, error: String(error) }, []);
  }
};

import { useEffect, useState } from 'react';
import { type ChFieldSet, type ChParams, type ChRun } from '../../models/cell-handover';
import {
  CellHandoverRequests,
  type ChFieldRequest,
  type ChJob,
  type ChResult,
} from './cell-handover-requests';

export type { ChFieldRequest } from './cell-handover-requests';
const requests = new CellHandoverRequests();

function useWorkerResult<T extends ChResult>(job: ChJob | null) {
  const key = job ? JSON.stringify(job) : '';
  const [state, setState] = useState<{ key: string; value: T } | null>(() => {
    const hit = job ? requests.peek(job) : undefined;
    return hit ? { key, value: hit as T } : null;
  });
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => requests.retain(), []);
  useEffect(() => {
    if (!job) return;
    return requests.subscribe(
      job,
      (value) => {
        setFailure(null);
        setState({ key, value: value as T });
      },
      (message) => setFailure({ key, message }),
    );
  }, [key]);
  return {
    value: state?.value ?? null,
    current: !!state && state.key === key,
    error: failure?.key === key ? failure.message : '',
  };
}

/** Independent map layers share a bounded Worker queue; dragging retains only settled inputs.
 * While a new one is computing, the previous one stays visible. */
export function useCellHandoverField(request: ChFieldRequest | null) {
  const { value, error } = useWorkerResult<ChFieldSet>(request ? { kind: 'field', request } : null);
  return { set: value, field: value?.field ?? null, error };
}

/** A connected-mode route simulation for exploration, off the main thread and debounced. */
export function useCellHandoverRun(params: ChParams, fallback: ChRun) {
  const { value, current, error } = useWorkerResult<ChRun>({ kind: 'run', params });
  return { run: value ?? fallback, pending: !current && !error, error };
}

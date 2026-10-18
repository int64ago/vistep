import { useEffect, useRef, useState } from 'react';
import { rippleGrid, type RippleInput } from '../../models/ripple-tank-lab';
/** Keep at most one calculation in flight; geometry and colour use the same returned input. */
export function useRippleField(input: RippleInput) {
  const [state, setState] = useState<{ input: RippleInput; field: Float32Array }>(() => ({
      input,
      field: rippleGrid(input),
    })),
    latest = useRef(input),
    worker = useRef<Worker | null>(null),
    pending = useRef(false),
    done = useRef(JSON.stringify(input)),
    flush = useRef<() => void>(() => {}),
    key = JSON.stringify(input);
  useEffect(() => {
    let disposed = false;
    const calculate = () => {
      if (disposed || pending.current) return;
      const next = latest.current,
        nextKey = JSON.stringify(next);
      if (nextKey === done.current) return;
      if (worker.current) {
        pending.current = true;
        worker.current.postMessage(next);
      } else {
        const field = rippleGrid(next);
        done.current = nextKey;
        setState({ input: next, field });
      }
    };
    flush.current = calculate;
    try {
      worker.current = new Worker(
        new URL('../../workers/ripple-tank-lab.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.current.onmessage = (
        event: MessageEvent<{ input: RippleInput; field: Float32Array }>,
      ) => {
        if (disposed) return;
        pending.current = false;
        done.current = JSON.stringify(event.data.input);
        if (event.data.input.mode === latest.current.mode) setState(event.data);
        calculate();
      };
      worker.current.onerror = () => {
        worker.current?.terminate();
        worker.current = null;
        pending.current = false;
        calculate();
      };
    } catch {
      worker.current = null;
    }
    calculate();
    return () => {
      disposed = true;
      worker.current?.terminate();
      worker.current = null;
      pending.current = false;
      flush.current = () => {};
    };
  }, []);
  useEffect(() => {
    latest.current = input;
    flush.current();
  }, [key]);
  return state.input.mode === input.mode ? state : { input, field: new Float32Array(96 * 72 * 4) };
}

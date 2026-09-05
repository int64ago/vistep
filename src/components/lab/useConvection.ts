import { useEffect, useMemo, useRef, useState } from 'react';
import { ConvectionRequests } from './convection-requests';
import {
  ConvectionRun,
  convectionTargetStep,
  createConvection,
  stepConvection,
  type ConvectionOptions,
  type ConvectionState,
} from '../../models/convection';
/** No simulation clock: work requests are samples of the parent director's requested model time. */
export function useConvection(options: ConvectionOptions, time: number, enabled = true) {
  const key = JSON.stringify(options),
    initial = useMemo(() => createConvection(options), [key]);
  const [result, setResult] = useState<{ key: string; state: ConvectionState } | null>(null),
    [error, setError] = useState(''),
    [fallback, setFallback] = useState(false);
  const request = useRef<((time: number) => void) | null>(null),
    latestTime = useRef(time);
  latestTime.current = time;
  useEffect(() => {
    if (!enabled) {
      request.current = null;
      return;
    }
    let worker: Worker | null = null,
      disposed = false,
      mailbox: ConvectionRequests | null = null,
      timer: ReturnType<typeof setTimeout> | null = null,
      run: ConvectionRun | null = null,
      localState: ConvectionState | null = null;
    setError('');
    setFallback(false);
    const localRequest = (targetTime: number) => {
      if (!run) run = new ConvectionRun(options);
      const target = convectionTargetStep(initial.p, targetTime);
      if (!localState || localState.step > target) localState = run.nearest(targetTime);
      if (timer !== null) return;
      const pump = () => {
        timer = null;
        if (disposed || !run || !localState) return;
        try {
          const wanted = convectionTargetStep(initial.p, latestTime.current);
          if (localState.step > wanted) localState = run.nearest(latestTime.current);
          for (let i = 0; i < 40 && localState.step < wanted; i++) {
            localState = stepConvection(localState);
            run.remember(localState);
          }
          if (localState.step < wanted) timer = setTimeout(pump, 0);
          else {
            setError('');
            setResult({ key, state: localState });
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'solver');
        }
      };
      timer = setTimeout(pump, 0);
    };
    const useLocal = () => {
      mailbox?.dispose();
      worker?.terminate();
      worker = null;
      setFallback(true);
      request.current = localRequest;
      localRequest(latestTime.current);
    };
    try {
      worker = new Worker(new URL('./Convection.worker.ts', import.meta.url), { type: 'module' });
      mailbox = new ConvectionRequests((id, targetTime) =>
        worker?.postMessage({ id, options, time: targetTime }),
      );
      worker.onmessage = ({
        data,
      }: {
        data: { id: number; state?: ConvectionState; error?: string };
      }) => {
        if (disposed) return;
        mailbox?.complete(data.id, () => {
          if (data.error) setError(data.error);
          else if (data.state) {
            setError('');
            // A backward seek must not display an already-computed future state.
            if (data.state.step <= convectionTargetStep(initial.p, latestTime.current))
              setResult({ key, state: data.state });
          }
        });
      };
      worker.onerror = (event) => {
        event.preventDefault();
        if (!disposed) useLocal();
      };
      request.current = (targetTime) => mailbox?.request(targetTime);
      request.current(latestTime.current);
    } catch {
      useLocal();
    }
    return () => {
      disposed = true;
      mailbox?.dispose();
      worker?.terminate();
      if (timer !== null) clearTimeout(timer);
      run?.clear();
      request.current = null;
    };
  }, [key, enabled]);
  useEffect(() => {
    if (enabled) request.current?.(time);
  }, [time, key, enabled]);
  const target = convectionTargetStep(initial.p, time);
  const state = result?.key === key && result.state.step <= target ? result.state : initial;
  return {
    state,
    pending: enabled && state.step !== target,
    error,
    fallback,
  };
}

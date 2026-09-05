import { useEffect, useMemo, useRef, useState } from 'react';
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
      sequence = 0,
      timer: ReturnType<typeof setTimeout> | null = null,
      run: ConvectionRun | null = null,
      localState: ConvectionState | null = null;
    setError('');
    setFallback(false);
    const localRequest = (targetTime: number) => {
      sequence++;
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
          else setResult({ key, state: localState });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'solver');
        }
      };
      timer = setTimeout(pump, 0);
    };
    const useLocal = () => {
      worker?.terminate();
      worker = null;
      setFallback(true);
      request.current = localRequest;
      localRequest(latestTime.current);
    };
    try {
      worker = new Worker(new URL('./Convection.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = ({
        data,
      }: {
        data: { id: number; state?: ConvectionState; error?: string };
      }) => {
        if (disposed || data.id !== sequence) return;
        if (data.error) setError(data.error);
        else if (data.state) setResult({ key, state: data.state });
      };
      worker.onerror = (event) => {
        event.preventDefault();
        if (!disposed) useLocal();
      };
      request.current = (targetTime) =>
        worker?.postMessage({ id: ++sequence, options, time: targetTime });
      request.current(latestTime.current);
    } catch {
      useLocal();
    }
    return () => {
      disposed = true;
      worker?.terminate();
      if (timer !== null) clearTimeout(timer);
      run?.clear();
      request.current = null;
    };
  }, [key, enabled]);
  useEffect(() => {
    if (enabled) request.current?.(time);
  }, [time, key, enabled]);
  const state = result?.key === key ? result.state : initial;
  return {
    state,
    pending: enabled && state.step !== convectionTargetStep(initial.p, time),
    error,
    fallback,
  };
}

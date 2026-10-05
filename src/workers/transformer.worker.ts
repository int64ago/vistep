import { TinyTransformer } from '../models/transformer';
let model = new TinyTransformer(),
  job = 0,
  context = '猫爱吃';
let directedSteps = -1,
  directedLosses: number[] = [];
let suspended = false;
let training: { remaining: number; rate: number } | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const send = (extra: Record<string, unknown> = {}) =>
  self.postMessage({ ...model.inspect(context), ...extra });
const clearTimer = () => {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
};
const cancelTraining = () => {
  clearTimer();
  training = null;
};
// A bounded batch gives visibility/stop messages a chance to run between weight updates.
function scheduleTraining() {
  if (suspended || !training || timer !== undefined) return;
  timer = setTimeout(() => {
    timer = undefined;
    if (suspended || !training) return;
    try {
      let loss = 0;
      for (let i = 0; i < 5 && training.remaining > 0; i++) {
        loss = model.trainStep(training.rate);
        training.remaining--;
      }
      const remaining = training.remaining;
      if (!remaining) training = null;
      send({ type: 'progress', loss, running: remaining > 0, remaining });
      scheduleTraining();
    } catch (error) {
      cancelTraining();
      self.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : '模型未能运行。',
        running: false,
      });
    }
  }, 0);
}
self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  try {
    if (m.type === 'direct') {
      cancelTraining();
      const current = ++job;
      const steps = Math.max(0, Math.min(160, Math.floor(m.steps)));
      if (directedSteps < 0 || steps < directedSteps) {
        model = new TinyTransformer();
        directedSteps = 0;
        directedLosses = [];
      }
      while (directedSteps < steps) {
        directedLosses.push(model.trainStep(0.015));
        directedSteps++;
        if (directedSteps % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (current !== job) return;
        }
      }
      if (m.gradient && !steps) {
        model.params.forEach((p) => (p.grad = 0));
        model.loss(0).backward();
      }
      let text = '猫爱吃';
      for (let i = 0; i < Math.min(2, m.samples || 0); i++) text += model.sample(text.slice(-4), 0);
      context = text.slice(-4);
      send({
        type: 'directed',
        requestId: m.requestId,
        text,
        history: directedLosses,
        loss: directedLosses.at(-1) ?? null,
        running: false,
      });
      return;
    }
    if (m.type === 'reset') {
      cancelTraining();
      directedSteps = -1;
      job++;
      model = new TinyTransformer();
      context = '猫爱吃';

      send({ type: 'ready', loss: null, running: false });
    }
    if (m.type === 'inspect') {
      context = m.context;
      send({ type: 'inspection' });
    }
    if (m.type === 'stop') {
      cancelTraining();
      job++;
      send({ type: 'stopped', running: false });
    }
    if (m.type === 'suspend') {
      suspended = true;
      clearTimer();
    }
    if (m.type === 'resume') {
      suspended = false;
      scheduleTraining();
    }
    if (m.type === 'train') {
      cancelTraining();
      directedSteps = -1;
      job++;
      context = m.context;
      training = {
        remaining: Math.min(200, Math.max(1, Math.floor(m.steps || 50))),
        rate: m.rate || 0.015,
      };
      scheduleTraining();
    }
    if (m.type === 'sample') {
      context = m.context;
      const next = model.sample(context, m.temperature);
      context = [...context, next].slice(-4).join('');
      send({ type: 'sample', next });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : '模型未能运行。',
      running: false,
    });
  }
};
send({ type: 'ready', loss: null, running: false });

import { TinyTransformer } from '../models/transformer';
let model = new TinyTransformer(),
  job = 0,
  context = '猫爱吃';
let directedSteps = -1,
  directedLosses: number[] = [];
const send = (extra: Record<string, unknown> = {}) =>
  self.postMessage({ ...model.inspect(context), ...extra });
self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  try {
    if (m.type === 'direct') {
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
      job++;
      send({ type: 'stopped', running: false });
    }
    if (m.type === 'train') {
      directedSteps = -1;
      const current = ++job;
      context = m.context;
      const steps = Math.min(200, Math.max(1, m.steps || 50));
      for (let i = 0; i < steps; i++) {
        if (current !== job) return;
        const loss = model.trainStep(m.rate || 0.015);
        if (i % 5 === 4 || i === steps - 1) {
          send({ type: 'progress', loss, running: i !== steps - 1 });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
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

import { TinyTransformer } from '../models/transformer';
let model = new TinyTransformer(),
  job = 0,
  context = '猫爱吃';
const send = (extra: Record<string, unknown> = {}) =>
  self.postMessage({ ...model.inspect(context), ...extra });
self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  try {
    if (m.type === 'reset') {
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

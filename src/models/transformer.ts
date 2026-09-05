/** A deliberately small, real decoder-only Transformer with scalar reverse-mode autodiff. */
export class Value {
  grad = 0;
  constructor(
    public data: number,
    public children: Value[] = [],
    public backwardOp: () => void = () => {},
  ) {}
  add(other: Value | number) {
    const b = other instanceof Value ? other : new Value(other),
      out = new Value(this.data + b.data, [this, b]);
    out.backwardOp = () => {
      this.grad += out.grad;
      b.grad += out.grad;
    };
    return out;
  }
  mul(other: Value | number) {
    const b = other instanceof Value ? other : new Value(other),
      out = new Value(this.data * b.data, [this, b]);
    out.backwardOp = () => {
      this.grad += b.data * out.grad;
      b.grad += this.data * out.grad;
    };
    return out;
  }
  pow(n: number) {
    const out = new Value(this.data ** n, [this]);
    out.backwardOp = () => {
      this.grad += n * this.data ** (n - 1) * out.grad;
    };
    return out;
  }
  exp() {
    const out = new Value(Math.exp(this.data), [this]);
    out.backwardOp = () => {
      this.grad += out.data * out.grad;
    };
    return out;
  }
  log() {
    const out = new Value(Math.log(this.data), [this]);
    out.backwardOp = () => {
      this.grad += out.grad / this.data;
    };
    return out;
  }
  relu() {
    const out = new Value(Math.max(0, this.data), [this]);
    out.backwardOp = () => {
      this.grad += (this.data > 0 ? 1 : 0) * out.grad;
    };
    return out;
  }
  backward() {
    const order: Value[] = [],
      visited = new Set<Value>();
    const visit = (v: Value) => {
      if (visited.has(v)) return;
      visited.add(v);
      v.children.forEach(visit);
      order.push(v);
    };
    visit(this);
    order.forEach((v) => (v.grad = 0));
    this.grad = 1;
    for (let i = order.length - 1; i >= 0; i--) order[i].backwardOp();
  }
}
export const VOCAB = ['猫', '狗', '鸟', '爱', '吃', '鱼', '肉', '虫', '。'];
export const CORPUS = ['猫爱吃鱼。', '狗爱吃肉。', '鸟爱吃虫。'];
const D = 8,
  CONTEXT = 4;
const sum = (values: Value[]) => values.reduce((a, b) => a.add(b), new Value(0));
const linear = (x: Value[], w: Value[][]) => w.map((row) => sum(row.map((v, i) => v.mul(x[i]))));
const normalize = (x: Value[]) => {
  const inv = sum(x.map((v) => v.mul(v)))
    .mul(1 / x.length)
    .add(1e-5)
    .pow(-0.5);
  return x.map((v) => v.mul(inv));
};
const softmax = (logits: Value[]) => {
  const max = Math.max(...logits.map((v) => v.data)),
    exp = logits.map((v) => v.add(-max).exp()),
    inv = sum(exp).pow(-1);
  return exp.map((v) => v.mul(inv));
};
export type Inspection = {
  context: string;
  attention: number[][];
  probabilities: number[];
  embeddings: number[][];
  tokenEmbeddings: number[][];
  positions: number[][];
  gradients: number[];
  weightDeltas: number[];
  weights: number[];
  step: number;
  parameterCount: number;
  gradientNorm: number;
};
export class TinyTransformer {
  embedding: Value[][];
  position: Value[][];
  q: Value[][];
  k: Value[][];
  v: Value[][];
  o: Value[][];
  ff1: Value[][];
  ff2: Value[][];
  out: Value[][];
  params: Value[];
  m: number[];
  variance: number[];
  step = 0;
  gradientNorm = 0;
  lastWeights: number[] = [];
  seed: number;
  constructor(seed = 42) {
    this.seed = seed;
    const matrix = (rows: number, cols: number, scale = 0.3) =>
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => new Value((this.random() * 2 - 1) * scale)),
      );
    this.embedding = matrix(VOCAB.length, D);
    this.position = matrix(CONTEXT, D, 0.04);
    this.q = matrix(D, D);
    this.k = matrix(D, D);
    this.v = matrix(D, D);
    this.o = matrix(D, D);
    this.ff1 = matrix(16, D);
    this.ff2 = matrix(D, 16);
    this.out = matrix(VOCAB.length, D);
    this.params = [
      this.embedding,
      this.position,
      this.q,
      this.k,
      this.v,
      this.o,
      this.ff1,
      this.ff2,
      this.out,
    ].flat(2);
    this.m = this.params.map(() => 0);
    this.variance = this.params.map(() => 0);
  }
  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  encode(text: string) {
    const ids = [...text].map((ch) => VOCAB.indexOf(ch));
    if (!ids.length || ids.some((i) => i < 0)) throw new Error('请输入教学词表中的字符。');
    return ids.slice(-CONTEXT);
  }
  forward(ids: number[]) {
    const x = ids.map((id, t) => this.embedding[id].map((w, i) => w.add(this.position[t][i]))),
      norm = x.map(normalize),
      queries = norm.map((row) => linear(row, this.q)),
      keys = norm.map((row) => linear(row, this.k)),
      values = norm.map((row) => linear(row, this.v));
    const attention: Value[][] = [];
    const probabilities = x.map((row, t) => {
      const scores = keys
          .slice(0, t + 1)
          .map((key) => sum(key.map((value, i) => value.mul(queries[t][i]))).mul(1 / Math.sqrt(D))),
        weights = softmax(scores);
      attention.push(weights);
      const pooled = Array.from({ length: D }, (_, i) =>
        sum(weights.map((weight, j) => weight.mul(values[j][i]))),
      );
      const residual = linear(pooled, this.o).map((v, i) => v.add(row[i]));
      const hidden = linear(normalize(residual), this.ff1).map((v) => v.relu());
      const final = linear(hidden, this.ff2).map((v, i) => v.add(residual[i]));
      return softmax(linear(normalize(final), this.out));
    });
    return { probabilities, attention, embeddings: x };
  }
  loss(corpusIndex: number) {
    const full = [...CORPUS[corpusIndex]].map((ch) => VOCAB.indexOf(ch)),
      input = full.slice(0, CONTEXT),
      targets = full.slice(1, CONTEXT + 1);
    const f = this.forward(input);
    return sum(targets.map((id, t) => f.probabilities[t][id].add(1e-12).log().mul(-1))).mul(
      1 / targets.length,
    );
  }
  trainStep(rate = 0.015) {
    const loss = this.loss(this.step % CORPUS.length);
    this.params.forEach((p) => (p.grad = 0));
    loss.backward();
    this.gradientNorm = Math.sqrt(this.params.reduce((s, p) => s + p.grad * p.grad, 0));
    const clip = Math.max(1, this.gradientNorm);
    this.lastWeights = this.q[0].map((p) => p.data);
    this.step++;
    const b1 = 0.9,
      b2 = 0.99;
    this.params.forEach((p, i) => {
      const g = p.grad / clip;
      this.m[i] = b1 * this.m[i] + (1 - b1) * g;
      this.variance[i] = b2 * this.variance[i] + (1 - b2) * g * g;
      p.data -=
        (rate * (this.m[i] / (1 - b1 ** this.step))) /
        (Math.sqrt(this.variance[i] / (1 - b2 ** this.step)) + 1e-8);
    });
    if (!Number.isFinite(loss.data)) throw new Error('训练出现数值异常，请重置模型。');
    return loss.data;
  }
  inspect(text: string): Inspection {
    const ids = this.encode(text),
      f = this.forward(ids);
    return {
      context: ids.map((i) => VOCAB[i]).join(''),
      attention: f.attention.map((row) =>
        Array.from({ length: ids.length }, (_, i) => row[i]?.data || 0),
      ),
      probabilities: f.probabilities.at(-1)!.map((v) => v.data),
      embeddings: f.embeddings.map((row) => row.map((v) => v.data)),
      tokenEmbeddings: ids.map((id) => this.embedding[id].map((v) => v.data)),
      positions: ids.map((_, i) => this.position[i].map((v) => v.data)),
      gradients: this.q[0].map((v) => v.grad),
      weightDeltas: this.q[0].map((v, i) =>
        this.lastWeights.length ? v.data - this.lastWeights[i] : 0,
      ),
      weights: this.q[0].map((v) => v.data),
      step: this.step,
      parameterCount: this.params.length,
      gradientNorm: this.gradientNorm,
    };
  }
  sample(text: string, temperature: number) {
    const probs = this.inspect(text).probabilities;
    if (temperature === 0) return VOCAB[probs.indexOf(Math.max(...probs))];
    const scaled = probs.map((p) => Math.max(p, 1e-12) ** (1 / temperature)),
      total = scaled.reduce((a, b) => a + b, 0);
    let pick = this.random() * total;
    for (let i = 0; i < scaled.length; i++) {
      pick -= scaled[i];
      if (pick <= 0) return VOCAB[i];
    }
    return VOCAB.at(-1)!;
  }
}

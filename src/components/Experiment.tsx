import { Component, lazy, Suspense, type ReactNode } from 'react';
import Showcase from './lab/Showcase';
const experiments = {
  pendulum: lazy(() => import('./experiments/Pendulum')),
  printer: lazy(() => import('./experiments/Printer')),
  jpeg: lazy(() => import('./experiments/Jpeg')),
  bicycle: lazy(() => import('./experiments/Bicycle')),
  refrigerator: lazy(() => import('./experiments/Refrigerator')),
  noise: lazy(() => import('./experiments/Noise')),
  gps: lazy(() => import('./experiments/Gps')),
  network: lazy(() => import('./experiments/Network')),
  transformer: lazy(() => import('./experiments/Transformer')),
  dimensions: lazy(() => import('./experiments/Dimensions')),
  elevator: lazy(() => import('./experiments/Elevator')),
  traffic: lazy(() => import('./experiments/Traffic')),
};
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="error-state" role="alert">
        <h2>实验暂时没能打开</h2>
        <p>可以重新加载试试，下方的原理讲解仍然可以阅读。</p>
        <button className="btn primary" onClick={() => location.reload()}>
          重新加载
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Experiment({ slug }: { slug: keyof typeof experiments }) {
  const Scene = experiments[slug];
  return (
    <Boundary>
      <Suspense
        fallback={
          <div className="lab-loading" role="status">
            正在准备实验…
          </div>
        }
      >
        <Showcase slug={slug}>
          <Scene />
        </Showcase>
      </Suspense>
    </Boundary>
  );
}

import { t } from '../i18n';
import { Component, lazy, Suspense, type ReactNode } from 'react';
import Showcase from './lab/Showcase';
import { experimentLoaders, type ExperimentSlug } from '../data/experiments';
const experiments = Object.fromEntries(
  Object.entries(experimentLoaders).map(([slug, load]) => [slug, lazy(load)]),
);
class Boundary extends Component<
  {
    children: ReactNode;
  },
  {
    failed: boolean;
  }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="error-state" role="alert">
        <h2>{t('实验暂时没能打开')}</h2>
        <p>{t('可以重新加载试试，下方的原理讲解仍然可以阅读。')}</p>
        <button className="btn primary" onClick={() => location.reload()}>
          {t('重新加载')}
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Experiment({ slug }: { slug: ExperimentSlug }) {
  // The inline gate in Base.astro marked this browser; do not load an engine that cannot run.
  if (document.documentElement.hasAttribute('data-unsupported')) return null;
  const Scene = experiments[slug];
  return (
    <Boundary>
      <Suspense
        fallback={
          <div className="lab-loading" role="status">
            {t('正在准备实验…')}
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

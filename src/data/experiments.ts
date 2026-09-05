// Keep explicit dynamic imports: importing this registry must not load scene engines.
export const experimentLoaders = {
  pendulum: () => import('../components/experiments/Pendulum'),
  printer: () => import('../components/experiments/Printer'),
  jpeg: () => import('../components/experiments/Jpeg'),
  bicycle: () => import('../components/experiments/Bicycle'),
  refrigerator: () => import('../components/experiments/Refrigerator'),
  noise: () => import('../components/experiments/Noise'),
  gps: () => import('../components/experiments/Gps'),
  network: () => import('../components/experiments/Network'),
  transformer: () => import('../components/experiments/Transformer'),
  dimensions: () => import('../components/experiments/Dimensions'),
  elevator: () => import('../components/experiments/Elevator'),
  traffic: () => import('../components/experiments/Traffic'),
};
export type ExperimentSlug = keyof typeof experimentLoaders;

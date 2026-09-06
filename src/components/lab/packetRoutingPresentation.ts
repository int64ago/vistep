import { routingSimulate, type RoutingConfig } from '../../models/packet-routing';

/** Capacity is the only changed input. Both runs use one physical-time ruler. */
export function routingBufferComparison(config: RoutingConfig) {
  const baseline = routingSimulate(config);
  const expanded = config.capacity === 8 ? baseline : routingSimulate({ ...config, capacity: 8 });
  return {
    baseline,
    expanded,
    duration: Math.max(0.3, baseline.end, expanded.end),
  };
}

import { Children, createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { routingReset, routingShot } from '../../models/packet-routing';
import { routingBufferComparison } from './packetRoutingPresentation';
import { routingSnapshot } from '../../models/packet-routing';

const context = vi.hoisted(() => ({
  watch: false,
  compact: false,
  chapter: 2,
  chapterProgress: 0.5,
  manual: null as ReturnType<typeof routingReset> | null,
}));
vi.mock('./Showcase', () => ({ useShowcase: () => context }));
vi.mock('./useCompact', () => ({ useCompact: () => context.compact }));
vi.mock('../../i18n', () => ({ t: (s: string) => s }));
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>();
  return {
    ...react,
    useId: () => 'routing-regression',
    useMemo: (compute: () => unknown) => compute(),
    useState: (initial: unknown) => {
      if (typeof initial !== 'function' || initial.name !== 'routingReset')
        throw new Error('Unexpected state hook in routing display regression');
      context.manual ??= initial();
      return [
        context.manual,
        (next: unknown) => {
          context.manual = (typeof next === 'function' ? next(context.manual) : next) as ReturnType<
            typeof routingReset
          >;
        },
      ];
    },
  };
});
import PacketRouting from '../experiments/PacketRouting';
import PacketRoutingMap from './PacketRoutingMap';

function nodes(node: ReactNode): { type: unknown; props: Record<string, any> }[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    return [{ type: child.type, props: child.props }, ...nodes(child.props.children)];
  });
}
function click(label: string) {
  const button = nodes(PacketRouting()).find(
    (node) => node.type === 'button' && node.props.children === label,
  );
  expect(button).toBeDefined();
  button!.props.onClick();
}
function currentDisplay() {
  return renderToStaticMarkup(createElement(PacketRouting));
}
function circleRectangleGap(
  cx: number,
  cy: number,
  radius: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return (
    Math.hypot(Math.max(x - cx, 0, cx - x - width), Math.max(y - cy, 0, cy - y - height)) - radius
  );
}

describe('actual routing control and map output', () => {
  it('keeps the physical clock and selected identity when the real compare handler toggles twice', () => {
    for (const compact of [false, true]) {
      Object.assign(context, { watch: false, compact, manual: routingReset() });
      Object.assign(context.manual!.config, {
        count: 12,
        interval: 0.004,
        brRate: 200000,
        capacity: 3,
      });
      context.manual!.selected = 3;
      // An actual 0.001-step slider value: 149.9536 ms, displayed as 150.0 ms.
      context.manual!.time = 0.298;
      const before = currentDisplay();
      expect(before).toContain('150.0 ms');
      const counts = (html: string) =>
        [
          ...html.match(/class="routing-ledger">([\s\S]*?)<\/div>/)![1].matchAll(/<b>(\d+)<\/b>/g),
        ].map((match) => Number(match[1]));
      expect(counts(before)).toEqual([3, 2, 7, 0]);
      click('对比 8 个等待位');
      const after = currentDisplay();
      expect(after).toContain('150.0 ms');
      expect(counts(after)).toEqual([8, 2, 2, 0]);
      expect(context.manual!.selected).toBe(3);
      expect(context.manual!.compare).toBe(true);
      click('对比 8 个等待位');
      expect(currentDisplay()).toBe(before);
    }
  });

  it('the real reset handler restores every control, comparison, selection, mode and clock', () => {
    context.manual = {
      config: { ...routingReset().config, count: 12, capacity: 10, ttl: 1, interval: 0.08 },
      compare: true,
      mode: 'failure',
      router: 'C',
      selected: 12,
      time: 0.9,
    };
    context.watch = false;
    click('重置分组网络');
    expect(context.manual).toEqual(routingReset());
    const html = currentDisplay();
    expect(html).toContain('0.0 ms');
    const ranges = [...html.matchAll(/<input\b[^>]*type="range"[^>]*>/g)];
    expect(ranges).toHaveLength(6);
    for (const match of ranges) expect(match[0]).toMatch(/aria-label="[^"]+"/);
  });

  it('leaves the P3 event coordinate unchanged and gives the B count badge real clearance', () => {
    const shot = routingShot(2, 0.5);
    expect(shot.state.packets[2].phase.kind).toBe('transmitting');
    expect(shot.state.packets[3].phase.kind).toBe('waiting');
    const html = renderToStaticMarkup(
      createElement(PacketRoutingMap, {
        ...shot,
        selected: 3,
        router: 'B',
        compact: false,
        costs: false,
      }),
    );
    const badge = html.match(/<g data-routing-queue="B">([\s\S]*?)<\/g>/)![1];
    expect(badge).toContain('d="M421 47L440 35"');
    expect(badge).toContain('cx="452" cy="27" r="13"');
    expect(badge).toContain('>1</text>');
    const marker = html
      .match(/<g data-routing-packet="3"><rect x="([^"]+)" y="([^"]+)"/)!
      .slice(1)
      .map(Number);
    expect(marker[0]).toBeCloseTo(412.3919192852624, 11);
    expect(marker[1]).toBeCloseTo(59.85811969761103, 11);
    expect(circleRectangleGap(452, 27, 13, marker[0], marker[1], 36, 26)).toBeGreaterThan(20);
    expect(27 - 13).toBeGreaterThanOrEqual(14);
  });

  it('keeps B count separate from all selected packet phases throughout the directed film', () => {
    let checked = 0;
    for (let chapter = 0; chapter < 8; chapter++)
      for (let frame = 0; frame <= 40; frame++) {
        const shot = routingShot(chapter, frame / 40);
        if (!shot.state.packets.some((p) => p.phase.kind === 'waiting' && p.phase.node === 'B'))
          continue;
        for (const packet of shot.state.packets) {
          const html = renderToStaticMarkup(
            createElement(PacketRoutingMap, {
              ...shot,
              selected: packet.id,
              router: 'B',
              compact: false,
              costs: true,
            }),
          );
          const marker = html.match(
            new RegExp(`<g data-routing-packet="${packet.id}"><rect x="([^"]+)" y="([^"]+)"`),
          );
          if (!marker) continue;
          expect(circleRectangleGap(452, 27, 13, +marker[1], +marker[2], 36, 26)).toBeGreaterThan(
            6,
          );
          checked++;
        }
      }
    expect(checked).toBeGreaterThan(100);
  });

  it('separates the phone B queue count from P3 and its neighboring link-cost label', () => {
    const pair = routingBufferComparison({
      ...routingReset().config,
      count: 12,
      interval: 0.004,
      brRate: 200000,
      capacity: 3,
    });
    const run = pair.baseline;
    const state = routingSnapshot(run, 0.298 * pair.duration);
    const html = renderToStaticMarkup(
      createElement(PacketRoutingMap, {
        run,
        state,
        selected: 3,
        router: 'B',
        compact: true,
        costs: true,
      }),
    );
    const badge = html.match(/<g data-routing-queue="B">([\s\S]*?)<\/g>/)![1];
    expect(badge).toContain('d="M45 137L44 149"');
    expect(badge).toContain('cx="44" cy="162" r="13"');
    expect(badge).toContain('>2</text>');
    const marker = html.match(/<g data-routing-packet="3"><rect x="([^"]+)" y="([^"]+)"/)!;
    expect(circleRectangleGap(44, 162, 13, +marker[1], +marker[2], 36, 26)).toBeGreaterThan(9);
    expect(html).toContain(
      'x="24" y="198" text-anchor="middle" fill="#d0c4a5" font-size="22">1</text>',
    );
  });
});

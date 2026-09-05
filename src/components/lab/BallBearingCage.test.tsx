import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { BEARING as B, bearingShot, bearingState } from '../../models/ball-bearing';
import { bearingPocketGeometry } from '../three/BallBearingStudio';
import BallBearingCage, { bearingCageSection } from './BallBearingCage';
import BallBearingInspection from './BallBearingInspection';

describe('bearing pocket section and closed shell', () => {
  it('keeps the inner and outer spherical surfaces and all four seam directions consistent', () => {
    for (const side of [0, Math.PI]) {
      const geometry = bearingPocketGeometry(side);
      try {
        const indices = geometry.index!,
          positions = geometry.getAttribute('position');
        const edges = new Map<string, { count: number; direction: number }>();
        let volume = 0,
          minimumGap = Infinity;
        const a = new THREE.Vector3(),
          b = new THREE.Vector3(),
          c = new THREE.Vector3();
        for (let i = 0; i < positions.count; i++) {
          a.fromBufferAttribute(positions, i);
          minimumGap = Math.min(minimumGap, a.length() - B.ball);
        }
        for (let i = 0; i < indices.count; i += 3) {
          const ids = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
          a.fromBufferAttribute(positions, ids[0]);
          b.fromBufferAttribute(positions, ids[1]);
          c.fromBufferAttribute(positions, ids[2]);
          volume += a.dot(b.clone().cross(c)) / 6;
          const normal = b.clone().sub(a).cross(c.clone().sub(a));
          if (normal.lengthSq() > 1e-24 && i < 32 * 18 * 12) {
            const outward = normal.dot(a.clone().add(b).add(c));
            expect(ids[0] < 627 ? outward < 0 : outward > 0).toBe(true);
          }
          for (let j = 0; j < 3; j++) {
            const from = ids[j],
              to = ids[(j + 1) % 3],
              key = `${Math.min(from, to)}:${Math.max(from, to)}`;
            const edge = edges.get(key) ?? { count: 0, direction: 0 };
            edge.count++;
            edge.direction += from < to ? 1 : -1;
            edges.set(key, edge);
          }
        }
        for (const edge of edges.values()) {
          expect(edge.count).toBe(2);
          expect(edge.direction).toBe(0);
        }
        expect(volume).toBeGreaterThan(0);
        expect(minimumGap).toBeCloseTo(B.pocketClearance, 6);
      } finally {
        geometry.dispose();
      }
    }
  });
  it('uses the 3D pocket equator with the original clearance in its 2D section', () => {
    for (const side of [0, Math.PI]) {
      const points = bearingCageSection(side);
      expect(points).toHaveLength(38);
      points.forEach((point, i) =>
        expect(Math.hypot(point.x, point.y)).toBeCloseTo(
          B.ball + B.pocketClearance + (i < 19 ? 0 : B.pocketThickness),
          12,
        ),
      );
    }
  });
  it('shows every pocket attached to its identified ball center, with independent ball spin', () => {
    for (const angle of [-6 * Math.PI, 0, 1.723, 16 * Math.PI]) {
      const state = bearingState(angle);
      const html = renderToStaticMarkup(<BallBearingCage state={state} />);
      expect(html.match(/data-pocket-id=/g)).toHaveLength(B.count);
      expect(html.match(/data-ball-id=/g)).toHaveLength(B.count);
      expect(html).toContain(`data-cage-angle="${state.cageAngle}"`);
      for (const ball of state.balls) {
        const a = -Math.PI / 2 + (ball.id * 2 * Math.PI) / B.count + state.cageAngle;
        expect(B.pitch * Math.cos(a)).toBeCloseTo(ball.x, 12);
        expect(B.pitch * Math.sin(a)).toBeCloseTo(ball.y, 12);
      }
      const tracked = state.balls[0];
      expect(html).toContain(`cx="${B.ball * 0.76 * Math.cos(tracked.spin)}"`);
      expect(html).toContain(`cy="${B.ball * 0.76 * Math.sin(tracked.spin)}"`);
      const fresh = renderToStaticMarkup(<BallBearingCage state={bearingState(angle)} />);
      expect(fresh).toBe(html);
    }
  });
  it('keeps contact and patch readouts outside scaled SVG in watch and exploration', () => {
    for (const chapter of [1, 3, 5, 6])
      for (const compact of [false, true]) {
        const shot = bearingShot(chapter, 0.6),
          state = bearingState(shot.innerAngle);
        const html = renderToStaticMarkup(
          <BallBearingInspection state={state} shot={shot} compact={compact} />,
        );
        expect(html).not.toMatch(/<text[ >]/);
        if (chapter === 1 || (chapter === 3 && !compact)) {
          expect(html).toContain('bb-contact-reading');
          expect(html).toContain('v/2');
        }
        if (chapter >= 5) expect(html).toContain('bb-diagram-note');
      }
  });
  it('renders the actual cage section in the phone orbit chapter, rather than only a pitch circle', () => {
    const shot = bearingShot(2, 0.5);
    const html = renderToStaticMarkup(
      <BallBearingInspection state={bearingState(shot.innerAngle)} shot={shot} compact />,
    );
    expect(html).toContain('bb-cage-section');
    expect(html.match(/data-pocket-id=/g)).toHaveLength(B.count);
    expect(html).not.toContain('stroke-dasharray');
  });
});

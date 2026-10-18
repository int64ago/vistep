import { expect, it } from 'vitest';
import {
  strongTitration,
  titrationFlaskGeometry,
  endpointVolume,
  readingVolume,
  titrationErrors,
  rinseCarryover,
  halfDropState,
  textbookTitrationMean,
  studentTitrationRows,
} from './chem-acid-base-titration';
it('strong-acid curve agrees with stoichiometry away from equivalence and water at equivalence', () => {
  expect(strongTitration('base-into-acid', 0).pH).toBeCloseTo(1, 10);
  expect(strongTitration('base-into-acid', 10).pH).toBeCloseTo(-Math.log10(0.001 / 0.03), 10);
  expect(strongTitration('base-into-acid', 20).pH).toBeCloseTo(7, 10);
  expect(strongTitration('base-into-acid', 40).pH).toBeCloseTo(14 + Math.log10(0.002 / 0.06), 10);
  for (let v = 0; v <= 40; v += 0.05) {
    const a = strongTitration('base-into-acid', v),
      b = strongTitration('acid-into-base', v);
    expect(a.pH + b.pH).toBeCloseTo(14, 9);
    expect(a.h * a.oh).toBeCloseTo(1e-14, 20);
    expect(a.acidLeft + a.neutralized).toBeCloseTo(a.acid, 14);
    expect(a.baseLeft + a.neutralized).toBeCloseTo(a.base, 14);
  }
});
it('indicator transition endpoints lie on either side of exact equivalence and need not be pH7', () => {
  expect(endpointVolume('base-into-acid', 8.2)).toBeGreaterThan(20);
  expect(endpointVolume('base-into-acid', 4.4)).toBeLessThan(20);
  expect(endpointVolume('acid-into-base', 8.2)).toBeLessThan(20);
  expect(strongTitration('acid-into-base', 19.975).pink).toBeGreaterThan(0.8);
  expect(strongTitration('acid-into-base', 20).pink).toBe(0);
});
it('half-drop cannot neutralize the bulk before physical wall delivery and washing', () => {
  expect(halfDropState(0.2).bulk).toBe(0);
  expect(halfDropState(0.4).wall).toBeCloseTo(0.025);
  for (let i = 0; i <= 100; i++) {
    const a = halfDropState(i / 100);
    expect(a.hanging + a.wall + a.bulk).toBeCloseTo(a.formed, 12);
    expect(a.reading - a.bulkDelivered).toBeCloseTo(a.hanging + a.wall, 12);
  }
  const contact = halfDropState(0.28);
  expect(167 + contact.flaskDy).toBe(125);
  expect(contact.flaskDx - 22).toBe(0);
  const end = halfDropState(0.95);
  expect(end.bulk).toBeCloseTo(0.025);
  expect(end.state.pH).toBeCloseTo(7);
  expect(end.clock).toBe(30);
});
it('water in flask preserves equivalence but water in burette and extra analyte bias result high', () => {
  expect(strongTitration('acid-into-base', 20, 0.1, 20, 0.1, 5).pH).toBeCloseTo(7);
  expect(titrationErrors('flask-water').inferredC).toBeCloseTo(0.1);
  expect(titrationErrors('burette-water').inferredC).toBeCloseTo(0.1020408163, 9);
  expect(titrationErrors('flask-sample').inferredC).toBeCloseTo(0.105);
  expect(titrationErrors('tip-bubble').inferredC).toBeCloseTo(0.101);
  expect(rinseCarryover(3).waterMl).toBeLessThan(rinseCarryover(1).waterMl);
});
it('readings increase downwards; real records start empty and example uses actual textbook data', () => {
  expect(readingVolume(2.35, 22.35)).toBeCloseTo(20);
  expect(readingVolume(22, 2)).toBeNull();
  expect(readingVolume(0, 51)).toBeNull();
  expect(studentTitrationRows([{ initial: '', final: '' }]).mean).toBeNull();
  expect(studentTitrationRows([{ initial: '0', final: '20' }]).mean).toBeCloseTo(0.1);
  expect(textbookTitrationMean()).toBeCloseTo(0.11492352, 10);
});

it('drawn flask volume follows the tapered interior and remains inside its rounded base', () => {
  const integrate = (h: number) => {
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      const z = ((i + 0.5) * h) / 10000,
        r = z < 10 ? 44 + 20 * Math.sqrt(z / 10) - (12 * z) / 10 : 52 - 0.4 * (z - 10);
      sum += (Math.PI * r * r * h) / 10000;
    }
    return sum;
  };
  const full = integrate(60);
  for (const ml of [0.01, 1, 5, 20, 40, 50]) {
    const g = titrationFlaskGeometry(ml);
    expect((integrate(g.height) / full) * 50).toBeCloseTo(ml, 4);
    expect(g.level).toBeGreaterThanOrEqual(217);
    expect(g.level).toBeLessThan(277);
  }
});

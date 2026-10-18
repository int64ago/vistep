export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export function saponify(p: number) {
  const x = clamp(p);
  return {
    triglyceride: 1 - x,
    glycerol: x,
    soap: 3 * x,
    hydroxide: 3 * (1 - x),
    esterBonds: 3 * (1 - x),
  };
}
export function saltOut(soap: number, salt: number) {
  const capacity = 3 / (1 + 4 * Math.max(0, salt)),
    dissolved = Math.min(soap, capacity);
  return { dissolved, curd: Math.max(0, soap - dissolved), capacity };
}
export function washCurd(washVolumes: number, initialContaminant = 1) {
  return initialContaminant / (1 + Math.max(0, washVolumes));
}
export function hardWater(soap: number, calcium: number) {
  const calciumSoap = Math.min(Math.max(0, calcium), Math.max(0, soap) / 2);
  return {
    calciumSoap,
    active: Math.max(0, soap - 2 * calciumSoap),
    calcium: Math.max(0, calcium - calciumSoap),
  };
}
export type Point = { x: number; y: number };
export function amphiphile(
  i: number,
  count: number,
  assembly: number,
  center: Point = { x: 160, y: 125 },
  oilRadius = 45,
) {
  const theta = (i / count) * Math.PI * 2,
    headRadius = oilRadius + 12;
  const a = clamp(assembly),
    initialAngle = -Math.PI + ((i + 0.5) / count) * Math.PI;
  const targetAngle = theta > Math.PI ? theta - 2 * Math.PI : theta;
  const angle = initialAngle + (targetAngle - initialAngle) * a,
    radius = 95 + (headRadius - 95) * a;
  const head = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  const inwardX = Math.cos(angle),
    inwardY = Math.sin(angle),
    tangentX = -inwardY,
    tangentY = inwardX;
  const tail = Array.from({ length: 7 }, (_, j) => {
    const d = 4 + j * 5,
      w = (j % 2 ? 2.4 : -2.4) * (j === 0 ? 0 : 1);
    return { x: head.x - inwardX * d + tangentX * w, y: head.y - inwardY * d + tangentY * w };
  });
  return { id: `soap-${i}`, head, tail };
}
export function oilLift(assembly: number, agitation: number, active: number) {
  const coverage = Math.min(1, Math.max(0, active) / 3) * clamp(assembly),
    lift = coverage * clamp(agitation);
  return { x: 160, y: 165 - 70 * lift, radius: 45, coverage };
}
export function esterGeometry(index: number, p: number) {
  const q = clamp(p),
    y = 50 + index * 65;
  return {
    id: `ester-${index}`,
    glycerolCarbon: { x: 45, y },
    glycerolOxygen: { x: 100, y },
    acylCarbon: { x: 160 + 85 * q, y },
    carbonylOxygen: { x: 160 + 85 * q, y: y - 26 },
    incomingOxygen: { x: 160 + 120 * q, y: y + 28 },
    chainEnd: { x: 270 + 55 * q, y },
    bond: 1 - q,
  };
}

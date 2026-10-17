/** Rigid Cardan-joint kinematics. Input axis X, intermediate axis bent in XY.
 * Input trunnion starts at +Y; intermediate trunnion starts at +Z. This phase
 * convention has the first speed maximum at input angle zero. */
export type JointVector = { x: number; y: number; z: number };
const cross = (a: JointVector, b: JointVector): JointVector => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const unit = (v: JointVector) => {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};
function unwrap(value: number, reference: number) {
  return value + 2 * Math.PI * Math.round((reference - value) / (2 * Math.PI));
}
export function universalJointState(
  input: number,
  bend: number,
  paired = false,
  secondBend = bend,
) {
  if (
    ![input, bend, secondBend].every(Number.isFinite) ||
    bend < 0 ||
    bend > 60 ||
    secondBend < 0 ||
    secondBend > 60
  )
    throw new RangeError('Finite input angle and bends from 0 to 60 degrees required');
  const b = (bend * Math.PI) / 180,
    d = (secondBend * Math.PI) / 180,
    cos = Math.cos(b),
    middle = unwrap(Math.atan2(Math.sin(input), cos * Math.cos(input)), input),
    middleRatio = cos / (Math.sin(input) ** 2 + cos * cos * Math.cos(input) ** 2),
    output = paired
      ? unwrap(Math.atan2(Math.cos(d) * Math.sin(middle), Math.cos(middle)), middle)
      : middle,
    ratio = paired
      ? (middleRatio * Math.cos(d)) /
        (Math.cos(middle) ** 2 + Math.cos(d) ** 2 * Math.sin(middle) ** 2)
      : middleRatio;
  const inputAxis = { x: 1, y: 0, z: 0 },
    middleAxis = { x: Math.cos(b), y: Math.sin(b), z: 0 },
    outputAxis = paired ? { x: Math.cos(b - d), y: Math.sin(b - d), z: 0 } : middleAxis,
    inputPin = { x: 0, y: Math.cos(input), z: Math.sin(input) },
    middlePin = unit(cross(middleAxis, inputPin)),
    outputPin = paired ? unit(cross(middlePin, outputAxis)) : middlePin;
  return {
    input,
    middle,
    output,
    middleRatio,
    ratio,
    inputAxis,
    middleAxis,
    outputAxis,
    inputPin,
    middlePin,
    outputPin,
    min: cos,
    max: 1 / cos,
    paired,
    bend,
    secondBend,
  };
}
export function universalJointShot(chapter: number, progress: number) {
  const u = Math.max(0, Math.min(1, progress));
  let bend = 30,
    secondBend = 30,
    input = u * Math.PI * 2,
    paired = false;
  if (chapter === 0) bend = 0;
  if (chapter === 1) {
    bend = 30 * u;
    input = Math.PI / 4;
  }
  if (chapter === 3) {
    bend = 35 * Math.sin(Math.PI * u);
    input = 0;
  }
  if (chapter === 4) input = u * Math.PI * 4;
  if (chapter >= 5) {
    paired = true;
    input = u * Math.PI * 4;
    secondBend = chapter === 5 ? 30 : 15;
  }
  return universalJointState(input, bend, paired, secondBend);
}
export type UniversalJointState = ReturnType<typeof universalJointState>;

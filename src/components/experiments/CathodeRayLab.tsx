import ModernPhysicsSeries from './ModernPhysicsSeries';
export default function CathodeRayLab() {
  return (
    <ModernPhysicsSeries
      segments={[
        {
          kind: 'electron',
          firstChapter: 0,
          name: ['偏转与比荷', 'Deflection and charge-to-mass ratio'],
          variants: ['e3-thomson-electron'],
        },
        {
          kind: 'lenard',
          firstChapter: 4,
          name: ['勒纳德金属窗', 'Lenard’s metal window'],
          variants: ['e3-lenard-electron-foil'],
        },
      ]}
    />
  );
}

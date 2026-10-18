import ModernPhysicsSeries from './ModernPhysicsSeries';
export default function PhotoelectricLab() {
  return (
    <ModernPhysicsSeries
      segments={[
        {
          kind: 'zinc',
          firstChapter: 0,
          name: ['锌板验电器', 'Zinc electroscope'],
          variants: ['e3-photoelectric-zinc'],
        },
        {
          kind: 'photoelectric',
          firstChapter: 2,
          name: ['光电管', 'Photocell'],
          variants: ['e3-photoelectric-cell'],
        },
        {
          kind: 'planck',
          firstChapter: 5,
          name: ['测量普朗克常量', 'Measuring Planck’s constant'],
          variants: ['e3-photoelectric-planck-measurement'],
        },
      ]}
    />
  );
}

import ModernPhysicsSeries from './ModernPhysicsSeries';
export default function OilDropLab() {
  return (
    <ModernPhysicsSeries
      segments={[
        {
          kind: 'oil',
          firstChapter: 0,
          name: ['油滴测量', 'Oil-drop measurement'],
          variants: ['r3-millikan-charge', 'e3-millikan-oil-drop'],
        },
      ]}
    />
  );
}

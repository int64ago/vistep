import ModernPhysicsSeries from './ModernPhysicsSeries';
export default function BlackbodyLab() {
  return (
    <ModernPhysicsSeries
      segments={[
        {
          kind: 'blackbody',
          firstChapter: 0,
          name: ['黑体辐射', 'Blackbody radiation'],
          variants: ['e3-blackbody-spectrum-measurement'],
        },
      ]}
    />
  );
}

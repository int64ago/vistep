import ModernPhysicsSeries from './ModernPhysicsSeries';
export default function AtomicSpectrumLab() {
  return (
    <ModernPhysicsSeries
      segments={[
        {
          kind: 'sodium',
          firstChapter: 0,
          name: ['食盐焰色', 'Sodium flame'],
          variants: ['e3-salt-flame'],
        },
        {
          kind: 'hydrogen',
          firstChapter: 2,
          name: ['氢线光谱', 'Hydrogen spectrum'],
          variants: ['e3-hydrogen-spectrum'],
        },
        {
          kind: 'solar',
          firstChapter: 4,
          name: ['太阳暗线', 'Solar absorption'],
          variants: ['e3-fraunhofer-spectral-analysis'],
        },
        {
          kind: 'lamb',
          firstChapter: 6,
          name: ['精密氢光谱', 'Precision hydrogen spectroscopy'],
          variants: ['e3-precision-hydrogen-spectrum'],
        },
      ]}
    />
  );
}

import ModernPhysicsSeries from './ModernPhysicsSeries';
export default function AtomicScatteringLab() {
  return (
    <ModernPhysicsSeries
      segments={[
        {
          kind: 'rutherford',
          firstChapter: 0,
          name: ['α粒子散射', 'Alpha-particle scattering'],
          variants: ['e3-rutherford-scattering'],
        },
        {
          kind: 'compton',
          firstChapter: 3,
          name: ['康普顿散射', 'Compton scattering'],
          variants: ['e3-compton-scattering'],
        },
      ]}
    />
  );
}

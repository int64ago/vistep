import { useSyncExternalStore } from 'react';
const queryText = '(max-width: 760px)';
const subscribe = (callback: () => void) => {
  const query = matchMedia(queryText);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};
/** Recompose diagrams on phones instead of shrinking their labels and objects. */
export function useCompact() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(queryText).matches,
    () => false,
  );
}

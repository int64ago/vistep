type PreferenceStore = Pick<Storage, 'getItem' | 'setItem'>;
type Stores = Array<() => PreferenceStore>;
const browserStores = (): Stores => [() => localStorage, () => sessionStorage];

/** An explicit choice wins; a first visit requests narration. Storage may be unavailable. */
export function narrationPreference(stores: Stores = browserStores()) {
  for (const getStore of stores) {
    try {
      const value = getStore().getItem('vistep:narration');
      if (value === 'on' || value === 'off') return value === 'on';
    } catch {}
  }
  return true;
}

export function rememberNarration(on: boolean, stores: Stores = browserStores()) {
  for (const getStore of stores) {
    try {
      getStore().setItem('vistep:narration', on ? 'on' : 'off');
    } catch {}
  }
}

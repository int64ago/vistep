/** LRU storage bounded by the estimated retained bytes, rather than a number of entries. */
export class ByteCache<K, V> {
  private entries = new Map<K, { value: V; bytes: number }>();
  private used = 0;

  constructor(
    readonly budget: number,
    private readonly measure: (value: V) => number,
  ) {}

  get retainedBytes() {
    return this.used;
  }
  get size() {
    return this.entries.size;
  }
  get(key: K): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }
  set(key: K, value: V) {
    const previous = this.entries.get(key);
    if (previous) {
      this.used -= previous.bytes;
      this.entries.delete(key);
    }
    const bytes = this.measure(value);
    // A single slow route can be larger than the entire cache; its caller may use it without
    // retaining another reference here or evicting useful small entries.
    if (!Number.isFinite(bytes) || bytes < 0 || bytes > this.budget) return;
    while (this.used + bytes > this.budget) {
      const oldest = this.entries.keys().next().value!;
      this.used -= this.entries.get(oldest)!.bytes;
      this.entries.delete(oldest);
    }
    this.entries.set(key, { value, bytes });
    this.used += bytes;
  }
  clear() {
    this.entries.clear();
    this.used = 0;
  }
}

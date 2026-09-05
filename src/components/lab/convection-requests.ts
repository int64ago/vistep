/** One worker job in flight; replace queued samples with the latest film position.
 * Completed forward samples may be displayed while the next sample is computed. */
export class ConvectionRequests {
  private nextId = 0;
  private active: { id: number; time: number } | null = null;
  private pending: number | null = null;
  private closed = false;

  constructor(private readonly send: (id: number, time: number) => void) {}

  request(time: number) {
    if (this.closed) return;
    if (this.active) {
      this.pending = time === this.active.time ? null : time;
      return;
    }
    this.dispatch(time);
  }

  private dispatch(time: number) {
    this.active = { id: ++this.nextId, time };
    this.send(this.active.id, time);
  }

  complete(id: number, receive: () => void) {
    if (this.closed || id !== this.active?.id) return;
    this.active = null;
    receive();
    if (this.closed) return;
    const next = this.pending;
    this.pending = null;
    if (next !== null) this.dispatch(next);
  }

  dispose() {
    this.closed = true;
    this.active = null;
    this.pending = null;
  }
}

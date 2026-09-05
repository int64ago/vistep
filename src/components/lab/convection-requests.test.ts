import { describe, expect, it } from 'vitest';
import { ConvectionRequests } from './convection-requests';

describe('convection worker backpressure', () => {
  it('keeps displaying completed samples when computation is slower than animation', () => {
    const jobs: { id: number; time: number; due: number }[] = [];
    const displayed: number[] = [];
    let now = 0;
    let maxInFlight = 0;
    const queue = new ConvectionRequests((id, time) => {
      jobs.push({ id, time, due: now + 40 });
      maxInFlight = Math.max(maxInFlight, jobs.length);
    });
    for (now = 0; now < 3000; now++) {
      if (now < 2880 && now % 16 === 0) queue.request(now / 1000);
      if (jobs[0]?.due === now) {
        const job = jobs.shift()!;
        queue.complete(job.id, () => displayed.push(job.time));
      }
    }
    expect(maxInFlight).toBe(1);
    expect(displayed.length).toBeGreaterThan(60);
    expect(displayed.at(-1)).toBe(2.864);
    expect(displayed.every((t, i) => i === 0 || t > displayed[i - 1])).toBe(true);
  });

  it('replaces intermediate requests with the latest position, including backward seeks', () => {
    const sent: [number, number][] = [];
    const queue = new ConvectionRequests((id, time) => sent.push([id, time]));
    queue.request(20);
    queue.request(21);
    queue.request(35);
    queue.request(2);
    expect(sent).toEqual([[1, 20]]);
    queue.complete(1, () => {});
    expect(sent).toEqual([
      [1, 20],
      [2, 2],
    ]);
  });

  it('does not duplicate an in-flight position when initialization effects request it twice', () => {
    const sent: number[] = [];
    const queue = new ConvectionRequests((_id, time) => sent.push(time));
    queue.request(0);
    queue.request(0);
    queue.complete(1, () => {});
    expect(sent).toEqual([0]);
  });

  it('ignores late replies and queued work after navigation or fallback disposal', () => {
    const sent: number[] = [];
    let received = 0;
    const queue = new ConvectionRequests((_id, time) => sent.push(time));
    queue.request(1);
    queue.request(2);
    queue.dispose();
    queue.complete(1, () => received++);
    queue.request(3);
    expect(sent).toEqual([1]);
    expect(received).toBe(0);
  });

  it('ignores unrelated replies and advances after a handled worker failure', () => {
    const sent: number[] = [];
    let received = 0;
    const queue = new ConvectionRequests((_id, time) => sent.push(time));
    queue.request(1);
    queue.request(2);
    queue.complete(99, () => received++);
    expect(received).toBe(0);
    expect(sent).toEqual([1]);
    queue.complete(1, () => received++);
    expect(received).toBe(1);
    expect(sent).toEqual([1, 2]);
  });
});

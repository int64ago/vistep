function check(initial: number, rate: number, capacity: number, time: number) {
  if (
    !Number.isFinite(initial) ||
    initial < 0 ||
    initial > 400 ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 2 ||
    !Number.isFinite(capacity) ||
    capacity < 1 ||
    capacity > 200 ||
    !Number.isFinite(time) ||
    time < 0 ||
    time > 40
  )
    throw new RangeError('Invalid logistic parameters');
}
export function logisticRate(population: number, rate = 0.6, capacity = 100) {
  check(population, rate, capacity, 0);
  return rate * population * (1 - population / capacity);
}
export function logisticValue(time: number, initial = 10, rate = 0.6, capacity = 100) {
  check(initial, rate, capacity, time);
  if (initial === 0 || rate === 0) return initial;
  return capacity / (1 + (capacity / initial - 1) * Math.exp(-rate * time));
}
export function logisticSwitched(
  time: number,
  initial = 10,
  rate = 0.6,
  capacity = 100,
  nextCapacity = 60,
  switchAt = 6,
) {
  check(initial, rate, nextCapacity, time);
  check(initial, rate, capacity, switchAt);
  return time <= switchAt
    ? logisticValue(time, initial, rate, capacity)
    : logisticValue(
        time - switchAt,
        logisticValue(switchAt, initial, rate, capacity),
        rate,
        nextCapacity,
      );
}
export function logisticTrace(
  initial = 10,
  rate = 0.6,
  capacity = 100,
  until = 14,
  nextCapacity: number | null = null,
  switchAt = 6,
) {
  check(initial, rate, capacity, until);
  if (nextCapacity !== null) check(initial, rate, nextCapacity, switchAt);
  return Array.from({ length: 141 }, (_, i) => {
    const time = (until * i) / 140;
    return {
      time,
      value:
        nextCapacity === null
          ? logisticValue(time, initial, rate, capacity)
          : logisticSwitched(time, initial, rate, capacity, nextCapacity, switchAt),
    };
  });
}

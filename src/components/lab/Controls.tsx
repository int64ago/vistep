import type { CSSProperties, ReactNode } from 'react';
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  help,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (n: number) => void;
  help?: string;
}) {
  return (
    <label className="control">
      <span className="control-top">
        <span>{label}</span>
        <output>
          {step < 1 ? value.toFixed((String(step).split('.')[1] || '').length) : value} {unit}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {help && <small>{help}</small>}
    </label>
  );
}
export function Metric({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
    </div>
  );
}
export function Segments<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label} style={{ '--swatch': i.color } as CSSProperties}>
          <i />
          {i.label}
        </span>
      ))}
    </div>
  );
}
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

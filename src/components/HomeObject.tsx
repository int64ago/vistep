import { useState } from 'react';
import PrinterStudio from './three/PrinterStudio';
const heart = [
  '01100110',
  '11111111',
  '11111111',
  '01111110',
  '00111100',
  '00011000',
  '00000000',
  '00000000',
];
export default function HomeObject() {
  const [open, setOpen] = useState(true);
  return (
    <div className="home-object">
      <div className="object-overline">
        <span>
          <i /> INTERACTIVE OBJECT 003
        </span>
        <span>LASER PRINTER</span>
      </div>
      <PrinterStudio
        progress={2.4}
        exploded={open}
        pattern={heart}
        selected={11}
        charges={false}
        view="perspective"
      />
      <div className="object-caption">
        <span>
          熟悉的外表，
          <br />
          <b>意想不到的内部。</b>
        </span>
        <button className="object-toggle" onClick={() => setOpen(!open)} aria-pressed={open}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          {open ? '合上外壳' : '打开外壳'}
        </button>
      </div>
      <span className="object-hint">拖动，换个角度看</span>
    </div>
  );
}

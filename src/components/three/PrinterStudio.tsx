import { useRef } from 'react';
import Studio from './Studio';
import { createPrinter, type PrinterVisualState } from './printerModel';
export default function PrinterStudio(props: PrinterVisualState & { className?: string }) {
  const current = useRef(props);
  current.current = props;
  return (
    <Studio
      className={props.className}
      label="激光打印机三维拆解：感光鼓、激光扫描器、传动齿轮、转印辊和定影器"
      cameraPosition={[8, 6.5, 10]}
      target={[0, 1.1, 0]}
      span={11.2}
      create={(context) => createPrinter(context, () => current.current)}
      fallback={
        <svg viewBox="0 0 700 380" aria-label="打印路径的二维剖面">
          <path d="M60 280H645" stroke="#b6b5af" strokeWidth="8" />
          <circle cx="290" cy="211" r="65" fill="#267f74" />
          <circle cx="290" cy="290" r="14" fill="#343d40" />
          <path d="M160 120H290V146" stroke="#ea6733" strokeWidth="3" />
          <rect x="363" y="175" width="65" height="70" rx="8" fill="#394147" />
          <circle cx="535" cy="255" r="23" fill="#b97139" />
          <circle cx="535" cy="305" r="23" fill="#394147" />
          <g fill="#394147" fontSize="16" textAnchor="middle">
            <text x="290" y="216" fill="white">
              感光鼓
            </text>
            <text x="160" y="100">
              激光扫描
            </text>
            <text x="398" y="155">
              碳粉
            </text>
            <text x="535" y="211">
              定影
            </text>
            <text x="150" y="330">
              纸张 →
            </text>
          </g>
        </svg>
      }
    />
  );
}

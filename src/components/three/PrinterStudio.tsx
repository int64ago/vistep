import { useRef } from 'react';
import Studio from './Studio';
import PrinterFlat from './PrinterFlat';
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
      fallback={<PrinterFlat {...props} />}
    />
  );
}

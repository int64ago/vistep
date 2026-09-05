import { useEffect, useRef } from 'react';
import { t } from '../../i18n';
import { airyDiameter, circleOfConfusion, relativeLight } from '../../models/optics';
export default function AperturePhoto({
  fNumber,
  focus,
  compensate,
}: {
  fNumber: number;
  focus: number;
  compensate: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    layers = useRef<HTMLCanvasElement[]>([]);
  useEffect(() => {
    layers.current = [6000, 3000, 2000, 1300].map((distance, index) => {
      const layer = document.createElement('canvas');
      layer.width = 900;
      layer.height = 600;
      const c = layer.getContext('2d')!;
      if (index === 0) {
        const sky = c.createLinearGradient(0, 0, 0, 600);
        sky.addColorStop(0, '#263e3a');
        sky.addColorStop(0.55, '#4d6657');
        sky.addColorStop(1, '#1c382f');
        c.fillStyle = sky;
        c.fillRect(0, 0, 900, 600);
        for (let i = 0; i < 11; i++) {
          const x = i * 94 - 20,
            h = 140 + (Math.sin(i * 7) + 1) * 85;
          c.fillStyle = i % 2 ? '#314b43' : '#2a433b';
          c.fillRect(x, 420 - h, 79, h);
          for (let row = 0; row < 4; row++)
            for (let col = 0; col < 3; col++) {
              c.fillStyle = (i + row + col) % 3 ? '#839780' : '#d8c598';
              c.fillRect(x + 14 + col * 20, 438 - h + row * 35, 8, 13);
            }
        }
        c.strokeStyle = '#c8b787';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, 140);
        c.quadraticCurveTo(400, 225, 900, 135);
        c.stroke();
      }
      if (index === 1) {
        c.fillStyle = '#b4a47d';
        c.beginPath();
        c.ellipse(680, 481, 85, 20, 0, 0, Math.PI * 2);
        c.fill();
        const vase = c.createLinearGradient(620, 0, 740, 0);
        vase.addColorStop(0, '#595d46');
        vase.addColorStop(0.4, '#aa9d71');
        vase.addColorStop(1, '#474f3d');
        c.fillStyle = vase;
        c.beginPath();
        c.moveTo(626, 328);
        c.bezierCurveTo(596, 445, 620, 478, 680, 487);
        c.bezierCurveTo(740, 478, 764, 445, 734, 328);
        c.closePath();
        c.fill();
        c.strokeStyle = '#75875b';
        c.lineWidth = 4;
        for (let i = 0; i < 7; i++) {
          const x = 625 + i * 19,
            y = 235 - Math.sin(i) * 37;
          c.beginPath();
          c.moveTo(682, 365);
          c.quadraticCurveTo(x + 15, 285, x, y);
          c.stroke();
          c.fillStyle = i % 2 ? '#cebca0' : '#d4caa8';
          for (let p = 0; p < 5; p++) {
            c.beginPath();
            c.ellipse(
              x + Math.cos(p * 1.257) * 9,
              y + Math.sin(p * 1.257) * 9,
              13,
              8,
              p * 1.257,
              0,
              Math.PI * 2,
            );
            c.fill();
          }
        }
      }
      if (index === 2) {
        c.strokeStyle = '#708b58';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(377, 605);
        c.bezierCurveTo(353, 445, 436, 334, 420, 249);
        c.stroke();
        for (const [x, y, rotation] of [
          [394, 467, -0.8],
          [398, 390, 0.8],
          [416, 326, -0.65],
        ]) {
          c.save();
          c.translate(x, y);
          c.rotate(rotation);
          const leaf = c.createLinearGradient(-65, 0, 65, 0);
          leaf.addColorStop(0, '#557956');
          leaf.addColorStop(0.5, '#8da573');
          leaf.addColorStop(1, '#456746');
          c.fillStyle = leaf;
          c.beginPath();
          c.ellipse(0, 0, 66, 20, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = '#aebc8b';
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(-58, 0);
          c.lineTo(58, 0);
          c.stroke();
          c.restore();
        }
        for (let i = 0; i < 14; i++) {
          const a = (i * Math.PI) / 7;
          c.save();
          c.translate(420 + Math.cos(a) * 33, 249 + Math.sin(a) * 33);
          c.rotate(a);
          const petal = c.createLinearGradient(0, -12, 40, 15);
          petal.addColorStop(0, '#b5a98a');
          petal.addColorStop(0.4, '#ece7ce');
          petal.addColorStop(1, '#faf2d7');
          c.fillStyle = petal;
          c.beginPath();
          c.ellipse(18, 0, 34, 12, 0, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
        c.fillStyle = '#b88b43';
        c.beginPath();
        c.arc(420, 249, 29, 0, Math.PI * 2);
        c.fill();
        for (let i = 0; i < 220; i++) {
          const a = i * 2.39996,
            r = 1.72 * Math.sqrt(i);
          c.fillStyle = i % 3 ? '#6c6636' : '#d4b461';
          c.beginPath();
          c.arc(420 + Math.cos(a) * r, 249 + Math.sin(a) * r, 1.2, 0, Math.PI * 2);
          c.fill();
        }
      }
      if (index === 3) {
        c.strokeStyle = '#557447';
        c.lineWidth = 6;
        c.beginPath();
        c.moveTo(-30, 610);
        c.quadraticCurveTo(225, 515, 183, 360);
        c.stroke();
        for (let i = 0; i < 13; i++) {
          const x = 160 - i * 8,
            y = 380 + i * 18;
          for (const sign of [-1, 1]) {
            c.save();
            c.translate(x, y);
            c.rotate(sign * 0.65);
            c.fillStyle = i % 2 ? '#6d8957' : '#82986a';
            c.beginPath();
            c.ellipse(sign * 28, 0, 48, 10, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
        }
      }
      layer.dataset.distance = String(distance);
      return layer;
    });
    return () => {
      layers.current = [];
    };
  }, []);
  useEffect(() => {
    const c = canvas.current?.getContext('2d');
    if (!c) return;
    const width = 900,
      height = 600;
    c.clearRect(0, 0, width, height);
    for (const layer of layers.current) {
      const diameter =
        (circleOfConfusion(50, fNumber, Number(layer.dataset.distance), focus) * width) / 36;
      const diffraction = (airyDiameter(fNumber) * width) / 36;
      // Extended artwork uses a Gaussian approximation; isolated lights below use actual discs.
      const sigma = Math.sqrt(diameter * diameter + diffraction * diffraction) / 4;
      c.save();
      c.filter = `blur(${Math.min(28, sigma).toFixed(2)}px)`;
      c.drawImage(layer, 0, 0);
      c.restore();
      if (layer === layers.current[0]) {
        const r = Math.max(1.4, diameter / 2);
        for (let i = 0; i < 14; i++) {
          const x = 23 + i * 65,
            y = 144 + Math.sin((i / 13) * Math.PI) * 40;
          c.fillStyle = 'rgba(247,221,163,.58)';
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = 'rgba(255,230,183,.23)';
          c.lineWidth = 0.7;
          c.stroke();
        }
      }
    }
    if (!compensate) {
      c.fillStyle = `rgba(3,9,6,${1 - Math.sqrt(relativeLight(fNumber))})`;
      c.fillRect(0, 0, width, height);
    }
    const vignette = c.createRadialGradient(450, 250, 150, 450, 250, 600);
    vignette.addColorStop(0, '#0000');
    vignette.addColorStop(1, '#07120d66');
    c.fillStyle = vignette;
    c.fillRect(0, 0, width, height);
  }, [fNumber, focus, compensate]);
  return (
    <canvas
      ref={canvas}
      width="900"
      height="600"
      className="aperture-photo"
      role="img"
      aria-label={t('不同距离的花朵、绿叶和背景灯光；虚化大小由镜头模型计算')}
    />
  );
}

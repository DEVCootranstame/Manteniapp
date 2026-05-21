import React, { useRef, useEffect, useState } from 'react';
import { IonButton, IonLabel } from '@ionic/react';
import './FirmaCanvas.css';

interface FirmaCanvasProps {
  label: string;
  onFirma: (dataUrl: string) => void;
  firmaGuardada?: string;
}

const FirmaCanvas: React.FC<FirmaCanvasProps> = ({ label, onFirma, firmaGuardada }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(!!firmaGuardada);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (firmaGuardada) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = firmaGuardada;
    }
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    setDibujando(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); if (!dibujando) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };

  const endDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); if (!dibujando) return;
    setDibujando(false); setTieneFirma(true);
    const canvas = canvasRef.current;
    if (canvas) onFirma(canvas.toDataURL('image/png'));
  };

  const limpiar = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneFirma(false); onFirma('');
  };

  return (
    <div className="firma-container">
      <IonLabel className="firma-label">{label}</IonLabel>
      <div className="firma-wrapper">
        <canvas ref={canvasRef} className="firma-canvas"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {!tieneFirma && <span className="firma-placeholder">Firme aqui</span>}
      </div>
      {tieneFirma && <IonButton fill="clear" size="small" color="medium" onClick={limpiar}>Limpiar firma</IonButton>}
    </div>
  );
};

export default FirmaCanvas;

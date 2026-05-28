import React, { useState, useRef, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { businessOutline, chevronDownOutline } from 'ionicons/icons';
import { useAgenciaFilter } from '../context/AgenciaFilterContext';
import './AgenciaFilterSelect.css';

const AgenciaFilterSelect: React.FC = () => {
  const { isFilterActive, agenciaFilterId, agenciasDisponibles, setFilterAgencia } = useAgenciaFilter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al tocar fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!isFilterActive || agenciasDisponibles.length === 0) return null;

  const opciones = [{ id: 'todas', label: 'Todas' }, ...agenciasDisponibles.map(a => ({
    id: String(a.id),
    label: a.codigo ? `${a.codigo} - ${a.nombre}` : a.nombre,
  }))];

  const seleccionada = opciones.find(o => o.id === agenciaFilterId) || opciones[0];

  return (
    <div className="agencia-filter" ref={ref}>
      <button
        className="agencia-filter__btn"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <IonIcon icon={businessOutline} className="agencia-filter__icon" />
        <span className="agencia-filter__label">{seleccionada.label}</span>
        <IonIcon icon={chevronDownOutline} className={`agencia-filter__chevron ${open ? 'agencia-filter__chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="agencia-filter__dropdown">
          {opciones.map(op => (
            <button
              key={op.id}
              type="button"
              className={`agencia-filter__option ${op.id === agenciaFilterId ? 'agencia-filter__option--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setFilterAgencia(op.id);
                setOpen(false);
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgenciaFilterSelect;

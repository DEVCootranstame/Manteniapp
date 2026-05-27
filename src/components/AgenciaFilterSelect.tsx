import React from 'react';
import { IonIcon } from '@ionic/react';
import { businessOutline } from 'ionicons/icons';
import { useAgenciaFilter } from '../context/AgenciaFilterContext';
import './AgenciaFilterSelect.css';

const AgenciaFilterSelect: React.FC = () => {
  const { isFilterActive, agenciaFilterId, agenciasDisponibles, setFilterAgencia } = useAgenciaFilter();

  if (!isFilterActive || agenciasDisponibles.length === 0) return null;

  return (
    <div className="agencia-filter">
      <IonIcon icon={businessOutline} className="agencia-filter__icon" />
      <select
        className="agencia-filter__select"
        value={agenciaFilterId}
        onChange={(e) => setFilterAgencia(e.target.value)}
      >
        <option value="todas">Todas las agencias</option>
        {agenciasDisponibles.map((a) => (
          <option key={a.id} value={a.id}>
            {a.codigo ? `${a.codigo} - ${a.nombre}` : a.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AgenciaFilterSelect;

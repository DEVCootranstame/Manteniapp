import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent,
  IonSearchbar, IonSkeletonText, IonRefresher, IonRefresherContent,
  IonIcon, RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { desktopOutline, personOutline, alertCircleOutline, ellipsisVertical, hardwareChipOutline } from 'ionicons/icons';
import { EquiposService, ComputadoresListItem } from '../../services/equipos.service';
import { useAuth } from '../../context/AuthContext';
import { useAgenciaFilter } from '../../context/AgenciaFilterContext';
import AgenciaFilterSelect from '../../components/AgenciaFilterSelect';
import './ListaEquipos.css';

const ListaEquipos: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { getFilteredAgenciaId, agenciaFilterId } = useAgenciaFilter();
  const [equipos, setEquipos] = useState<ComputadoresListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadEquipos = useCallback(async (searchTerm?: string) => {
    try {
      setError(null);
      const agenciaId = getFilteredAgenciaId();
      const data = await EquiposService.getComputadores(agenciaId, searchTerm);
      setEquipos(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  }, [getFilteredAgenciaId]);

  useEffect(() => {
    loadEquipos();
  }, [loadEquipos]);

  // Re-cargar cuando cambia el filtro global de agencia
  useEffect(() => {
    loadEquipos(search);
  }, [agenciaFilterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: CustomEvent) => {
    const val = e.detail.value ?? '';
    setSearch(val);
    loadEquipos(val);
  };

  const handleRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await loadEquipos(search);
    e.detail.complete();
  };

  const getEstadoColor = (estado: string | null) => {
    switch (estado?.toLowerCase()) {
      case 'activo': return '#10B981';
      case 'inactivo': return '#94A3B8';
      case 'baja': return '#EF4444';
      default: return '#F97316';
    }
  };

  const sinResponsable = equipos.filter(e => !e.responsable_id).length;

  return (
    <IonPage>
      <IonContent className="equipos-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="chip-header">
          <div className="chip-header__left">
            <IonIcon icon={hardwareChipOutline} className="chip-header__icon" />
            <span className="chip-header__brand">C.H.I.P</span>
          </div>
          <span className="chip-header__subtitle">Equipos</span>
        </div>

        <div className="equipos-header-section">
          <h1 className="equipos-page-title">Equipos</h1>
          <AgenciaFilterSelect />
        </div>
        {sinResponsable > 0 && (
          <div className="equipos-alert-badge">
            <IonIcon icon={alertCircleOutline} />
            <span>{sinResponsable} sin responsable</span>
          </div>
        )}

        <div className="equipos-search-wrapper">
          <IonSearchbar
            value={search}
            onIonInput={handleSearch}
            placeholder="Buscar equipo..."
            debounce={400}
            className="equipos-searchbar"
          />
        </div>

        {error && (
          <div className="equipos-error">
            <IonIcon icon={alertCircleOutline} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="equipos-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="equipo-card equipo-card--skeleton">
                <IonSkeletonText animated style={{ width: '60%', height: '20px' }} />
                <IonSkeletonText animated style={{ width: '80%', height: '14px' }} />
              </div>
            ))}
          </div>
        ) : equipos.length === 0 ? (
          <div className="equipos-empty">
            <IonIcon icon={desktopOutline} />
            <p>No se encontraron equipos</p>
          </div>
        ) : (
          <div className="equipos-grid">
            {equipos.map(equipo => (
              <div
                key={equipo.id}
                className="equipo-card"
                onClick={() => history.push(`/equipos/${equipo.id}`)}
              >
                <div className="equipo-card__header">
                  <div className="equipo-card__icon">
                    <IonIcon icon={desktopOutline} />
                  </div>
                  <button className="equipo-card__menu">
                    <IonIcon icon={ellipsisVertical} />
                  </button>
                </div>
                <h3 className="equipo-card__code">{equipo.Codigo}</h3>
                <p className="equipo-card__responsable">
                  {equipo.responsable_nombre || 'Sin responsable'}
                </p>
                {equipo.agencia_nombre && (
                  <span className="equipo-card__agencia">{equipo.agencia_nombre}</span>
                )}
                <div className="equipo-card__footer">
                  <span className="equipo-card__estado" style={{ '--estado-color': getEstadoColor(equipo.estado) } as any}>
                    {equipo.estado || 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default ListaEquipos;

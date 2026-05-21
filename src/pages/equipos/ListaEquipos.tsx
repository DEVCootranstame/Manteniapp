import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonList, IonItem, IonLabel, IonBadge,
  IonSkeletonText, IonNote, IonRefresher, IonRefresherContent,
  IonIcon, IonChip, RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { desktopOutline, personOutline, alertCircleOutline } from 'ionicons/icons';
import { EquiposService, ComputadoresListItem } from '../../services/equipos.service';
import { useAuth } from '../../context/AuthContext';
import './ListaEquipos.css';

const ListaEquipos: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [equipos, setEquipos] = useState<ComputadoresListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadEquipos = useCallback(async (searchTerm?: string) => {
    try {
      setError(null);
      const agenciaId = user?.agencia_id ?? undefined;
      const data = await EquiposService.getComputadores(agenciaId, searchTerm);
      setEquipos(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEquipos();
  }, [loadEquipos]);

  const handleSearch = (e: CustomEvent) => {
    const val = e.detail.value ?? '';
    setSearch(val);
    loadEquipos(val);
  };

  const handleRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await loadEquipos(search);
    e.detail.complete();
  };

  const getEstadoBadgeColor = (estado: string | null) => {
    switch (estado?.toLowerCase()) {
      case 'activo': return 'success';
      case 'inactivo': return 'medium';
      case 'baja': return 'danger';
      default: return 'warning';
    }
  };

  const sinResponsable = equipos.filter(e => !e.responsable_id).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Equipos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {sinResponsable > 0 && (
          <div className="alerta-equipos">
            <IonIcon icon={alertCircleOutline} color="warning" />
            <span>{sinResponsable} equipo{sinResponsable > 1 ? 's' : ''} sin responsable</span>
          </div>
        )}

        <IonSearchbar
          value={search}
          onIonInput={handleSearch}
          placeholder="Buscar por código, responsable, serial..."
          debounce={400}
        />

        {error && (
          <div className="error-message">
            <IonIcon icon={alertCircleOutline} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <IonList>
            {[1, 2, 3, 4, 5].map(i => (
              <IonItem key={i}>
                <IonLabel>
                  <IonSkeletonText animated style={{ width: '60%' }} />
                  <IonSkeletonText animated style={{ width: '40%' }} />
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        ) : (
          <IonList>
            {equipos.length === 0 ? (
              <IonItem lines="none">
                <IonLabel className="ion-text-center" color="medium">
                  <IonIcon icon={desktopOutline} size="large" />
                  <p>No se encontraron equipos</p>
                </IonLabel>
              </IonItem>
            ) : (
              equipos.map(equipo => (
                <IonItem
                  key={equipo.id}
                  button
                  detail
                  onClick={() => history.push(`/equipos/${equipo.id}`)}
                >
                  <IonIcon icon={desktopOutline} slot="start" color="primary" />
                  <IonLabel>
                    <h2>{equipo.Codigo}</h2>
                    <p>
                      {equipo.responsable_nombre ? (
                        <>
                          <IonIcon icon={personOutline} /> {equipo.responsable_nombre}
                          {equipo.responsable_documento && ` • ${equipo.responsable_documento}`}
                        </>
                      ) : (
                        <span className="sin-responsable">Sin responsable asignado</span>
                      )}
                    </p>
                    {equipo.agencia_nombre && (
                      <IonNote>{equipo.agencia_nombre}{equipo.ubicacion_nombre && ` • ${equipo.ubicacion_nombre}`}</IonNote>
                    )}
                  </IonLabel>
                  <IonBadge slot="end" color={getEstadoBadgeColor(equipo.estado)}>
                    {equipo.estado || 'Sin estado'}
                  </IonBadge>
                </IonItem>
              ))
            )}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ListaEquipos;

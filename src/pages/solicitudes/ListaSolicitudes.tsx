import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonBadge, IonSkeletonText,
  IonRefresher, IonRefresherContent, IonIcon, IonSegment,
  IonSegmentButton, RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { swapHorizontalOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { SolicitudesService } from '../../services/solicitudes.service';
import { Solicitud } from '../../types/solicitud.types';
import './ListaSolicitudes.css';

const ListaSolicitudes: React.FC = () => {
  const history = useHistory();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('pendiente');

  const load = useCallback(async (estado: string) => {
    setLoading(true);
    try {
      const data = await SolicitudesService.getSolicitudes(undefined, estado === 'todas' ? undefined : estado);
      setSolicitudes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filtro); }, [filtro, load]);

  const handleRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await load(filtro);
    e.detail.complete();
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'aprobada': return 'success';
      case 'rechazada': return 'danger';
      default: return 'medium';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'cambio_responsable': return 'Cambio de responsable';
      case 'custodia_temporal': return 'Custodia temporal';
      case 'creacion_responsable': return 'Creacion de responsable';
      default: return tipo;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Solicitudes</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filtro} onIonChange={e => setFiltro(e.detail.value as string)}>
            <IonSegmentButton value="pendiente">Pendientes</IonSegmentButton>
            <IonSegmentButton value="aprobada">Aprobadas</IonSegmentButton>
            <IonSegmentButton value="rechazada">Rechazadas</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <IonList>
            {[1,2,3,4].map(i => (
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
            {solicitudes.length === 0 ? (
              <IonItem lines="none">
                <IonLabel className="ion-text-center" color="medium">
                  <IonIcon icon={timeOutline} size="large" />
                  <p>No hay solicitudes {filtro !== 'todas' ? filtro + 's' : ''}</p>
                </IonLabel>
              </IonItem>
            ) : (
              solicitudes.map((s: any) => (
                <IonItem key={s.id} button detail onClick={() => history.push(`/solicitudes/${s.id}`)}>
                  <IonIcon icon={swapHorizontalOutline} slot="start" color="primary" />
                  <IonLabel>
                    <h2>{s.computador_codigo || 'Sin equipo'}</h2>
                    <p>{getTipoLabel(s.tipo)}</p>
                    <p className="responsables-line">
                      {s.responsable_anterior_nombre || 'Sin anterior'}
                      {' → '}
                      {s.responsable_nuevo_nombre || 'Sin nuevo'}
                    </p>
                    <p className="fecha-line">{new Date(s.created_at).toLocaleDateString('es-CO')}</p>
                  </IonLabel>
                  <IonBadge slot="end" color={getBadgeColor(s.estado)}>{s.estado}</IonBadge>
                </IonItem>
              ))
            )}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ListaSolicitudes;

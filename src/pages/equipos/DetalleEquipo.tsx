import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonBackButton, IonButtons, IonCard, IonCardHeader, IonCardContent,
  IonCardTitle, IonCardSubtitle, IonItem, IonLabel, IonNote,
  IonSkeletonText, IonIcon, IonButton, IonBadge, IonList,
  IonListHeader, IonChip,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  personOutline, desktopOutline, timeOutline, swapHorizontalOutline,
  alertCircleOutline, addCircleOutline,
} from 'ionicons/icons';
import { EquiposService, ComputadorDetalle } from '../../services/equipos.service';
import { useAuth } from '../../context/AuthContext';
import './DetalleEquipo.css';

const DetalleEquipo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { hasRole } = useAuth();
  const [equipo, setEquipo] = useState<ComputadorDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    EquiposService.getComputador(Number(id))
      .then(setEquipo)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const getEstadoColor = (estado: string | null) => {
    switch (estado?.toLowerCase()) {
      case 'activo': return 'success';
      case 'inactivo': return 'medium';
      case 'baja': return 'danger';
      default: return 'warning';
    }
  };

  const canManage = hasRole(['admin', 'gestor']);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start"><IonBackButton defaultHref="/equipos" /></IonButtons>
            <IonTitle>Cargando...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {[1, 2, 3].map(i => <IonSkeletonText key={i} animated style={{ height: '60px', marginBottom: '8px' }} />)}
        </IonContent>
      </IonPage>
    );
  }

  if (error || !equipo) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start"><IonBackButton defaultHref="/equipos" /></IonButtons>
            <IonTitle>Error</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="error-container">
            <IonIcon icon={alertCircleOutline} size="large" color="danger" />
            <p>{error || 'Equipo no encontrado'}</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/equipos" /></IonButtons>
          <IonTitle>{equipo.Codigo}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Info del equipo */}
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={desktopOutline} /> Informacion del Equipo
            </IonCardSubtitle>
            <IonCardTitle>{equipo.Codigo}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="info-grid">
              {equipo.agencia && <div><span>Agencia</span><strong>{equipo.agencia.nombre}</strong></div>}
              {equipo.ubicacion && <div><span>Ubicacion</span><strong>{equipo.ubicacion.nombre}</strong></div>}
              {equipo.modelo && <div><span>Modelo</span><strong>{equipo.modelo}</strong></div>}
              {equipo.serial && <div><span>Serial</span><strong>{equipo.serial}</strong></div>}
              {equipo.procesador && <div><span>Procesador</span><strong>{equipo.procesador}</strong></div>}
              {equipo.ram && <div><span>RAM</span><strong>{equipo.ram}</strong></div>}
              {equipo.disco_duro && <div><span>Disco</span><strong>{equipo.disco_duro}</strong></div>}
            </div>
            <div style={{ marginTop: 8 }}>
              <IonBadge color={getEstadoColor(equipo.estado)}>{equipo.estado || 'Sin estado'}</IonBadge>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Responsable actual */}
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={personOutline} /> Responsable Actual
            </IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            {equipo.responsable_info ? (
              <div className="responsable-info">
                <p className="responsable-nombre">{equipo.responsable_info.nombre}</p>
                <p>{equipo.responsable_info.numero_documento}</p>
                {equipo.responsable_info.correo && <p>{equipo.responsable_info.correo}</p>}
                {equipo.responsable_info.cargo && <IonChip color="primary">{equipo.responsable_info.cargo}</IonChip>}
              </div>
            ) : (
              <div className="sin-responsable-container">
                <IonIcon icon={alertCircleOutline} color="warning" size="large" />
                <p>Este equipo no tiene responsable asignado</p>
              </div>
            )}

            {canManage && (
              <div className="acciones-responsable">
                <IonButton
                  expand="block"
                  fill={equipo.responsable_info ? 'outline' : 'solid'}
                  color="primary"
                  onClick={() => history.push(`/equipos/${equipo.id}/cambiar-responsable`)}
                >
                  <IonIcon icon={swapHorizontalOutline} slot="start" />
                  {equipo.responsable_info ? 'Cambiar Responsable' : 'Asignar Responsable'}
                </IonButton>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Historial de entregas */}
        {equipo.entregas && equipo.entregas.length > 0 && (
          <IonList>
            <IonListHeader>
              <IonLabel>
                <IonIcon icon={timeOutline} /> Historial de Entregas
              </IonLabel>
            </IonListHeader>
            {equipo.entregas.map((entrega) => (
              <IonItem key={entrega.id}>
                <IonLabel>
                  <h3>{entrega.Responsable}</h3>
                  <p>CC: {entrega.CC_responsable}</p>
                  <IonNote>{new Date(entrega.fecha_entrega).toLocaleDateString('es-CO')}</IonNote>
                </IonLabel>
                <IonBadge slot="end" color={entrega.estado === 'activo' ? 'success' : 'medium'}>
                  {entrega.estado}
                </IonBadge>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DetalleEquipo;

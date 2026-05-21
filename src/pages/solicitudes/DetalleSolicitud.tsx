import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardContent,
  IonCardTitle, IonCardSubtitle, IonButton, IonIcon, IonBadge,
  IonTextarea, IonItem, IonLabel, IonSpinner, IonAlert, IonImg,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  checkmarkCircleOutline, closeCircleOutline, swapHorizontalOutline,
  personOutline, desktopOutline, documentTextOutline,
} from 'ionicons/icons';
import { SolicitudesService } from '../../services/solicitudes.service';
import { useAuth } from '../../context/AuthContext';
import './DetalleSolicitud.css';

const DetalleSolicitud: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();
  const [solicitud, setSolicitud] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<'aprobada' | 'rechazada' | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    SolicitudesService.getSolicitud(Number(id))
      .then(setSolicitud)
      .finally(() => setLoading(false));
  }, [id]);

  const confirmarAccion = (accion: 'aprobada' | 'rechazada') => {
    if (accion === 'rechazada' && !observaciones.trim()) {
      setAlertMsg('Debes escribir una observacion para rechazar la solicitud');
      setShowAlert(true);
      return;
    }
    setAccionPendiente(accion);
    setShowConfirm(true);
  };

  const ejecutarAccion = async () => {
    if (!accionPendiente || !user) return;
    setProcesando(true);
    try {
      await SolicitudesService.resolverSolicitud(Number(id), {
        estado: accionPendiente,
        aprobado_por: user.id,
        observaciones: observaciones || undefined,
      });
      history.replace('/solicitudes');
    } catch (e: any) {
      setAlertMsg(e.message || 'Error al procesar solicitud');
      setShowAlert(true);
    } finally {
      setProcesando(false);
      setShowConfirm(false);
    }
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'aprobada': return 'success';
      case 'rechazada': return 'danger';
      default: return 'medium';
    }
  };

  if (loading) return (
    <IonPage>
      <IonHeader><IonToolbar color="primary">
        <IonButtons slot="start"><IonBackButton defaultHref="/solicitudes" /></IonButtons>
        <IonTitle>Cargando...</IonTitle>
      </IonToolbar></IonHeader>
      <IonContent className="ion-padding ion-text-center"><IonSpinner /></IonContent>
    </IonPage>
  );

  if (!solicitud) return (
    <IonPage>
      <IonHeader><IonToolbar color="primary">
        <IonButtons slot="start"><IonBackButton defaultHref="/solicitudes" /></IonButtons>
        <IonTitle>No encontrada</IonTitle>
      </IonToolbar></IonHeader>
      <IonContent className="ion-padding"><p>Solicitud no encontrada</p></IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start"><IonBackButton defaultHref="/solicitudes" /></IonButtons>
          <IonTitle>Solicitud #{solicitud.id}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="detalle-solicitud-content">

        {/* Estado */}
        <div className="estado-header">
          <IonBadge color={getBadgeColor(solicitud.estado)} className="estado-badge">
            {solicitud.estado?.toUpperCase()}
          </IonBadge>
          <span className="fecha-solicitud">{new Date(solicitud.created_at).toLocaleString('es-CO')}</span>
        </div>

        {/* Equipo */}
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle><IonIcon icon={desktopOutline} /> Equipo</IonCardSubtitle>
            <IonCardTitle>{solicitud.computador_codigo || 'N/A'}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {solicitud.agencia_nombre && <p>Agencia: <strong>{solicitud.agencia_nombre}</strong></p>}
          </IonCardContent>
        </IonCard>

        {/* Responsables */}
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle><IonIcon icon={personOutline} /> Cambio de Responsable</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="responsable-cambio">
              <div className="resp-item">
                <span className="resp-label">Entrega</span>
                <strong>{solicitud.responsable_anterior_nombre || 'Sin responsable'}</strong>
                {solicitud.responsable_anterior_doc && <small>{solicitud.responsable_anterior_doc}</small>}
              </div>
              <IonIcon icon={swapHorizontalOutline} color="primary" size="large" />
              <div className="resp-item">
                <span className="resp-label">Recibe</span>
                <strong>{solicitud.responsable_nuevo_nombre || 'N/A'}</strong>
                {solicitud.responsable_nuevo_doc && <small>{solicitud.responsable_nuevo_doc}</small>}
              </div>
            </div>
            {solicitud.motivo_cambio && (
              <div className="motivo-box">
                <p className="motivo-label">Motivo</p>
                <p>{solicitud.motivo_cambio}</p>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        {/* Acta de entrega con firmas */}
        {solicitud.acta && (
          <IonCard>
            <IonCardHeader>
              <IonCardSubtitle><IonIcon icon={documentTextOutline} /> Acta de Entrega</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              {solicitud.acta.observaciones && <p>{solicitud.acta.observaciones}</p>}
              <div className="firmas-grid">
                {solicitud.acta.firma_entrega && (
                  <div className="firma-preview">
                    <span>Firma entrega</span>
                    <IonImg src={solicitud.acta.firma_entrega} alt="Firma entrega" />
                  </div>
                )}
                {solicitud.acta.firma_recibe && (
                  <div className="firma-preview">
                    <span>Firma recibe</span>
                    <IonImg src={solicitud.acta.firma_recibe} alt="Firma recibe" />
                  </div>
                )}
                {solicitud.acta.firma_gestor && (
                  <div className="firma-preview">
                    <span>Firma gestor</span>
                    <IonImg src={solicitud.acta.firma_gestor} alt="Firma gestor" />
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Acciones supervisor */}
        {solicitud.estado === 'pendiente' && (
          <div className="acciones-supervisor ion-padding">
            <IonItem>
              <IonLabel position="stacked">Observaciones (requerido para rechazar)</IonLabel>
              <IonTextarea
                rows={3}
                value={observaciones}
                onIonInput={e => setObservaciones(e.detail.value ?? '')}
                placeholder="Escribe el motivo de la decision..."
              />
            </IonItem>
            <div className="botones-accion">
              <IonButton expand="block" color="success" onClick={() => confirmarAccion('aprobada')} disabled={procesando}>
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Aprobar
              </IonButton>
              <IonButton expand="block" color="danger" fill="outline" onClick={() => confirmarAccion('rechazada')} disabled={procesando}>
                <IonIcon icon={closeCircleOutline} slot="start" />
                Rechazar
              </IonButton>
            </div>
          </div>
        )}

        {/* Si ya fue resuelta */}
        {solicitud.estado !== 'pendiente' && solicitud.observaciones && (
          <IonCard>
            <IonCardContent>
              <p className="motivo-label">Observacion del supervisor</p>
              <p>{solicitud.observaciones}</p>
            </IonCardContent>
          </IonCard>
        )}

      </IonContent>

      <IonAlert
        isOpen={showConfirm}
        onDidDismiss={() => setShowConfirm(false)}
        header={accionPendiente === 'aprobada' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        message={accionPendiente === 'aprobada' ? 'Esta accion actualizara el responsable del equipo.' : 'Esta accion no puede deshacerse.'}
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Confirmar', handler: ejecutarAccion },
        ]}
      />
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Atencion"
        message={alertMsg}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default DetalleSolicitud;

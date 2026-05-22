import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent,
  IonSkeletonText, IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  personOutline, desktopOutline, timeOutline, swapHorizontalOutline,
  alertCircleOutline, arrowBackOutline,
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

  const getEstadoClass = (estado: string | null) => {
    switch (estado?.toLowerCase()) {
      case 'activo': return 'detalle-estado-badge--activo';
      case 'inactivo': return 'detalle-estado-badge--inactivo';
      case 'baja': return 'detalle-estado-badge--baja';
      default: return 'detalle-estado-badge--inactivo';
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const canManage = hasRole(['admin', 'gestor']);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="detalle-content" fullscreen>
          <div className="detalle-header-card">
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.2)' }} />
            <IonSkeletonText animated style={{ width: '60%', height: '24px' }} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="detalle-section">
              <IonSkeletonText animated style={{ height: '60px' }} />
            </div>
          ))}
        </IonContent>
      </IonPage>
    );
  }

  if (error || !equipo) {
    return (
      <IonPage>
        <IonContent className="detalle-content" fullscreen>
          <div className="detalle-header-card">
            <button className="detalle-header-card__back" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBackOutline} />
            </button>
            <div className="detalle-header-card__info">
              <h1 className="detalle-header-card__code">Error</h1>
            </div>
          </div>
          <div className="error-container">
            <IonIcon icon={alertCircleOutline} style={{ fontSize: 48, color: '#EF4444' }} />
            <p>{error || 'Equipo no encontrado'}</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="detalle-content" fullscreen>

        {/* Header Card */}
        <div className="detalle-header-card">
          <button className="detalle-header-card__back" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBackOutline} />
          </button>
          <div className="detalle-header-card__info">
            <h1 className="detalle-header-card__code">{equipo.Codigo}</h1>
            <span className="detalle-estado-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10 }}>
              {equipo.estado || 'Sin estado'}
            </span>
          </div>
        </div>

        {/* Información del equipo */}
        <div className="detalle-section">
          <p className="detalle-section__title">
            <IonIcon icon={desktopOutline} /> Información del Equipo
          </p>
          <div className="info-grid">
            {equipo.agencia && (
              <div className="info-grid__item">
                <span className="info-grid__label">Agencia</span>
                <span className="info-grid__value">{equipo.agencia.nombre}</span>
              </div>
            )}
            {equipo.ubicacion && (
              <div className="info-grid__item">
                <span className="info-grid__label">Ubicación</span>
                <span className="info-grid__value">{equipo.ubicacion.nombre}</span>
              </div>
            )}
            {equipo.modelo && (
              <div className="info-grid__item">
                <span className="info-grid__label">Modelo</span>
                <span className="info-grid__value">{equipo.modelo}</span>
              </div>
            )}
            {equipo.serial && (
              <div className="info-grid__item">
                <span className="info-grid__label">Serial</span>
                <span className="info-grid__value">{equipo.serial}</span>
              </div>
            )}
            {equipo.procesador && (
              <div className="info-grid__item info-grid__item--full">
                <span className="info-grid__label">Procesador</span>
                <span className="info-grid__value">{equipo.procesador}</span>
              </div>
            )}
            {equipo.ram && (
              <div className="info-grid__item">
                <span className="info-grid__label">RAM</span>
                <span className="info-grid__value">{equipo.ram}</span>
              </div>
            )}
            {equipo.disco_duro && (
              <div className="info-grid__item">
                <span className="info-grid__label">Disco</span>
                <span className="info-grid__value">{equipo.disco_duro}</span>
              </div>
            )}
          </div>
          <span className={`detalle-estado-badge ${getEstadoClass(equipo.estado)}`}>
            {equipo.estado || 'Sin estado'}
          </span>
        </div>

        {/* Responsable */}
        <div className="detalle-section">
          <p className="detalle-section__title">
            <IonIcon icon={personOutline} /> Responsable Actual
          </p>
          {equipo.responsable_info ? (
            <>
              <div className="responsable-row">
                <div className="responsable-avatar">
                  {getInitials(equipo.responsable_info.nombre)}
                </div>
                <div className="responsable-info">
                  <p className="responsable-nombre">{equipo.responsable_info.nombre}</p>
                  <p className="responsable-doc">CC: {equipo.responsable_info.numero_documento}</p>
                  {equipo.responsable_info.correo && (
                    <p className="responsable-correo">{equipo.responsable_info.correo}</p>
                  )}
                  {equipo.responsable_info.cargo && (
                    <span className="responsable-cargo">{equipo.responsable_info.cargo}</span>
                  )}
                </div>
              </div>
              {canManage && (
                <button className="detalle-btn-outline" style={{ marginTop: 14 }} onClick={() => history.push(`/equipos/${equipo.id}/cambiar-responsable`)}>
                  <IonIcon icon={swapHorizontalOutline} />
                  Cambiar Responsable
                </button>
              )}
            </>
          ) : (
            <>
              <div className="sin-responsable-container">
                <IonIcon icon={alertCircleOutline} style={{ fontSize: 40, color: '#F97316' }} />
                <p>Este equipo no tiene responsable asignado</p>
              </div>
              {canManage && (
                <button className="detalle-btn-primary" onClick={() => history.push(`/equipos/${equipo.id}/cambiar-responsable`)}>
                  <IonIcon icon={personOutline} />
                  Asignar Responsable
                </button>
              )}
            </>
          )}
        </div>

        {/* Historial */}
        {equipo.entregas && equipo.entregas.length > 0 && (
          <div className="detalle-section">
            <p className="detalle-section__title">
              <IonIcon icon={timeOutline} /> Historial de Entregas
            </p>
            {equipo.entregas.map((entrega: any) => (
              <div key={entrega.id} className="historial-item">
                <div className={`historial-dot ${entrega.estado !== 'activo' ? 'historial-dot--inactivo' : ''}`} />
                <div className="historial-info">
                  <p className="historial-nombre">{entrega.Responsable}</p>
                  <p className="historial-meta">CC: {entrega.CC_responsable}</p>
                </div>
                <span className="historial-fecha">
                  {new Date(entrega.fecha_entrega).toLocaleDateString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        )}

      </IonContent>
    </IonPage>
  );
};

export default DetalleEquipo;

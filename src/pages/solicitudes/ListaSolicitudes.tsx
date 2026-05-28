import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonSkeletonText,
  IonRefresher, IonRefresherContent, IonIcon,
  RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { swapHorizontalOutline, documentTextOutline, hardwareChipOutline } from 'ionicons/icons';
import { SolicitudesService } from '../../services/solicitudes.service';
import './ListaSolicitudes.css';

type Filtro = 'pendiente' | 'aprobada' | 'rechazada' | 'todas';

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
];

const getTipoLabel = (tipo: string) => {
  switch (tipo) {
    case 'cambio_responsable': return 'Cambio de responsable';
    case 'custodia_temporal': return 'Custodia temporal';
    case 'creacion_responsable': return 'Creación de responsable';
    default: return tipo;
  }
};

const getDotClass = (estado: string) => {
  switch (estado) {
    case 'pendiente': return 'sol-card__dot--pendiente';
    case 'aprobada': return 'sol-card__dot--aprobada';
    case 'rechazada': return 'sol-card__dot--rechazada';
    default: return 'sol-card__dot--default';
  }
};

const getBadgeClass = (estado: string) => {
  switch (estado) {
    case 'pendiente': return 'sol-card__badge--pendiente';
    case 'aprobada': return 'sol-card__badge--aprobada';
    case 'rechazada': return 'sol-card__badge--rechazada';
    default: return 'sol-card__badge--default';
  }
};

const ListaSolicitudes: React.FC = () => {
  const history = useHistory();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('pendiente');

  const load = useCallback(async (estado: Filtro) => {
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

  return (
    <IonPage>
      <IonContent className="solicitudes-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="chip-header">
          <div className="chip-header__left">
            <IonIcon icon={hardwareChipOutline} className="chip-header__icon" />
            <span className="chip-header__brand">C.H.I.P</span>
          </div>
          <span className="chip-header__subtitle">Solicitudes</span>
        </div>

        <div className="sol-filters">
          {FILTROS.map(f => (
            <button
              key={f.value}
              className={`sol-filter-btn${filtro === f.value ? ' sol-filter-btn--active' : ''}`}
              onClick={() => setFiltro(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="sol-list">
            {[1, 2, 3, 4].map(i => (
              <IonSkeletonText key={i} animated className="sol-skeleton-card" style={{ height: '96px' }} />
            ))}
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="sol-empty">
            <IonIcon icon={documentTextOutline} />
            <p>No hay solicitudes {filtro !== 'todas' ? filtro + 's' : ''}</p>
          </div>
        ) : (
          <div className="sol-list">
            {solicitudes.map((s: any) => (
              <div key={s.id} className="sol-card" onClick={() => history.push(`/solicitudes/${s.id}`)}>

                {/* Fila 1: # solicitud + badge estado */}
                <div className="sol-card__top">
                  <div className="sol-card__num-wrap">
                    <span className="sol-card__num">Solicitud #{s.id}</span>
                    <span className="sol-card__tipo">{getTipoLabel(s.tipo)}</span>
                  </div>
                  <span className={`sol-card__badge ${getBadgeClass(s.estado)}`}>{s.estado}</span>
                </div>

                {/* Fila 2: equipo */}
                <div className="sol-card__equipo">
                  <IonIcon icon={hardwareChipOutline} />
                  <span>{s.computador_codigo || 'Sin equipo'}</span>
                  {s.agencia_nombre && <span className="sol-card__agencia">· {s.agencia_nombre}</span>}
                </div>

                {/* Fila 3: cambio responsable */}
                <div className="sol-card__responsables">
                  <span className="sol-card__resp-name">{s.responsable_anterior_nombre || 'Sin anterior'}</span>
                  <IonIcon icon={swapHorizontalOutline} className="sol-card__arrow" />
                  <span className="sol-card__resp-name sol-card__resp-name--new">{s.responsable_nuevo_nombre || 'Sin nuevo'}</span>
                </div>

                {/* Fecha */}
                <div className="sol-card__date">{new Date(s.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>

              </div>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ListaSolicitudes;


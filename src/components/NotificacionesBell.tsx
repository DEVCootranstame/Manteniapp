import React, { useState, useEffect, useCallback } from 'react';
import { IonIcon } from '@ionic/react';
import { notificationsOutline, chevronDownOutline, chevronUpOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { SolicitudesService } from '../services/solicitudes.service';
import { Solicitud } from '../types/solicitud.types';
import { useAuth } from '../context/AuthContext';
import './NotificacionesBell.css';

const NotificacionesBell: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Solicitud[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const aprobadas = await SolicitudesService.getSolicitudes(undefined, 'aprobada');
      const rechazadas = await SolicitudesService.getSolicitudes(undefined, 'rechazada');
      const todas = [...aprobadas, ...rechazadas]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 20);
      setNotificaciones(todas);
    } catch {
      // Sin conexión, no mostrar nada
    }
  }, []);

  useEffect(() => {
    if (user) cargarNotificaciones();
  }, [user, cargarNotificaciones]);

  // Cerrar al navegar
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Cerrar al oprimir fuera
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notif-bell') && !target.closest('.notif-panel')) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [open]);

  if (!user) return null;

  const unreadCount = notificaciones.length;

  return (
    <>
      {/* Botón campana verde */}
      <button
        className="notif-bell"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
          if (!open) cargarNotificaciones();
        }}
      >
        <IonIcon icon={notificationsOutline} />
        {unreadCount > 0 && (
          <span className="notif-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel__header">
            <span className="notif-panel__title">Notificaciones</span>
            <span className="notif-panel__count">{notificaciones.length}</span>
          </div>

          <div className="notif-panel__list">
            {notificaciones.length === 0 ? (
              <div className="notif-panel__empty">No hay notificaciones</div>
            ) : (
              notificaciones.map((sol) => {
                const isExpanded = expandedId === sol.id;
                const isAprobada = sol.estado === 'aprobada';
                const motivo = sol.observaciones || sol.motivo_cambio || 'Sin motivo especificado';

                return (
                  <div
                    key={sol.id}
                    className={`notif-item notif-item--${sol.estado}`}
                    onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                  >
                    <div className="notif-item__row">
                      <IonIcon
                        icon={isAprobada ? checkmarkCircle : closeCircle}
                        className={`notif-item__status-icon notif-item__status-icon--${sol.estado}`}
                      />
                      <div className="notif-item__content">
                        <span className="notif-item__label">
                          Solicitud #{sol.id} — {isAprobada ? 'Aprobada' : 'Rechazada'}
                        </span>
                        {/* Equipo y agencia */}
                        {sol.computador?.Codigo && (
                          <span className="notif-item__equipo">💻 {sol.computador.Codigo}</span>
                        )}
                        {/* Cambio de responsable */}
                        {(sol.responsable_anterior?.nombre || sol.responsable_nuevo?.nombre) && (
                          <span className="notif-item__cambio">
                            {sol.responsable_anterior?.nombre || '—'} → {sol.responsable_nuevo?.nombre || '—'}
                          </span>
                        )}
                        {/* Motivo/observaciones (solo al expandir) */}
                        {isExpanded && motivo !== 'Sin motivo especificado' && (
                          <p className="notif-item__motivo notif-item__motivo--expanded">{motivo}</p>
                        )}
                      </div>
                      <IonIcon
                        icon={isExpanded ? chevronUpOutline : chevronDownOutline}
                        className="notif-item__chevron"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NotificacionesBell;

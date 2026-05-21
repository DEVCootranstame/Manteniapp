import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonRefresher, IonRefresherContent, IonCard, IonCardHeader,
  IonCardContent, IonCardTitle, IonCardSubtitle, IonIcon,
  IonBadge, IonButton, IonItem, IonLabel, IonSkeletonText,
  IonList, IonChip, RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  desktopOutline, swapHorizontalOutline, alertCircleOutline,
  personOutline, checkmarkCircleOutline, timeOutline,
  constructOutline, statsChartOutline, logOutOutline,
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { DashboardService, DashboardStats, DashboardAlerta } from '../../services/dashboard.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import './HomeDashboard.css';

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string; onClick?: () => void }> = ({ label, value, icon, color, onClick }) => (
  <div className={`stat-card stat-card--${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <IonIcon icon={icon} />
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

const HomeDashboard: React.FC = () => {
  const history = useHistory();
  const { user, hasRole, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alertas, setAlertas] = useState<DashboardAlerta[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (hasRole(['admin', 'supervisor', 'gestor'])) {
        const [s, a] = await Promise.all([
          DashboardService.getStats(),
          DashboardService.getAlertas(),
        ]);
        setStats(s);
        setAlertas(a);
      }
      if (hasRole(['admin', 'supervisor'])) {
        const sols = await SolicitudesService.getSolicitudes(undefined, 'pendiente');
        setSolicitudesPendientes(sols.slice(0, 5));
      }
    } catch (e) {
      // API may not be reachable, show empty state
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async (e: CustomEvent<RefresherEventDetail>) => {
    await loadData();
    e.detail.complete();
  };

  const getRolLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'gestor': return 'Gestor de Agencia';
      case 'tecnico': return 'Tecnico';
      default: return user?.role;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
          <IonButton slot="end" fill="clear" color="light" onClick={logout}>
            <IonIcon icon={logOutOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Saludo */}
        <div className="dashboard-header">
          <div>
            <h2>Hola, {user?.name?.split(' ')[0]}</h2>
            <IonChip color="primary" outline>{getRolLabel()}</IonChip>
          </div>
        </div>

        {/* ADMIN / SUPERVISOR: Stats globales */}
        {hasRole(['admin', 'supervisor']) && (
          <>
            {loading ? (
              <div className="stats-grid">
                {[1,2,3,4].map(i => <IonSkeletonText key={i} animated style={{ height: '80px', borderRadius: '12px' }} />)}
              </div>
            ) : stats ? (
              <>
                <div className="stats-grid">
                  <StatCard label="Total Equipos" value={stats.equipos_total} icon={desktopOutline} color="primary" onClick={() => history.push('/equipos')} />
                  <StatCard label="Sin Responsable" value={stats.equipos_sin_responsable} icon={alertCircleOutline} color="warning" onClick={() => history.push('/equipos')} />
                  <StatCard label="Pendientes" value={stats.solicitudes_pendientes} icon={timeOutline} color="danger" onClick={() => history.push('/solicitudes')} />
                  <StatCard label="Responsables" value={stats.responsables_total} icon={personOutline} color="success" />
                </div>

                {/* Alertas */}
                {alertas.length > 0 && (
                  <IonCard className="alertas-card">
                    <IonCardHeader>
                      <IonCardSubtitle><IonIcon icon={alertCircleOutline} color="warning" /> Alertas</IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      {alertas.map((a, i) => (
                        <div key={i} className="alerta-item">
                          <IonIcon icon={alertCircleOutline} color="warning" />
                          <span>{a.mensaje}</span>
                          {a.cantidad !== undefined && <IonBadge color="warning">{a.cantidad}</IonBadge>}
                        </div>
                      ))}
                    </IonCardContent>
                  </IonCard>
                )}

                {/* Solicitudes pendientes recientes */}
                {solicitudesPendientes.length > 0 && (
                  <IonCard>
                    <IonCardHeader>
                      <IonCardSubtitle><IonIcon icon={swapHorizontalOutline} /> Solicitudes pendientes</IonCardSubtitle>
                    </IonCardHeader>
                    <IonList lines="none">
                      {solicitudesPendientes.map((s: any) => (
                        <IonItem key={s.id} button onClick={() => history.push(`/solicitudes/${s.id}`)}>
                          <IonIcon icon={swapHorizontalOutline} slot="start" color="warning" />
                          <IonLabel>
                            <h3>{s.computador_codigo || 'Sin equipo'}</h3>
                            <p>{s.responsable_anterior_nombre} → {s.responsable_nuevo_nombre}</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                    <IonCardContent>
                      <IonButton expand="block" fill="outline" size="small" onClick={() => history.push('/solicitudes')}>
                        Ver todas las solicitudes
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                )}
              </>
            ) : (
              <div className="empty-state">
                <IonIcon icon={statsChartOutline} size="large" color="medium" />
                <p>No se pudieron cargar las estadisticas</p>
              </div>
            )}
          </>
        )}

        {/* GESTOR: Acciones rapidas */}
        {hasRole(['gestor']) && (
          <>
            {loading ? (
              <IonSkeletonText animated style={{ height: '100px', margin: '16px', borderRadius: '12px' }} />
            ) : (
              <>
                {stats && stats.equipos_sin_responsable > 0 && (
                  <div className="alerta-banner">
                    <IonIcon icon={alertCircleOutline} color="warning" />
                    <span>{stats.equipos_sin_responsable} equipo{stats.equipos_sin_responsable > 1 ? 's' : ''} sin responsable en tu agencia</span>
                    <IonButton size="small" fill="clear" onClick={() => history.push('/equipos')}>Ver</IonButton>
                  </div>
                )}

                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Acciones rapidas</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="acciones-grid">
                      <IonButton expand="block" onClick={() => history.push('/equipos')}>
                        <IonIcon icon={desktopOutline} slot="start" />
                        Ver Equipos
                      </IonButton>
                      <IonButton expand="block" fill="outline" onClick={() => history.push('/solicitudes')}>
                        <IonIcon icon={swapHorizontalOutline} slot="start" />
                        Mis Solicitudes
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>

                {stats && (
                  <div className="stats-grid">
                    <StatCard label="Equipos" value={stats.equipos_total} icon={desktopOutline} color="primary" onClick={() => history.push('/equipos')} />
                    <StatCard label="Sin Resp." value={stats.equipos_sin_responsable} icon={alertCircleOutline} color="warning" />
                    <StatCard label="Enviadas" value={stats.solicitudes_pendientes} icon={timeOutline} color="warning" />
                    <StatCard label="Aprobadas" value={stats.solicitudes_aprobadas} icon={checkmarkCircleOutline} color="success" />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* TECNICO: Acceso a mantenimientos */}
        {hasRole(['tecnico']) && (
          <IonCard>
            <IonCardHeader>
              <IonCardSubtitle><IonIcon icon={constructOutline} /> Mantenimientos</IonCardSubtitle>
              <IonCardTitle>Panel Tecnico</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>Gestiona los mantenimientos de equipos desde aqui.</p>
              <IonButton expand="block" className="ion-margin-top">
                <IonIcon icon={constructOutline} slot="start" />
                Ver Mantenimientos
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

      </IonContent>
    </IonPage>
  );
};

export default HomeDashboard;

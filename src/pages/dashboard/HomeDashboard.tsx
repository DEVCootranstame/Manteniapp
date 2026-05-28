import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonRefresher, IonRefresherContent,
  IonIcon, IonButton, IonSkeletonText, RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  desktopOutline, alertCircleOutline, timeOutline, personOutline,
  checkmarkCircleOutline, closeCircleOutline, constructOutline,
  swapHorizontalOutline, statsChartOutline, cloudDoneOutline,
  hardwareChipOutline,
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '../../context/AuthContext';
import AgenciaFilterSelect from '../../components/AgenciaFilterSelect';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { Mantenimiento, STORAGE_KEY, TIPOS_MANTENIMIENTO_STORAGE_KEY, TipoMantenimiento } from '../../types';
import './HomeDashboard.css';

/* ── Bar Chart Component ──────────────────────────── */
interface BarItem { label: string; value: number; color: string; }
const BarChart: React.FC<{ title: string; items: BarItem[]; icon: string }> = ({ title, items, icon }) => {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="chart-card">
      <p className="chart-card__title"><IonIcon icon={icon} />{title}</p>
      <div className="bar-chart">
        {items.map((item, idx) => (
          <div key={idx} className="bar-row">
            <span className="bar-label">{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
            </div>
            <span className="bar-value" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Donut Chart Component ────────────────────────── */
const DonutChart: React.FC<{ label: string; value: number; total: number; color: string }> = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="donut-item">
      <div className="donut-ring" style={{ '--pct': `${pct}%`, '--color': color } as any}>
        <div className="donut-inner">
          <span className="donut-pct">{pct}%</span>
        </div>
      </div>
      <span className="donut-label">{label}</span>
      <span className="donut-vals">{value}/{total}</span>
    </div>
  );
};

/* ── Stat Card ────────────────────────────────────── */
const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string; onClick?: () => void }> = ({ label, value, icon, color, onClick }) => (
  <div className={`stat-card stat-card--${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <IonIcon icon={icon} />
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

/* ── Main Component ───────────────────────────────── */
const HomeDashboard: React.FC = () => {
  const history = useHistory();
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [tiposMap, setTiposMap] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar tipos de mantenimiento para mapear IDs a nombres
      const { value: tiposVal } = await Preferences.get({ key: TIPOS_MANTENIMIENTO_STORAGE_KEY });
      if (tiposVal) {
        const tipos: TipoMantenimiento[] = JSON.parse(tiposVal);
        const map: Record<string, string> = {};
        tipos.forEach(t => { map[t.id] = t.nombre; });
        setTiposMap(map);
      }

      // Cargar mantenimientos locales
      const { value: mantVal } = await Preferences.get({ key: STORAGE_KEY });
      if (mantVal) setMantenimientos(JSON.parse(mantVal));

      // Cargar stats de API para roles que las necesiten
      if (hasRole(['admin', 'supervisor', 'gestor'])) {
        const s = await DashboardService.getStats();
        setStats(s);
      }
    } catch {
      // API no disponible, seguir con datos locales
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
      case 'tecnico': return 'Técnico';
      default: return user?.role;
    }
  };

  // Stats de mantenimientos
  const mantSincronizados = mantenimientos.filter(m => m.sincronizado).length;
  const mantPendientes = mantenimientos.filter(m => !m.sincronizado).length;
  const mantPorTipo = Object.entries(
    mantenimientos.reduce((acc: Record<string, number>, m) => {
      const tipo = (m.tipoMantenimientoId && tiposMap[m.tipoMantenimientoId]) || 'Sin tipo';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const TIPO_COLORS = ['#2563EB', '#10B981', '#F97316', '#7C3AED', '#EF4444'];

  if (!user) return null;

  return (
    <IonPage>
      <IonContent className="dashboard-content" fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* ── C.H.I.P Header ────────────────────── */}
        <div className="chip-header">
          <div className="chip-header__left">
            <IonIcon icon={hardwareChipOutline} className="chip-header__icon" />
            <span className="chip-header__brand">C.H.I.P</span>
          </div>
          <span className="chip-header__subtitle">Dashboard</span>
        </div>

        {/* ── Welcome + filtro en misma fila ─────── */}
        <div className="dashboard-topbar">
          <div className="dashboard-welcome">
            <span className="dashboard-welcome__greeting">Bienvenido,</span>
            <span className="dashboard-welcome__name">{user.name || 'Usuario'}</span>
          </div>
          <AgenciaFilterSelect />
        </div>

        {loading ? (
          <div className="dash-loading">
            {[1, 2, 3].map(i => <IonSkeletonText key={i} animated style={{ height: '120px', borderRadius: '18px', margin: '12px 16px' }} />)}
          </div>
        ) : (
          <>
            {/* ── ADMIN: Ve todo ── */}
            {hasRole(['admin']) && stats && (
              <>
                {/* Stats cards */}
                <div className="stats-grid">
                  <StatCard label="Total Equipos" value={stats.equipos_total} icon={desktopOutline} color="primary" onClick={() => history.push('/equipos')} />
                  <StatCard label="Sin Responsable" value={stats.equipos_sin_responsable} icon={alertCircleOutline} color="warning" onClick={() => history.push('/equipos')} />
                  <StatCard label="Pendientes" value={stats.solicitudes_pendientes} icon={timeOutline} color="danger" onClick={() => history.push('/solicitudes')} />
                  <StatCard label="Responsables" value={stats.responsables_total} icon={personOutline} color="success" />
                </div>

                {/* Barras: Equipos por estado */}
                <BarChart
                  title="Equipos por Estado"
                  icon={desktopOutline}
                  items={[
                    { label: 'Activos', value: stats.equipos_activos, color: '#10B981' },
                    { label: 'Inactivos', value: stats.equipos_inactivos, color: '#94A3B8' },
                    { label: 'Sin Resp.', value: stats.equipos_sin_responsable, color: '#F97316' },
                  ]}
                />

                {/* Barras: Solicitudes */}
                <BarChart
                  title="Solicitudes de Cambio"
                  icon={swapHorizontalOutline}
                  items={[
                    { label: 'Pendientes', value: stats.solicitudes_pendientes, color: '#F97316' },
                    { label: 'Aprobadas', value: stats.solicitudes_aprobadas, color: '#10B981' },
                    { label: 'Rechazadas', value: stats.solicitudes_rechazadas, color: '#EF4444' },
                  ]}
                />

                {/* Barras: Mantenimientos por tipo */}
                {mantPorTipo.length > 0 && (
                  <BarChart
                    title="Mantenimientos por Tipo"
                    icon={constructOutline}
                    items={mantPorTipo.map((item, i) => ({ ...item, color: TIPO_COLORS[i % TIPO_COLORS.length] }))}
                  />
                )}

                {/* Donuts: Sincronización de mantenimientos */}
                {mantenimientos.length > 0 && (
                  <div className="chart-card">
                    <p className="chart-card__title"><IonIcon icon={cloudDoneOutline} />Sincronización</p>
                    <div className="donut-row">
                      <DonutChart label="Sincronizados" value={mantSincronizados} total={mantenimientos.length} color="#10B981" />
                      <DonutChart label="Pendientes" value={mantPendientes} total={mantenimientos.length} color="#F97316" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── SUPERVISOR: Solicitudes + Equipos ── */}
            {hasRole(['supervisor']) && stats && (
              <>
                <div className="stats-grid">
                  <StatCard label="Total Equipos" value={stats.equipos_total} icon={desktopOutline} color="primary" onClick={() => history.push('/equipos')} />
                  <StatCard label="Sin Resp." value={stats.equipos_sin_responsable} icon={alertCircleOutline} color="warning" />
                  <StatCard label="Pendientes" value={stats.solicitudes_pendientes} icon={timeOutline} color="danger" onClick={() => history.push('/solicitudes')} />
                  <StatCard label="Aprobadas" value={stats.solicitudes_aprobadas} icon={checkmarkCircleOutline} color="success" />
                </div>

                <BarChart
                  title="Solicitudes de Cambio"
                  icon={swapHorizontalOutline}
                  items={[
                    { label: 'Pendientes', value: stats.solicitudes_pendientes, color: '#F97316' },
                    { label: 'Aprobadas', value: stats.solicitudes_aprobadas, color: '#10B981' },
                    { label: 'Rechazadas', value: stats.solicitudes_rechazadas, color: '#EF4444' },
                  ]}
                />

                <BarChart
                  title="Equipos por Estado"
                  icon={desktopOutline}
                  items={[
                    { label: 'Activos', value: stats.equipos_activos, color: '#10B981' },
                    { label: 'Inactivos', value: stats.equipos_inactivos, color: '#94A3B8' },
                    { label: 'Sin Resp.', value: stats.equipos_sin_responsable, color: '#F97316' },
                  ]}
                />
              </>
            )}

            {/* ── GESTOR: Equipos de su agencia ── */}
            {hasRole(['gestor']) && stats && (
              <>
                {stats.equipos_sin_responsable > 0 && (
                  <div className="alerta-banner">
                    <IonIcon icon={alertCircleOutline} />
                    <span>{stats.equipos_sin_responsable} equipo(s) sin responsable</span>
                    <IonButton size="small" fill="clear" onClick={() => history.push('/equipos')}>Ver</IonButton>
                  </div>
                )}

                <div className="stats-grid">
                  <StatCard label="Equipos" value={stats.equipos_total} icon={desktopOutline} color="primary" onClick={() => history.push('/equipos')} />
                  <StatCard label="Sin Resp." value={stats.equipos_sin_responsable} icon={alertCircleOutline} color="warning" />
                  <StatCard label="Activos" value={stats.equipos_activos} icon={checkmarkCircleOutline} color="success" />
                  <StatCard label="Inactivos" value={stats.equipos_inactivos} icon={closeCircleOutline} color="danger" />
                </div>

                <BarChart
                  title="Estado de Equipos"
                  icon={desktopOutline}
                  items={[
                    { label: 'Activos', value: stats.equipos_activos, color: '#10B981' },
                    { label: 'Inactivos', value: stats.equipos_inactivos, color: '#94A3B8' },
                    { label: 'Sin Resp.', value: stats.equipos_sin_responsable, color: '#F97316' },
                  ]}
                />

                <div className="chart-card">
                  <p className="chart-card__title"><IonIcon icon={desktopOutline} />Cobertura de Responsables</p>
                  <div className="donut-row">
                    <DonutChart
                      label="Con Resp."
                      value={stats.equipos_total - stats.equipos_sin_responsable}
                      total={stats.equipos_total}
                      color="#2563EB"
                    />
                    <DonutChart
                      label="Sin Resp."
                      value={stats.equipos_sin_responsable}
                      total={stats.equipos_total}
                      color="#F97316"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── TÉCNICO: Sus mantenimientos ── */}
            {hasRole(['tecnico']) && (
              <>
                <div className="stats-grid">
                  <StatCard label="Total Mant." value={mantenimientos.length} icon={constructOutline} color="primary" onClick={() => history.push('/home-mantenimientos')} />
                  <StatCard label="Sincronizados" value={mantSincronizados} icon={cloudDoneOutline} color="success" />
                  <StatCard label="Pendientes" value={mantPendientes} icon={timeOutline} color="warning" />
                  <StatCard label="Tipos" value={mantPorTipo.length} icon={statsChartOutline} color="primary" />
                </div>

                {mantPorTipo.length > 0 ? (
                  <BarChart
                    title="Mis Mantenimientos por Tipo"
                    icon={constructOutline}
                    items={mantPorTipo.map((item, i) => ({ ...item, color: TIPO_COLORS[i % TIPO_COLORS.length] }))}
                  />
                ) : (
                  <div className="empty-state">
                    <IonIcon icon={constructOutline} style={{ fontSize: 48, opacity: 0.3 }} />
                    <p>No hay mantenimientos registrados</p>
                    <IonButton onClick={() => history.push('/formulario')}>Registrar ahora</IonButton>
                  </div>
                )}

                {mantenimientos.length > 0 && (
                  <div className="chart-card">
                    <p className="chart-card__title"><IonIcon icon={cloudDoneOutline} />Estado de Sincronización</p>
                    <div className="donut-row">
                      <DonutChart label="Enviados" value={mantSincronizados} total={mantenimientos.length} color="#10B981" />
                      <DonutChart label="Pendientes" value={mantPendientes} total={mantenimientos.length} color="#F97316" />
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default HomeDashboard;

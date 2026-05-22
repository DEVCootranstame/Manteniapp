import { ApiService } from './api.service';

export interface DashboardStats {
  equipos_total: number;
  equipos_sin_responsable: number;
  equipos_activos: number;
  equipos_inactivos: number;
  solicitudes_pendientes: number;
  solicitudes_aprobadas: number;
  solicitudes_rechazadas: number;
  responsables_total: number;
}

export interface DashboardAlerta {
  tipo: string;
  mensaje: string;
  equipos?: Array<{ id: number; Codigo: string; agencia_nombre: string }>;
  cantidad?: number;
}

interface ApiStatsResponse {
  equipos: {
    total: number;
    sin_responsable: number;
    por_estado: { activos: number; inactivos: number; en_mantenimiento: number; otro: number };
  };
  solicitudes: {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
  };
  responsables: { total: number };
}

interface ApiAlertasResponse {
  equipos_sin_responsable: { total: number; items: Array<{ id: number; Codigo: string; agencia_nombre: string }> };
  solicitudes_pendientes_vencidas: { total: number; dias_umbral: number; items: unknown[] };
}

class DashboardServiceClass {
  async getStats(): Promise<DashboardStats> {
    const raw = await ApiService.get<ApiStatsResponse>('/dashboard/stats');
    return {
      equipos_total: raw.equipos.total,
      equipos_sin_responsable: raw.equipos.sin_responsable,
      equipos_activos: raw.equipos.por_estado.activos,
      equipos_inactivos: raw.equipos.por_estado.inactivos,
      solicitudes_pendientes: raw.solicitudes.pendientes,
      solicitudes_aprobadas: raw.solicitudes.aprobadas,
      solicitudes_rechazadas: raw.solicitudes.rechazadas,
      responsables_total: raw.responsables.total,
    };
  }

  async getAlertas(): Promise<DashboardAlerta[]> {
    const raw = await ApiService.get<ApiAlertasResponse>('/dashboard/alertas');
    const alertas: DashboardAlerta[] = [];

    if (raw.equipos_sin_responsable.total > 0) {
      alertas.push({
        tipo: 'equipos_sin_responsable',
        mensaje: `${raw.equipos_sin_responsable.total} equipo(s) sin responsable asignado`,
        cantidad: raw.equipos_sin_responsable.total,
        equipos: raw.equipos_sin_responsable.items,
      });
    }

    if (raw.solicitudes_pendientes_vencidas.total > 0) {
      alertas.push({
        tipo: 'solicitudes_vencidas',
        mensaje: `${raw.solicitudes_pendientes_vencidas.total} solicitud(es) pendiente(s) por más de ${raw.solicitudes_pendientes_vencidas.dias_umbral} días`,
        cantidad: raw.solicitudes_pendientes_vencidas.total,
      });
    }

    return alertas;
  }
}

export const DashboardService = new DashboardServiceClass();

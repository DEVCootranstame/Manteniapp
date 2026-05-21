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

class DashboardServiceClass {
  async getStats(): Promise<DashboardStats> {
    return ApiService.get<DashboardStats>('/dashboard/stats');
  }

  async getAlertas(): Promise<DashboardAlerta[]> {
    return ApiService.get<DashboardAlerta[]>('/dashboard/alertas');
  }
}

export const DashboardService = new DashboardServiceClass();

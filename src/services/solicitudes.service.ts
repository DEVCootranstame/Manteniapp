import { ApiService } from './api.service';
import { Solicitud } from '../types/solicitud.types';

export interface CreateSolicitudDto {
  tipo: 'cambio_responsable' | 'custodia_temporal' | 'creacion_responsable' | 'crear_equipo';
  computador_id?: number;
  responsable_anterior_id?: number;
  responsable_nuevo_id?: number;
  agencia_id: number;
  creado_por: number;
  motivo_cambio?: string;
  observaciones?: string;
  datos_equipo?: Record<string, any>;
}

export interface CreateActaDto {
  computador_id: number;
  solicitud_id?: number;
  responsable_entrega_id?: number;
  responsable_recibe_id?: number;
  firma_entrega?: string;
  firma_recibe?: string;
  firma_gestor?: string;
  fotos_estado?: string[];
  observaciones?: string;
}

class SolicitudesServiceClass {
  async getSolicitudes(agenciaId?: number, estado?: string): Promise<Solicitud[]> {
    const params = new URLSearchParams();
    if (agenciaId) params.set('agencia_id', String(agenciaId));
    if (estado) params.set('estado', estado);
    const query = params.toString() ? `?${params.toString()}` : '';
    return ApiService.get<Solicitud[]>(`/solicitudes${query}`);
  }

  async getSolicitud(id: number): Promise<Solicitud> {
    return ApiService.get<Solicitud>(`/solicitudes/${id}`);
  }

  async createSolicitud(dto: CreateSolicitudDto): Promise<Solicitud> {
    return ApiService.post<Solicitud>('/solicitudes', dto);
  }

  async resolverSolicitud(id: number, dto: { estado: 'aprobada' | 'rechazada'; aprobado_por: number; observaciones?: string }): Promise<Solicitud> {
    return ApiService.patch<Solicitud>(`/solicitudes/${id}/resolver`, dto);
  }

  async createActa(dto: CreateActaDto): Promise<{ id: number }> {
    return ApiService.post<{ id: number }>('/solicitudes/actas', dto);
  }
}

export const SolicitudesService = new SolicitudesServiceClass();

import { ApiService } from './api.service';
import { Computador } from '../types/equipo.types';

export interface ComputadoresListItem {
  id: number;
  Codigo: string;
  Responsable: string | null;
  CC_responsable: string | null;
  responsable_id: number | null;
  agencia_id: number;
  estado: string | null;
  modelo: string | null;
  serial: string | null;
  responsable_nombre: string | null;
  responsable_documento: string | null;
  responsable_correo: string | null;
  agencia_nombre: string | null;
  ubicacion_nombre: string | null;
}

export interface ComputadorDetalle extends Computador {
  responsable_info: {
    id: number;
    nombre: string;
    numero_documento: string;
    correo: string | null;
    cargo: string | null;
  } | null;
  agencia?: { id: number; nombre: string };
  ubicacion?: { id: number; nombre: string };
  entregas: Array<{
    id: number;
    Responsable: string;
    CC_responsable: string;
    fecha_entrega: string;
    email: string;
    estado: string;
  }>;
}

class EquiposServiceClass {
  async getComputadores(agenciaId?: number, search?: string): Promise<ComputadoresListItem[]> {
    const params = new URLSearchParams();
    if (agenciaId) params.set('agencia_id', String(agenciaId));
    if (search) params.set('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return ApiService.get<ComputadoresListItem[]>(`/computadores${query}`);
  }

  async getComputador(id: number): Promise<ComputadorDetalle> {
    return ApiService.get<ComputadorDetalle>(`/computadores/${id}`);
  }
}

export const EquiposService = new EquiposServiceClass();

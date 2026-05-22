import { ApiService } from './api.service';
import { Preferences } from '@capacitor/preferences';
import { Computador } from '../types/equipo.types';

const EQUIPOS_CACHE_KEY = 'equipos_cache';

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
    try {
      const data = await ApiService.get<ComputadoresListItem[]>(`/computadores${query}`);
      // Save to cache only on unfiltered fetch
      if (!search) await this.saveCache(data);
      return data;
    } catch {
      // Fallback to cache
      return this.getCached();
    }
  }

  async getComputador(id: number): Promise<ComputadorDetalle> {
    return ApiService.get<ComputadorDetalle>(`/computadores/${id}`);
  }

  async saveCache(list: ComputadoresListItem[]): Promise<void> {
    await Preferences.set({ key: EQUIPOS_CACHE_KEY, value: JSON.stringify(list) });
  }

  async getCached(): Promise<ComputadoresListItem[]> {
    const { value } = await Preferences.get({ key: EQUIPOS_CACHE_KEY });
    if (!value) return [];
    try { return JSON.parse(value); } catch { return []; }
  }
}

export const EquiposService = new EquiposServiceClass();

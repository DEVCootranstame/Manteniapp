import { ApiService } from './api.service';
import { Preferences } from '@capacitor/preferences';
import { Responsable } from '../types/equipo.types';

const RESPONSABLES_RECIENTES_KEY = 'responsables_recientes';
const MAX_RECIENTES = 20;

export interface CreateResponsableDto {
  nombre: string;
  numero_documento: string;
  tipo_documento_id?: number;
  correo?: string;
  cargo?: string;
}

class ResponsablesServiceClass {
  async getResponsables(search?: string): Promise<Responsable[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    try {
      const data = await ApiService.get<Responsable[]>(`/responsables${query}`);
      return data;
    } catch {
      // Fallback: filter from recientes
      const recientes = await this.getRecientes();
      if (!search) return recientes;
      const q = search.toLowerCase();
      return recientes.filter(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.numero_documento.includes(q)
      );
    }
  }

  async getResponsable(id: number): Promise<Responsable> {
    return ApiService.get<Responsable>(`/responsables/${id}`);
  }

  async createResponsable(dto: CreateResponsableDto): Promise<Responsable> {
    return ApiService.post<Responsable>('/responsables', dto);
  }

  async updateResponsable(id: number, dto: Partial<CreateResponsableDto>): Promise<Responsable> {
    return ApiService.patch<Responsable>(`/responsables/${id}`, dto);
  }

  /** Save a recently used responsable to local cache */
  async saveReciente(r: Responsable): Promise<void> {
    const list = await this.getRecientes();
    const filtered = list.filter(x => x.id !== r.id);
    filtered.unshift(r);
    const trimmed = filtered.slice(0, MAX_RECIENTES);
    await Preferences.set({ key: RESPONSABLES_RECIENTES_KEY, value: JSON.stringify(trimmed) });
  }

  async getRecientes(): Promise<Responsable[]> {
    const { value } = await Preferences.get({ key: RESPONSABLES_RECIENTES_KEY });
    if (!value) return [];
    try { return JSON.parse(value); } catch { return []; }
  }
}

export const ResponsablesService = new ResponsablesServiceClass();

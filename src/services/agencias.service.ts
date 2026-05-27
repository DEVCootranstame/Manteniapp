import { ApiService } from './api.service';
import { Preferences } from '@capacitor/preferences';
import { Agencia, AGENCIAS_STORAGE_KEY } from '../types';
import { UserProfile } from '../types/auth.types';

export interface AgenciaAPI {
  id: number;
  nombre: string;
  codigo: string | null;
  direccion: string | null;
  telefono: string | null;
  ciudad: string | null;
}

// Incrementar este valor invalida el cache local viejo
const AGENCIAS_CACHE_VERSION = 'api-v1';
const AGENCIAS_CACHE_VERSION_KEY = 'agencias_cache_version';

/** Convierte la agencia de la API al formato local */
function toLocal(api: AgenciaAPI): Agencia {
  return {
    id: String(api.id),
    codigo: api.codigo || '',
    nombre: api.nombre,
    ubicaciones: [],
  };
}

class AgenciasServiceClass {
  /** Limpia el cache si es de una versión anterior (datos hardcodeados viejos) */
  private async migrateIfNeeded(): Promise<void> {
    const { value: version } = await Preferences.get({ key: AGENCIAS_CACHE_VERSION_KEY });
    if (version !== AGENCIAS_CACHE_VERSION) {
      await Preferences.remove({ key: AGENCIAS_STORAGE_KEY });
      await Preferences.set({ key: AGENCIAS_CACHE_VERSION_KEY, value: AGENCIAS_CACHE_VERSION });
    }
  }

  async getAgencias(search?: string): Promise<Agencia[]> {
    await this.migrateIfNeeded();
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const raw = await ApiService.get<AgenciaAPI[] | { items?: AgenciaAPI[]; data?: AgenciaAPI[] }>(`/agencias${params}`);
      // Soportar respuesta como array directo o como objeto paginado { items: [...] } / { data: [...] }
      const list: AgenciaAPI[] = Array.isArray(raw) ? raw : ((raw as any).items ?? (raw as any).data ?? []);
      const agencias = list.map(toLocal);
      await this.saveCache(agencias);
      return agencias;
    } catch (e) {
      console.warn('[AgenciasService] getAgencias failed, using cache:', e);
      return this.getCached();
    }
  }

  async createAgencia(nombre: string, codigo: string): Promise<Agencia> {
    const created = await ApiService.post<AgenciaAPI>('/agencias', { nombre, codigo });
    const local = toLocal(created);
    const list = await this.getCached();
    list.push(local);
    await this.saveCache(list);
    return local;
  }

  async updateAgencia(id: string, nombre: string, codigo: string): Promise<Agencia> {
    const updated = await ApiService.patch<AgenciaAPI>(`/agencias/${id}`, { nombre, codigo });
    const local = toLocal(updated);
    const list = await this.getCached();
    const idx = list.findIndex(a => a.id === local.id);
    if (idx >= 0) list[idx] = local;
    await this.saveCache(list);
    return local;
  }

  async saveCache(list: Agencia[]): Promise<void> {
    await Preferences.set({ key: AGENCIAS_STORAGE_KEY, value: JSON.stringify(list) });
  }

  async getCached(): Promise<Agencia[]> {
    const { value } = await Preferences.get({ key: AGENCIAS_STORAGE_KEY });
    if (!value) return [];
    try { return JSON.parse(value); } catch { return []; }
  }

  async clearCache(): Promise<void> {
    await Preferences.remove({ key: AGENCIAS_STORAGE_KEY });
    await Preferences.remove({ key: AGENCIAS_CACHE_VERSION_KEY });
  }

  /** Retorna agencias según rol: admin ve todas, otros solo la suya */
  async getAgenciasForUser(user: UserProfile | null, search?: string): Promise<Agencia[]> {
    if (!user || user.role === 'admin') {
      return this.getAgencias(search);
    }

    // Non-admin: construir desde el perfil si está disponible
    if (user.agencia) {
      const cached = await this.getCached();
      const cachedAgencia = cached.find((a) => a.id === String(user.agencia_id));
      const agencia: Agencia = cachedAgencia ?? {
        id: String(user.agencia.id),
        codigo: user.agencia.codigo || '',
        nombre: user.agencia.nombre,
        ubicaciones: [],
      };
      return [agencia];
    }

    // Fallback: obtener todas y filtrar por agencia_id
    const all = await this.getAgencias(search);
    return all.filter((a) => a.id === String(user.agencia_id));
  }
}

export const AgenciasService = new AgenciasServiceClass();

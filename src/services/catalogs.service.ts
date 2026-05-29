import { ApiService } from './api.service';

export interface Marca {
  id: number;
  nombre: string;
}

export interface TipoPc {
  id: number;
  nombre: string;
}

export interface Ubicacion {
  id: number;
  nombre: string;
}

export interface ResponsableSearch {
  id: number;
  nombre: string;
  numero_documento: string;
  correo: string | null;
  cargo: string | null;
}

class CatalogsServiceClass {
  async getMarcas(): Promise<Marca[]> {
    const raw = await ApiService.get<any>('/marcas');
    return Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
  }

  async getTiposPc(): Promise<TipoPc[]> {
    const raw = await ApiService.get<any>('/tipos-pc');
    return Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
  }

  async getUbicaciones(): Promise<Ubicacion[]> {
    const raw = await ApiService.get<any>('/ubicaciones');
    return Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
  }

  async searchResponsables(search: string): Promise<ResponsableSearch[]> {
    const raw = await ApiService.get<any>(`/responsables?search=${encodeURIComponent(search)}`);
    return Array.isArray(raw) ? raw : (raw?.data ?? raw?.items ?? []);
  }
}

export const CatalogsService = new CatalogsServiceClass();

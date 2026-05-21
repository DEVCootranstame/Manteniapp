import { ApiService } from './api.service';
import { Responsable } from '../types/equipo.types';

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
    return ApiService.get<Responsable[]>(`/responsables${query}`);
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
}

export const ResponsablesService = new ResponsablesServiceClass();

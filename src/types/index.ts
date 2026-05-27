export interface Ubicacion {
  id: string;
  nombre: string;
}

export interface Agencia {
  id: string;
  codigo: string;
  nombre: string;
  ubicaciones: Ubicacion[];
}

export interface TipoMantenimiento {
  id: string;
  nombre: string;
}

export interface FotosCategorized {
  antes: string | null;
  durante: string | null;
  despues: string | null;
}

export interface Mantenimiento {
  id: string;
  nombreEquipo: string;
  computadorId?: number;
  proveedor: string;
  mantenimientoRealizado: string;
  observaciones: string;
  fecha: string;
  hora: string;
  fotos: string[];
  fotosCategorized?: FotosCategorized;
  sincronizado: boolean;
  agenciaId?: string;
  ubicacionId?: string;
  tipoMantenimientoId?: string;
}

export interface SugerenciaMantenimiento {
  id: string;
  tipoMantenimiento: string; // nombre del tipo: 'Preventivo', 'Correctivo', 'Predictivo', etc.
  texto: string;
}

export const STORAGE_KEY = 'mantenimientos_registros';
export const AGENCIAS_STORAGE_KEY = 'agencias_registros';
export const TIPOS_MANTENIMIENTO_STORAGE_KEY = 'tipos_mantenimiento';
export const SUGERENCIAS_STORAGE_KEY = 'sugerencias_mantenimiento';

/**
 * Sanitiza texto de entrada eliminando caracteres potencialmente peligrosos (XSS).
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida que un string no exceda el largo máximo permitido.
 */
export function validateLength(value: string, max: number): boolean {
  return value.trim().length <= max;
}

/**
 * Tamaño máximo permitido para fotos en bytes (5MB).
 */
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

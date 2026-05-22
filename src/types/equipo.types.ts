export interface Responsable {
  id: number;
  nombre: string;
  numero_documento: string;
  tipo_documento_id?: number;
  correo: string | null;
  cargo: string | null;
  computadores_count?: number;
  impresoras_count?: number;
  scanners_count?: number;
}

export interface Computador {
  id: number;
  Codigo: string;
  Responsable: string | null;
  CC_responsable: string | null;
  responsable_id: number | null;
  agencia_id: number;
  ubicacion_id: number | null;
  tipoPc_id: number | null;
  estado: string;
  marca_id: number | null;
  modelo: string | null;
  serial: string | null;
  procesador: string | null;
  ram: string | null;
  disco_duro: string | null;
  // Relations
  responsable?: Responsable;
  agencia?: { id: number; nombre: string };
  ubicacion?: { id: number; nombre: string };
}

export interface EntregaActa {
  id: number;
  Responsable: string;
  CC_responsable: string;
  Codigo_Equipo: string;
  fecha_entrega: string;
  email: string;
  estado: string;
}

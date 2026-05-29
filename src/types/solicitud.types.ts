export type TipoSolicitud = 'cambio_responsable' | 'custodia_temporal' | 'creacion_responsable' | 'crear_equipo';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

export interface Solicitud {
  id: number;
  tipo: TipoSolicitud;
  computador_id: number | null;
  responsable_anterior_id: number | null;
  responsable_nuevo_id: number | null;
  acta_entrega_id: number | null;
  agencia_id: number;
  creado_por: number;
  estado: EstadoSolicitud;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  motivo_cambio: string | null;
  observaciones: string | null;
  datos_equipo?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Relations
  computador?: { Codigo: string; estado: string };
  responsable_anterior?: { nombre: string; numero_documento: string };
  responsable_nuevo?: { nombre: string; numero_documento: string };
}

export interface ActaEntregaFirmas {
  firma_entrega: string;   // base64 PNG
  firma_recibe: string;    // base64 PNG
  firma_gestor: string;    // base64 PNG
  fotos_estado?: string[]; // base64 fotos opcionales
  observaciones: string;
}

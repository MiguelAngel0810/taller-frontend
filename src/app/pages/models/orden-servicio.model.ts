import { Mecanico } from './mecanico.model';
import { Vehiculo } from './vehiculo.model';

export interface OrdenServicio {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'diagnostico' | 'reparacion' | 'pruebas' | 'finalizacion' | 'finalizado' | 'pausado';
  validacion_diagnostico: 'en_espera' | 'aprobado' | 'aclaracion';
  fecha_inicio: string;
  fecha_fin: string | null;
  mecanico?: Mecanico;
  vehiculo?: Vehiculo;
  etapas?: Array<{
    id: number;
    id_orden: number;
    etapa: 'diagnostico' | 'reparacion' | 'pruebas' | 'finalizacion';
    estado: 'pendiente' | 'en_proceso' | 'completado';
  }>;
}

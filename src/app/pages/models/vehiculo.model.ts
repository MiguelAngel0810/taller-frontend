import { Cliente } from './cliente.model';
import { OrdenServicio } from './orden-servicio.model';

export interface Vehiculo {
  mecanico_asignado: any;
  id: number;
  id_cliente: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  imagen?: string | null;
  cliente: Cliente;
  ordenes?: OrdenServicio[];
}

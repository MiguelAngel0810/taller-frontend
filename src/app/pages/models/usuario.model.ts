import { Role } from './role.model';
import { TipoDocumento } from './tipo-documento.model';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  id_rol: number;
  id_tipo_documento: number | null;
  activo: boolean;
  telefono: string | null;
  direccion: string | null;
  tipo_documento?: TipoDocumento | null;
  numero_documento: string | null;
  rol: Role;
}

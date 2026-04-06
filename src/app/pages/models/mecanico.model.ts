import { Usuario } from './usuario.model';

export interface Mecanico {
  id: number;
  id_usuario: number;
  especialidad: string;
  usuario?: Usuario;
}
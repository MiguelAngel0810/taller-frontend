export interface TipoDocumento {
  id: number;
  nombre: string;
  abreviatura: string;
  longitud_exacta?: number | null;
  longitud_maxima?: number | null;
}
import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';
import { EstadoTurno } from '../turno.entity'; // Asegúrate de importar el enum/type correcto

/**
 * Define los parámetros de filtro que llegan por la URL (query parameters).
 * TODOS los query parameters llegan inicialmente como strings.
 */
export class TurnoFiltersDto {
  
  @IsOptional()
  @IsNumberString()
  barberoId?: string; // Se recibe como string (ej. "1"), pero se usará como number en el Service
  
  @IsOptional()
  @IsNumberString()
  clienteId?: string;
  
  @IsOptional()
  @IsNumberString()
  servicioId?: string;
  
  @IsOptional()
  @IsString()
  // Asumiendo que has importado el tipo o enum EstadoTurno
  @IsIn(Object.values(EstadoTurno)) // Opcional: valida que el valor sea uno de los estados permitidos
  estado?: EstadoTurno; // Se recibe como string (ej. "pendiente")
  
  @IsOptional()
  @IsString()
  // Asumiendo que el formato es YYYY-MM-DD
  fecha?: string; 
}
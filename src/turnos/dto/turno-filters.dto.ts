import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';
import { EstadoTurno } from '../turno.entity';

export class TurnoFiltersDto {
  
  @IsOptional()
  @IsNumberString()
  barberoId?: string; // Se recibe como string pero se usa como number en el Service
  
  @IsOptional()
  @IsNumberString()
  clienteId?: string;
  
  @IsOptional()
  @IsNumberString()
  servicioId?: string;
  
  @IsOptional()
  @IsString()
  @IsIn(Object.values(EstadoTurno)) // valida que el valor sea uno de los estados permitidos
  estado?: EstadoTurno; // Se recibe como string (ej. "pendiente")
  
  @IsOptional()
  @IsString()
  fecha?: string; 
}
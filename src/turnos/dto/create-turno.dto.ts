import { IsInt, IsDateString, IsEnum } from 'class-validator';
import { EstadoTurno } from '../turno.entity';

export class CreateTurnoDto {
  @IsInt()
  clienteId: number;

  @IsInt()
  barberoId: number;

  @IsInt()
  servicioId: number;

  @IsDateString()
  fecha_hora: string;

  @IsEnum(EstadoTurno)
  estado?: EstadoTurno; 
}

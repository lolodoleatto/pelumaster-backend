import { IsString, IsInt, IsPositive, Length, IsNumber, IsOptional } from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @Length(2, 50)
  nombre: string;

  @IsInt()
  @IsPositive()
  duracion_minutos: number;

  @IsNumber()
  @IsPositive()
  precio: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

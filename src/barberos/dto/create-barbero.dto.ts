import { IsString, IsOptional, IsBoolean, IsDateString, Length } from 'class-validator';

export class CreateBarberoDto {
  @IsString()
  @Length(2, 50)
  nombre: string;

  @IsString()
  @Length(2, 50)
  apellido: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  telefono?: string;

  @IsOptional()
  @IsDateString()
  fecha_ingreso?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

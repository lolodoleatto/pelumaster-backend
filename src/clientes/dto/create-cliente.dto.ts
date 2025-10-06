import { IsString, IsOptional, IsEmail, Length } from 'class-validator';

export class CreateClienteDto {
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
  @IsEmail()
  email?: string;
}

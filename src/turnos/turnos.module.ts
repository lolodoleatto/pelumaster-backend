import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './turno.entity';
import { TurnoService } from './turnos.service';
import { TurnoController } from './turnos.controller';
import { Cliente } from '../clientes/cliente.entity';
import { Barbero } from '../barberos/barbero.entity';
import { Servicio } from '../servicios/servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Cliente, Barbero, Servicio])],
  providers: [TurnoService],
  controllers: [TurnoController],
})
export class TurnoModule {}


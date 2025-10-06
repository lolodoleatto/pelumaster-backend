import { Module } from '@nestjs/common';
import { ServicioService } from './servicios.service';
import { ServicioController } from './servicios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Servicio } from './servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio])],
  providers: [ServicioService],
  controllers: [ServicioController],
  exports: [TypeOrmModule]
})
export class ServiciosModule {} 

import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from 'src/turnos/turno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno])],
  providers: [ReportesService],
  controllers: [ReportesController],
})
export class ReportesModule {}


import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from 'src/turnos/turno.entity';
import { Repository, Between } from 'typeorm';
import moment from 'moment';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  // 🔹 Reporte por barbero en un rango de fechas
  async reportePorBarbero(id_barbero: number, desde?: string, hasta?: string) {
    let fechaInicio: Date | undefined;
    let fechaFin: Date | undefined;

    if (desde) fechaInicio = moment(desde).startOf('day').toDate();
    if (hasta) fechaFin = moment(hasta).endOf('day').toDate();

    // 🔹 Creamos un objeto para la condición de búsqueda
    const whereCondition: any = {
      barbero: { id_barbero }, // usamos la relación
    };

    if (fechaInicio && fechaFin) {
      whereCondition.fecha_hora = Between(fechaInicio, fechaFin);
    }

    const turnos = await this.turnoRepository.find({
      where: whereCondition,
      relations: ['servicio', 'barbero', 'cliente'],
      order: { fecha_hora: 'ASC' },
    });

    const totalTurnos = turnos.length;
    const totalGanancias = turnos.reduce(
      (acc, turno) => acc + Number(turno.servicio.precio),
      0,
    );

    return {
      id_barbero,
      totalTurnos,
      totalGanancias,
      desde: fechaInicio,
      hasta: fechaFin,
      turnos, // opcional, detalle de turnos
    };
  }
  
  // 🔹 Reporte semanal
  async reporteSemana(id_barbero: number, fecha: string) {
    const inicioSemana = moment(fecha).startOf('week').toDate();
    const finSemana = moment(fecha).endOf('week').toDate();

    return this.reportePorBarbero(id_barbero, inicioSemana.toISOString(), finSemana.toISOString());
  }

  // 🔹 Reporte mensual
  async reporteMes(id_barbero: number, fecha: string) {
    const inicioMes = moment(fecha).startOf('month').toDate();
    const finMes = moment(fecha).endOf('month').toDate();

    return this.reportePorBarbero(id_barbero, inicioMes.toISOString(), finMes.toISOString());
  }

  // 🔹 Reporte anual
  async reporteAnio(id_barbero: number, fecha: string) {
    const inicioAnio = moment(fecha).startOf('year').toDate();
    const finAnio = moment(fecha).endOf('year').toDate();

    return this.reportePorBarbero(id_barbero, inicioAnio.toISOString(), finAnio.toISOString());
  }
}


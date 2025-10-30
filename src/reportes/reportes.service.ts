import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// Asegúrate de que EstadoTurno esté importado o sea visible
import { Turno, EstadoTurno } from 'src/turnos/turno.entity'; 
import { Repository, Between } from 'typeorm';
import moment from 'moment';

@Injectable()
export class ReportesService {
    constructor(
        @InjectRepository(Turno)
        private readonly turnoRepository: Repository<Turno>,
    ) {}
    
    // 🛑 1. FUNCIONES AUXILIARES (COPIADAS DESDE TurnoService) 🛑
    private calcularFechaFin(fecha_hora: string, duracion_minutos: number | string): Date {
        const duracion = Number(duracion_minutos);
        const fechaInicio = new Date(fecha_hora);
        const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);
        return fechaFin;
    }

    private getEstadoDinamico(turno: Turno): EstadoTurno {
        // Ignoramos la lógica de tiempo si ya fue CANCELADO o REALIZADO
        if (turno.estado === EstadoTurno.CANCELADO || turno.estado === EstadoTurno.REALIZADO) {
            return turno.estado;
        }

        const ahora = new Date();
        const fechaInicio = new Date(turno.fecha_hora);
        // Requiere que la relación 'servicio' esté cargada
        const fechaFin = this.calcularFechaFin(turno.fecha_hora.toString(), turno.servicio.duracion_minutos);

        if (ahora > fechaFin) return EstadoTurno.REALIZADO;
        if (ahora >= fechaInicio && ahora < fechaFin) return EstadoTurno.EN_PROCESO;
        return EstadoTurno.PENDIENTE;
    }
    // 🛑 FIN DE FUNCIONES AUXILIARES 🛑


    // 🔹 Reporte por barbero en un rango de fechas (MODIFICADO)
    async reportePorBarbero(id_barbero: number, desde?: string, hasta?: string) {
        let fechaInicio: Date | undefined;
        let fechaFin: Date | undefined;

        if (desde) fechaInicio = moment(desde).startOf('day').toDate();
        if (hasta) fechaFin = moment(hasta).endOf('day').toDate();

        const whereCondition: any = {
            barbero: { id_barbero },
        };

        if (fechaInicio && fechaFin) {
            whereCondition.fecha_hora = Between(fechaInicio, fechaFin);
        }

        // 1. Obtener todos los turnos del rango (incluyendo cancelados)
        const turnosDB = await this.turnoRepository.find({
            where: whereCondition,
            relations: ['servicio', 'barbero', 'cliente'],
            order: { fecha_hora: 'ASC' },
        });

        // 🛑 2. APLICAR ESTADO DINÁMICO 🛑
        const turnosConEstadoDinamico = turnosDB.map(turno => {
            const turnoCopia = { ...turno };
            if (turno.servicio) {
                turnoCopia.estado = this.getEstadoDinamico(turnoCopia as Turno);
            }
            return turnoCopia;
        }) as Turno[];


        // 🛑 3. FILTRAR PARA MÉTRICAS: EXCLUIR SOLO CANCELADOS 🛑
        const turnosParaMetricas = turnosConEstadoDinamico.filter(t => t.estado !== EstadoTurno.CANCELADO);

        // Contamos la longitud de los turnos NO CANCELADOS
        const totalTurnos = turnosParaMetricas.length; 
        
        // Sumamos las ganancias de los turnos NO CANCELADOS
        // Nota: Esto es el "Valor Bruto de Turnos" en el rango.
        const totalGanancias = turnosParaMetricas.reduce(
            (acc, turno) => acc + Number(turno.servicio.precio),
            0,
        );

        return {
            id_barbero,
            totalTurnos, // Conteo excluyendo cancelados
            totalGanancias, // Ganancia excluyendo cancelados
            desde: fechaInicio,
            hasta: fechaFin,
            turnos: turnosConEstadoDinamico, // Devolver la lista completa con el estado dinámico
        };
    }
    
    // 🔹 Reporte semanal (usa reportePorBarbero, sin cambios)
    async reporteSemana(id_barbero: number, fecha: string) {
        const inicioSemana = moment(fecha).startOf('week').toDate();
        const finSemana = moment(fecha).endOf('week').toDate();
        return this.reportePorBarbero(id_barbero, inicioSemana.toISOString(), finSemana.toISOString());
    }

    // 🔹 Reporte mensual (usa reportePorBarbero, sin cambios)
    async reporteMes(id_barbero: number, fecha: string) {
        const inicioMes = moment(fecha).startOf('month').toDate();
        const finMes = moment(fecha).endOf('month').toDate();
        return this.reportePorBarbero(id_barbero, inicioMes.toISOString(), finMes.toISOString());
    }

    // 🔹 Reporte anual (usa reportePorBarbero, sin cambios)
    async reporteAnio(id_barbero: number, fecha: string) {
        const inicioAnio = moment(fecha).startOf('year').toDate();
        const finAnio = moment(fecha).endOf('year').toDate();
        return this.reportePorBarbero(id_barbero, inicioAnio.toISOString(), finAnio.toISOString());
    }
}
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    // GET /reportes/barbero/:id?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    @Get('barbero/:id')
    getReporteBarbero(
        @Param('id') id_barbero: number,
        @Query('desde') desde?: string,
        @Query('hasta') hasta?: string,
    ) {
        return this.reportesService.reportePorBarbero(id_barbero, desde, hasta);
    }

    // Reporte semanal
    @Get('barbero/:id/semana')
    getReporteSemana(
        @Param('id') id_barbero: number,
        @Query('fecha') fecha: string, // cualquier fecha dentro de la semana
    ) {
        return this.reportesService.reporteSemana(id_barbero, fecha);
    }

    // Reporte mensual
    @Get('barbero/:id/mes')
    getReporteMes(
        @Param('id') id_barbero: number,
        @Query('fecha') fecha: string, // cualquier fecha dentro del mes
    ) {
        return this.reportesService.reporteMes(id_barbero, fecha);
    }

    // Reporte anual
    @Get('barbero/:id/anio')
    getReporteAnio(
        @Param('id') id_barbero: number,
        @Query('fecha') fecha: string, // cualquier fecha dentro del año
    ) {
        return this.reportesService.reporteAnio(id_barbero, fecha);
    }
}


import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { TurnoService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { EstadoTurno } from './turno.entity';

@Controller('turnos')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) { }

  @Post()
  create(@Body() dto: CreateTurnoDto) {
    return this.turnoService.create(dto);
  }

  @Get()
  findAll() {
    return this.turnoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.turnoService.findOne(+id);
  }

  // listar turnos por barberos
  @Get('barbero/:id')
  async findByBarbero(@Param('id') id: string) {
    return this.turnoService.findByBarbero(+id);
  }

  // listar turnos por cliente
  @Get('cliente/:id')
  async findByCliente(@Param('id') id: string) {
    return this.turnoService.findByCliente(+id);
  }

  //listar turnos por estado
  @Get('estado/:estado')
  async findByEstado(@Param('estado') estado: EstadoTurno) {
    return this.turnoService.findByEstado(estado);
  }

  @Get('fecha/:fecha')
  findByFecha(@Param('fecha') fecha: string) {
    return this.turnoService.findByFecha(fecha);
  }

  @Get('semana/:fecha')
  findBySemana(@Param('fecha') fecha: string) {
    return this.turnoService.findBySemana(fecha);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    return this.turnoService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turnoService.remove(+id);
  }

  // 🟢 Nuevo Endpoint: Cancelar Turno
  @Patch(':id/cancelar')
  cancelarTurno(@Param('id') id: string) {
    // Solo se necesita el ID para cambiar el estado a 'CANCELADO'
    return this.turnoService.updateEstado(+id, ESTADOS_TURNO.CANCELADO);
  }

  // 🟢 Nuevo Endpoint: Reprogramar Turno
  @Patch(':id/reprogramar')
  reprogramarTurno(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    // Necesita el ID y la nueva fecha_hora en el DTO
    return this.turnoService.reprogramar(+id, dto.fecha_hora);
  }

}



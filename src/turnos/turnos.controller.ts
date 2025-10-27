import { Controller, Get, Post, Patch, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
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

  // 🟢 Verificar la URL de Cancelar
  @Patch(':id/cancelar') // <--- VERIFICA EL PATTERN DE RUTA
  cancelarTurno(@Param('id') id: string) {
    return this.turnoService.updateEstado(+id, EstadoTurno.CANCELADO);
  }

  // 🟢 Verificar la URL de Reprogramar
  @Patch(':id/reprogramar')
  reprogramarTurno(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    // 🟢 CORRECCIÓN: Validar que fecha_hora exista
    if (!dto.fecha_hora) {
      throw new BadRequestException('El campo fecha_hora es requerido para la reprogramación.');
    }
    // El '!' le dice a TypeScript que, si llegamos aquí, ya sabemos que NO es undefined.
    return this.turnoService.reprogramar(+id, dto.fecha_hora);
  }

}



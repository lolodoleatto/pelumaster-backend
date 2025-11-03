import { 
  Controller, Get, Post, Patch, Delete, Param, Body, Query, BadRequestException 
} from '@nestjs/common';
import { TurnoService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { EstadoTurno, Turno } from './turno.entity';
import { TurnoFiltersDto } from './dto/turno-filters.dto';

@Controller('turnos')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) { }

  @Post()
  create(@Body() dto: CreateTurnoDto) {
    return this.turnoService.create(dto);
  }

  @Get()
  async findAll(@Query() filters: TurnoFiltersDto): Promise<Turno[]> { 
    return this.turnoService.findAll(filters); 
  }

  @Get(':id')
  // @Param('id') extrae el ID de la URL. El '+' convierte el string 'id' a number.
  findOne(@Param('id') id: string) {
    return this.turnoService.findOne(+id);
  }

  @Get('barbero/:id')
  async findByBarbero(@Param('id') id: string) {
    return this.turnoService.findByBarbero(+id);
  }

  @Get('cliente/:id')
  async findByCliente(@Param('id') id: string) {
    return this.turnoService.findByCliente(+id);
  }

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

  @Patch(':id/cancelar')
  cancelarTurno(@Param('id') id: string) {
    // Llama al servicio para cambiar el estado a CANCELADO sin necesidad de un DTO completo.
    return this.turnoService.updateEstado(+id, EstadoTurno.CANCELADO);
  }

  @Patch(':id/reprogramar')
  reprogramarTurno(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    if (!dto.fecha_hora) {
      throw new BadRequestException('El campo fecha_hora es requerido para la reprogramación.');
    }
    return this.turnoService.reprogramar(+id, dto.fecha_hora);
  }

}
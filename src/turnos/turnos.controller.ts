import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTurnoDto) {
    return this.turnoService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.turnoService.remove(+id);
  }
}


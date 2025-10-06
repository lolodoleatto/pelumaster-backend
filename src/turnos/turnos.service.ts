import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoTurno, Turno } from './turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Cliente } from '../clientes/cliente.entity';
import { Barbero } from '../barberos/barbero.entity';
import { Servicio } from '../servicios/servicio.entity';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Barbero)
    private readonly barberoRepository: Repository<Barbero>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  async create(dto: CreateTurnoDto): Promise<Turno> {
  const cliente = await this.clienteRepository.findOneBy({ id_cliente: dto.clienteId });
  const barbero = await this.barberoRepository.findOneBy({ id_barbero: dto.barberoId });
  const servicio = await this.servicioRepository.findOneBy({ id_servicio: dto.servicioId });

  if (!cliente) throw new NotFoundException(`Cliente con id ${dto.clienteId} no encontrado`);
  if (!barbero) throw new NotFoundException(`Barbero con id ${dto.barberoId} no encontrado`);
  if (!servicio) throw new NotFoundException(`Servicio con id ${dto.servicioId} no encontrado`);

  const turno = this.turnoRepository.create({
    cliente,
    barbero,
    servicio,
    fecha_hora: new Date(dto.fecha_hora),
    estado: dto.estado ?? EstadoTurno.PENDIENTE, // ⚡
  });

  return this.turnoRepository.save(turno);
}

  async findAll(): Promise<Turno[]> {
    return this.turnoRepository.find();
  }

  async findOne(id: number): Promise<Turno> {
    const turno = await this.turnoRepository.findOneBy({ id_turno: id });
    if (!turno) throw new NotFoundException(`Turno con id ${id} no encontrado`);
    return turno;
  }

  async update(id: number, dto: UpdateTurnoDto): Promise<Turno> {
    const turno = await this.findOne(id);

    if (dto.clienteId) {
      const cliente = await this.clienteRepository.findOneBy({ id_cliente: dto.clienteId });
      if (!cliente) throw new NotFoundException(`Cliente con id ${dto.clienteId} no encontrado`);
      turno.cliente = cliente;
    }

    if (dto.barberoId) {
      const barbero = await this.barberoRepository.findOneBy({ id_barbero: dto.barberoId });
      if (!barbero) throw new NotFoundException(`Barbero con id ${dto.barberoId} no encontrado`);
      turno.barbero = barbero;
    }

    if (dto.servicioId) {
      const servicio = await this.servicioRepository.findOneBy({ id_servicio: dto.servicioId });
      if (!servicio) throw new NotFoundException(`Servicio con id ${dto.servicioId} no encontrado`);
      turno.servicio = servicio;
    }

    if (dto.fecha_hora) turno.fecha_hora = new Date(dto.fecha_hora);
    if (dto.estado) turno.estado = dto.estado;

    return this.turnoRepository.save(turno);
  }

  async remove(id: number): Promise<void> {
    const result = await this.turnoRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Turno con id ${id} no encontrado`);
  }
}

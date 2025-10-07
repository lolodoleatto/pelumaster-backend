import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  ) { }

  async create(dto: CreateTurnoDto): Promise<Turno> {
    const { clienteId, barberoId, servicioId, fecha_hora } = dto;

    // 🕒 Buscar si ya hay un turno en esa fecha/hora para el mismo barbero
    const turnoExistente = await this.turnoRepository.findOne({
      where: { barbero: { id_barbero: barberoId }, fecha_hora: new Date(fecha_hora) },
    });

    if (turnoExistente) {
      throw new ConflictException({
        message: 'El barbero ya tiene un turno asignado en ese horario',
        turnoId: turnoExistente.id_turno,
      });
    }

    const cliente = await this.clienteRepository.findOneBy({ id_cliente: dto.clienteId });
    const barbero = await this.barberoRepository.findOneBy({ id_barbero: dto.barberoId });
    const servicio = await this.servicioRepository.findOneBy({ id_servicio: dto.servicioId });

    if (!cliente) throw new NotFoundException(`Cliente con id ${dto.clienteId} no encontrado`);
    if (!barbero) throw new NotFoundException(`Barbero con id ${dto.barberoId} no encontrado`);
    if (!servicio) throw new NotFoundException(`Servicio con id ${dto.servicioId} no encontrado`);

    // ⏱ Calcular hora de fin
    const fechaInicio = new Date(fecha_hora);
    const fechaFin = new Date(fechaInicio.getTime() + servicio.duracion_minutos * 60000);

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

  //encontrar barbero por turno
  async findByBarbero(barberoId: number): Promise<Turno[]> {
    return this.turnoRepository.find({
      where: { barbero: { id_barbero: barberoId } },
      relations: ['cliente', 'servicio', 'barbero'],
    });
  }

  //listar clientes por turnos
  async findByCliente(clienteId: number): Promise<Turno[]> {
    return this.turnoRepository.find({
      where: { cliente: { id_cliente: clienteId } },
      relations: ['cliente', 'servicio', 'barbero'],
    });
  }

  // listar turnos por estado
  async findByEstado(estado: EstadoTurno): Promise<Turno[]> {
    return this.turnoRepository.find({
      where: { estado },
      relations: ['cliente', 'servicio', 'barbero'],
    });
  }

}



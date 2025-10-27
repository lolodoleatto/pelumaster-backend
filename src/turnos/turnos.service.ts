import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import moment from 'moment';
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

  // 🔹 Función auxiliar para calcular la fecha de fin del turno
  private calcularFechaFin(fecha_hora: string, duracion_minutos: number | string): Date {
    const duracion = Number(duracion_minutos);
    if (isNaN(duracion)) {
      throw new Error('La duración del servicio no es válida');
    }

    const fechaInicio = new Date(fecha_hora);
    if (isNaN(fechaInicio.getTime())) {
      throw new Error('La fecha de inicio no es válida');
    }

    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);
    return fechaFin;
  }


  async create(dto: CreateTurnoDto) {
    const { barberoId, servicioId, fecha_hora } = dto;

    const barbero = await this.barberoRepository.findOne({ where: { id_barbero: barberoId } });
    if (!barbero) throw new NotFoundException('Barbero no encontrado');

    const servicio = await this.servicioRepository.findOne({ where: { id_servicio: servicioId } });
    if (!servicio) throw new NotFoundException('Servicio no encontrado');

    const fechaInicio = new Date(fecha_hora);
    const fechaFin = this.calcularFechaFin(fecha_hora, servicio.duracion_minutos);

    // Buscamos todos los turnos de ese barbero
    const turnos = await this.turnoRepository.find({ where: { barbero } });

    // Validar si hay superposición
    const conflicto = turnos.find((t) => {
      const inicioExistente = new Date(t.fecha_hora);
      const finExistente = this.calcularFechaFin(
        typeof t.fecha_hora === 'string' ? t.fecha_hora : t.fecha_hora.toISOString(),
        servicio.duracion_minutos
      );

      return (
        (fechaInicio >= inicioExistente && fechaInicio < finExistente) ||
        (fechaFin > inicioExistente && fechaFin <= finExistente)
      );
    });

    if (conflicto) {
      throw new BadRequestException({
        mensaje: 'El barbero ya tiene un turno asignado en ese horario',
        conflicto: {
          id_turno: conflicto.id_turno,
          inicio: conflicto.fecha_hora,
          fin: this.calcularFechaFin(
            typeof conflicto.fecha_hora === 'string' ? conflicto.fecha_hora : conflicto.fecha_hora.toISOString(),
            servicio.duracion_minutos
          ),
        },
      });
    }

    // Si no hay conflicto, creamos el turno
    const nuevoTurno = this.turnoRepository.create({
      ...dto,
      barbero,
      servicio,
    });

    return this.turnoRepository.save(nuevoTurno);
  }


  async findAll(): Promise<Turno[]> {
    return this.turnoRepository.find({
      relations: [
        'cliente',  // ¡Necesario para el frontend!
        'barbero',  // ¡Necesario para el frontend!
        'servicio', // ¡Necesario para el frontend!
      ],
      order: { fecha_hora: 'ASC' }, // Opcional: ordenar para mejor UX
    });
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

  // 🔹 Filtrar turnos por fecha (día específico)
  async findByFecha(fecha: string) {
    const fechaInicio = moment.utc(fecha).startOf('day').toDate();
    const fechaFin = moment.utc(fecha).endOf('day').toDate();

    return this.turnoRepository.find({
      where: { fecha_hora: Between(fechaInicio, fechaFin) },
      relations: ['barbero', 'servicio', 'cliente'],
      order: { fecha_hora: 'ASC' },
    });
  }

  // 🔹 Filtrar turnos por semana (semana de una fecha dada)
  async findBySemana(fecha: string) {
    const fechaInicio = moment.utc(fecha).startOf('week').toDate();
    const fechaFin = moment.utc(fecha).endOf('week').toDate();

    return this.turnoRepository.find({
      where: { fecha_hora: Between(fechaInicio, fechaFin) },
      relations: ['barbero', 'servicio', 'cliente'],
      order: { fecha_hora: 'ASC' },
    });
  }

  // 🔹 Reporte de un barbero
  async getReporteBarbero(id_barbero: number, desde?: string, hasta?: string) {
    let fechaInicio: Date | undefined;
    let fechaFin: Date | undefined;

    if (desde) fechaInicio = moment(desde).startOf('day').toDate();
    if (hasta) fechaFin = moment(hasta).endOf('day').toDate();

    const whereCondition = {
      id_barbero,
      ...(fechaInicio && fechaFin ? { fecha_hora: Between(fechaInicio, fechaFin) } : {}),
    };

    const turnos = await this.turnoRepository.find({
      where: whereCondition,
      relations: ['servicio'],
    });

    const totalTurnos = turnos.length;
    const totalGanancias = turnos.reduce((acc, turno) => acc + Number(turno.servicio.precio), 0);

    return {
      id_barbero,
      totalTurnos,
      totalGanancias,
      desde: fechaInicio,
      hasta: fechaFin,
      turnos, // opcional, para detalle de cada turno
    };
  }

}



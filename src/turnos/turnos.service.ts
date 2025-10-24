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

  
// 🟢 NUEVA FUNCIÓN: Determina el estado dinámico basado en la hora actual
private getEstadoDinamico(turno: Turno): EstadoTurno {
  // Ignoramos la lógica de tiempo si ya fue CANCELADO o CONFIRMADO (si los usas manualmente)
  if (turno.estado === EstadoTurno.CANCELADO || turno.estado === EstadoTurno.REALIZADO) {
      return turno.estado;
  }

  const ahora = new Date();
  const fechaInicio = new Date(turno.fecha_hora);
  
  // Usamos el servicio cargado para obtener la duración
  const fechaFin = this.calcularFechaFin(
    turno.fecha_hora.toString(), 
    turno.servicio.duracion_minutos // Asumimos que el servicio ya está cargado
  );

  // 1. Está COMPLETADO: Si la hora actual es posterior a la hora de FIN del turno.
  if (ahora > fechaFin) {
    return EstadoTurno.REALIZADO;
  }
  
  // 2. Está EN PROCESO: Si la hora actual está entre la hora de INICIO y la hora de FIN.
  if (ahora >= fechaInicio && ahora < fechaFin) {
    return EstadoTurno.EN_PROCESO;
  }
  
  // 3. PENDIENTE: Si la hora actual es anterior a la hora de INICIO.
  return EstadoTurno.PENDIENTE;
}



  async create(dto: CreateTurnoDto) {
    const { barberoId, servicioId, clienteId, fecha_hora } = dto;

    // 1. 🔍 BUSCAR Y VALIDAR CLIENTE
    const cliente = await this.clienteRepository.findOne({ where: { id_cliente: clienteId } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // 2. 🔍 BUSCAR Y VALIDAR BARBERO
    const barbero = await this.barberoRepository.findOne({ where: { id_barbero: barberoId } });
    if (!barbero) throw new NotFoundException('Barbero no encontrado');

    // 3. 🔍 BUSCAR Y VALIDAR SERVICIO
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
      cliente,
    });

    return this.turnoRepository.save(nuevoTurno);
  }


 async findAll(): Promise<Turno[]> {
  // 1. Obtener todos los turnos con sus relaciones (¡esto ya lo corregimos y funciona bien!)
  const turnosDB = await this.turnoRepository.find({
    relations: [
      'cliente',
      'barbero',
      'servicio', // Necesitamos el servicio para obtener la duración
    ],
    order: { fecha_hora: 'ASC' },
  });

  // 2. Mapear los turnos para aplicar el estado dinámico
  const turnosConEstadoDinamico = turnosDB.map(turno => {
    // ⚠️ Importante: Creamos una copia del objeto para no modificar la entidad original de TypeORM
    // Esto es solo para la respuesta HTTP.
    const turnoCopia = { ...turno }; 
    
    // Si la entidad Servicio está cargada, calculamos el nuevo estado
    if (turno.servicio) {
        // 🟢 Asignamos el estado calculado dinámicamente
        // Esto sobrescribe el estado almacenado en la DB, pero solo en la respuesta HTTP
        turnoCopia.estado = this.getEstadoDinamico(turnoCopia as Turno); 
    }
    
    return turnoCopia;
  });

  return turnosConEstadoDinamico as Turno[];
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



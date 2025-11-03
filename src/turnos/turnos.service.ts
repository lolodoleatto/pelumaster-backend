import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import moment from 'moment';
import { EstadoTurno, Turno } from './turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Cliente } from '../clientes/cliente.entity';
import { Barbero } from '../barberos/barbero.entity';
import { Servicio } from '../servicios/servicio.entity';
import { TurnoFiltersDto } from './dto/turno-filters.dto';

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


  // Función para calcular la fecha de fin del turno
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


  // Funcion para determinar el estado dinámico basado en la hora actual
  private getEstadoDinamico(turno: Turno): EstadoTurno {
    // Ignoramos la lógica de tiempo si ya fue CANCELADO o CONFIRMADO
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

    // Está COMPLETADO: Si la hora actual es posterior a la hora de FIN del turno.
    if (ahora > fechaFin) {
      return EstadoTurno.REALIZADO;
    }

    // Está EN PROCESO: Si la hora actual está entre la hora de INICIO y la hora de FIN.
    if (ahora >= fechaInicio && ahora < fechaFin) {
      return EstadoTurno.EN_PROCESO;
    }

    // 3. PENDIENTE: Si la hora actual es anterior a la hora de INICIO.
    return EstadoTurno.PENDIENTE;
  }


  async create(dto: CreateTurnoDto) {
    const { barberoId, servicioId, clienteId, fecha_hora } = dto;

    const fechaInicio = new Date(fecha_hora);
    const ahora = new Date(); // Obtener la hora actual

    // validación para agendar turnos solo en fechas futuras
    if (fechaInicio < ahora) {
      throw new BadRequestException({
        mensaje: 'No se puede agendar un turno en el pasado. Seleccione una fecha y hora futuras.'
      });
    }

    // BUSCAR Y VALIDAR CLIENTE, BARBERO Y SERVICIO
    const cliente = await this.clienteRepository.findOne({ where: { id_cliente: clienteId } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const barbero = await this.barberoRepository.findOne({ where: { id_barbero: barberoId } });
    if (!barbero) throw new NotFoundException('Barbero no encontrado');

    const servicio = await this.servicioRepository.findOne({ where: { id_servicio: servicioId } });
    if (!servicio) throw new NotFoundException('Servicio no encontrado');

    // CÁLCULO DE HORARIO
    const fechaInicioTurno = new Date(fecha_hora);
    const fechaFin = this.calcularFechaFin(fecha_hora, servicio.duracion_minutos);

    // VALIDACIÓN DE CONFLICTO (Filtrando solo turnos activos)

    // ESTADOS QUE BLOQUEAN LA AGENDA
    const estadosActivos: EstadoTurno[] = [
      EstadoTurno.PENDIENTE,
      EstadoTurno.EN_PROCESO,
    ];

    // Consulta para obtener SOLO los turnos que realmente bloquean
    const turnosActivos = await this.turnoRepository.find({
      where: {
        barbero: { id_barbero: barberoId }, // Filtrar por ID del barbero
        estado: In(estadosActivos) // Usamos In(estadosActivos)
      },
      relations: ['servicio'] // Necesitamos la duración del servicio para el conflicto
    });


    // BUSCAR CONFLICTO DENTRO DE LOS TURNOS ACTIVOS
    const conflicto = turnosActivos.find((t) => {
      const inicioExistente = new Date(t.fecha_hora);
      const finExistente = this.calcularFechaFin(
        inicioExistente.toISOString(),
        t.servicio.duracion_minutos
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
          fin: this.calcularFechaFin(conflicto.fecha_hora.toISOString(), conflicto.servicio.duracion_minutos),
        },
      });
    }

    // CREAR Y GUARDAR EL TURNO
    const nuevoTurno = this.turnoRepository.create({
      ...dto,
      barbero,
      servicio,
      cliente,
    });

    return this.turnoRepository.save(nuevoTurno);
  }


  async findAll(filters: TurnoFiltersDto = {}): Promise<Turno[]> {
    // Desestructurar y preparar filtros (convertir a número donde sea necesario)
    const barberoId = filters.barberoId ? parseInt(filters.barberoId, 10) : undefined;
    const clienteId = filters.clienteId ? parseInt(filters.clienteId, 10) : undefined;
    const servicioId = filters.servicioId ? parseInt(filters.servicioId, 10) : undefined;

    // El estado y la fecha se manejan como strings
    const { estado, fecha } = filters;

    // Construir la condición WHERE (SOLO para filtros estáticos de DB)
    const where: any = {};

    if (barberoId) {
      where.barbero = { id_barbero: barberoId };
    }
    if (clienteId) {
      where.cliente = { id_cliente: clienteId };
    }
    if (servicioId) {
      where.servicio = { id_servicio: servicioId };
    }

    // Filtro por FECHA (Between)
    if (fecha) {
      const fechaInicio = moment(fecha).startOf('day').toDate();
      const fechaFin = moment(fecha).endOf('day').toDate();
      where.fecha_hora = Between(fechaInicio, fechaFin);
    }


    // Ejecutar la consulta base (con filtros estáticos como ID y FECHA)
    const turnosDB = await this.turnoRepository.find({
      where: where,
      relations: [
        'cliente',
        'barbero',
        'servicio',
      ],
      order: { fecha_hora: 'ASC' },
    });

    // Aplicar LÓGICA DINÁMICA DE ESTADO (Mapeo)
    const turnosConEstadoDinamico = turnosDB.map(turno => {
      const turnoCopia = { ...turno };

      // Sobreescribir el estado con el valor calculado en tiempo de ejecución
      // Esto permite que 'pendiente' se convierta en 'realizado' si ya pasó la hora.
      if (turno.servicio) {
        turnoCopia.estado = this.getEstadoDinamico(turnoCopia as Turno);
      }
      return turnoCopia;
    }) as Turno[];

    // Aplicar FILTRO DE ESTADO EN MEMORIA (Si se solicitó)
    if (estado) {
      // Filtramos la lista de turnos DESPUÉS de calcular su estado real 
      return turnosConEstadoDinamico.filter(turno => turno.estado === estado);
    }

    // Si no hay filtro de estado, devolvemos toda la lista dinámica
    return turnosConEstadoDinamico;
  }

  
  async findOne(id: number): Promise<Turno> {
    const turno = await this.turnoRepository.findOneBy({ id_turno: id });
    if (!turno) throw new NotFoundException(`Turno con id ${id} no encontrado`);
    return turno;
  }

  // Actualizar solo el estado (usado para CANCELAR)
  async updateEstado(id: number, nuevoEstado: EstadoTurno): Promise<Turno> {
    const turno = await this.turnoRepository.findOneBy({ id_turno: id });
    if (!turno) {
      throw new NotFoundException(`Turno con id ${id} no encontrado`);
    }
    turno.estado = nuevoEstado;

    await this.turnoRepository.save(turno);

    // Devolver el turno con todas las relaciones cargadas
    const turnoConRelaciones = await this.turnoRepository.findOne({
      where: { id_turno: id },
      relations: ['cliente', 'barbero', 'servicio'],
    });

    if (!turnoConRelaciones) {
      throw new NotFoundException(`Turno con id ${id} no encontrado`);
    }

    return turnoConRelaciones;
  }

  // Reprogramar turno (con validación de conflicto)
  async reprogramar(id: number, nuevaFechaHora: string): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id_turno: id },
      relations: ['servicio', 'barbero']
    });
    if (!turno) {
      throw new NotFoundException(`Turno con id ${id} no encontrado`);
    }

    const nuevaFechaInicio = new Date(nuevaFechaHora);

    // VALIDAR FECHA FUTURA
    if (nuevaFechaInicio < new Date()) {
      throw new BadRequestException({
        mensaje: 'No se puede reprogramar a una fecha u hora pasada.',
      });
    }

    // VALIDACIÓN DE CONFLICTO
    const nuevaFechaFin = this.calcularFechaFin(nuevaFechaHora, turno.servicio.duracion_minutos);
    const estadosActivos: EstadoTurno[] = [EstadoTurno.PENDIENTE, EstadoTurno.EN_PROCESO];

    const turnosActivos = await this.turnoRepository.find({
      where: {
        barbero: { id_barbero: turno.barbero.id_barbero },
        estado: In(estadosActivos)
      },
      relations: ['servicio']
    });

    const conflicto = turnosActivos.find((t) => {
      // Excluimos el turno que estamos reprogramando de la validación
      if (t.id_turno === id) return false;

      const inicioExistente = new Date(t.fecha_hora);
      const finExistente = this.calcularFechaFin(inicioExistente.toISOString(), t.servicio.duracion_minutos);

      return (
        (nuevaFechaInicio >= inicioExistente && nuevaFechaInicio < finExistente) ||
        (nuevaFechaFin > inicioExistente && nuevaFechaFin <= finExistente)
      );
    });

    if (conflicto) {
      throw new BadRequestException({
        mensaje: 'El barbero ya tiene un turno asignado en ese nuevo horario.',
      });
    }

    // ASIGNAR NUEVOS VALORES Y GUARDAR
    turno.fecha_hora = nuevaFechaInicio;
    turno.estado = EstadoTurno.PENDIENTE;

    await this.turnoRepository.save(turno);

    const turnoConRelaciones = await this.turnoRepository.findOne({
      where: { id_turno: id },
      relations: ['cliente', 'barbero', 'servicio'],
    });

    if (!turnoConRelaciones) {
      throw new NotFoundException(`Turno con id ${id} no encontrado`);
    }

    return turnoConRelaciones;
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

  // encontrar barbero por turno
  async findByBarbero(barberoId: number): Promise<Turno[]> {
    return this.turnoRepository.find({
      where: { barbero: { id_barbero: barberoId } },
      relations: ['cliente', 'servicio', 'barbero'],
    });
  }

  // listar clientes por turnos
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

  // Filtrar turnos por fecha (día específico)
  async findByFecha(fecha: string) {
    const fechaInicio = moment.utc(fecha).startOf('day').toDate();
    const fechaFin = moment.utc(fecha).endOf('day').toDate();

    return this.turnoRepository.find({
      where: { fecha_hora: Between(fechaInicio, fechaFin) },
      relations: ['barbero', 'servicio', 'cliente'],
      order: { fecha_hora: 'ASC' },
    });
  }

  // Filtrar turnos por semana (semana de una fecha dada)
  async findBySemana(fecha: string) {
    const fechaInicio = moment.utc(fecha).startOf('week').toDate();
    const fechaFin = moment.utc(fecha).endOf('week').toDate();

    return this.turnoRepository.find({
      where: { fecha_hora: Between(fechaInicio, fechaFin) },
      relations: ['barbero', 'servicio', 'cliente'],
      order: { fecha_hora: 'ASC' },
    });
  }

  // Reporte de un barbero
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
      turnos, 
    };
  }

}
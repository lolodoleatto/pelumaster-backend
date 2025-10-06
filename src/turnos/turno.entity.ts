import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { Barbero } from '../barberos/barbero.entity';
import { Servicio } from '../servicios/servicio.entity';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
}

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn()
  id_turno: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.turnos, { eager: true })
  cliente: Cliente;

  @ManyToOne(() => Barbero, (barbero) => barbero.turnos, { eager: true })
  barbero: Barbero;

  @ManyToOne(() => Servicio, (servicio) => servicio.turnos, { eager: true })
  servicio: Servicio;

  @Column('datetime')
  fecha_hora: Date;

  @Column({
    type: 'enum',
    enum: EstadoTurno,
    default: EstadoTurno.PENDIENTE,
  })
  estado: EstadoTurno;
}

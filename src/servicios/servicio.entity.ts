import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Turno } from 'src/turnos/turno.entity';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn()
  id_servicio: number;

  @Column()
  nombre: string;

  @Column()
  duracion_minutos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ nullable: true })
  descripcion: string;

  @OneToMany(() => Turno, (turno) => turno.servicio)
  turnos: Turno[];
}
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Turno } from 'src/turnos/turno.entity';

@Entity('barberos')
export class Barbero {
  @PrimaryGeneratedColumn()
  id_barbero: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fecha_ingreso: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Turno, (turno) => turno.barbero)
  turnos: Turno[];
}


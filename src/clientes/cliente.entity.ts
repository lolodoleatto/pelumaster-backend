import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Turno } from 'src/turnos/turno.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id_cliente: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => Turno, (turno) => turno.cliente)
  turnos: Turno[];
}
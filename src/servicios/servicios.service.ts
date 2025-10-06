import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServicioService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  async create(createServicioDto: CreateServicioDto): Promise<Servicio> {
    const servicio = this.servicioRepository.create(createServicioDto);
    return this.servicioRepository.save(servicio);
  }

  async findAll(): Promise<Servicio[]> {
    return this.servicioRepository.find();
  }

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepository.findOneBy({ id_servicio: id });
    if (!servicio) throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    return servicio;
  }

  async update(id: number, updateServicioDto: UpdateServicioDto): Promise<Servicio> {
    const servicio = await this.findOne(id);
    Object.assign(servicio, updateServicioDto);
    return this.servicioRepository.save(servicio);
  }

  async remove(id: number): Promise<void> {
    const result = await this.servicioRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barbero } from './barbero.entity';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UpdateBarberoDto } from './dto/update-barbero.dto';

@Injectable()
export class BarberosService {
  constructor(
    @InjectRepository(Barbero)
    private readonly barberoRepository: Repository<Barbero>,
  ) {}

  async create(createBarberoDto: CreateBarberoDto): Promise<Barbero> {
    const barbero = this.barberoRepository.create(createBarberoDto);
    return this.barberoRepository.save(barbero);
  }

  async findAll(): Promise<Barbero[]> {
    return this.barberoRepository.find();
  }

  async findOne(id: number): Promise<Barbero> {
    const barbero = await this.barberoRepository.findOneBy({ id_barbero: id });
    if (!barbero) {
      throw new NotFoundException(`Barbero con id ${id} no encontrado`);
    }
    return barbero;
  }

  async update(id: number, updateBarberoDto: UpdateBarberoDto): Promise<Barbero> {
    const barbero = await this.findOne(id);
    Object.assign(barbero, updateBarberoDto);
    return this.barberoRepository.save(barbero);
  }

  async remove(id: number): Promise<void> {
    const result = await this.barberoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Barbero con id ${id} no encontrado`);
    }
  }
}

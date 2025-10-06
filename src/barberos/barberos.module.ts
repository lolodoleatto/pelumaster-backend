import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barbero } from './barbero.entity';
import { BarberosService } from './barberos.service';
import { BarberosController } from './barberos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Barbero])],
  controllers: [BarberosController],
  providers: [BarberosService],
  exports: [TypeOrmModule],
})
export class BarberosModule {}
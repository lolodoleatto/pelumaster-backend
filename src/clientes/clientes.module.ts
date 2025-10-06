import { Module } from '@nestjs/common';
import { ClienteService } from './clientes.service';
import { ClienteController } from './clientes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  providers: [ClienteService],
  controllers: [ClienteController],
  exports: [TypeOrmModule],
})
export class ClientesModule {}

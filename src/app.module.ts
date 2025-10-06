import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarberosModule } from './barberos/barberos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ServiciosModule } from './servicios/servicios.module';
import { TurnoModule } from './turnos/turnos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', 
      host: 'localhost',
      port: 3306, 
      username: 'root', 
      password: 'Lolodoleatto123.',
      database: 'pelumaster_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    BarberosModule,
    ClientesModule,
    ServiciosModule,
    TurnoModule,
  ],
})
export class AppModule {}

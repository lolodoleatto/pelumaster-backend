import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BarberosModule } from './barberos/barberos.module';
import { ClientesModule } from './clientes/clientes.module';
import { ServiciosModule } from './servicios/servicios.module';
import { TurnoModule } from './turnos/turnos.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    // 1. Módulo de Configuración: Carga el .env y lo hace globalmente disponible
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Configuración Asíncrona de TypeORM (Recomendado)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Aseguramos que ConfigModule se cargue primero
      inject: [ConfigService], // Solicitamos el servicio de configuración
      useFactory: (config: ConfigService) => ({ // Función que crea la configuración
        type: 'mysql',
        // Usamos .get<tipo>(variable, valorPorDefecto) para seguridad
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'), // Ya maneja la conversión a número
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'), // Valor por defecto para la base de datos

        autoLoadEntities: true,
        synchronize: true, 
      }),
    }),

    BarberosModule,
    ClientesModule,
    ServiciosModule,
    TurnoModule,
    ReportesModule,
  ],
})
export class AppModule { }
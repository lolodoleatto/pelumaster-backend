import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activar validaciones automáticas para todos los endpoints
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true, // lanza error si hay propiedades extra
    transform: true, // transforma JSON a instancia de clase
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

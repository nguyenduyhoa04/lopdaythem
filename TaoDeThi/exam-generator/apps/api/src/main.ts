import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Increase payload limits to accept base64 image uploads in JSON body (logo data URLs)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Serve uploaded files from a public uploads folder
  const uploadsPath = path.join(process.cwd(), 'apps', 'api', 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Increase payload limits to accept base64 image uploads in JSON body (logo data URLs)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Serve uploaded files from a public uploads folder
  // Handle both cwd from monorepo root and from workspace root (turbo)
  let uploadsPath = path.join(
    process.cwd(),
    'apps',
    'api',
    'public',
    'uploads',
  );
  if (!fs.existsSync(uploadsPath)) {
    const altPath = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(altPath)) {
      uploadsPath = altPath;
    } else {
      // Create the directory if it doesn't exist
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
  }
  console.log('[INFO] Uploads directory:', uploadsPath);
  app.use('/uploads', express.static(uploadsPath));

  app.enableCors();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[INFO] Server running on port ${port}`);
}

bootstrap();

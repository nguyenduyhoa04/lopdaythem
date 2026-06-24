import {
  Controller,
  Patch,
  Get,
  Body,
  Request,
  NotFoundException,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { extname } from 'path';

// Resolve the uploads directory once — works whether cwd is the monorepo root
// or the apps/api workspace (turbo runs from the workspace root).
function getUploadsDir(): string {
  const cwd = process.cwd();
  let uploadsPath = path.join(cwd, 'apps', 'api', 'public', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    const altPath = path.join(cwd, 'public', 'uploads');
    if (fs.existsSync(altPath)) {
      uploadsPath = altPath;
    } else {
      // Return the expected path anyway; multer will create it
      uploadsPath = path.join(cwd, 'apps', 'api', 'public', 'uploads');
    }
  }
  return uploadsPath;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('logo')
  async getLogo() {
    const logoUrl = await this.settingsService.getLogo();
    if (!logoUrl) {
      throw new NotFoundException('Logo chưa được cấu hình');
    }
    return { logoUrl };
  }

  @Patch('logo')
  @UseGuards(AuthGuard('jwt'))
  async updateLogo(@Body('logoUrl') logoUrl: string, @Request() req: any) {
    const saved = await this.settingsService.updateLogo(logoUrl, req.user);
    return { logoUrl: saved?.value || logoUrl };
  }

  @Patch('logo/upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = getUploadsDir();
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
          } catch (e) {
            console.error('Failed to create upload directory:', uploadDir, e);
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const name = `logo-${Date.now()}${extname(file.originalname)}`;
          cb(null, name);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Chỉ cho phép upload file ảnh'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    }),
  )
  async uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      `http://localhost:${process.env.PORT ?? 3000}`;
    const logoUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${file.filename}`;
    console.log(
      `[Settings] Uploading logo: ${logoUrl}, filename: ${file.filename}`,
    );
    const saved = await this.settingsService.updateLogo(logoUrl, req.user);
    console.log(`[Settings] Logo saved to DB: ${saved?.value}`);
    return { logoUrl: saved?.value || logoUrl };
  }

  @Delete('logo')
  @UseGuards(AuthGuard('jwt'))
  async deleteLogo(@Request() req: any) {
    return this.settingsService.deleteLogo(req.user);
  }
}

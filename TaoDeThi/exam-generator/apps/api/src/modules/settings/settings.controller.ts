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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { extname } from 'path';
import { Delete } from '@nestjs/common';

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
    return this.settingsService.updateLogo(logoUrl, req.user);
  }

  @Patch('logo/upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'apps', 'api', 'public', 'uploads');
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
          } catch (e) {
            console.error('Failed to create upload directory', e);
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, name);
        },
      }),
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    console.log('[SettingsController] uploadLogo', {
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      file: file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : null,
    });

    if (!file) {
      console.log('[SettingsController] uploadLogo no file');
      throw new NotFoundException('No file uploaded');
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT ?? 3001}`;
    const logoUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${file.filename}`;
    try {
      return await this.settingsService.updateLogo(logoUrl, req.user);
    } catch (error) {
      console.error('[SettingsController] uploadLogo failed', error);
      throw error;
    }
  }

  @Delete('logo')
  @UseGuards(AuthGuard('jwt'))
  async deleteLogo(@Request() req: any) {
    return this.settingsService.deleteLogo(req.user);
  }
}

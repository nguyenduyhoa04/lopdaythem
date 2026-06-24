import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

function getUploadsDir(): string {
  const cwd = process.cwd();
  let uploadsPath = path.join(cwd, 'apps', 'api', 'public', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    const altPath = path.join(cwd, 'public', 'uploads');
    if (fs.existsSync(altPath)) {
      uploadsPath = altPath;
    }
  }
  return uploadsPath;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateLogo(logoUrl: string, user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền thay đổi logo');
    }

    // Delete old logo file if it exists in local uploads
    try {
      const oldSetting = await this.prisma.setting.findUnique({
        where: { key: 'siteLogo' },
      });
      if (oldSetting?.value) {
        console.log(`[Settings] Found old logo: ${oldSetting.value}`);
        const uploadsSegment = '/uploads/';
        const idx = oldSetting.value.indexOf(uploadsSegment);
        if (idx !== -1) {
          const filename = oldSetting.value.substring(
            idx + uploadsSegment.length,
          );
          const filePath = path.join(getUploadsDir(), filename);
          console.log(`[Settings] Deleting old file: ${filePath}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Settings] Old file deleted successfully`);
          } else {
            console.log(`[Settings] Old file not found: ${filePath}`);
          }
        }
      }
    } catch (e) {
      console.error('[Settings] Error deleting old file:', e);
    }

    console.log(`[Settings] Upserting new logo URL: ${logoUrl}`);
    const result = await this.prisma.setting.upsert({
      where: { key: 'siteLogo' },
      create: { key: 'siteLogo', value: logoUrl },
      update: { value: logoUrl },
    });
    console.log(`[Settings] Upsert result:`, result);
    return result;
  }

  async getLogo() {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'siteLogo' },
    });
    return setting?.value || null;
  }

  async deleteLogo(user: any) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ ADMIN mới có quyền thay đổi logo');
    }

    const setting = await this.prisma.setting.findUnique({
      where: { key: 'siteLogo' },
    });
    if (!setting) return { removed: false };

    const logoUrl: string = setting.value;
    // If logo is stored in local uploads, remove the file
    try {
      const uploadsSegment = '/uploads/';
      const idx = logoUrl.indexOf(uploadsSegment);
      if (idx !== -1) {
        const filename = logoUrl.substring(idx + uploadsSegment.length);
        const filePath = path.join(getUploadsDir(), filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (e) {
      // ignore file deletion errors
    }

    try {
      await this.prisma.setting.delete({ where: { key: 'siteLogo' } });
    } catch (e) {
      // ignore if already removed
    }

    return { removed: true };
  }
}

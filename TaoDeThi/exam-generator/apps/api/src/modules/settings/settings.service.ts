import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateLogo(logoUrl: string, user: any) {
    console.log('[SettingsService] updateLogo', {
      user: user ? { id: user.id, role: user.role } : null,
      logoUrl,
    });

    if (user?.role !== 'ADMIN') {
      console.log('[SettingsService] updateLogo forbidden', user?.role);
      throw new ForbiddenException('Chỉ ADMIN mới có quyền thay đổi logo');
    }

    return this.prisma.setting.upsert({
      where: { key: 'siteLogo' },
      create: { key: 'siteLogo', value: logoUrl },
      update: { value: logoUrl },
    });
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

    const setting = await this.prisma.setting.findUnique({ where: { key: 'siteLogo' } });
    if (!setting) return null;

    const logoUrl: string = setting.value;
    // If logo is stored in local uploads, remove the file
    try {
      const uploadsSegment = '/uploads/';
      const idx = logoUrl.indexOf(uploadsSegment);
      if (idx !== -1) {
        const filename = logoUrl.substring(idx + uploadsSegment.length);
        const filePath = path.join(process.cwd(), 'apps', 'api', 'public', 'uploads', filename);
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

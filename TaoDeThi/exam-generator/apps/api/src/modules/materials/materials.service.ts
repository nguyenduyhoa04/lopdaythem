import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: { subjectId?: string; gradeId?: string; type?: string },
    userId?: string,
  ) {
    const materials = await this.prisma.learningMaterial.findMany({
      where: {
        ...(query.subjectId && { subjectId: query.subjectId }),
        ...(query.gradeId && { gradeId: query.gradeId }),
        ...(query.type && { type: query.type as any }),
      },
      include: {
        teacher: { select: { id: true, name: true } },
        subject: true,
        grade: true,
        purchases: userId ? { where: { parentUserId: userId } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return materials.map((m) => ({
      ...m,
      // Only return fileUrl if FREE or user has purchased
      fileUrl:
        m.accessType === 'FREE' || (userId && m.purchases?.length > 0)
          ? m.fileUrl
          : null,
      isPurchased: userId ? m.purchases?.length > 0 : false,
      purchases: undefined,
    }));
  }

  async findOne(id: string, userId?: string) {
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        subject: true,
        grade: true,
        purchases: userId ? { where: { parentUserId: userId } } : false,
      },
    });
    if (!material) throw new BadRequestException('Tài liệu không tồn tại');

    const isPurchased = userId && material.purchases?.length > 0;
    return {
      ...material,
      fileUrl:
        material.accessType === 'FREE' || isPurchased ? material.fileUrl : null,
      isPurchased: !!isPurchased,
      purchases: undefined,
    };
  }

  async create(
    userId: string,
    dto: {
      title: string;
      description?: string;
      type: 'SLIDE_PPT' | 'VIDEO' | 'DOCUMENT';
      subjectId: string;
      gradeId: string;
      fileUrl: string;
      thumbnailUrl?: string;
      accessType: 'FREE' | 'PAID';
      price?: number;
    },
  ) {
    return this.prisma.learningMaterial.create({
      data: {
        ...dto,
        teacherId: userId,
        price: dto.price ? dto.price : undefined,
      },
      include: { subject: true, grade: true },
    });
  }

  async purchase(materialId: string, parentUserId: string) {
    const material = await this.prisma.learningMaterial.findUnique({
      where: { id: materialId },
    });
    if (!material) throw new BadRequestException('Tài liệu không tồn tại');

    const existing = await this.prisma.materialPurchase.findUnique({
      where: { materialId_parentUserId: { materialId, parentUserId } },
    });
    if (existing)
      throw new BadRequestException('Bạn đã sở hữu tài liệu này rồi');

    await this.prisma.materialPurchase.create({
      data: { materialId, parentUserId, pricePaid: material.price },
    });

    return { success: true, message: 'Nhận tài liệu thành công' };
  }
}

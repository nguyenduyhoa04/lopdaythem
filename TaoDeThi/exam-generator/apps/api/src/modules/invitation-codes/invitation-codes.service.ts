import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvitationCodesService {
  constructor(private prisma: PrismaService) {}

  async createInvitationCode(
    userId: string,
    studentId: string,
    targetRole: 'PARENT' | 'STUDENT',
  ) {
    // Basic check
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new BadRequestException('Học sinh không tồn tại');

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    return this.prisma.invitationCode.create({
      data: {
        code,
        studentId,
        targetRole,
        createdById: userId,
      },
    });
  }

  async redeemCode(userId: string, role: string, codeStr: string) {
    return this.prisma.$transaction(async (tx) => {
      const validInvitation = await tx.invitationCode.findUnique({
        where: { code: codeStr },
      });

      if (!validInvitation || validInvitation.isUsed) {
        throw new BadRequestException(
          'Mã mời không hợp lệ hoặc đã được sử dụng',
        );
      }

      if (validInvitation.targetRole !== role) {
        throw new BadRequestException(
          `Mã mời này dành cho vai trò ${validInvitation.targetRole}, không phải ${role}`,
        );
      }

      await tx.invitationCode.update({
        where: { id: validInvitation.id },
        data: { isUsed: true, usedByUserId: userId },
      });

      if (role === 'STUDENT') {
        await tx.student.update({
          where: { id: validInvitation.studentId },
          data: { userId },
        });
      } else if (role === 'PARENT') {
        // Check if already linked
        const existingLink = await tx.parentStudent.findUnique({
          where: {
            parentUserId_studentId: {
              parentUserId: userId,
              studentId: validInvitation.studentId,
            },
          },
        });
        if (!existingLink) {
          await tx.parentStudent.create({
            data: {
              parentUserId: userId,
              studentId: validInvitation.studentId,
              isOwner: false,
            },
          });
        }
      }

      return { success: true, message: 'Đã liên kết tài khoản thành công' };
    });
  }
}

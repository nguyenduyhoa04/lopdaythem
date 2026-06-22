import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EnrollmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    parentUserId: string,
    dto: { studentId: string; classroomId: string; note?: string },
  ) {
    // Check classroom exists and is open
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: dto.classroomId },
    });
    if (!classroom) throw new BadRequestException('Lớp học không tồn tại');

    // Check student belongs to parent
    const link = await this.prisma.parentStudent.findFirst({
      where: { parentUserId, studentId: dto.studentId },
    });
    if (!link)
      throw new ForbiddenException(
        'Bạn không có quyền đăng ký cho học sinh này',
      );

    // Check duplicate
    const existing = await this.prisma.enrollmentRequest.findFirst({
      where: {
        parentUserId,
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        status: 'PENDING',
      },
    });
    if (existing)
      throw new BadRequestException('Đã có yêu cầu đăng ký đang chờ xử lý');

    return this.prisma.enrollmentRequest.create({
      data: {
        parentUserId,
        studentId: dto.studentId,
        classroomId: dto.classroomId,
        note: dto.note,
      },
      include: {
        classroom: { include: { subject: true, grade: true } },
        student: true,
      },
    });
  }

  async findAll(query: { status?: string }, userId: string, role: string) {
    const where: any = {};
    if (query.status) where.status = query.status;

    // Parent can only see their own requests
    if (role === 'PARENT') where.parentUserId = userId;

    return this.prisma.enrollmentRequest.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, email: true } },
        student: true,
        classroom: {
          include: {
            subject: true,
            grade: true,
            teacher: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, reviewerId: string) {
    const req = await this.prisma.enrollmentRequest.findUnique({
      where: { id },
    });
    if (!req) throw new BadRequestException('Yêu cầu không tồn tại');
    if (req.status !== 'PENDING')
      throw new BadRequestException('Yêu cầu không ở trạng thái chờ duyệt');

    // Add student to classroom
    const existing = await this.prisma.classroomStudent.findUnique({
      where: {
        classroomId_studentId: {
          classroomId: req.classroomId,
          studentId: req.studentId,
        },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.enrollmentRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
      if (!existing) {
        await tx.classroomStudent.create({
          data: { classroomId: req.classroomId, studentId: req.studentId },
        });
      }
    });

    return { success: true, message: 'Đã duyệt yêu cầu đăng ký học' };
  }

  async reject(id: string, reviewerId: string) {
    const req = await this.prisma.enrollmentRequest.findUnique({
      where: { id },
    });
    if (!req) throw new BadRequestException('Yêu cầu không tồn tại');

    return this.prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  async getPublicClassrooms() {
    return this.prisma.classroom.findMany({
      include: {
        subject: true,
        grade: true,
        teacher: { select: { id: true, name: true } },
        schedules: true,
        classroomStudents: { select: { id: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClassroomsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findOne(id: string) {
    return this.prisma.classroom.findUnique({
      where: { id },
      include: {
        subject: true,
        grade: true,
        teacher: { select: { id: true, name: true } },
        schedules: true,
        classroomStudents: { select: { id: true } },
      },
    });
  }
}

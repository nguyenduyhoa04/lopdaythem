import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

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

  async create(dto: CreateClassroomDto) {
    // Verify subject and grade exist
    const [subject, grade, teacher] = await Promise.all([
      this.prisma.subject.findUnique({ where: { id: dto.subjectId } }),
      this.prisma.grade.findUnique({ where: { id: dto.gradeId } }),
      this.prisma.user.findUnique({ where: { id: dto.teacherId } }),
    ]);

    if (!subject) throw new NotFoundException('Môn học không tồn tại');
    if (!grade) throw new NotFoundException('Khối lớp không tồn tại');
    if (!teacher) throw new NotFoundException('Giáo viên không tồn tại');

    const classroom = await this.prisma.classroom.create({
      data: {
        name: dto.name,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        teacherId: dto.teacherId,
        description: dto.description,
        classroomStudents: dto.studentIds
          ? {
              create: dto.studentIds.map((studentId) => ({ studentId })),
            }
          : undefined,
      },
      include: {
        subject: true,
        grade: true,
        teacher: { select: { id: true, name: true } },
        classroomStudents: { include: { student: true } },
        schedules: true,
      },
    });

    return classroom;
  }

  async update(id: string, dto: UpdateClassroomDto) {
    const classroom = await this.findOne(id);
    if (!classroom) throw new NotFoundException('Lớp học không tồn tại');

    const updated = await this.prisma.classroom.update({
      where: { id },
      data: {
        name: dto.name,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        teacherId: dto.teacherId,
        description: dto.description,
      },
      include: {
        subject: true,
        grade: true,
        teacher: { select: { id: true, name: true } },
        classroomStudents: { include: { student: true } },
        schedules: true,
      },
    });

    return updated;
  }

  async delete(id: string) {
    const classroom = await this.findOne(id);
    if (!classroom) throw new NotFoundException('Lớp học không tồn tại');

    // Delete related data
    await this.prisma.classroomStudent.deleteMany({
      where: { classroomId: id },
    });
    await this.prisma.schedule.deleteMany({ where: { classroomId: id } });

    const deleted = await this.prisma.classroom.delete({
      where: { id },
    });

    return { message: 'Lớp học đã được xóa', id: deleted.id };
  }

  async addStudent(classroomId: string, studentId: string) {
    const [classroom, student] = await Promise.all([
      this.findOne(classroomId),
      this.prisma.student.findUnique({ where: { id: studentId } }),
    ]);

    if (!classroom) throw new NotFoundException('Lớp học không tồn tại');
    if (!student) throw new NotFoundException('Học sinh không tồn tại');

    // Check if already enrolled
    const existing = await this.prisma.classroomStudent.findUnique({
      where: {
        classroomId_studentId: { classroomId, studentId },
      },
    });

    if (existing) throw new BadRequestException('Học sinh đã đăng ký lớp này');

    const enrolled = await this.prisma.classroomStudent.create({
      data: { classroomId, studentId },
      include: { student: true },
    });

    return enrolled;
  }

  async removeStudent(classroomId: string, studentId: string) {
    const enrolled = await this.prisma.classroomStudent.findUnique({
      where: {
        classroomId_studentId: { classroomId, studentId },
      },
    });

    if (!enrolled)
      throw new NotFoundException('Học sinh không đăng ký lớp này');

    await this.prisma.classroomStudent.delete({
      where: {
        classroomId_studentId: { classroomId, studentId },
      },
    });

    return { message: 'Học sinh đã được xóa khỏi lớp' };
  }

  async getAll(filters?: {
    subjectId?: string;
    gradeId?: string;
    teacherId?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = filters?.skip || 0;
    const take = filters?.take || 10;
    const where: any = {};

    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.gradeId) where.gradeId = filters.gradeId;
    if (filters?.teacherId) where.teacherId = filters.teacherId;

    const [data, total] = await Promise.all([
      this.prisma.classroom.findMany({
        where,
        include: {
          subject: true,
          grade: true,
          teacher: { select: { id: true, name: true } },
          classroomStudents: { select: { id: true } },
          schedules: true,
        },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.classroom.count({ where }),
    ]);

    return { data, total, skip, take };
  }
}

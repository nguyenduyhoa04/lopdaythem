import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createStudent(
    user: any,
    dto: { fullName: string; dob?: string; gradeId: string },
  ) {
    const student = await this.prisma.student.create({
      data: {
        fullName: dto.fullName,
        dob: dto.dob ? new Date(dto.dob) : null,
        gradeId: dto.gradeId,
        createdByTeacherId: user.id,
      },
    });

    if (user.role === 'PARENT') {
      await this.prisma.parentStudent.create({
        data: {
          parentUserId: user.id,
          studentId: student.id,
          isOwner: true,
        },
      });
    }

    return student;
  }

  async searchStudents(fullName?: string, dob?: string) {
    const where: any = {};
    if (fullName) {
      where.fullName = { contains: fullName, mode: 'insensitive' };
    }
    if (dob) {
      where.dob = new Date(dob);
    }
    return this.prisma.student.findMany({ where });
  }

  async getDashboardData(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        classroomStudents: {
          include: {
            classroom: {
              include: {
                schedules: true,
                subject: true,
              },
            },
          },
        },
        examResults: {
          include: {
            examCode: {
              include: {
                exam: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
          orderBy: { gradedAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    const schedules: any[] = [];
    for (const cs of student.classroomStudents) {
      for (const s of cs.classroom.schedules) {
        schedules.push({
          id: s.id,
          classroomId: cs.classroom.id,
          classroomName: cs.classroom.name,
          subjectName: cs.classroom.subject.name,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
        });
      }
    }

    const results = student.examResults.map((r) => ({
      id: r.id,
      examId: r.examCode.exam.id,
      examTitle: r.examCode.exam.title,
      subjectName: r.examCode.exam.subject.name,
      totalScore: r.totalScore,
      gradedAt: r.gradedAt,
    }));

    return {
      studentInfo: {
        id: student.id,
        fullName: student.fullName,
        dob: student.dob,
      },
      schedules,
      results,
    };
  }

  private async ensureStudentAccess(studentId: string, user: any) {
    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student || student.userId !== user.id) {
        throw new ForbiddenException('Chỉ xem được tiến trình của bản thân');
      }
      return student;
    }

    if (user.role === 'PARENT') {
      const link = await this.prisma.parentStudent.findUnique({
        where: { parentUserId_studentId: { parentUserId: user.id, studentId } },
      });
      if (!link) {
        throw new ForbiddenException('Không có quyền xem học sinh này');
      }
      return this.prisma.student.findUnique({ where: { id: studentId } });
    }

    throw new ForbiddenException('Không có quyền truy cập thông tin học sinh');
  }

  async getStudentSchedule(studentId: string, user: any) {
    await this.ensureStudentAccess(studentId, user);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classroomStudents: {
          include: {
            classroom: {
              include: { schedules: true, subject: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Không tìm thấy hồ sơ học sinh.');
    }

    return student.classroomStudents.flatMap((cs) =>
      cs.classroom.schedules.map((s) => ({
        id: s.id,
        classroomId: cs.classroom.id,
        classroomName: cs.classroom.name,
        subjectName: cs.classroom.subject.name,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location,
      })),
    );
  }

  async getStudentResults(studentId: string, user: any) {
    await this.ensureStudentAccess(studentId, user);

    const results = await this.prisma.examResult.findMany({
      where: { studentId },
      include: {
        examCode: {
          include: {
            exam: {
              include: { subject: true },
            },
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    });

    return results.map((r) => ({
      id: r.id,
      examId: r.examCode.exam.id,
      examTitle: r.examCode.exam.title,
      subjectName: r.examCode.exam.subject.name,
      totalScore: r.totalScore,
      gradedAt: r.gradedAt,
    }));
  }
}

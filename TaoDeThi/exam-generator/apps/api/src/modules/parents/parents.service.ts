import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(parentUserId: string) {
    const parentStudents = await this.prisma.parentStudent.findMany({
      where: { parentUserId },
      include: {
        student: {
          include: {
            classroomStudents: {
              include: {
                classroom: {
                  include: {
                    subject: true,
                    schedules: true,
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
              orderBy: { gradedAt: 'asc' },
            },
          },
        },
      },
    });

    if (parentStudents.length === 0)
      return { studentName: null, schedules: [], examResults: [] };

    const student = parentStudents[0].student;

    const schedules = student.classroomStudents.flatMap((cs) =>
      cs.classroom.schedules.map((sch) => ({
        id: sch.id,
        subjectName: cs.classroom.subject.name,
        classroomName: cs.classroom.name,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        location: sch.location,
      })),
    );

    const examResults = student.examResults.map((er) => ({
      id: er.id,
      examTitle: er.examCode.exam.title,
      subjectName: er.examCode.exam.subject.name,
      totalScore: er.totalScore ? parseFloat(er.totalScore.toString()) : 0,
      gradedAt: er.gradedAt,
    }));

    return {
      studentName: student.fullName,
      schedules,
      examResults,
    };
  }

  async getChildren(parentUserId: string) {
    const parentStudents = await this.prisma.parentStudent.findMany({
      where: { parentUserId },
      include: {
        student: {
          include: {
            classroomStudents: {
              include: {
                classroom: {
                  include: { subject: true },
                },
              },
            },
            examResults: {
              include: {
                examCode: { include: { exam: { include: { subject: true } } } },
                details: true,
              },
              orderBy: { gradedAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    });

    return parentStudents.map((ps) => ({
      id: ps.student.id,
      fullName: ps.student.fullName,
      code: ps.student.id,
      dateOfBirth: ps.student.dob,
      classrooms: ps.student.classroomStudents.map((cs) => ({
        id: cs.classroom.id,
        name: cs.classroom.name,
        subjectName: cs.classroom.subject.name,
      })),
      recentResults: ps.student.examResults.length,
    }));
  }

  async getChildProgress(parentUserId: string, studentId: string) {
    // Verify student belongs to parent
    const parentStudent = await this.prisma.parentStudent.findFirst({
      where: {
        parentUserId,
        studentId,
      },
    });

    if (!parentStudent) {
      throw new NotFoundException('Học sinh không thuộc bất kỳ phụ huynh nào');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        examResults: {
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
        },
        classroomStudents: {
          include: {
            classroom: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Học sinh không tồn tại');
    }

    // Calculate progress statistics
    const examResults = student.examResults;
    const avgScore =
      examResults.length > 0
        ? (
            examResults.reduce(
              (sum, er) =>
                sum +
                (er.totalScore ? parseFloat(er.totalScore.toString()) : 0),
              0,
            ) / examResults.length
          ).toFixed(2)
        : 0;

    const bySubject = {} as Record<string, { count: number; avgScore: number }>;
    examResults.forEach((er) => {
      const subject = er.examCode.exam.subject.name;
      if (!bySubject[subject]) {
        bySubject[subject] = { count: 0, avgScore: 0 };
      }
      bySubject[subject].count++;
      bySubject[subject].avgScore += er.totalScore
        ? parseFloat(er.totalScore.toString())
        : 0;
    });

    Object.keys(bySubject).forEach((subject) => {
      bySubject[subject].avgScore = parseFloat(
        (bySubject[subject].avgScore / bySubject[subject].count).toFixed(2),
      );
    });

    return {
      studentName: student.fullName,
      totalExams: examResults.length,
      averageScore: avgScore,
      classrooms: student.classroomStudents.map((cs) => ({
        name: cs.classroom.name,
        subject: cs.classroom.subject.name,
      })),
      bySubject,
      recentExams: examResults.slice(0, 10).map((er) => ({
        id: er.id,
        title: er.examCode.exam.title,
        subject: er.examCode.exam.subject.name,
        score: er.totalScore ? parseFloat(er.totalScore.toString()) : null,
        gradedAt: er.gradedAt,
        status: er.status,
      })),
    };
  }

  async getChildResults(
    parentUserId: string,
    studentId: string,
    skip = 0,
    take = 10,
  ) {
    // Verify student belongs to parent
    const parentStudent = await this.prisma.parentStudent.findFirst({
      where: {
        parentUserId,
        studentId,
      },
    });

    if (!parentStudent) {
      throw new NotFoundException('Học sinh không thuộc bất kỳ phụ huynh nào');
    }

    const [results, total] = await Promise.all([
      this.prisma.examResult.findMany({
        where: { studentId },
        include: {
          examCode: {
            include: {
              exam: {
                include: {
                  subject: true,
                  grade: true,
                },
              },
            },
          },
          details: true,
        },
        skip,
        take,
        orderBy: { gradedAt: 'desc' },
      }),
      this.prisma.examResult.count({ where: { studentId } }),
    ]);

    return {
      data: results.map((r) => ({
        id: r.id,
        examTitle: r.examCode.exam.title,
        subject: r.examCode.exam.subject.name,
        grade: r.examCode.exam.grade.name,
        totalScore: r.totalScore ? parseFloat(r.totalScore.toString()) : null,
        status: r.status,
        gradedAt: r.gradedAt,
        examFormat: r.examCode.exam.examFormat,
        durationMinutes: r.examCode.exam.durationMinutes,
        resultDetailsCount: r.details.length,
      })),
      total,
      skip,
      take,
    };
  }
}

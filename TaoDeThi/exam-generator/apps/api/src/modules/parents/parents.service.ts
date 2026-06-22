import { Injectable } from '@nestjs/common';
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
}

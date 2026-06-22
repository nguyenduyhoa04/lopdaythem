import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PreviewExamDto } from './dto/preview-exam.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamPdfService } from './exam-pdf.service';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: ExamPdfService,
  ) {}

  async getMetadata() {
    const grades = await this.prisma.grade.findMany({
      orderBy: { level: 'asc' },
    });
    const subjects = await this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
    });
    return { grades, subjects };
  }

  async previewExam(dto: PreviewExamDto) {
    const {
      subjectId,
      gradeId,
      category,
      format,
      difficulties,
      mcCount,
      essayCount,
      scopeType,
      lessonIds,
      examPeriod,
    } = dto;

    if (format === 'TRAC_NGHIEM' && mcCount < 1) {
      throw new BadRequestException(
        'Số lượng câu hỏi trắc nghiệm phải lớn hơn 0',
      );
    }
    if (format === 'TU_LUAN' && essayCount < 1) {
      throw new BadRequestException('Số lượng câu hỏi tự luận phải lớn hơn 0');
    }
    if (format === 'KET_HOP' && (mcCount < 1 || essayCount < 1)) {
      throw new BadRequestException('Số lượng câu hỏi phải lớn hơn 0');
    }

    const selectedQuestions: any[] = [];

    const baseWhere: any = {
      subjectId,
      gradeId,
      examCategory: category,
      difficulty: { in: difficulties },
    };

    if (scopeType === 'LESSON' && lessonIds && lessonIds.length > 0) {
      baseWhere.lessonId = { in: lessonIds };
    } else if (scopeType === 'PERIOD' && examPeriod) {
      baseWhere.examPeriods = { some: { period: examPeriod } };
    }

    if (format === 'TRAC_NGHIEM' || format === 'KET_HOP') {
      const mcQuestions = await this.prisma.question.findMany({
        where: { ...baseWhere, type: 'TRAC_NGHIEM' },
        include: { options: true },
      });
      if (mcQuestions.length < mcCount) {
        throw new BadRequestException(
          `Chỉ có ${mcQuestions.length} câu trắc nghiệm phù hợp.`,
        );
      }
      this.shuffleArray(mcQuestions);
      selectedQuestions.push(...mcQuestions.slice(0, mcCount));
    }

    if (format === 'TU_LUAN' || format === 'KET_HOP') {
      const essayQuestions = await this.prisma.question.findMany({
        where: { ...baseWhere, type: 'TU_LUAN' },
        include: { options: true },
      });
      if (essayQuestions.length < essayCount) {
        throw new BadRequestException(
          `Chỉ có ${essayQuestions.length} câu tự luận phù hợp.`,
        );
      }
      this.shuffleArray(essayQuestions);
      selectedQuestions.push(...essayQuestions.slice(0, essayCount));
    }

    return selectedQuestions;
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  async createExam(userId: string, dto: CreateExamDto) {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: dto.questionIds } },
      include: { options: true },
    });

    if (questions.length !== dto.questionIds.length) {
      throw new BadRequestException('Một số câu hỏi không tồn tại');
    }

    // Order questions as requested
    const orderedQuestions = dto.questionIds.map((id) =>
      questions.find((q) => q.id === id),
    );

    const exam = await this.prisma.exam.create({
      data: {
        teacherId: userId,
        title: dto.title,
        subjectId: dto.subjectId,
        gradeId: dto.gradeId,
        examCategory: dto.category,
        examFormat: dto.format,
        totalScore: dto.totalScore,
        durationMinutes: dto.durationMinutes,
        scopeType: dto.scopeType || 'PERIOD',
        examPeriod: dto.examPeriod,
        examLessons:
          dto.scopeType === 'LESSON' && dto.lessonIds
            ? {
                create: dto.lessonIds.map((lessonId) => ({ lessonId })),
              }
            : undefined,
        examQuestions: {
          create: dto.questionIds.map((qid, index) => ({
            questionId: qid,
            orderNo: index + 1,
          })),
        },
      },
    });

    const codeStr =
      Math.floor(100 + Math.random() * 900) +
      String.fromCharCode(65 + Math.floor(Math.random() * 4));
    const examCode = await this.prisma.examCode.create({
      data: {
        examId: exam.id,
        code: codeStr,
      },
    });

    const pdfs = await this.pdfService.generateAllPdfs(
      exam,
      orderedQuestions,
      codeStr,
    );

    return {
      examId: exam.id,
      examCode: codeStr,
      pdfs,
    };
  }

  async getExamCodes() {
    return this.prisma.examCode.findMany({
      include: { exam: true },
    });
  }

  async getStudents() {
    return this.prisma.student.findMany();
  }

  async getExamHistory(teacherId: string) {
    return this.prisma.exam.findMany({
      where: { teacherId },
      include: {
        subject: true,
        grade: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeacherGrading(teacherId: string) {
    return this.prisma.examResult.findMany({
      where: {
        status: 'NEEDS_REVIEW',
        examCode: {
          exam: {
            teacherId,
          },
        },
      },
      include: {
        examCode: {
          include: {
            exam: {
              include: { subject: true },
            },
          },
        },
        student: true,
      },
      orderBy: { gradedAt: 'desc' },
    });
  }

  async getCollectedExams(teacherId: string) {
    return this.prisma.collectedExam.findMany({
      where: { teacherId },
      include: {
        subject: true,
        grade: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async mockScan(dto: { examCodeStr: string; studentId: string }) {
    const examCode = await this.prisma.examCode.findUnique({
      where: { code: dto.examCodeStr },
      include: {
        exam: {
          include: { examQuestions: { include: { question: true } } },
        },
      },
    });

    if (!examCode) throw new BadRequestException('Mã đề không tồn tại');

    let mcScore = 0;
    let status = 'PROCESSED';
    let isEssay = false;

    // Check if there are essay questions
    if (
      examCode.exam.examFormat === 'TU_LUAN' ||
      examCode.exam.examFormat === 'KET_HOP'
    ) {
      isEssay = true;
      status = 'NEEDS_REVIEW';
    }

    if (examCode.exam.examFormat === 'TRAC_NGHIEM') {
      mcScore = parseFloat((Math.random() * 4 + 6).toFixed(1)); // 6.0 - 10.0
    } else if (examCode.exam.examFormat === 'KET_HOP') {
      mcScore = parseFloat((Math.random() * 3 + 3).toFixed(1)); // 3.0 - 6.0
    } else {
      mcScore = 0; // TU_LUAN completely manual
    }

    const result = await this.prisma.examResult.create({
      data: {
        examCodeId: examCode.id,
        studentId: dto.studentId,
        totalScore:
          isEssay && examCode.exam.examFormat === 'TU_LUAN' ? null : mcScore,
        gradedAt: new Date(),
        status: status as any,
      },
    });

    return result;
  }
}

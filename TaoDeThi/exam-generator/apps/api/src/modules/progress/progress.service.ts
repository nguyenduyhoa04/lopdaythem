import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentProgress(
    studentId: string,
    subjectId?: string,
    from?: string,
    to?: string,
  ) {
    const results = await this.prisma.examResult.findMany({
      where: {
        studentId,
        ...(subjectId && {
          examCode: {
            exam: { subjectId },
          },
        }),
      },
      include: {
        examCode: {
          include: { exam: true },
        },
      },
      orderBy: { gradedAt: 'asc' },
    });

    return {
      success: true,
      data: {
        scoreTimeline:
          results.length > 0
            ? results.map((r) => ({
                date: r.gradedAt
                  ? r.gradedAt.toISOString()
                  : new Date().toISOString(),
                subjectId: r.examCode?.exam?.subjectId,
                score: r.totalScore || 0,
                isMockExam: r.isMockExam,
              }))
            : [
                {
                  date: new Date(Date.now() - 30 * 86400000).toISOString(),
                  score: 6.5,
                  isMockExam: false,
                },
                {
                  date: new Date(Date.now() - 15 * 86400000).toISOString(),
                  score: 7.5,
                  isMockExam: true,
                },
                {
                  date: new Date(Date.now()).toISOString(),
                  score: 8.5,
                  isMockExam: false,
                },
              ],
        difficultyBreakdown: [
          { difficulty: 'NHAN_BIET', correctRate: 0.85 },
          { difficulty: 'THONG_HIEU', correctRate: 0.7 },
          { difficulty: 'VAN_DUNG', correctRate: 0.45 },
        ],
        topicBreakdown: [
          { topicId: 't1', topicName: 'Phép cộng có nhớ', correctRate: 0.8 },
          { topicId: 't2', topicName: 'Phép trừ có nhớ', correctRate: 0.6 },
          { topicId: 't3', topicName: 'Bảng cửu chương', correctRate: 0.95 },
        ],
        mockVsRealComparison: {
          mockAvgScore: 7.5,
          realAvgScore: 8.0,
        },
      },
    };
  }
}

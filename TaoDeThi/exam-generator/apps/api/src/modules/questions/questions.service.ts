import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiExtractionService } from '../../services/ai-extraction.service';

@Injectable()
export class QuestionsService {
  constructor(
    private prisma: PrismaService,
    private aiExtractionService: AiExtractionService,
  ) {}

  async findAll(queryParams: any) {
    const { subjectId, gradeId, examCategory, difficulty, type } = queryParams;
    return this.prisma.question.findMany({
      where: {
        ...(subjectId && { subjectId }),
        ...(gradeId && { gradeId }),
        ...(examCategory && { examCategory }),
        ...(difficulty && { difficulty }),
        ...(type && { type }),
      },
      include: {
        options: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
  }

  async scanExam(file: any, url?: string) {
    // Giả lập dữ liệu trả về từ AI / OCR
    // Một số câu cố tình bị thiếu đáp án đúng để test luồng frontend
    return [
      {
        content: 'Thủ đô của Việt Nam là gì?',
        type: 'TRAC_NGHIEM',
        difficulty: 'NHAN_BIET',
        examCategory: 'CO_BAN',
        options: [
          { label: 'A', content: 'Hà Nội', isCorrect: true },
          { label: 'B', content: 'Hồ Chí Minh', isCorrect: false },
          { label: 'C', content: 'Đà Nẵng', isCorrect: false },
          { label: 'D', content: 'Hải Phòng', isCorrect: false },
        ],
      },
      {
        content: 'Trái Đất hình gì?',
        type: 'TRAC_NGHIEM',
        difficulty: 'NHAN_BIET',
        examCategory: 'CO_BAN',
        options: [
          { label: 'A', content: 'Hình vuông', isCorrect: false },
          { label: 'B', content: 'Hình tròn', isCorrect: false },
          { label: 'C', content: 'Hình cầu', isCorrect: false },
          { label: 'D', content: 'Hình nón', isCorrect: false },
        ],
        // Cố tình không có isCorrect = true
      },
      {
        content: 'Viết một đoạn văn ngắn miêu tả mùa xuân.',
        type: 'TU_LUAN',
        difficulty: 'VAN_DUNG',
        examCategory: 'CO_BAN',
        answerText: '', // Cố tình bỏ trống
      },
    ];
  }

  async createBatch(questions: any[], userId: string) {
    const defaultSubject = await this.prisma.subject.findFirst();
    const defaultGrade = await this.prisma.grade.findFirst();

    if (!defaultSubject || !defaultGrade) {
      throw new Error('Không tìm thấy môn học hoặc khối lớp mặc định trong DB');
    }

    const createdQuestions: any[] = [];
    for (const q of questions) {
      const created = await this.prisma.question.create({
        data: {
          content: q.content,
          type: q.type,
          difficulty: q.difficulty || 'NHAN_BIET',
          examCategory: q.examCategory || 'CO_BAN',
          answerText: q.answerText || null,
          subjectId: q.subjectId || defaultSubject.id,
          gradeId: q.gradeId || defaultGrade.id,
          createdById: userId,
          options: q.options
            ? {
                create: q.options.map((opt: any) => ({
                  label: opt.label,
                  content: opt.content,
                  isCorrect: opt.isCorrect || false,
                })),
              }
            : undefined,
        },
      });
      createdQuestions.push(created);
    }
    return createdQuestions;
  }

  /**
   * Extract từ file Word/ảnh
   */
  async extractFromFile(file: Express.Multer.File): Promise<any[]> {
    let extractedText = '';

    if (file.mimetype.includes('word') || file.originalname.endsWith('.docx')) {
      extractedText = await this.aiExtractionService.extractFromWord(file);
    } else if (file.mimetype.startsWith('image/')) {
      extractedText = await this.aiExtractionService.extractFromImage(file);
    } else {
      throw new Error('Unsupported file type. Use .docx or image files.');
    }

    // Parse extracted text với AI
    const questions =
      await this.aiExtractionService.parseExamContent(extractedText);
    return questions;
  }

  /**
   * Extract từ URL
   */
  async extractFromUrl(url: string): Promise<any[]> {
    const content = await this.aiExtractionService.fetchFromUrl(url);
    const questions = await this.aiExtractionService.parseExamContent(content);
    return questions;
  }

  /**
   * Parse raw text thành questions
   */
  async parseText(text: string): Promise<any[]> {
    const questions = await this.aiExtractionService.parseExamContent(text);
    return questions;
  }

  /**
   * Save extracted questions vào DB
   */
  async saveExtractedQuestions(saveDto: any, userId: string): Promise<any[]> {
    const defaultSubject = await this.prisma.subject.findFirst();
    const defaultGrade = await this.prisma.grade.findFirst();

    if (!defaultSubject || !defaultGrade) {
      throw new Error('Không tìm thấy môn học hoặc khối lớp mặc định trong DB');
    }

    const createdQuestions: any[] = [];
    for (const q of saveDto.questions) {
      const created = await this.prisma.question.create({
        data: {
          content: q.content,
          type: q.type || 'TRAC_NGHIEM',
          difficulty: q.difficulty || 'NHAN_BIET',
          examCategory: q.examCategory || 'CO_BAN',
          answerText: q.answerText || null,
          subjectId: q.subjectId || saveDto.subjectId || defaultSubject.id,
          gradeId: q.gradeId || saveDto.gradeId || defaultGrade.id,
          createdById: userId,
          options: q.options
            ? {
                create: q.options.map((opt: any) => ({
                  label: opt.label,
                  content: opt.content,
                  isCorrect: opt.isCorrect || false,
                })),
              }
            : undefined,
        },
        include: { options: true },
      });
      createdQuestions.push(created);
    }
    return createdQuestions;
  }
}

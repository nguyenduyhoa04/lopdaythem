import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { Anthropic } from '@anthropic-ai/sdk';
import axios from 'axios';

const Tesseract = require('tesseract.js');

@Injectable()
export class AiExtractionService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn(
        'ANTHROPIC_API_KEY not configured. AI extraction features will be disabled.',
      );
    }
    this.client = new Anthropic({ apiKey: apiKey || 'dummy' });
  }

  /**
   * Extract text từ file Word (.docx)
   */
  async extractFromWord(file: Express.Multer.File): Promise<string> {
    try {
      const result = await mammoth.extractRawText({
        buffer: file.buffer,
      });
      return result.value;
    } catch (error) {
      throw new BadRequestException(
        `Failed to extract from Word file: ${error.message}`,
      );
    }
  }

  /**
   * Extract text từ ảnh bằng OCR (Tesseract)
   */
  async extractFromImage(file: Express.Multer.File): Promise<string> {
    try {
      const imageBase64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${imageBase64}`;

      const {
        data: { text },
      } = await Tesseract.recognize(dataUrl);
      return text;
    } catch (error) {
      throw new BadRequestException(
        `Failed to extract from image: ${error.message}`,
      );
    }
  }

  /**
   * Fetch content từ URL
   */
  async fetchFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024, // 5MB max
      });
      // Nếu là HTML, extract text (đơn giản)
      // Hoặc nếu là PDF, etc. cần xử lý thêm
      return response.data;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch from URL: ${error.message}`,
      );
    }
  }

  /**
   * Parse đề và đáp án từ text bằng Claude
   * Trả về mảng câu hỏi với định dạng chuẩn
   */
  async parseExamContent(text: string): Promise<any[]> {
    if (!process.env.ANTHROPIC_API_KEY) {
      return this.mockParseExamContent(text);
    }

    try {
      const prompt = `Bạn là chuyên gia phân tích đề thi. Tôi cung cấp nội dung đề thi (có thể từ ảnh scan, Word hoặc link). 
Hãy:
1. Nhận diện từng câu hỏi
2. Xác định loại câu (TRAC_NGHIEM hoặc TU_LUAN)
3. Nếu là trắc nghiệm: liệt kê các tùy chọn (A, B, C, D) và chỉ ra đáp án đúng
4. Nếu là tự luận: trích xuất bài giải/đáp án model

Định dạng output là JSON array, mỗi câu hỏi là object với cấu trúc:
{
  "content": "nội dung câu hỏi",
  "type": "TRAC_NGHIEM" | "TU_LUAN",
  "difficulty": "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG",
  "examCategory": "CO_BAN" | "NANG_CAO",
  "options": [
    {"label": "A", "content": "...", "isCorrect": true},
    ...
  ],
  "answerText": "Bài giải (nếu tự luận)"
}

Đề thi:
${text}

Trả về JSON array, không có markdown wrapper.`;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse JSON từ response
      let questions = [];
      try {
        // Cố gắng extract JSON từ response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        } else {
          questions = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', responseText);
        throw new BadRequestException('Failed to parse Claude response');
      }

      // Validate và normalize structure
      return questions.map((q: any) => ({
        content: q.content || '',
        type: q.type || 'TRAC_NGHIEM',
        difficulty: q.difficulty || 'NHAN_BIET',
        examCategory: q.examCategory || 'CO_BAN',
        options: q.options || [],
        answerText: q.answerText || '',
      }));
    } catch (error) {
      console.error('AI extraction error:', error);
      throw new BadRequestException(
        `Failed to parse exam content: ${error.message}`,
      );
    }
  }

  /**
   * Mock parsing để test (khi không có ANTHROPIC_API_KEY)
   */
  private mockParseExamContent(text: string): any[] {
    // Simple regex-based mock parsing
    return [
      {
        content: 'Mẫu câu hỏi từ: ' + text.substring(0, 50) + '...',
        type: 'TRAC_NGHIEM',
        difficulty: 'NHAN_BIET',
        examCategory: 'CO_BAN',
        options: [
          { label: 'A', content: 'Tùy chọn 1', isCorrect: true },
          { label: 'B', content: 'Tùy chọn 2', isCorrect: false },
          { label: 'C', content: 'Tùy chọn 3', isCorrect: false },
          { label: 'D', content: 'Tùy chọn 4', isCorrect: false },
        ],
        answerText: '',
      },
    ];
  }
}

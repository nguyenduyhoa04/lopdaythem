import { Injectable, Logger } from '@nestjs/common';
import * as qrcode from 'qrcode';
import { AnswerSheetLayout } from './answer-sheet-layout.config';

@Injectable()
export class ExamPdfService {
  private readonly logger = new Logger(ExamPdfService.name);

  async generateAllPdfs(exam: any, questions: any[], examCodeStr: string) {
    this.logger.log(`Generating PDFs for exam code: ${examCodeStr}`);
    const puppeteer = await eval(`import('puppeteer')`);
    const browser = await puppeteer.launch({ headless: true });

    try {
      const examHtml = this.renderExamHtml(exam, questions, examCodeStr, false);
      const examPage = await browser.newPage();
      await examPage.setContent(examHtml, { waitUntil: 'networkidle0' as any });
      const examPdf = await examPage.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        printBackground: true,
      });

      const answerHtml = this.renderExamHtml(
        exam,
        questions,
        examCodeStr,
        true,
      );
      const answerPage = await browser.newPage();
      await answerPage.setContent(answerHtml, {
        waitUntil: 'networkidle0' as any,
      });
      const answerPdf = await answerPage.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        printBackground: true,
      });

      const qrDataUrl = await qrcode.toDataURL(examCodeStr, {
        errorCorrectionLevel: 'H',
        width: AnswerSheetLayout.qrCode.size * 3.77,
      });
      const sheetHtml = this.renderAnswerSheetHtml(
        examCodeStr,
        qrDataUrl,
        questions,
      );
      const sheetPage = await browser.newPage();
      await sheetPage.setContent(sheetHtml, {
        waitUntil: 'networkidle0' as any,
      });
      const sheetPdf = await sheetPage.pdf({
        format: 'A4',
        printBackground: true,
      });

      return {
        examBase64: Buffer.from(examPdf).toString('base64'),
        answerKeyBase64: Buffer.from(answerPdf).toString('base64'),
        answerSheetBase64: Buffer.from(sheetPdf).toString('base64'),
      };
    } catch (e) {
      this.logger.error('Failed to generate PDF', e);
      throw e;
    } finally {
      await browser.close();
    }
  }

  private renderExamHtml(
    exam: any,
    questions: any[],
    examCodeStr: string,
    isAnswerKey: boolean,
  ) {
    const questionsHtml = questions
      .map((q, index) => {
        if (q.type === 'TU_LUAN') {
          return `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <div style="font-weight: bold;">Câu ${index + 1} (Tự luận): <span style="font-weight: normal">${q.content}</span></div>
            ${
              isAnswerKey
                ? `<div style="margin-top: 10px; color: red; font-style: italic;"><strong>Đáp án:</strong> ${q.answerText || ''}</div>`
                : '<div style="margin-top: 100px;"></div>'
            }
          </div>
        `;
        }

        const optionsHtml =
          q.options
            ?.map((opt: any) => {
              const isCorrect = isAnswerKey && opt.isCorrect;
              return `
          <div style="margin-top: 5px; ${isCorrect ? 'color: red; font-weight: bold;' : ''}">
            ${opt.label}. ${opt.content}
          </div>
        `;
            })
            .join('') || '';

        return `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="font-weight: bold;">Câu ${index + 1}: <span style="font-weight: normal">${q.content}</span></div>
          <div style="margin-left: 20px;">
            ${optionsHtml}
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; color: #000; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .title { font-size: 18pt; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .subtitle { font-size: 14pt; font-style: italic; }
          .exam-code { float: right; font-weight: bold; border: 1px solid #000; padding: 5px; }
          .answer-key-badge { color: red; font-weight: bold; font-size: 16pt; margin-bottom: 10px; text-align: center; border: 2px solid red; display: inline-block; padding: 5px 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="exam-code">Mã đề: ${examCodeStr}</div>
          <div class="title">${exam.title}</div>
          <div class="subtitle">Thời gian làm bài: ${exam.durationMinutes} phút</div>
        </div>
        ${isAnswerKey ? '<div style="text-align: center"><div class="answer-key-badge">ĐÁP ÁN CHÍNH THỨC</div></div>' : ''}
        <div class="content">
          ${questionsHtml}
        </div>
      </body>
      </html>
    `;
  }

  private renderAnswerSheetHtml(
    examCodeStr: string,
    qrDataUrl: string,
    questions: any[],
  ) {
    const { markers, qrCode, questionsGrid } = AnswerSheetLayout;

    // Generate bubbles and essay spaces
    let contentHtml = '';
    const cols = 4;
    let mcIndex = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (q.type === 'TU_LUAN') {
        // Render essay space below the grid. But wait, absolute positioning is used for grid.
        // It's better to just skip bubble generation for TU_LUAN in the grid,
        // and append a block for essay below.
        continue;
      }

      const col = mcIndex % cols;
      const row = Math.floor(mcIndex / cols);

      const x = questionsGrid.startX + col * questionsGrid.columnWidth;
      const y = questionsGrid.startY + row * questionsGrid.rowHeight;

      let optionsHtml = '';
      ['A', 'B', 'C', 'D'].forEach((label, idx) => {
        const ox = x + 15 + idx * questionsGrid.bubbleSpacing;
        optionsHtml += `
          <div style="position: absolute; left: ${ox}mm; top: ${y}mm; width: ${questionsGrid.bubbleSize}mm; height: ${questionsGrid.bubbleSize}mm; border: 1px solid #000; border-radius: 50%; text-align: center; font-size: 10px; line-height: ${questionsGrid.bubbleSize}mm;">
            ${label}
          </div>
        `;
      });

      contentHtml += `
        <div style="position: absolute; left: ${x}mm; top: ${y}mm; font-weight: bold; font-size: 12px; line-height: ${questionsGrid.bubbleSize}mm;">
          ${i + 1}.
        </div>
        ${optionsHtml}
      `;
      mcIndex++;
    }

    // Determine Y position for the essay section based on how many rows were used by MC questions
    const mcRows = Math.ceil(mcIndex / cols);
    const essayStartY =
      questionsGrid.startY + mcRows * questionsGrid.rowHeight + 10;

    let essayHtml = '';
    let hasEssay = false;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === 'TU_LUAN') {
        hasEssay = true;
        essayHtml += `
          <div style="margin-bottom: 20px; border: 1px solid #ccc; min-height: 150px; padding: 10px;">
            <strong>Câu ${i + 1} (Tự luận):</strong>
            <div style="margin-top: 10px; width: 100%; height: 100%;"></div>
          </div>
        `;
      }
    }

    if (hasEssay) {
      contentHtml += `
        <div style="position: absolute; left: 20mm; top: ${essayStartY}mm; width: 170mm; padding: 0;">
          <h3 style="margin-top: 0;">Phần Tự Luận</h3>
          ${essayHtml}
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; size: A4; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: white; width: 210mm; height: 297mm; position: relative; }
          .marker { position: absolute; background: black; }
        </style>
      </head>
      <body>
        <!-- Markers -->
        <div class="marker" style="top: ${markers[0].top}mm; left: ${markers[0].left}mm; width: ${markers[0].size}mm; height: ${markers[0].size}mm;"></div>
        <div class="marker" style="top: ${markers[1].top}mm; right: ${markers[1].right}mm; width: ${markers[1].size}mm; height: ${markers[1].size}mm;"></div>
        <div class="marker" style="bottom: ${markers[2].bottom}mm; left: ${markers[2].left}mm; width: ${markers[2].size}mm; height: ${markers[2].size}mm;"></div>
        
        <!-- QR Code -->
        <img src="${qrDataUrl}" style="position: absolute; top: ${qrCode.top}mm; right: ${qrCode.right}mm; width: ${qrCode.size}mm; height: ${qrCode.size}mm;" />
        
        <!-- Header Info -->
        <div style="position: absolute; top: 30mm; left: 40mm; font-size: 18px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px;">
          PHIẾU TRẢ LỜI TRẮC NGHIỆM
        </div>
        <div style="position: absolute; top: 40mm; left: 40mm; font-size: 14px;">
          <div>Họ và tên: ................................................................</div>
          <div style="margin-top: 10px;">Lớp: ........................ Mã đề: <b>${examCodeStr}</b></div>
        </div>

        <!-- Instructions -->
        <div style="position: absolute; top: 60mm; left: 30mm; font-size: 12px; font-style: italic;">
          Dùng bút chì tô đen kín ô tròn tương ứng với đáp án đúng. Vd: ⬤
        </div>

        <!-- Generated Bubble Grid and Essay Spaces -->
        ${contentHtml}
      </body>
      </html>
    `;
  }
}

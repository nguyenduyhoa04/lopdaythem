import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamResultsController } from './exam-results.controller';
import { CollectedExamsController } from './collected-exams.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExamPdfService } from './exam-pdf.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ExamsController,
    ExamResultsController,
    CollectedExamsController,
  ],
  providers: [ExamsService, ExamPdfService],
})
export class ExamsModule {}

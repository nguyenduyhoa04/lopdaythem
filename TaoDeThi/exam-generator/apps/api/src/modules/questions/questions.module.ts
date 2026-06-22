import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { AiExtractionService } from '../../services/ai-extraction.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, AiExtractionService],
})
export class QuestionsModule {}

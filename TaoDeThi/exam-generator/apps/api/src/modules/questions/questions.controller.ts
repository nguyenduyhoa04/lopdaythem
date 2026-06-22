import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ExtractFromFileDto,
  ExtractFromUrlDto,
  SaveQuestionsDto,
} from './dto/extract.dto';

@Controller('questions')
@UseGuards(AuthGuard('jwt'))
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Get()
  async findAll(@Query() query: any) {
    const data = await this.questionsService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.questionsService.findOne(id);
    return { success: true, data };
  }

  @Post('scan')
  @UseInterceptors(FileInterceptor('file'))
  async scanExam(
    @UploadedFile() file: Express.Multer.File,
    @Body('url') url?: string,
  ) {
    const data = await this.questionsService.scanExam(file, url);
    return { success: true, data };
  }

  /**
   * Extract questions từ file Word
   * POST /questions/extract-from-file
   */
  @Post('extract-from-file')
  @UseInterceptors(FileInterceptor('file'))
  async extractFromFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const data = await this.questionsService.extractFromFile(file);
    return { success: true, data };
  }

  /**
   * Extract questions từ URL (Web, PDF, etc.)
   * POST /questions/extract-from-url
   */
  @Post('extract-from-url')
  async extractFromUrl(@Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }
    const data = await this.questionsService.extractFromUrl(url);
    return { success: true, data };
  }

  /**
   * Parse raw text thành structured questions
   * POST /questions/parse-text
   */
  @Post('parse-text')
  async parseText(@Body('text') text: string) {
    if (!text) {
      throw new BadRequestException('Text is required');
    }
    const data = await this.questionsService.parseText(text);
    return { success: true, data };
  }

  /**
   * Save parsed questions vào DB
   * POST /questions/save-extracted
   */
  @Post('save-extracted')
  async saveExtracted(
    @Body() saveDto: SaveQuestionsDto,
    @Req() req: any,
  ) {
    const userId = req.user.sub || req.user.id;
    const data = await this.questionsService.saveExtractedQuestions(
      saveDto,
      userId,
    );
    return { success: true, data };
  }


  @Post('batch')
  async createBatch(@Body() batchDto: any, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    const data = await this.questionsService.createBatch(
      batchDto.questions,
      userId,
    );
    return { success: true, data };
  }
}

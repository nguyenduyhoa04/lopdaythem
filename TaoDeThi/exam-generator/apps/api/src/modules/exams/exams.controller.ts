import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { PreviewExamDto } from './dto/preview-exam.dto';
import { CreateExamDto } from './dto/create-exam.dto';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get('metadata')
  getMetadata() {
    return this.examsService.getMetadata();
  }

  @Post('preview')
  previewExam(@Body() dto: PreviewExamDto) {
    return this.examsService.previewExam(dto);
  }

  @Post()
  createExam(@Body() dto: CreateExamDto, @Request() req: any) {
    return this.examsService.createExam(req.user.id, dto);
  }

  @Get('codes')
  getExamCodes() {
    return this.examsService.getExamCodes();
  }

  @Get('students')
  getStudents() {
    return this.examsService.getStudents();
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.examsService.getExamHistory(req.user.id);
  }

  @Post('mock-scan')
  mockScan(@Body() dto: { examCodeStr: string; studentId: string }) {
    return this.examsService.mockScan(dto);
  }
}

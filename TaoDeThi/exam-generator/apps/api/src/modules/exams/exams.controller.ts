import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { PreviewExamDto } from './dto/preview-exam.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  listExams(
    @Query('teacherId') teacherId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.examsService.getAllExams({
      teacherId,
      subjectId,
      gradeId,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('metadata')
  getMetadata() {
    return this.examsService.getMetadata();
  }

  @Get(':id')
  getExam(@Param('id') id: string) {
    return this.examsService.getExamById(id);
  }

  @Post('preview')
  previewExam(@Body() dto: PreviewExamDto) {
    return this.examsService.previewExam(dto);
  }

  @Post()
  createExam(@Body() dto: CreateExamDto, @Request() req: any) {
    return this.examsService.createExam(req.user.id, dto);
  }

  @Patch(':id')
  updateExam(
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @Request() req: any,
  ) {
    return this.examsService.updateExam(id, req.user.id, dto);
  }

  @Delete(':id')
  deleteExam(@Param('id') id: string, @Request() req: any) {
    return this.examsService.deleteExam(id, req.user.id);
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

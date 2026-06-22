import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';

@Controller('teacher')
@UseGuards(AuthGuard('jwt'))
export class ExamResultsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get('grading')
  getPendingGrading(@Request() req: any) {
    return this.examsService.getTeacherGrading(req.user.id);
  }
}

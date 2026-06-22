import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';

@Controller('collected-exams')
@UseGuards(AuthGuard('jwt'))
export class CollectedExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  getCollectedExams(@Request() req: any) {
    return this.examsService.getCollectedExams(req.user.id);
  }
}

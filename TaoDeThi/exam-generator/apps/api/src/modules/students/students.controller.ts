import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(AuthGuard('jwt'))
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(
    @Request() req: any,
    @Body() body: { fullName: string; dob?: string; gradeId: string },
  ) {
    return this.studentsService.createStudent(req.user, body);
  }

  @Get('search')
  search(@Query('fullName') fullName?: string, @Query('dob') dob?: string) {
    return this.studentsService.searchStudents(fullName, dob);
  }

  @Get('dashboard')
  getDashboardData(@Request() req: any) {
    return this.studentsService.getDashboardData(req.user.id);
  }

  @Get(':studentId/schedule')
  getSchedule(@Request() req: any, @Param('studentId') studentId: string) {
    return this.studentsService.getStudentSchedule(studentId, req.user);
  }

  @Get(':studentId/results')
  getResults(@Request() req: any, @Param('studentId') studentId: string) {
    return this.studentsService.getStudentResults(studentId, req.user);
  }
}

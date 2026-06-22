import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(AuthGuard('jwt'))
@Controller('students/:studentId/progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getProgress(
    @Request() req: any,
    @Param('studentId') studentId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    const user = req.user;

    let actualStudentId = studentId;

    if (studentId === 'me' && user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.id },
      });
      if (!student)
        throw new ForbiddenException('Không tìm thấy hồ sơ học sinh');
      actualStudentId = student.id;
    } else if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student || student.userId !== user.id) {
        throw new ForbiddenException('Chỉ xem được tiến trình của bản thân');
      }
    } else if (user.role === 'PARENT') {
      const link = await this.prisma.parentStudent.findUnique({
        where: { parentUserId_studentId: { parentUserId: user.id, studentId } },
      });
      if (!link) {
        throw new ForbiddenException('Không có quyền xem học sinh này');
      }
    }

    return this.progressService.getStudentProgress(actualStudentId, subjectId);
  }
}

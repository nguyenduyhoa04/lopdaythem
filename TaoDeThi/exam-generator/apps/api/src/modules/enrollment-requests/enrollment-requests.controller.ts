import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnrollmentRequestsService } from './enrollment-requests.service';

@Controller('enrollment-requests')
@UseGuards(AuthGuard('jwt'))
export class EnrollmentRequestsController {
  constructor(
    private readonly enrollmentRequestsService: EnrollmentRequestsService,
  ) {}

  @Post()
  create(
    @Request() req: any,
    @Body() body: { studentId: string; classroomId: string; note?: string },
  ) {
    return this.enrollmentRequestsService.create(req.user.id, body);
  }

  @Get()
  findAll(@Request() req: any, @Query('status') status?: string) {
    return this.enrollmentRequestsService.findAll(
      { status },
      req.user.id,
      req.user.role,
    );
  }
}

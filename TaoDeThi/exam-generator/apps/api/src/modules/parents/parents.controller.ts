import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParentsService } from './parents.service';

@Controller('parents')
@UseGuards(AuthGuard('jwt'))
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.parentsService.getDashboardData(req.user.id);
  }

  @Get('children')
  getChildren(@Request() req: any) {
    return this.parentsService.getChildren(req.user.id);
  }

  @Get('children/:childId/progress')
  getChildProgress(@Param('childId') childId: string, @Request() req: any) {
    return this.parentsService.getChildProgress(req.user.id, childId);
  }

  @Get('children/:childId/results')
  getChildResults(
    @Param('childId') childId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Request() req?: any,
  ) {
    return this.parentsService.getChildResults(
      req.user.id,
      childId,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 10,
    );
  }
}

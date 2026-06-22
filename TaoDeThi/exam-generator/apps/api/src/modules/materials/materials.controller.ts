import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Optional,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaterialsService } from './materials.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  // Public endpoint - list materials (no auth required)
  @Get()
  findAll(
    @Query('subjectId') subjectId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('type') type?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.materialsService.findAll({ subjectId, gradeId, type }, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req?: any) {
    return this.materialsService.findOne(id, req?.user?.id);
  }

  // Protected - teacher creates material
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Request() req: any, @Body() dto: any) {
    return this.materialsService.create(req.user.id, dto);
  }

  // Protected - parent purchases material
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/purchase')
  purchase(@Param('id') id: string, @Request() req: any) {
    return this.materialsService.purchase(id, req.user.id);
  }
}

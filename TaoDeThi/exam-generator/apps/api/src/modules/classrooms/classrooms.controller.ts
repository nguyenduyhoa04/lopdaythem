import { Controller, Get, Param } from '@nestjs/common';
import { ClassroomsService } from './classrooms.service';

@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get('public')
  getPublicClassrooms() {
    return this.classroomsService.getPublicClassrooms();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }
}

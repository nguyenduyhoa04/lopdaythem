import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Controller('classrooms')
@UseGuards(AuthGuard('jwt'))
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get()
  getAll(
    @Query('subjectId') subjectId?: string,
    @Query('gradeId') gradeId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.classroomsService.getAll({
      subjectId,
      gradeId,
      teacherId,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('public')
  getPublicClassrooms() {
    return this.classroomsService.getPublicClassrooms();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.classroomsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.classroomsService.delete(id);
  }

  @Post(':id/students/:studentId')
  addStudent(
    @Param('id') classroomId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classroomsService.addStudent(classroomId, studentId);
  }

  @Delete(':id/students/:studentId')
  removeStudent(
    @Param('id') classroomId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classroomsService.removeStudent(classroomId, studentId);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  create(createScheduleDto: CreateScheduleDto) {
    return this.prisma.schedule.create({
      data: {
        classroomId: createScheduleDto.classroomId,
        dayOfWeek: createScheduleDto.dayOfWeek,
        specificDate: createScheduleDto.specificDate
          ? new Date(createScheduleDto.specificDate)
          : null,
        startTime: createScheduleDto.startTime,
        endTime: createScheduleDto.endTime,
        location: createScheduleDto.location,
        note: createScheduleDto.note,
      },
    });
  }

  findAll(classroomId?: string) {
    if (classroomId) {
      return this.prisma.schedule.findMany({
        where: { classroomId },
      });
    }
    return this.prisma.schedule.findMany();
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  update(id: string, updateScheduleDto: UpdateScheduleDto) {
    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...updateScheduleDto,
        specificDate: updateScheduleDto.specificDate
          ? new Date(updateScheduleDto.specificDate)
          : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}

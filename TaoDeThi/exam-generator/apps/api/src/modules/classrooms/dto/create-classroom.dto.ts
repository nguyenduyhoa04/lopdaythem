import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum ClassroomStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
}

export class CreateClassroomDto {
  @IsString()
  name: string;

  @IsString()
  subjectId: string;

  @IsString()
  gradeId: string;

  @IsString()
  teacherId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ClassroomStatusEnum)
  status?: ClassroomStatusEnum;

  @IsOptional()
  @IsArray()
  studentIds?: string[];
}

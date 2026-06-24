import { IsString, IsEnum } from 'class-validator';

export enum EnrollmentStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateEnrollmentRequestDto {
  @IsString()
  studentId: string;

  @IsString()
  classroomId: string;
}

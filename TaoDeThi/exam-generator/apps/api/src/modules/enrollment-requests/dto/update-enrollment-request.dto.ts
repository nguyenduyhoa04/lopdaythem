import { IsEnum, IsOptional } from 'class-validator';

export enum EnrollmentStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateEnrollmentRequestDto {
  @IsOptional()
  @IsEnum(EnrollmentStatusEnum)
  status?: EnrollmentStatusEnum;
}

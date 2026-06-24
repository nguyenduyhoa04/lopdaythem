import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  fullName: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'])
  @IsOptional()
  role?: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

  @IsString()
  @IsOptional()
  phone?: string;
}

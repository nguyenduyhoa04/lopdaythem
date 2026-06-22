import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'])
  role!: 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

  @IsString()
  @IsOptional()
  phone?: string;
}

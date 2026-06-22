import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(['PARENT', 'STUDENT'])
  role!: 'PARENT' | 'STUDENT';

  @IsString()
  @IsOptional()
  invitationCode?: string;
}

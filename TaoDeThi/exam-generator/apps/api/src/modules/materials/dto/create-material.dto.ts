import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  subjectId: string;

  @IsString()
  gradeId: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  type?: string;
}

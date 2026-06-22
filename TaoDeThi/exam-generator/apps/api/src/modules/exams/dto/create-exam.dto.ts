import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateExamDto {
  @IsString()
  title!: string;

  @IsString()
  subjectId!: string;

  @IsString()
  gradeId!: string;

  @IsEnum(['CO_BAN', 'NANG_CAO'])
  category!: 'CO_BAN' | 'NANG_CAO';

  @IsEnum(['TRAC_NGHIEM', 'TU_LUAN', 'KET_HOP'])
  format!: 'TRAC_NGHIEM' | 'TU_LUAN' | 'KET_HOP';

  @IsNumber()
  totalScore!: number;

  @IsNumber()
  @Min(1)
  durationMinutes!: number;

  @IsEnum(['LESSON', 'PERIOD'])
  @IsOptional()
  scopeType?: 'LESSON' | 'PERIOD';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lessonIds?: string[];

  @IsEnum(['GIUA_KI_1', 'CUOI_KI_1', 'GIUA_KI_2', 'CUOI_KI_2', 'CA_NAM'])
  @IsOptional()
  examPeriod?: 'GIUA_KI_1' | 'CUOI_KI_1' | 'GIUA_KI_2' | 'CUOI_KI_2' | 'CA_NAM';

  @IsArray()
  @IsString({ each: true })
  questionIds!: string[];
}

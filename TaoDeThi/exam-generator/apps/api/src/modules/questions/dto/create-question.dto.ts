import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
} from 'class-validator';

export enum QuestionTypeEnum {
  TRAC_NGHIEM = 'TRAC_NGHIEM',
  TU_LUAN = 'TU_LUAN',
}

export enum DifficultyEnum {
  DE = 'DE',
  TRUNG_BINH = 'TRUNG_BINH',
  KHO = 'KHO',
}

export class CreateQuestionDto {
  @IsString()
  subjectId: string;

  @IsString()
  gradeId: string;

  @IsOptional()
  @IsString()
  topicId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsString()
  content: string;

  @IsEnum(QuestionTypeEnum)
  type: QuestionTypeEnum;

  @IsEnum(DifficultyEnum)
  difficulty: DifficultyEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  point?: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(['CO_BAN', 'NANG_CAO'])
  examCategory?: string;

  @IsOptional()
  @IsArray()
  options?: Array<{ content: string; isCorrect: boolean }>;

  @IsOptional()
  @IsArray()
  examPeriods?: string[];
}

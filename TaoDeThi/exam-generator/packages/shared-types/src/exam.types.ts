import { Difficulty, ExamCategory, ExamFormat } from './enums';

export interface GenerateExamDto {
  subjectId: string;
  gradeId: string;
  examCategory: ExamCategory;
  difficulties: Difficulty[];
  examFormat: ExamFormat;
  mcCount: number;
  essayCount: number;
}

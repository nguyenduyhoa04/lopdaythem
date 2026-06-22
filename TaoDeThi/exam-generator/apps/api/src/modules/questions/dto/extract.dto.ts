export class ExtractFromFileDto {
  file?: Express.Multer.File;
}

export class ExtractFromUrlDto {
  url: string;
}

export class ExtractFromTextDto {
  text: string;
}

export class SaveQuestionsDto {
  questions: Array<{
    content: string;
    type: 'TRAC_NGHIEM' | 'TU_LUAN';
    difficulty?: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG';
    examCategory?: 'CO_BAN' | 'NANG_CAO';
    options?: Array<{
      label: string;
      content: string;
      isCorrect: boolean;
    }>;
    answerText?: string;
    subjectId?: string;
    gradeId?: string;
  }>;
  subjectId?: string;
  gradeId?: string;
}

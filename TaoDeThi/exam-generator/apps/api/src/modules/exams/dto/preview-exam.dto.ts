export class PreviewExamDto {
  subjectId!: string;
  gradeId!: string;
  category!: 'CO_BAN' | 'NANG_CAO';
  format!: 'TRAC_NGHIEM' | 'TU_LUAN' | 'KET_HOP';
  difficulties!: ('NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG')[];
  mcCount!: number;
  essayCount!: number;
  scopeType?: 'LESSON' | 'PERIOD';
  lessonIds?: string[];
  examPeriod?: 'GIUA_KI_1' | 'CUOI_KI_1' | 'GIUA_KI_2' | 'CUOI_KI_2' | 'CA_NAM';
}

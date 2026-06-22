import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');

  await prisma.examResultDetail.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.examCode.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.examLesson.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.questionExamPeriod.deleteMany();
  await prisma.question.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.classroomStudent.deleteMany();
  await prisma.enrollmentRequest.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.parentStudent.deleteMany();
  await prisma.invitationCode.deleteMany();
  await prisma.student.deleteMany();
  await prisma.materialPurchase.deleteMany();
  await prisma.learningMaterial.deleteMany();
  await prisma.collectedExam.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.user.deleteMany();

  console.log('Start seeding new dummy data...');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const admin = await prisma.user.create({
    data: { id: 'admin-uuid-1', name: 'Admin', email: 'admin@exam.com', passwordHash, role: 'ADMIN' },
  });

  const teacher1 = await prisma.user.create({
    data: { id: 'teacher-uuid-1', name: 'Cô Lan', email: 'colan@exam.com', passwordHash, role: 'TEACHER', phone: '0901234567' },
  });

  const teacher2 = await prisma.user.create({
    data: { id: 'teacher-uuid-2', name: 'Thầy Tuấn', email: 'thaytuan@exam.com', passwordHash, role: 'TEACHER' },
  });

  const parent1 = await prisma.user.create({
    data: { id: 'parent-uuid-1', name: 'Phụ huynh Bé Bi', email: 'phuhuynh@exam.com', passwordHash, role: 'PARENT' },
  });

  const parent2 = await prisma.user.create({
    data: { id: 'parent-uuid-2', name: 'Phụ huynh Minh', email: 'phuhuynhminh@exam.com', passwordHash, role: 'PARENT' },
  });

  const studentUser1 = await prisma.user.create({
    data: { id: 'student-uuid-1', name: 'Bé Bi', email: 'bebi@exam.com', passwordHash, role: 'STUDENT' },
  });

  const studentUser2 = await prisma.user.create({
    data: { id: 'student-uuid-2', name: 'Bé Minh', email: 'beminhtest@exam.com', passwordHash, role: 'STUDENT' },
  });

  const toan = await prisma.subject.create({ data: { name: 'Toán' } });
  const tiengViet = await prisma.subject.create({ data: { name: 'Tiếng Việt' } });

  const grades: any[] = [];
  for (let i = 1; i <= 5; i++) {
    grades.push(await prisma.grade.create({ data: { name: `Lớp ${i}`, level: i } }));
  }

  const diffs = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG'];

  const studentBi = await prisma.student.create({
    data: {
      id: 'student-record-1',
      fullName: 'Nguyễn Văn Bi',
      dob: new Date('2015-05-15'),
      gradeId: grades[2].id,
      createdByTeacherId: teacher1.id,
      userId: studentUser1.id,
    }
  });

  const studentMinh = await prisma.student.create({
    data: {
      id: 'student-record-2',
      fullName: 'Lê Minh',
      dob: new Date('2014-09-20'),
      gradeId: grades[3].id,
      createdByTeacherId: teacher2.id,
      userId: studentUser2.id,
    }
  });

  const studentNoUser = await prisma.student.create({
    data: {
      id: 'student-record-3',
      fullName: 'Trần Thị Búp',
      gradeId: grades[2].id,
      createdByTeacherId: teacher1.id,
    }
  });

  await prisma.parentStudent.create({
    data: { id: 'parent-student-1', parentUserId: parent1.id, studentId: studentBi.id, relationship: 'Mẹ', isOwner: true },
  });

  await prisma.parentStudent.create({
    data: { id: 'parent-student-2', parentUserId: parent2.id, studentId: studentMinh.id, relationship: 'Bố', isOwner: true },
  });

  const classToan3 = await prisma.classroom.create({
    data: {
      id: 'classroom-1',
      teacherId: teacher1.id,
      subjectId: toan.id,
      gradeId: grades[2].id,
      name: 'Lớp Toán 3A - Tối 2-4-6',
      description: 'Lớp luyện Toán cơ bản dành cho học sinh lớp 3',
    }
  });

  const classTV4 = await prisma.classroom.create({
    data: {
      id: 'classroom-2',
      teacherId: teacher2.id,
      subjectId: tiengViet.id,
      gradeId: grades[3].id,
      name: 'Lớp Tiếng Việt 4B - Sáng 3-5',
      description: 'Lớp Tiếng Việt nâng cao cho học sinh lớp 4',
    }
  });

  await prisma.classroomStudent.create({ data: { id: 'classroom-student-1', classroomId: classToan3.id, studentId: studentBi.id } });
  await prisma.classroomStudent.create({ data: { id: 'classroom-student-2', classroomId: classToan3.id, studentId: studentNoUser.id } });

  await prisma.schedule.createMany({
    data: [
      { classroomId: classToan3.id, dayOfWeek: 1, startTime: '18:00', endTime: '19:30', location: 'Phòng 301', note: 'Học hàng tuần' },
      { classroomId: classToan3.id, dayOfWeek: 3, startTime: '18:00', endTime: '19:30', location: 'Phòng 301' },
      { classroomId: classToan3.id, specificDate: new Date('2026-07-05'), startTime: '18:00', endTime: '19:30', location: 'Phòng 305', note: 'Bù tiết' },
      { classroomId: classTV4.id, dayOfWeek: 2, startTime: '08:00', endTime: '09:30', location: 'Phòng 204' },
      { classroomId: classTV4.id, dayOfWeek: 4, startTime: '08:00', endTime: '09:30', location: 'Phòng 204' },
    ]
  });

  const topicMap: Record<string, any[]> = {};
  const lessonMap: Record<string, any[]> = {};

  for (const grade of grades) {
    for (const subject of [toan, tiengViet]) {
      const key = `${grade.level}-${subject.name}`;
      const topic1 = await prisma.topic.create({ data: { name: `Chủ đề 1 - ${subject.name} ${grade.name}`, subjectId: subject.id, gradeId: grade.id } });
      const topic2 = await prisma.topic.create({ data: { name: `Chủ đề 2 - ${subject.name} ${grade.name}`, subjectId: subject.id, gradeId: grade.id } });
      topicMap[key] = [topic1, topic2];

      const lessons: any[] = [];
      lessons.push(await prisma.lesson.create({
        data: {
          subjectId: subject.id,
          gradeId: grade.id,
          topicId: topic1.id,
          name: `Bài học 1 - ${subject.name} ${grade.name}`,
          orderNo: 1,
          description: `Nội dung bài học 1 của ${subject.name} ${grade.name}`,
        }
      }));
      lessons.push(await prisma.lesson.create({
        data: {
          subjectId: subject.id,
          gradeId: grade.id,
          topicId: topic2.id,
          name: `Bài học 2 - ${subject.name} ${grade.name}`,
          orderNo: 2,
          description: `Nội dung bài học 2 của ${subject.name} ${grade.name}`,
        }
      }));
      lessonMap[key] = lessons;
    }
  }

  console.log('Seeding questions and exam periods...');

  const allQuestions: any[] = [];

  for (const grade of grades) {
    for (const subject of [toan, tiengViet]) {
      const key = `${grade.level}-${subject.name}`;
      const lessons = lessonMap[key];
      const topics = topicMap[key];

      for (const category of ['CO_BAN', 'NANG_CAO']) {
        for (let i = 0; i < 10; i++) {
          const difficulty = diffs[i % diffs.length] as any;
          const topic = topics[i % topics.length];
          const lesson = lessons[i % lessons.length];
          const question = await prisma.question.create({
            data: {
              topicId: topic.id,
              gradeId: grade.id,
              subjectId: subject.id,
              lessonId: lesson.id,
              type: 'TRAC_NGHIEM',
              difficulty,
              examCategory: category as any,
              content: `Câu hỏi trắc nghiệm ${category === 'CO_BAN' ? 'cơ bản' : 'nâng cao'} số ${i + 1} môn ${subject.name} ${grade.name}`,
              createdById: teacher1.id,
              options: {
                create: [
                  { label: 'A', content: `Đáp án A`, isCorrect: i % 4 === 0 },
                  { label: 'B', content: `Đáp án B`, isCorrect: i % 4 === 1 },
                  { label: 'C', content: `Đáp án C`, isCorrect: i % 4 === 2 },
                  { label: 'D', content: `Đáp án D`, isCorrect: i % 4 === 3 },
                ]
              }
            }
          });
          allQuestions.push(question);

          await prisma.questionExamPeriod.create({
            data: {
              questionId: question.id,
              period: i % 2 === 0 ? 'GIUA_KI_1' : 'CUOI_KI_1',
            }
          });
        }

        for (let i = 0; i < 6; i++) {
          const difficulty = diffs[i % diffs.length] as any;
          const topic = topics[i % topics.length];
          const lesson = lessons[i % lessons.length];
          const question = await prisma.question.create({
            data: {
              topicId: topic.id,
              gradeId: grade.id,
              subjectId: subject.id,
              lessonId: lesson.id,
              type: 'TU_LUAN',
              difficulty,
              examCategory: category as any,
              content: `Câu hỏi tự luận ${category === 'CO_BAN' ? 'cơ bản' : 'nâng cao'} số ${i + 1} môn ${subject.name} ${grade.name}`,
              answerText: `Đáp án mẫu cho câu tự luận số ${i + 1}`,
              createdById: teacher1.id,
            }
          });
          allQuestions.push(question);
        }
      }
    }
  }

  const material1 = await prisma.learningMaterial.create({
    data: {
      teacherId: teacher1.id,
      title: 'Slide Toán lớp 3 - Phép cộng',
      description: 'Bộ slide bài giảng Toán lớp 3 chủ đề Phép cộng có nhớ.',
      type: 'SLIDE_PPT',
      subjectId: toan.id,
      gradeId: grades[2].id,
      fileUrl: 'https://example.com/materials/toan3-phep-cong.pptx',
      thumbnailUrl: 'https://example.com/thumbs/toan3.png',
      accessType: 'FREE',
      price: 0,
    }
  });

  const material2 = await prisma.learningMaterial.create({
    data: {
      teacherId: teacher2.id,
      title: 'Video Tiếng Việt lớp 4 - Chính tả',
      description: 'Video bài giảng chính tả lớp 4.',
      type: 'VIDEO',
      subjectId: tiengViet.id,
      gradeId: grades[3].id,
      fileUrl: 'https://example.com/materials/tiengviet4-chinh-ta.mp4',
      thumbnailUrl: 'https://example.com/thumbs/tiengviet4.png',
      accessType: 'PAID',
      price: 50000,
    }
  });

  const material3 = await prisma.learningMaterial.create({
    data: {
      teacherId: teacher1.id,
      title: 'Tài liệu Toán lớp 4 - Hình học',
      description: 'Tài liệu PDF Toán lớp 4.',
      type: 'DOCUMENT',
      subjectId: toan.id,
      gradeId: grades[3].id,
      fileUrl: 'https://example.com/materials/toan4-hinh-hoc.pdf',
      thumbnailUrl: 'https://example.com/thumbs/toan4.png',
      accessType: 'PAID',
      price: 45000,
    }
  });

  await prisma.materialPurchase.create({
    data: { id: 'purchase-1', materialId: material2.id, parentUserId: parent1.id, purchasedAt: new Date('2026-06-01'), pricePaid: 50000 },
  });

  await prisma.materialPurchase.create({
    data: { id: 'purchase-2', materialId: material3.id, parentUserId: parent2.id, purchasedAt: new Date('2026-06-02'), pricePaid: 45000 },
  });

  await prisma.invitationCode.create({
    data: {
      id: 'invite-1',
      code: 'INVITE-PARENT-1',
      studentId: studentBi.id,
      targetRole: 'PARENT',
      createdById: teacher1.id,
      expiresAt: new Date('2027-01-01'),
      isUsed: false,
    }
  });

  await prisma.invitationCode.create({
    data: {
      id: 'invite-2',
      code: 'INVITE-STUDENT-1',
      studentId: studentBi.id,
      targetRole: 'STUDENT',
      createdById: teacher1.id,
      isUsed: true,
      usedByUserId: studentUser1.id,
      expiresAt: new Date('2026-12-31'),
    }
  });

  await prisma.collectedExam.create({
    data: {
      id: 'collected-1',
      teacherId: teacher1.id,
      title: 'Đề thi Toán 3 mẫu',
      subjectId: toan.id,
      gradeId: grades[2].id,
      fileUrl: 'https://example.com/collected/toan3-1.pdf',
      note: 'Đề kiểm tra tổng hợp lớp 3',
    }
  });

  await prisma.collectedExam.create({
    data: {
      id: 'collected-2',
      teacherId: teacher2.id,
      title: 'Đề thi Tiếng Việt 4 mẫu',
      subjectId: tiengViet.id,
      gradeId: grades[3].id,
      fileUrl: 'https://example.com/collected/tiengviet4-1.pdf',
      note: 'Đề thi học kỳ Tiếng Việt lớp 4',
    }
  });

  await prisma.enrollmentRequest.create({
    data: {
      id: 'enroll-1',
      parentUserId: parent1.id,
      studentId: studentNoUser.id,
      classroomId: classToan3.id,
      status: 'PENDING',
      note: 'Con tôi muốn học thêm Toán buổi tối',
    }
  });

  await prisma.enrollmentRequest.create({
    data: {
      id: 'enroll-2',
      parentUserId: parent2.id,
      studentId: studentMinh.id,
      classroomId: classTV4.id,
      status: 'APPROVED',
      note: 'Xin đăng ký lớp Tiếng Việt 4',
      reviewedAt: new Date('2026-06-10'),
      reviewedById: teacher2.id,
    }
  });

  const exam1Lessons = [
    lessonMap[`3-Toán`][0],
    lessonMap[`3-Toán`][1],
  ];

  const exam1 = await prisma.exam.create({
    data: {
      id: 'exam-1',
      teacherId: teacher1.id,
      title: 'Kiểm tra giữa kỳ Toán 3',
      subjectId: toan.id,
      gradeId: grades[2].id,
      examCategory: 'CO_BAN',
      examFormat: 'TRAC_NGHIEM',
      totalScore: 10,
      durationMinutes: 45,
      scopeType: 'PERIOD',
      examPeriod: 'GIUA_KI_1',
      examLessons: {
        create: exam1Lessons.map((lesson: any, index: number) => ({ lessonId: lesson.id }))
      }
    }
  });

  const selectedQuestions = await prisma.question.findMany({
    where: {
      gradeId: grades[2].id,
      subjectId: toan.id,
      examCategory: 'CO_BAN',
      type: 'TRAC_NGHIEM',
    },
    take: 8,
  });

  for (let i = 0; i < selectedQuestions.length; i++) {
    await prisma.examQuestion.create({
      data: {
        examId: exam1.id,
        questionId: selectedQuestions[i].id,
        orderNo: i + 1,
        scoreOverride: 1,
      }
    });
  }

  const examCodeA = await prisma.examCode.create({
    data: { id: 'examcode-1', examId: exam1.id, code: 'EXM3A1' }
  });

  const examCodeB = await prisma.examCode.create({
    data: { id: 'examcode-2', examId: exam1.id, code: 'EXM3A2' }
  });

  const examResult = await prisma.examResult.create({
    data: {
      id: 'examresult-1',
      examCodeId: examCodeA.id,
      studentId: studentBi.id,
      totalScore: 8,
      correctCount: 7,
      wrongCount: 1,
      blankCount: 0,
      gradedAt: new Date('2026-06-12'),
      status: 'PROCESSED',
      isMockExam: false,
    }
  });

  const examQuestions = await prisma.examQuestion.findMany({ where: { examId: exam1.id } });

  for (const [index, eq] of examQuestions.entries()) {
    await prisma.examResultDetail.create({
      data: {
        examResultId: examResult.id,
        examQuestionId: eq.id,
        selectedOptionLabel: index === 0 ? 'A' : 'B',
        isCorrect: index !== 1,
        scoreObtained: index === 1 ? 0 : 1,
      }
    });
  }

  console.log('Seeding dummy data finished!');
  console.log('Login credentials:');
  console.log('Admin: admin@exam.com / 123456');
  console.log('Teacher 1: colan@exam.com / 123456');
  console.log('Teacher 2: thaytuan@exam.com / 123456');
  console.log('Parent 1: phuhuynh@exam.com / 123456');
  console.log('Parent 2: phuhuynhminh@exam.com / 123456');
  console.log('Student 1: bebi@exam.com / 123456');
  console.log('Student 2: beminhtest@exam.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

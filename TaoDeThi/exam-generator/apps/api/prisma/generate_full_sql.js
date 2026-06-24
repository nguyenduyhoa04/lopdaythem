const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'full_schema_and_seed.sql');
const lines = [];

const escape = (value) => value.replace(/'/g, "''");

const add = (line = '') => lines.push(line);

add('-- Full PostgreSQL schema and sample seed data generated from prisma/schema.prisma and prisma/seed.ts');
add('BEGIN;');
add('');
add('-- Enums');
add("CREATE TYPE \"UserRole\" AS ENUM ('ADMIN', 'TEACHER', 'PARENT', 'STUDENT');");
add("CREATE TYPE \"QuestionType\" AS ENUM ('TRAC_NGHIEM', 'TU_LUAN');");
add("CREATE TYPE \"Difficulty\" AS ENUM ('NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG');");
add("CREATE TYPE \"ExamCategory\" AS ENUM ('CO_BAN', 'NANG_CAO');");
add("CREATE TYPE \"ExamFormat\" AS ENUM ('TRAC_NGHIEM', 'TU_LUAN', 'KET_HOP');");
add("CREATE TYPE \"ScanStatus\" AS ENUM ('PENDING', 'PROCESSED', 'NEEDS_REVIEW');");
add("CREATE TYPE \"ExamPeriod\" AS ENUM ('GIUA_KI_1', 'CUOI_KI_1', 'GIUA_KI_2', 'CUOI_KI_2', 'CA_NAM');");
add("CREATE TYPE \"ExamScopeType\" AS ENUM ('LESSON', 'PERIOD');");
add("CREATE TYPE \"EnrollmentStatus\" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');");
add("CREATE TYPE \"MaterialType\" AS ENUM ('SLIDE_PPT', 'VIDEO', 'DOCUMENT');");
add("CREATE TYPE \"MaterialAccessType\" AS ENUM ('FREE', 'PAID');");
add("CREATE TYPE \"InvitationTargetRole\" AS ENUM ('PARENT', 'STUDENT');");
add('');
add('-- Tables');
add('CREATE TABLE "User" (');
add('  "id" TEXT NOT NULL,');
add('  "name" TEXT NOT NULL,');
add('  "email" TEXT NOT NULL,');
add('  "passwordHash" TEXT NOT NULL,');
add('  "role" "UserRole" NOT NULL,');
add('  "phone" TEXT,');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "User_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Student" (');
add('  "id" TEXT NOT NULL,');
add('  "fullName" TEXT NOT NULL,');
add('  "dob" TIMESTAMP(3),');
add('  "gradeId" TEXT NOT NULL,');
add('  "createdByTeacherId" TEXT NOT NULL,');
add('  "userId" TEXT,');
add('  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ParentStudent" (');
add('  "id" TEXT NOT NULL,');
add('  "parentUserId" TEXT NOT NULL,');
add('  "studentId" TEXT NOT NULL,');
add('  "relationship" TEXT,');
add('  "isOwner" BOOLEAN NOT NULL DEFAULT false,');
add('  CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Classroom" (');
add('  "id" TEXT NOT NULL,');
add('  "teacherId" TEXT NOT NULL,');
add('  "name" TEXT NOT NULL,');
add('  "subjectId" TEXT NOT NULL,');
add('  "gradeId" TEXT NOT NULL,');
add('  "description" TEXT,');
add('  CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ClassroomStudent" (');
add('  "id" TEXT NOT NULL,');
add('  "classroomId" TEXT NOT NULL,');
add('  "studentId" TEXT NOT NULL,');
add('  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "ClassroomStudent_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Subject" (');
add('  "id" TEXT NOT NULL,');
add('  "name" TEXT NOT NULL,');
add('  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Grade" (');
add('  "id" TEXT NOT NULL,');
add('  "name" TEXT NOT NULL,');
add('  "level" INTEGER NOT NULL,');
add('  CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Topic" (');
add('  "id" TEXT NOT NULL,');
add('  "subjectId" TEXT NOT NULL,');
add('  "gradeId" TEXT NOT NULL,');
add('  "name" TEXT NOT NULL,');
add('  CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Lesson" (');
add('  "id" TEXT NOT NULL,');
add('  "subjectId" TEXT NOT NULL,');
add('  "gradeId" TEXT NOT NULL,');
add('  "topicId" TEXT,');
add('  "name" TEXT NOT NULL,');
add('  "orderNo" INTEGER NOT NULL,');
add('  "description" TEXT,');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Question" (');
add('  "id" TEXT NOT NULL,');
add('  "topicId" TEXT,');
add('  "gradeId" TEXT NOT NULL,');
add('  "subjectId" TEXT NOT NULL,');
add('  "type" "QuestionType" NOT NULL,');
add('  "difficulty" "Difficulty" NOT NULL,');
add('  "examCategory" "ExamCategory" NOT NULL,');
add('  "content" TEXT NOT NULL,');
add('  "answerText" TEXT,');
add('  "score" DECIMAL(65,30) NOT NULL DEFAULT 1.0,');
add('  "createdById" TEXT NOT NULL,');
add('  "lessonId" TEXT,');
add('  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "QuestionExamPeriod" (');
add('  "id" TEXT NOT NULL,');
add('  "questionId" TEXT NOT NULL,');
add('  "period" "ExamPeriod" NOT NULL,');
add('  CONSTRAINT "QuestionExamPeriod_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "QuestionOption" (');
add('  "id" TEXT NOT NULL,');
add('  "questionId" TEXT NOT NULL,');
add('  "label" TEXT NOT NULL,');
add('  "content" TEXT NOT NULL,');
add('  "isCorrect" BOOLEAN NOT NULL DEFAULT false,');
add('  CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Exam" (');
add('  "id" TEXT NOT NULL,');
add('  "teacherId" TEXT NOT NULL,');
add('  "title" TEXT NOT NULL,');
add('  "subjectId" TEXT NOT NULL,');
add('  "gradeId" TEXT NOT NULL,');
add('  "examCategory" "ExamCategory" NOT NULL,');
add('  "examFormat" "ExamFormat" NOT NULL,');
add('  "totalScore" DECIMAL(65,30) NOT NULL,');
add('  "durationMinutes" INTEGER NOT NULL,');
add('  "scopeType" "ExamScopeType" NOT NULL DEFAULT PERIOD,');
add('  "examPeriod" "ExamPeriod",');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ExamLesson" (');
add('  "id" TEXT NOT NULL,');
add('  "examId" TEXT NOT NULL,');
add('  "lessonId" TEXT NOT NULL,');
add('  CONSTRAINT "ExamLesson_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ExamQuestion" (');
add('  "id" TEXT NOT NULL,');
add('  "examId" TEXT NOT NULL,');
add('  "questionId" TEXT NOT NULL,');
add('  "orderNo" INTEGER NOT NULL,');
add('  "scoreOverride" DECIMAL(65,30),');
add('  CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ExamCode" (');
add('  "id" TEXT NOT NULL,');
add('  "examId" TEXT NOT NULL,');
add('  "code" TEXT NOT NULL,');
add('  "qrPayload" TEXT,');
add('  "studentId" TEXT,');
add('  "pdfPath" TEXT,');
add('  CONSTRAINT "ExamCode_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ExamResult" (');
add('  "id" TEXT NOT NULL,');
add('  "examCodeId" TEXT NOT NULL,');
add('  "studentId" TEXT,');
add('  "totalScore" DECIMAL(65,30),');
add('  "correctCount" INTEGER,');
add('  "wrongCount" INTEGER,');
add('  "blankCount" INTEGER,');
add('  "gradedAt" TIMESTAMP(3),');
add('  "scanImagePath" TEXT,');
add('  "status" "ScanStatus" NOT NULL DEFAULT \'PENDING\',');
add('  "isMockExam" BOOLEAN NOT NULL DEFAULT false,');
add('  CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "ExamResultDetail" (');
add('  "id" TEXT NOT NULL,');
add('  "examResultId" TEXT NOT NULL,');
add('  "examQuestionId" TEXT NOT NULL,');
add('  "selectedOptionLabel" TEXT,');
add('  "isCorrect" BOOLEAN,');
add('  "scoreObtained" DECIMAL(65,30),');
add('  CONSTRAINT "ExamResultDetail_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Schedule" (');
add('  "id" TEXT NOT NULL,');
add('  "classroomId" TEXT NOT NULL,');
add('  "dayOfWeek" INTEGER,');
add('  "specificDate" TIMESTAMP(3),');
add('  "startTime" TEXT NOT NULL,');
add('  "endTime" TEXT NOT NULL,');
add('  "location" TEXT,');
add('  "note" TEXT,');
add('  CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "EnrollmentRequest" (');
add('  "id" TEXT NOT NULL,');
add('  "parentUserId" TEXT NOT NULL,');
add('  "studentId" TEXT NOT NULL,');
add('  "classroomId" TEXT NOT NULL,');
add('  "status" "EnrollmentStatus" NOT NULL DEFAULT PENDING,');
add('  "note" TEXT,');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  "reviewedAt" TIMESTAMP(3),');
add('  "reviewedById" TEXT,');
add('  CONSTRAINT "EnrollmentRequest_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "Setting" (');
add('  "id" TEXT NOT NULL,');
add('  "key" TEXT NOT NULL,');
add('  "value" TEXT NOT NULL,');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "LearningMaterial" (');
add('  "id" TEXT NOT NULL,');
add('  "teacherId" TEXT NOT NULL,');
add('  "title" TEXT NOT NULL,');
add('  "description" TEXT,');
add('  "type" "MaterialType" NOT NULL,');
add('  "subjectId" TEXT NOT NULL,');
add('  "gradeId" TEXT NOT NULL,');
add('  "fileUrl" TEXT NOT NULL,');
add('  "thumbnailUrl" TEXT,');
add('  "accessType" "MaterialAccessType" NOT NULL DEFAULT FREE,');
add('  "price" DECIMAL(65,30),');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "MaterialPurchase" (');
add('  "id" TEXT NOT NULL,');
add('  "materialId" TEXT NOT NULL,');
add('  "parentUserId" TEXT NOT NULL,');
add('  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  "pricePaid" DECIMAL(65,30),');
add('  CONSTRAINT "MaterialPurchase_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "InvitationCode" (');
add('  "id" TEXT NOT NULL,');
add('  "code" TEXT NOT NULL,');
add('  "studentId" TEXT NOT NULL,');
add('  "targetRole" "InvitationTargetRole" NOT NULL,');
add('  "createdById" TEXT NOT NULL,');
add('  "isUsed" BOOLEAN NOT NULL DEFAULT false,');
add('  "usedByUserId" TEXT,');
add('  "expiresAt" TIMESTAMP(3),');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "InvitationCode_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('CREATE TABLE "CollectedExam" (');
add('  "id" TEXT NOT NULL,');
add('  "teacherId" TEXT NOT NULL,');
add('  "title" TEXT NOT NULL,');
add('  "subjectId" TEXT,');
add('  "gradeId" TEXT,');
add('  "fileUrl" TEXT NOT NULL,');
add('  "note" TEXT,');
add('  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,');
add('  CONSTRAINT "CollectedExam_pkey" PRIMARY KEY ("id")');
add(');');
add('');
add('-- Indexes');
add('CREATE UNIQUE INDEX "User_email_key" ON "User"("email");');
add('CREATE UNIQUE INDEX "ParentStudent_parentUserId_studentId_key" ON "ParentStudent"("parentUserId", "studentId");');
add('CREATE UNIQUE INDEX "ClassroomStudent_classroomId_studentId_key" ON "ClassroomStudent"("classroomId", "studentId");');
add('CREATE UNIQUE INDEX "QuestionExamPeriod_questionId_period_key" ON "QuestionExamPeriod"("questionId", "period");');
add('CREATE UNIQUE INDEX "ExamLesson_examId_lessonId_key" ON "ExamLesson"("examId", "lessonId");');
add('CREATE UNIQUE INDEX "ExamCode_code_key" ON "ExamCode"("code");');
add('CREATE UNIQUE INDEX "MaterialPurchase_materialId_parentUserId_key" ON "MaterialPurchase"("materialId", "parentUserId");');
add('CREATE UNIQUE INDEX "InvitationCode_code_key" ON "InvitationCode"("code");');
add('CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");');
add('CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");');
add('');
add('-- Foreign keys');
add('ALTER TABLE "Student" ADD CONSTRAINT "Student_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Student" ADD CONSTRAINT "Student_createdByTeacherId_fkey" FOREIGN KEY ("createdByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Topic" ADD CONSTRAINT "Topic_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;');
add('ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;');
add('ALTER TABLE "Question" ADD CONSTRAINT "Question_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Question" ADD CONSTRAINT "Question_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Question" ADD CONSTRAINT "Question_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;');
add('ALTER TABLE "QuestionExamPeriod" ADD CONSTRAINT "QuestionExamPeriod_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Exam" ADD CONSTRAINT "Exam_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamLesson" ADD CONSTRAINT "ExamLesson_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamLesson" ADD CONSTRAINT "ExamLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamCode" ADD CONSTRAINT "ExamCode_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examCodeId_fkey" FOREIGN KEY ("examCodeId") REFERENCES "ExamCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "ExamResultDetail" ADD CONSTRAINT "ExamResultDetail_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "ExamResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "EnrollmentRequest" ADD CONSTRAINT "EnrollmentRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "MaterialPurchase" ADD CONSTRAINT "MaterialPurchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "MaterialPurchase" ADD CONSTRAINT "MaterialPurchase_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "InvitationCode" ADD CONSTRAINT "InvitationCode_usedByUserId_fkey" FOREIGN KEY ("usedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "CollectedExam" ADD CONSTRAINT "CollectedExam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "CollectedExam" ADD CONSTRAINT "CollectedExam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('ALTER TABLE "CollectedExam" ADD CONSTRAINT "CollectedExam_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;');
add('');

add('-- Seed data');
add('');
const users = [
  { id: 'admin-uuid-1', name: 'Admin', email: 'admin@exam.com', passwordHash: 'hashed-123456', role: 'ADMIN', phone: null },
  { id: 'teacher-uuid-1', name: 'Cô Lan', email: 'colan@exam.com', passwordHash: 'hashed-123456', role: 'TEACHER', phone: '0901234567' },
  { id: 'teacher-uuid-2', name: 'Thầy Tuấn', email: 'thaytuan@exam.com', passwordHash: 'hashed-123456', role: 'TEACHER', phone: null },
  { id: 'parent-uuid-1', name: 'Phụ huynh Bé Bi', email: 'phuhuynh@exam.com', passwordHash: 'hashed-123456', role: 'PARENT', phone: null },
  { id: 'parent-uuid-2', name: 'Phụ huynh Minh', email: 'phuhuynhminh@exam.com', passwordHash: 'hashed-123456', role: 'PARENT', phone: null },
  { id: 'student-uuid-1', name: 'Bé Bi', email: 'bebi@exam.com', passwordHash: 'hashed-123456', role: 'STUDENT', phone: null },
  { id: 'student-uuid-2', name: 'Bé Minh', email: 'beminhtest@exam.com', passwordHash: 'hashed-123456', role: 'STUDENT', phone: null },
];

add('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "phone") VALUES');
add(users.map((user) => `  ('${user.id}', '${escape(user.name)}', '${escape(user.email)}', '${escape(user.passwordHash)}', '${user.role}', ${user.phone === null ? 'NULL' : `'${escape(user.phone)}'`})`).join(',\n') + ';');
add('');
const grades = [];
for (let i = 1; i <= 5; i += 1) {
  grades.push({ id: `grade-${i}`, name: `Lớp ${i}`, level: i });
}
add('INSERT INTO "Grade" ("id", "name", "level") VALUES');
add(grades.map((grade) => `  ('${grade.id}', '${escape(grade.name)}', ${grade.level})`).join(',\n') + ';');
add('');
const subjects = [
  { id: 'subject-toan', name: 'Toán', key: 'toan' },
  { id: 'subject-tiengviet', name: 'Tiếng Việt', key: 'tiengviet' },
];
add('INSERT INTO "Subject" ("id", "name") VALUES');
add(subjects.map((subject) => `  ('${subject.id}', '${escape(subject.name)}')`).join(',\n') + ';');
add('');
const students = [
  { id: 'student-record-1', fullName: 'Nguyễn Văn Bi', dob: '2015-05-15 00:00:00', gradeId: grades[2].id, createdByTeacherId: users[1].id, userId: users[5].id },
  { id: 'student-record-2', fullName: 'Lê Minh', dob: '2014-09-20 00:00:00', gradeId: grades[3].id, createdByTeacherId: users[2].id, userId: users[6].id },
  { id: 'student-record-3', fullName: 'Trần Thị Búp', dob: null, gradeId: grades[2].id, createdByTeacherId: users[1].id, userId: null },
];
add('INSERT INTO "Student" ("id", "fullName", "dob", "gradeId", "createdByTeacherId", "userId") VALUES');
add(students.map((student) => `  ('${student.id}', '${escape(student.fullName)}', ${student.dob ? `'${student.dob}'` : 'NULL'}, '${student.gradeId}', '${student.createdByTeacherId}', ${student.userId ? `'${student.userId}'` : 'NULL'})`).join(',\n') + ';');
add('');
add('INSERT INTO "ParentStudent" ("id", "parentUserId", "studentId", "relationship", "isOwner") VALUES');
add([`  ('parent-student-1', '${users[3].id}', '${students[0].id}', 'Mẹ', true)`, `  ('parent-student-2', '${users[4].id}', '${students[1].id}', 'Bố', true)`].join(',\n') + ';');
add('');
const classrooms = [
  { id: 'classroom-1', teacherId: users[1].id, subjectId: subjects[0].id, gradeId: grades[2].id, name: 'Lớp Toán 3A - Tối 2-4-6', description: 'Lớp luyện Toán cơ bản dành cho học sinh lớp 3' },
  { id: 'classroom-2', teacherId: users[2].id, subjectId: subjects[1].id, gradeId: grades[3].id, name: 'Lớp Tiếng Việt 4B - Sáng 3-5', description: 'Lớp Tiếng Việt nâng cao cho học sinh lớp 4' },
];
add('INSERT INTO "Classroom" ("id", "teacherId", "name", "subjectId", "gradeId", "description") VALUES');
add(classrooms.map((room) => `  ('${room.id}', '${room.teacherId}', '${escape(room.name)}', '${room.subjectId}', '${room.gradeId}', ${room.description === null ? 'NULL' : `'${escape(room.description)}'`})`).join(',\n') + ';');
add('');
add('INSERT INTO "ClassroomStudent" ("id", "classroomId", "studentId") VALUES');
add([`  ('classroom-student-1', '${classrooms[0].id}', '${students[0].id}')`, `  ('classroom-student-2', '${classrooms[0].id}', '${students[2].id}')`].join(',\n') + ';');
add('');
add('INSERT INTO "Schedule" ("id", "classroomId", "dayOfWeek", "specificDate", "startTime", "endTime", "location", "note") VALUES');
add([
  `  ('schedule-1', '${classrooms[0].id}', 1, NULL, '18:00', '19:30', 'Phòng 301', 'Học hàng tuần')`,
  `  ('schedule-2', '${classrooms[0].id}', 3, NULL, '18:00', '19:30', 'Phòng 301', NULL)`,
  `  ('schedule-3', '${classrooms[0].id}', NULL, '2026-07-05 00:00:00', '18:00', '19:30', 'Phòng 305', 'Bù tiết')`,
  `  ('schedule-4', '${classrooms[1].id}', 2, NULL, '08:00', '09:30', 'Phòng 204', NULL)`,
  `  ('schedule-5', '${classrooms[1].id}', 4, NULL, '08:00', '09:30', 'Phòng 204', NULL)`,
].join(',\n') + ';');
add('');

const topicRows = [];
const lessonRows = [];
const lessonMap = {};
const topicMap = {};
for (const grade of grades) {
  for (const subject of subjects) {
    const key = `${grade.level}-${subject.key}`;
    const topic1 = { id: `topic-${key}-1`, subjectId: subject.id, gradeId: grade.id, name: `Chủ đề 1 - ${subject.name} ${grade.name}` };
    const topic2 = { id: `topic-${key}-2`, subjectId: subject.id, gradeId: grade.id, name: `Chủ đề 2 - ${subject.name} ${grade.name}` };
    topicRows.push(topic1, topic2);
    topicMap[key] = [topic1, topic2];
    const lesson1 = { id: `lesson-${key}-1`, subjectId: subject.id, gradeId: grade.id, topicId: topic1.id, name: `Bài học 1 - ${subject.name} ${grade.name}`, orderNo: 1, description: `Nội dung bài học 1 của ${subject.name} ${grade.name}` };
    const lesson2 = { id: `lesson-${key}-2`, subjectId: subject.id, gradeId: grade.id, topicId: topic2.id, name: `Bài học 2 - ${subject.name} ${grade.name}`, orderNo: 2, description: `Nội dung bài học 2 của ${subject.name} ${grade.name}` };
    lessonRows.push(lesson1, lesson2);
    lessonMap[key] = [lesson1, lesson2];
  }
}
add('INSERT INTO "Topic" ("id", "subjectId", "gradeId", "name") VALUES');
add(topicRows.map((topic) => `  ('${topic.id}', '${topic.subjectId}', '${topic.gradeId}', '${escape(topic.name)}')`).join(',\n') + ';');
add('');
add('INSERT INTO "Lesson" ("id", "subjectId", "gradeId", "topicId", "name", "orderNo", "description") VALUES');
add(lessonRows.map((lesson) => `  ('${lesson.id}', '${lesson.subjectId}', '${lesson.gradeId}', '${lesson.topicId}', '${escape(lesson.name)}', ${lesson.orderNo}, '${escape(lesson.description)}')`).join(',\n') + ';');
add('');

const questionRows = [];
const questionOptionRows = [];
const questionExamPeriodRows = [];
const categories = ['CO_BAN', 'NANG_CAO'];
const difficulties = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG'];

for (const grade of grades) {
  for (const subject of subjects) {
    const key = `${grade.level}-${subject.key}`;
    const lessons = lessonMap[key];
    const topics = topicMap[key];
    categories.forEach((category) => {
      for (let i = 0; i < 10; i += 1) {
        const difficulty = difficulties[i % difficulties.length];
        const topic = topics[i % topics.length];
        const lesson = lessons[i % lessons.length];
        const questionId = `question-${key}-${category}-${i + 1}`;
        questionRows.push({
          id: questionId,
          topicId: topic.id,
          gradeId: grade.id,
          subjectId: subject.id,
          type: 'TRAC_NGHIEM',
          difficulty,
          examCategory: category,
          content: `Câu hỏi trắc nghiệm ${category === 'CO_BAN' ? 'cơ bản' : 'nâng cao'} số ${i + 1} môn ${subject.name} ${grade.name}`,
          answerText: null,
          score: '1.0',
          createdById: users[1].id,
          lessonId: lesson.id,
        });
        const labels = ['A', 'B', 'C', 'D'];
        labels.forEach((label, idx) => {
          questionOptionRows.push({
            id: `option-${questionId}-${label}`,
            questionId,
            label,
            content: `Đáp án ${label}`,
            isCorrect: idx === i % 4,
          });
        });
        questionExamPeriodRows.push({
          id: `qep-${questionId}`,
          questionId,
          period: i % 2 === 0 ? 'GIUA_KI_1' : 'CUOI_KI_1',
        });
      }
      for (let i = 0; i < 6; i += 1) {
        const difficulty = difficulties[i % difficulties.length];
        const topic = topics[i % topics.length];
        const lesson = lessons[i % lessons.length];
        const questionId = `question-${key}-${category}-essay-${i + 1}`;
        questionRows.push({
          id: questionId,
          topicId: topic.id,
          gradeId: grade.id,
          subjectId: subject.id,
          type: 'TU_LUAN',
          difficulty,
          examCategory: category,
          content: `Câu hỏi tự luận ${category === 'CO_BAN' ? 'cơ bản' : 'nâng cao'} số ${i + 1} môn ${subject.name} ${grade.name}`,
          answerText: `Đáp án mẫu cho câu tự luận số ${i + 1}`,
          score: '1.0',
          createdById: users[1].id,
          lessonId: lesson.id,
        });
      }
    });
  }
}
add('INSERT INTO "Question" ("id", "topicId", "gradeId", "subjectId", "type", "difficulty", "examCategory", "content", "answerText", "score", "createdById", "lessonId") VALUES');
add(questionRows.map((q) => `  ('${q.id}', '${q.topicId}', '${q.gradeId}', '${q.subjectId}', '${q.type}', '${q.difficulty}', '${q.examCategory}', '${escape(q.content)}', ${q.answerText === null ? 'NULL' : `'${escape(q.answerText)}'`}, ${q.score}, '${q.createdById}', '${q.lessonId}')`).join(',\n') + ';');
add('');
add('INSERT INTO "QuestionOption" ("id", "questionId", "label", "content", "isCorrect") VALUES');
add(questionOptionRows.map((o) => `  ('${o.id}', '${o.questionId}', '${o.label}', '${escape(o.content)}', ${o.isCorrect ? 'true' : 'false'})`).join(',\n') + ';');
add('');
add('INSERT INTO "QuestionExamPeriod" ("id", "questionId", "period") VALUES');
add(questionExamPeriodRows.map((row) => `  ('${row.id}', '${row.questionId}', '${row.period}')`).join(',\n') + ';');
add('');
const materials = [
  { id: 'material-1', teacherId: users[1].id, title: 'Slide Toán lớp 3 - Phép cộng', description: 'Bộ slide bài giảng Toán lớp 3 chủ đề Phép cộng có nhớ.', type: 'SLIDE_PPT', subjectId: subjects[0].id, gradeId: grades[2].id, fileUrl: 'https://example.com/materials/toan3-phep-cong.pptx', thumbnailUrl: 'https://example.com/thumbs/toan3.png', accessType: 'FREE', price: '0' },
  { id: 'material-2', teacherId: users[2].id, title: 'Video Tiếng Việt lớp 4 - Chính tả', description: 'Video bài giảng chính tả lớp 4.', type: 'VIDEO', subjectId: subjects[1].id, gradeId: grades[3].id, fileUrl: 'https://example.com/materials/tiengviet4-chinh-ta.mp4', thumbnailUrl: 'https://example.com/thumbs/tiengviet4.png', accessType: 'PAID', price: '50000' },
  { id: 'material-3', teacherId: users[1].id, title: 'Tài liệu Toán lớp 4 - Hình học', description: 'Tài liệu PDF Toán lớp 4.', type: 'DOCUMENT', subjectId: subjects[0].id, gradeId: grades[3].id, fileUrl: 'https://example.com/materials/toan4-hinh-hoc.pdf', thumbnailUrl: 'https://example.com/thumbs/toan4.png', accessType: 'PAID', price: '45000' },
];
add('INSERT INTO "LearningMaterial" ("id", "teacherId", "title", "description", "type", "subjectId", "gradeId", "fileUrl", "thumbnailUrl", "accessType", "price") VALUES');
add(materials.map((m) => `  ('${m.id}', '${m.teacherId}', '${escape(m.title)}', '${escape(m.description)}', '${m.type}', '${m.subjectId}', '${m.gradeId}', '${escape(m.fileUrl)}', '${escape(m.thumbnailUrl)}', '${m.accessType}', ${m.price})`).join(',\n') + ';');
add('');
add('INSERT INTO "MaterialPurchase" ("id", "materialId", "parentUserId", "purchasedAt", "pricePaid") VALUES');
add([`  ('purchase-1', '${materials[1].id}', '${users[3].id}', '2026-06-01 00:00:00', 50000)`, `  ('purchase-2', '${materials[2].id}', '${users[4].id}', '2026-06-02 00:00:00', 45000)`].join(',\n') + ';');
add('');
add('INSERT INTO "InvitationCode" ("id", "code", "studentId", "targetRole", "createdById", "isUsed", "usedByUserId", "expiresAt") VALUES');
add([`  ('invite-1', 'INVITE-PARENT-1', '${students[0].id}', 'PARENT', '${users[1].id}', false, NULL, '2027-01-01 00:00:00')`, `  ('invite-2', 'INVITE-STUDENT-1', '${students[0].id}', 'STUDENT', '${users[1].id}', true, '${users[5].id}', '2026-12-31 00:00:00')`].join(',\n') + ';');
add('');
add('INSERT INTO "CollectedExam" ("id", "teacherId", "title", "subjectId", "gradeId", "fileUrl", "note") VALUES');
add([`  ('collected-1', '${users[1].id}', 'Đề thi Toán 3 mẫu', '${subjects[0].id}', '${grades[2].id}', 'https://example.com/collected/toan3-1.pdf', 'Đề kiểm tra tổng hợp lớp 3')`, `  ('collected-2', '${users[2].id}', 'Đề thi Tiếng Việt 4 mẫu', '${subjects[1].id}', '${grades[3].id}', 'https://example.com/collected/tiengviet4-1.pdf', 'Đề thi học kỳ Tiếng Việt lớp 4')`].join(',\n') + ';');
add('');
add('INSERT INTO "EnrollmentRequest" ("id", "parentUserId", "studentId", "classroomId", "status", "note", "createdAt", "reviewedAt", "reviewedById") VALUES');
add([`  ('enroll-1', '${users[3].id}', '${students[2].id}', '${classrooms[0].id}', 'PENDING', 'Con tôi muốn học thêm Toán buổi tối', '2026-06-01 00:00:00', NULL, NULL)`, `  ('enroll-2', '${users[4].id}', '${students[1].id}', '${classrooms[1].id}', 'APPROVED', 'Xin đăng ký lớp Tiếng Việt 4', '2026-06-01 00:00:00', '2026-06-10 00:00:00', '${users[2].id}')`].join(',\n') + ';');
add('');
add('INSERT INTO "Exam" ("id", "teacherId", "title", "subjectId", "gradeId", "examCategory", "examFormat", "totalScore", "durationMinutes", "scopeType", "examPeriod") VALUES');
add(`  ('exam-1', '${users[1].id}', 'Kiểm tra giữa kỳ Toán 3', '${subjects[0].id}', '${grades[2].id}', 'CO_BAN', 'TRAC_NGHIEM', 10, 45, 'PERIOD', 'GIUA_KI_1');`);
add('');
const selectedQuestions = questionRows.filter((q) => q.gradeId === grades[2].id && q.subjectId === subjects[0].id && q.examCategory === 'CO_BAN' && q.type === 'TRAC_NGHIEM').slice(0, 8);
add('INSERT INTO "ExamQuestion" ("id", "examId", "questionId", "orderNo", "scoreOverride") VALUES');
add(selectedQuestions.map((q, idx) => `  ('examquestion-${idx + 1}', 'exam-1', '${q.id}', ${idx + 1}, 1)`).join(',\n') + ';');
add('');
add('INSERT INTO "ExamCode" ("id", "examId", "code") VALUES');
add(`  ('examcode-1', 'exam-1', 'EXM3A1'),`);
add(`  ('examcode-2', 'exam-1', 'EXM3A2');`);
add('');
add('INSERT INTO "ExamResult" ("id", "examCodeId", "studentId", "totalScore", "correctCount", "wrongCount", "blankCount", "gradedAt", "status", "isMockExam") VALUES');
add(`  ('examresult-1', 'examcode-1', '${students[0].id}', 8, 7, 1, 0, '2026-06-12 00:00:00', 'PROCESSED', false);`);
add('');
add('INSERT INTO "ExamResultDetail" ("id", "examResultId", "examQuestionId", "selectedOptionLabel", "isCorrect", "scoreObtained") VALUES');
add(selectedQuestions.map((q, idx) => `  ('examresultdetail-${idx + 1}', 'examresult-1', 'examquestion-${idx + 1}', '${idx === 0 ? 'A' : 'B'}', ${idx === 1 ? 'false' : 'true'}, ${idx === 1 ? 0 : 1})`).join(',\n') + ';');
add('');
add('INSERT INTO "Setting" ("id", "key", "value", "createdAt", "updatedAt") VALUES');
add(`  ('setting-1', 'site_name', 'LopDayThem Exam Generator', '2026-06-01 00:00:00', '2026-06-01 00:00:00');`);
add('');
add('COMMIT;');

fs.writeFileSync(outputFile, lines.join('\n'));
console.log(`Generated SQL file: ${outputFile}`);

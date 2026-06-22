# PROMPT DỰ ÁN: Website Tạo Đề Thi & Chấm Điểm Trắc Nghiệm Tiểu Học
## (Stack: NestJS + PostgreSQL + Next.js)

> Tài liệu này dùng làm (1) đặc tả yêu cầu (SRS) để trao đổi với dev/freelancer, và (2) prompt để đưa cho AI (Claude/ChatGPT) code dần theo từng module. Copy nguyên văn hoặc từng phần vào AI code khi triển khai.

---

## 1. TỔNG QUAN DỰ ÁN

Xây dựng website giúp **giáo viên dạy thêm cấp tiểu học (lớp 1-5)** tạo đề thi môn **Toán** và **Tiếng Việt**, in đề ra giấy cho học sinh làm, sau đó **chấm điểm tự động phần trắc nghiệm bằng cách quét mã đề qua camera điện thoại** (nhận diện ô được tô đen kiểu OMR - Optical Mark Recognition). **Phụ huynh** có tài khoản riêng để xem tiến độ học tập và lịch học của con.

### 1.1. Đối tượng sử dụng (Actors)
| Vai trò | Mô tả |
|---|---|
| **Admin** | Quản lý toàn hệ thống, quản lý ngân hàng câu hỏi, quản lý tài khoản giáo viên/phụ huynh |
| **Giáo viên** | Tạo đề thi, in đề, quét bài chấm điểm, quản lý lớp học, học sinh, lịch học, nhập điểm/nhận xét |
| **Phụ huynh** | Xem kết quả học tập, lịch sử bài thi, lịch học trên lớp của con |
| **Học sinh** | (không cần đăng nhập ở giai đoạn 1 - chỉ làm bài trên giấy) |

### 1.2. Công nghệ sử dụng (Tech Stack)

**Backend — NestJS:**
- NestJS 10.x (Node.js 20 LTS, TypeScript strict mode)
- PostgreSQL 16 làm database chính
- **Prisma ORM** (khuyến nghị hơn TypeORM cho team mới — type-safe, migration rõ ràng, Prisma Studio tiện debug dữ liệu). Có thể dùng TypeORM nếu team đã quen.
- **Passport.js + JWT** (`@nestjs/passport`, `@nestjs/jwt`) cho xác thực, kèm refresh token lưu ở DB hoặc Redis
- **BullMQ** (`@nestjs/bullmq`) + Redis — xử lý queue cho job nặng: xử lý ảnh quét bài OMR, generate PDF
- **class-validator + class-transformer** — validate DTO đầu vào
- **Puppeteer** (qua `nestjs-puppeteer` hoặc tự wrap service) — xuất đề thi/phiếu trả lời ra PDF với độ chính xác layout cao (quan trọng vì tọa độ ô tô đen phải khớp tuyệt đối)
- **Sharp** — xử lý ảnh (resize, grayscale, threshold) trước khi đưa vào bước nhận diện OMR
- (Tùy chọn nâng cao) Microservice riêng bằng **Python (FastAPI + OpenCV)** để xử lý nhận diện OMR chính xác hơn, NestJS gọi qua HTTP nội bộ hoặc qua queue — xem mục 6
- **Swagger** (`@nestjs/swagger`) — tự sinh API documentation, rất hữu ích khi Next.js team làm việc song song

**Frontend — Next.js:**
- Next.js 14+ (App Router, không dùng Pages Router)
- TypeScript strict mode
- TailwindCSS — UI nhanh, responsive
- **TanStack Query (React Query)** — quản lý cache API, kết hợp Server Components cho phần không cần tương tác nhiều
- **Zustand** — state quản lý wizard tạo đề nhiều bước (state client-side, không phù hợp Server Component)
- **React Hook Form + Zod** — validate form, dùng chung schema Zod giữa frontend/backend nếu setup monorepo
- **Axios hoặc fetch native** — gọi API NestJS (Next.js Route Handlers có thể làm proxy nếu cần ẩn API endpoint thật)
- **react-pdf** hoặc `<iframe>` — preview PDF đề thi ngay trên web trước khi in
- **NextAuth.js (Auth.js)** — quản lý session phía Next.js, kết nối với JWT do NestJS phát hành (Credentials Provider gọi sang NestJS login API)
- (Mobile scan) Triển khai như **PWA** dùng `getUserMedia` API hoặc thư viện `react-webcam` để truy cập camera điện thoại trực tiếp từ trình duyệt — không cần build app native ở giai đoạn đầu
- **Recharts** — biểu đồ tiến độ học tập cho phụ huynh
- **react-big-calendar** hoặc tự build bằng TailwindCSS — hiển thị lịch học

**Giao tiếp Backend-Frontend:**
- RESTful API, JSON, response chuẩn hóa qua NestJS Interceptor toàn cục:
```json
{
  "success": true,
  "data": {},
  "message": "",
  "errors": null
}
```
- (Tùy chọn) Nếu muốn tối ưu hơn cho các trang nhiều dữ liệu lồng nhau (dashboard phụ huynh), có thể xem xét **GraphQL** (`@nestjs/graphql`) thay REST — không bắt buộc, REST vẫn đáp ứng tốt cho dự án này.

**Hạ tầng:**
- **Monorepo** khuyến nghị dùng **Turborepo** hoặc **Nx** để quản lý chung `apps/api` (NestJS) và `apps/web` (Next.js) trong 1 repo, chia sẻ types/schema Zod giữa 2 phía.
- Storage: lưu ảnh quét bài và PDF đề thi qua AWS S3 / MinIO (self-host) — dùng `@aws-sdk/client-s3`, hoặc local disk ở giai đoạn MVP.
- Docker Compose cho môi trường dev: PostgreSQL, Redis, (MinIO nếu cần), NestJS, Next.js.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (Monorepo)

```
exam-generator/
├── apps/
│   ├── api/                                  # NestJS project
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   └── roles.decorator.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── roles.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── response.interceptor.ts   # Chuẩn hóa response { success, data, message }
│   │   │   │   └── filters/
│   │   │   │       └── http-exception.filter.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   └── local.strategy.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── login.dto.ts
│   │   │   │   │       └── register.dto.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.module.ts
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   └── users.service.ts
│   │   │   │   ├── questions/                    # Ngân hàng câu hỏi
│   │   │   │   │   ├── questions.module.ts
│   │   │   │   │   ├── questions.controller.ts
│   │   │   │   │   ├── questions.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── create-question.dto.ts
│   │   │   │   │       └── query-question.dto.ts
│   │   │   │   ├── exams/
│   │   │   │   │   ├── exams.module.ts
│   │   │   │   │   ├── exams.controller.ts
│   │   │   │   │   ├── exams.service.ts             # CRUD đề thi
│   │   │   │   │   ├── exam-generator.service.ts    # Logic sinh đề theo wizard
│   │   │   │   │   ├── exam-pdf.service.ts          # Xuất PDF (Puppeteer)
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── generate-exam.dto.ts
│   │   │   │   │       └── preview-exam.dto.ts
│   │   │   │   ├── exam-scan/
│   │   │   │   │   ├── exam-scan.module.ts
│   │   │   │   │   ├── exam-scan.controller.ts
│   │   │   │   │   ├── omr-scan.service.ts          # Xử lý ảnh, detect mã đề + ô tô đen
│   │   │   │   │   ├── scoring.service.ts           # So đáp án, tính điểm
│   │   │   │   │   └── processors/
│   │   │   │   │       └── scan.processor.ts         # BullMQ Processor xử lý job quét ảnh
│   │   │   │   ├── classrooms/
│   │   │   │   │   ├── classrooms.module.ts
│   │   │   │   │   ├── classrooms.controller.ts
│   │   │   │   │   └── classrooms.service.ts
│   │   │   │   ├── students/
│   │   │   │   │   ├── students.module.ts
│   │   │   │   │   ├── students.controller.ts
│   │   │   │   │   └── students.service.ts
│   │   │   │   ├── schedules/
│   │   │   │   │   ├── schedules.module.ts
│   │   │   │   │   ├── schedules.controller.ts
│   │   │   │   │   └── schedules.service.ts
│   │   │   │   ├── exam-results/
│   │   │   │   │   ├── exam-results.module.ts
│   │   │   │   │   ├── exam-results.controller.ts
│   │   │   │   │   └── exam-results.service.ts
│   │   │   │   └── parent-dashboard/
│   │   │   │       ├── parent-dashboard.module.ts
│   │   │   │       ├── parent-dashboard.controller.ts
│   │   │   │       └── parent-dashboard.service.ts
│   │   │   └── prisma/
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts                              # Seed câu hỏi mẫu lớp 1-5
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── nest-cli.json
│   │
│   └── web/                                   # Next.js project (App Router)
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── (teacher)/
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── exams/
│       │   │   │   ├── create/page.tsx              # Wizard tạo đề (Client Component)
│       │   │   │   ├── [id]/page.tsx                # Xem chi tiết / xuất PDF
│       │   │   │   └── page.tsx                     # Danh sách đề
│       │   │   ├── scan/page.tsx                    # Trang quét bài (mobile-first)
│       │   │   ├── classrooms/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [id]/page.tsx
│       │   │   └── schedule/page.tsx
│       │   ├── (parent)/
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── children/[studentId]/page.tsx
│       │   │   └── schedule/page.tsx
│       │   ├── api/
│       │   │   └── auth/[...nextauth]/route.ts      # NextAuth config
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                                  # Button, Select, Stepper, Modal...
│       │   ├── exam-wizard/
│       │   │   ├── step-1-exam-type.tsx
│       │   │   ├── step-2-grade.tsx
│       │   │   ├── step-3-difficulty.tsx
│       │   │   ├── step-4-question-format.tsx
│       │   │   ├── step-5-question-count.tsx
│       │   │   ├── step-6-preview.tsx
│       │   │   └── exam-wizard.tsx                  # Container điều phối các step
│       │   ├── scan/
│       │   │   ├── camera-scanner.tsx
│       │   │   ├── scan-result-card.tsx
│       │   │   └── scan-history-list.tsx
│       │   └── parent-dashboard/
│       │       ├── child-progress-chart.tsx
│       │       ├── child-schedule-calendar.tsx
│       │       └── child-exam-history.tsx
│       ├── lib/
│       │   ├── api-client.ts                        # Axios instance gọi NestJS API
│       │   ├── auth.ts                               # NextAuth config helper
│       │   └── validators/                           # Zod schemas (share được với backend nếu monorepo)
│       ├── stores/
│       │   └── exam-wizard-store.ts                  # Zustand store giữ state qua các step
│       ├── hooks/
│       │   ├── use-exam-generator.ts
│       │   └── use-camera-scanner.ts
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── Dockerfile
│
├── packages/                                   # (Nếu dùng Turborepo) code share giữa api & web
│   └── shared-types/
│       └── src/
│           ├── exam.types.ts
│           └── enums.ts
│
├── docker-compose.yml                          # postgres, redis, api, web
├── turbo.json
└── docs/
    ├── api-spec.md                             # hoặc dùng Swagger tự sinh tại /api/docs
    └── database-schema.png
```

---

## 3. THIẾT KẾ DATABASE (Prisma Schema — Tóm tắt)

```prisma
// schema.prisma (rút gọn, chỉ thể hiện cấu trúc — viết đầy đủ khi triển khai thật)

enum UserRole {
  ADMIN
  TEACHER
  PARENT
}

enum QuestionType {
  TRAC_NGHIEM
  TU_LUAN
}

enum Difficulty {
  NHAN_BIET
  THONG_HIEU
  VAN_DUNG
}

enum ExamCategory {
  CO_BAN
  NANG_CAO
}

enum ExamFormat {
  TRAC_NGHIEM
  TU_LUAN
  KET_HOP
}

enum ScanStatus {
  PENDING
  PROCESSED
  NEEDS_REVIEW
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          UserRole
  phone         String?
  createdAt     DateTime @default(now())

  classrooms      Classroom[]      @relation("TeacherClassrooms")
  parentStudents  ParentStudent[]
  questions       Question[]
  exams           Exam[]
}

model Student {
  id              String   @id @default(uuid())
  fullName        String
  dob             DateTime?
  gradeId         String
  grade           Grade    @relation(fields: [gradeId], references: [id])
  createdByTeacherId String

  parentStudents    ParentStudent[]
  classroomStudents ClassroomStudent[]
  examResults       ExamResult[]
}

model ParentStudent {
  id            String @id @default(uuid())
  parentUserId  String
  studentId     String
  relationship  String?   // cha/mẹ/người giám hộ

  parent  User    @relation(fields: [parentUserId], references: [id])
  student Student @relation(fields: [studentId], references: [id])

  @@unique([parentUserId, studentId])
}

model Classroom {
  id          String   @id @default(uuid())
  teacherId   String
  name        String
  subjectId   String
  gradeId     String
  description String?

  teacher           User               @relation("TeacherClassrooms", fields: [teacherId], references: [id])
  subject           Subject            @relation(fields: [subjectId], references: [id])
  grade             Grade              @relation(fields: [gradeId], references: [id])
  classroomStudents ClassroomStudent[]
  schedules         Schedule[]
}

model ClassroomStudent {
  id          String   @id @default(uuid())
  classroomId String
  studentId   String
  joinedAt    DateTime @default(now())

  classroom Classroom @relation(fields: [classroomId], references: [id])
  student   Student   @relation(fields: [studentId], references: [id])

  @@unique([classroomId, studentId])
}

model Subject {
  id    String @id @default(uuid())
  name  String // Toán, Tiếng Việt
}

model Grade {
  id    String @id @default(uuid())
  name  String // Lớp 1...Lớp 5
  level Int    // 1-5
}

model Topic {
  id        String  @id @default(uuid())
  subjectId String
  gradeId   String
  name      String  // VD: "Phép cộng có nhớ", "Tập đọc - Chính tả"

  questions Question[]
}

model Question {
  id            String        @id @default(uuid())
  topicId       String?
  gradeId       String
  subjectId     String
  type          QuestionType
  difficulty    Difficulty
  examCategory  ExamCategory
  content       String        // hỗ trợ HTML/markdown + ảnh minh họa
  answerText    String?       // đáp án mẫu/hướng dẫn chấm cho tự luận
  score         Decimal       @default(1.0)
  createdById   String

  topic         Topic?            @relation(fields: [topicId], references: [id])
  createdBy     User              @relation(fields: [createdById], references: [id])
  options       QuestionOption[]
  examQuestions ExamQuestion[]
}

model QuestionOption {
  id         String  @id @default(uuid())
  questionId String
  label      String  // A/B/C/D
  content    String
  isCorrect  Boolean @default(false)

  question Question @relation(fields: [questionId], references: [id])
}

model Exam {
  id              String       @id @default(uuid())
  teacherId       String
  title           String
  subjectId       String
  gradeId         String
  examCategory    ExamCategory
  examFormat      ExamFormat
  totalScore      Decimal
  durationMinutes Int
  createdAt       DateTime     @default(now())

  teacher       User           @relation(fields: [teacherId], references: [id])
  examQuestions ExamQuestion[]
  examCodes     ExamCode[]
}

model ExamQuestion {
  id            String  @id @default(uuid())
  examId        String
  questionId    String
  orderNo       Int
  scoreOverride Decimal?

  exam     Exam     @relation(fields: [examId], references: [id])
  question Question @relation(fields: [questionId], references: [id])
}

model ExamCode {
  id         String  @id @default(uuid())
  examId     String
  code       String  @unique  // VD: "101A"
  qrPayload  String?
  studentId  String?           // có thể in trước, gán học sinh sau
  pdfPath    String?

  exam        Exam          @relation(fields: [examId], references: [id])
  examResults ExamResult[]
}

model ExamResult {
  id              String     @id @default(uuid())
  examCodeId      String
  studentId       String?
  totalScore      Decimal?
  correctCount    Int?
  wrongCount      Int?
  blankCount      Int?
  gradedAt        DateTime?
  scanImagePath   String?
  status          ScanStatus @default(PENDING)

  examCode ExamCode             @relation(fields: [examCodeId], references: [id])
  student  Student?             @relation(fields: [studentId], references: [id])
  details  ExamResultDetail[]
}

model ExamResultDetail {
  id                 String   @id @default(uuid())
  examResultId       String
  examQuestionId     String
  selectedOptionLabel String?
  isCorrect          Boolean?
  scoreObtained      Decimal?

  examResult ExamResult @relation(fields: [examResultId], references: [id])
}

model Schedule {
  id           String    @id @default(uuid())
  classroomId  String
  dayOfWeek    Int?      // 0-6 nếu lặp lại hàng tuần
  specificDate DateTime? // hoặc ngày cụ thể (học bù, học thêm)
  startTime    String
  endTime      String
  location     String?
  note         String?

  classroom Classroom @relation(fields: [classroomId], references: [id])
}
```

> **Lưu ý quan trọng về `ExamCode`:** Mỗi đề thi khi in ra cho 1 học sinh sẽ có **1 mã đề duy nhất** (số + chữ, hoặc kèm QR code nhỏ ở góc phiếu trả lời). Mã này dùng để:
> 1. Khi quét, hệ thống biết đây là đề nào, đáp án đúng là gì (tránh nhầm giữa nhiều đề khác nhau cùng lúc).
> 2. Gán được bài chấm về đúng học sinh nào (nếu giáo viên gán trước khi in, hoặc nhập tên sau khi quét).

---

## 4. LUỒNG NGHIỆP VỤ CHI TIẾT

### 4.1. Luồng tạo đề thi (Exam Creation Wizard - 6 bước)

```
[Bước 1] Chọn loại đề
   ○ Cơ bản     ○ Nâng cao
        ↓
[Bước 2] Chọn lớp
   ○ Lớp 1  ○ Lớp 2  ○ Lớp 3  ○ Lớp 4  ○ Lớp 5
   (kèm chọn môn: Toán / Tiếng Việt nếu chưa chọn trước đó)
        ↓
[Bước 3] Chọn độ khó (có thể chọn nhiều mức, kèm tỉ lệ %)
   ☑ Nhận biết     ☑ Thông hiểu     ☐ Vận dụng
        ↓
[Bước 4] Chọn dạng đề
   ○ Trắc nghiệm     ○ Tự luận     ○ Kết hợp (cả 2)
        ↓
[Bước 5] Nhập số câu mỗi loại
   - Nếu Trắc nghiệm/Kết hợp: số câu trắc nghiệm = ___
   - Nếu Tự luận/Kết hợp: số câu tự luận = ___
   - Hệ thống hiển thị tổng điểm dự kiến, cảnh báo nếu ngân hàng câu hỏi
     không đủ số câu theo điều kiện đã chọn (vd: không đủ câu "Vận dụng" lớp 3 Toán)
        ↓
[Bước 6] Xem trước đề (Preview) → [Tạo đề] → [Xuất PDF] → [In]
```

**API liên quan (NestJS Controllers):**
- `GET /topics?subjectId=&gradeId=` — lấy chủ đề để lọc thêm (optional, bước phụ)
- `POST /exams/preview` — body chứa toàn bộ lựa chọn wizard (validate qua `PreviewExamDto`), trả về danh sách câu hỏi được random chọn (chưa lưu DB) để giáo viên xem trước, có thể "làm mới" (random lại) từng câu nếu không hài lòng
- `POST /exams` — lưu đề chính thức từ kết quả preview đã chốt
- `POST /exams/:id/generate-pdf` — sinh PDF đề thi (tham số: số lượng bản in, có in đáp án riêng không, có in phiếu trả lời trắc nghiệm riêng không)

**Logic Service (`exam-generator.service.ts`):**
```typescript
// Giả lập pseudocode
@Injectable()
export class ExamGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(criteria: GenerateExamDto) {
    const {
      subjectId, gradeId, examCategory,
      difficulties, examFormat, mcCount, essayCount,
    } = criteria;

    const mcQuestions = await this.prisma.question.findMany({
      where: {
        subjectId, gradeId, examCategory,
        type: 'TRAC_NGHIEM',
        difficulty: { in: difficulties },
      },
      include: { options: true },
    });

    if (mcQuestions.length < mcCount) {
      throw new InsufficientQuestionsException(
        `Ngân hàng chỉ có ${mcQuestions.length} câu trắc nghiệm phù hợp, cần ${mcCount}.`,
      );
    }

    const selectedMc = shuffleArray(mcQuestions).slice(0, mcCount);

    // Tương tự cho essayQuestions nếu examFormat = TU_LUAN | KET_HOP

    return shuffleArray([...selectedMc, ...selectedEssay]);
  }
}
```

> Dùng `class-validator` decorator trong `GenerateExamDto` để validate: `mcCount` + `essayCount` >= 1, `difficulties` là array enum hợp lệ, v.v. Trả lỗi 422 kèm message rõ ràng nếu vi phạm, để Next.js hiển thị lỗi đúng vị trí form.

### 4.2. Luồng xuất PDF đề thi

Mỗi lần "Tạo đề" xong, hệ thống xuất ra **3 loại file PDF** (qua `exam-pdf.service.ts`, dùng Puppeteer render HTML/CSS chuẩn in ấn rồi xuất PDF):
1. **Đề thi** (không có đáp án) — để in cho học sinh
2. **Đáp án** (kèm hướng dẫn chấm tự luận) — để giáo viên đối chiếu
3. **Phiếu trả lời trắc nghiệm (Answer Sheet)** — tách riêng nếu đề có phần trắc nghiệm, thiết kế dạng ô tròn/ô vuông để tô đen (bubble sheet), có in **mã đề** dạng số lớn + **QR code nhỏ ở 3 góc** (góc làm điểm neo - anchor point để xử lý ảnh nghiêng/xoay khi quét)

> **Thiết kế phiếu trả lời (Answer Sheet) cần lưu ý kỹ thuật:**
> - In 3 ô vuông đen đặc (anchor markers) ở 3 góc tờ giấy (trên-trái, trên-phải, dưới-trái) để khi xử lý ảnh, hệ thống tính toán được góc nghiêng và tỷ lệ, "duỗi thẳng" ảnh (perspective transform) trước khi đọc.
> - Mã đề in dưới dạng QR code hoặc dãy ô tròn tô đen riêng (giống tô số báo danh) để máy đọc chính xác hơn là OCR chữ số.
> - Mỗi câu trắc nghiệm là 1 dòng có 4 ô tròn A/B/C/D, khoảng cách cố định, căn lề chuẩn để tính toán vị trí ô theo tọa độ tương đối — **lưu các tọa độ chuẩn này vào file config** (`apps/api/src/modules/exams/answer-sheet-layout.config.ts`) để cả bước generate PDF và bước xử lý ảnh dùng chung 1 nguồn, tránh lệch tọa độ.

**Công nghệ xuất PDF:** Puppeteer (headless Chrome) render template HTML/CSS (đơn vị `mm`/`pt`), độ chính xác layout cao, đặc biệt quan trọng vì tọa độ ô tô đen phải khớp chính xác giữa file PDF gốc và ảnh chụp lại. Chạy job này qua BullMQ queue nếu sinh nhiều bản đồng thời (in cho cả lớp 30 học sinh).

### 4.3. Luồng quét chấm điểm trắc nghiệm (qua camera điện thoại)

```
[Giáo viên mở web trên điện thoại (PWA)]
        ↓
[Bật camera → đưa phiếu trả lời vào khung hình]
        ↓ (Next.js Client Component dùng react-webcam / getUserMedia, có khung hướng dẫn căn giấy)
[Chụp ảnh → upload lên server: POST /exam-scan/upload (multipart/form-data)]
        ↓
[NestJS: nhận file qua @UseInterceptors(FileInterceptor), lưu tạm vào storage,
 đẩy job vào BullMQ queue 'omr-scan']
        ↓
[Processor (scan.processor.ts) xử lý job bất đồng bộ]:
   1. Dùng Sharp đọc 3 anchor markers ở góc → tính góc nghiêng → warp ảnh thẳng
   2. Đọc mã đề (QR code hoặc ô tô mã đề) → xác định Exam + đáp án đúng tương ứng (ExamCode)
   3. Với mỗi câu, xác định vùng ô A/B/C/D theo tọa độ đã biết trước (từ answer-sheet-layout.config.ts)
      → tính mật độ pixel đen trong từng ô → ô có mật độ cao nhất & vượt threshold = đáp án học sinh chọn
      → nếu nhiều ô cùng đậm hoặc không ô nào đủ đậm → đánh dấu "cần xem lại" (NEEDS_REVIEW)
   4. So với đáp án đúng → tính điểm, lưu ExamResult + ExamResultDetail
        ↓
[Frontend polling GET /exam-scan/:scanId/status, hoặc dùng WebSocket (NestJS Gateway)
 để push kết quả real-time khi xử lý xong]
        ↓
[Trả kết quả về cho giáo viên: điểm số, số câu đúng/sai, danh sách câu cần xem lại tay]
        ↓
[Giáo viên xác nhận / sửa tay các câu "cần xem lại" nếu có → Lưu kết quả chính thức]
        ↓
[Gán kết quả cho học sinh cụ thể nếu mã đề chưa gán sẵn tên]
```

**API liên quan:**
- `POST /exam-scan/upload` — upload ảnh, trả về `scanId` (job đã queued)
- `GET /exam-scan/:scanId/status` — polling lấy trạng thái + kết quả
- (Khuyến nghị) `WebSocket Gateway` (`@WebSocketGateway()`) namespace `/scan` — emit event `scan.completed` để Next.js không cần polling liên tục, cải thiện UX trên mobile
- `PATCH /exam-results/:id` — giáo viên sửa tay câu nhận diện sai/không chắc
- `POST /exam-results/:id/assign-student` — gán bài chấm cho học sinh

> **Ghi chú quan trọng cho AI khi code phần này:** Đây là phần **khó nhất về kỹ thuật** trong toàn dự án (xử lý ảnh OMR). Khuyến nghị triển khai theo 2 giai đoạn:
> - **Giai đoạn MVP:** Dùng **Sharp** (Node.js) làm threshold đen/trắng + tính mật độ pixel theo tọa độ cố định (đơn giản, đủ dùng nếu ảnh chụp thẳng, đủ sáng).
> - **Giai đoạn nâng cao:** Tách riêng một **microservice Python (FastAPI + OpenCV + NumPy)** chuyên xử lý ảnh OMR (contour detection, perspective transform, adaptive threshold). NestJS gọi sang microservice này qua HTTP nội bộ (`HttpModule` của `@nestjs/axios`) hoặc đẩy job qua queue dùng chung Redis. Lý do: OpenCV Python có thư viện và tài liệu OMR phong phú hơn nhiều, ảnh thực tế (chụp bằng điện thoại, ánh sáng không đều, giấy nghiêng) cần xử lý ảnh mạnh hơn threshold đơn giản của Sharp.

### 4.4. Luồng phụ huynh xem tiến độ học tập

**Trang Dashboard phụ huynh hiển thị (cho mỗi con, nếu phụ huynh có nhiều con thì chọn tab/dropdown chuyển đổi):**
- Biểu đồ điểm số các bài thi theo thời gian (line chart bằng Recharts: điểm theo từng đề thi/tháng), theo từng môn
- Bảng lịch sử bài thi: tên đề, ngày làm, điểm số, số câu đúng/sai, link xem chi tiết bài làm (PDF/scan ảnh đã chấm có đánh dấu đúng/sai)
- Lịch học trong tuần/tháng (calendar view): ngày giờ học, môn học, lớp, địa điểm (nếu học nhiều nơi), trạng thái (đã học/sắp tới/nghỉ)
- (Tùy chọn) Nhận xét của giáo viên cho từng buổi học hoặc bài thi

**API liên quan:**
- `GET /parent-dashboard/children` — danh sách con của phụ huynh đang đăng nhập (lấy `userId` từ JWT qua `@CurrentUser()` decorator)
- `GET /parent-dashboard/children/:studentId/results?subjectId=&from=&to=` — lịch sử điểm
- `GET /parent-dashboard/children/:studentId/schedule?month=` — lịch học theo tháng
- `GET /parent-dashboard/children/:studentId/results/:resultId` — chi tiết 1 bài thi (xem ảnh bài làm đã chấm)

**Phân quyền bắt buộc:** Dùng NestJS **Guard** kết hợp custom logic kiểm tra quan hệ `ParentStudent` trong service (không chỉ dựa vào `@Roles('PARENT')` decorator là đủ) — phải kiểm tra `studentId` truyền vào request thực sự thuộc về `parentUserId` đang đăng nhập, nếu không thì trả `403 Forbidden`. Nên viết riêng 1 Guard tên `ParentOwnsStudentGuard` áp dụng cho toàn bộ route trong `parent-dashboard` module — không để phụ huynh A xem được dữ liệu con của phụ huynh B dù biết `studentId`.

```typescript
// Pseudocode minh họa cho AI code
@Injectable()
export class ParentOwnsStudentGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // gán từ JwtStrategy
    const studentId = request.params.studentId;

    const relation = await this.prisma.parentStudent.findUnique({
      where: { parentUserId_studentId: { parentUserId: user.id, studentId } },
    });

    if (!relation) throw new ForbiddenException('Bạn không có quyền xem dữ liệu học sinh này.');
    return true;
  }
}
```

---

## 5. YÊU CẦU GIAO DIỆN (UI/UX) THEO TỪNG MÀN HÌNH

| Màn hình | Yêu cầu chính |
|---|---|
| **Wizard tạo đề** (`app/(teacher)/exams/create/page.tsx`) | Dạng Stepper ngang (hiển thị 6 bước, bước hiện tại highlight), cho phép Back để sửa bước trước mà không mất dữ liệu các bước sau (lưu state ở Zustand store), nút "Làm mới câu hỏi này" ở bước Preview cho từng câu. **Đây là Client Component** (`"use client"`) vì cần state tương tác liên tục. |
| **Danh sách đề đã tạo** | Có thể dùng Server Component fetch dữ liệu ban đầu (SSR nhanh hơn), kết hợp Client Component cho phần filter/search. Bảng có filter theo lớp/môn/loại đề/ngày tạo, mỗi dòng có action: Xem PDF, In lại, Xóa, Xem kết quả đã chấm |
| **Trang quét bài (Scan)** | Client Component bắt buộc (cần `getUserMedia`), tối ưu cho mobile, full-screen camera với khung viền vàng hướng dẫn đặt giấy vào khung, nút chụp lớn dễ bấm, hiển thị loading khi đang xử lý (nên dùng WebSocket để cập nhật real-time thay vì polling liên tục tốn pin), hiển thị kết quả rõ ràng (điểm to, danh sách câu sai có thể tap để xem chi tiết) |
| **Dashboard giáo viên** | Server Component fetch số liệu tổng quan (tổng số đề đã tạo, số bài đã chấm trong tháng, lịch dạy sắp tới), shortcut "Tạo đề mới" nổi bật |
| **Dashboard phụ huynh** | Card tổng quan điểm trung bình gần nhất, biểu đồ tiến độ (Recharts — Client Component vì cần interactivity), lịch học dạng calendar |
| **Quản lý lớp học** | CRUD lớp, thêm/xóa học sinh vào lớp, gán lịch học cố định theo thứ trong tuần (lặp lại hàng tuần) hoặc lịch học theo ngày cụ thể (bù/học thêm) |

> Xem skill `frontend-design` để áp dụng nguyên tắc thiết kế trực quan (typography, màu sắc, spacing) khi build các component thực tế, tránh giao diện mặc định khô khan. Với Next.js App Router, ưu tiên Server Component cho phần hiển thị dữ liệu tĩnh/SSR, chỉ dùng `"use client"` khi thực sự cần state, effect, hoặc browser API.

---

## 6. KIẾN TRÚC HỆ THỐNG (Tổng thể)

```
┌───────────────────┐        ┌────────────────────────┐        ┌─────────────────┐
│  Next.js Frontend  │ <───>  │   NestJS Backend API    │ <───>  │  PostgreSQL DB   │
│  (App Router)       │ REST/  │   (Auth + Business      │        │   (qua Prisma)    │
│  - Server Components│ WebSocket│  Logic + Validation)   │        └─────────────────┘
│  - PWA camera        │        └───────────┬────────────┘
└───────────────────┘                       │
                              ┌──────────────┼───────────────┐
                              ▼                              ▼
                    ┌───────────────────┐         ┌────────────────────┐
                    │ Redis + BullMQ     │         │ Storage (Local/S3)  │
                    │ (xử lý ảnh async,  │         │ - Ảnh quét bài       │
                    │  generate PDF queue)│         │ - PDF đề thi          │
                    └─────────┬──────────┘         └────────────────────┘
                              │
                              ▼
                ┌─────────────────────────────┐
                │ (Tùy chọn) Python Microservice│
                │ FastAPI + OpenCV             │
                │ - Nhận diện OMR chính xác    │
                └─────────────────────────────┘
```

---

## 7. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN (Roadmap)

### Giai đoạn 1 — MVP (Core)
- [ ] Setup monorepo (Turborepo/Nx), Docker Compose (Postgres + Redis)
- [ ] Auth (đăng ký/đăng nhập giáo viên, phụ huynh) với Passport JWT (NestJS) + NextAuth (Next.js)
- [ ] Prisma schema + migration cho toàn bộ bảng ở mục 3, seed dữ liệu mẫu
- [ ] CRUD ngân hàng câu hỏi (admin/giáo viên nhập câu hỏi tay hoặc import Excel)
- [ ] Wizard tạo đề 6 bước (chỉ làm Trắc nghiệm trước, vì cần cho phần chấm tự động)
- [ ] Xuất PDF đề thi + phiếu trả lời có mã đề + anchor markers (Puppeteer)
- [ ] Quét chấm điểm cơ bản bằng Sharp (threshold đơn giản) + BullMQ queue
- [ ] Quản lý lớp học, học sinh, lịch học (CRUD cơ bản)
- [ ] Dashboard phụ huynh xem điểm + lịch học, có `ParentOwnsStudentGuard`

### Giai đoạn 2 — Mở rộng
- [ ] Hỗ trợ đề Tự luận và Kết hợp (giáo viên nhập điểm tay cho phần tự luận sau khi học sinh làm)
- [ ] Tách microservice Python OpenCV để tăng độ chính xác OMR (xử lý ảnh nghiêng, ánh sáng yếu)
- [ ] WebSocket Gateway để push kết quả chấm real-time thay vì polling
- [ ] Import câu hỏi từ Excel/Word có sẵn (giáo viên có ngân hàng câu hỏi cũ)
- [ ] Thông báo (notification) cho phụ huynh khi có điểm mới / lịch học thay đổi (email hoặc push PWA)
- [ ] Báo cáo thống kê cho giáo viên (lớp nào học yếu phần nào, theo dạng câu hỏi/topic)

### Giai đoạn 3 — Tối ưu & Mở rộng kinh doanh
- [ ] Thanh toán/học phí (nếu mở rộng thành SaaS cho nhiều giáo viên)
- [ ] App di động thực sự (React Native, share logic với Next.js qua packages chung trong monorepo) thay cho PWA nếu cần hiệu năng camera tốt hơn
- [ ] AI sinh câu hỏi mới tự động (dùng LLM) để mở rộng ngân hàng câu hỏi nhanh

---

## 8. CÁC ĐIỂM RỦI RO KỸ THUẬT CẦN LƯU Ý (Quan trọng)

1. **Độ chính xác OMR khi quét bằng điện thoại** là rủi ro lớn nhất: ánh sáng, độ nghiêng, chất lượng giấy in, mực in mờ có thể làm sai kết quả. → Bắt buộc có bước "giáo viên xác nhận lại câu không chắc" trước khi lưu điểm chính thức, không nên tự động 100% ngay từ đầu.
2. **Đồng bộ tọa độ giữa PDF gốc và ảnh chụp lại**: phải dùng đơn vị đo cố định (mm) khi generate PDF qua Puppeteer, và **lưu chung 1 file config tọa độ** (`answer-sheet-layout.config.ts`) dùng cho cả bước render PDF và bước xử lý ảnh — tránh tình trạng 2 bước tính tọa độ khác công thức dẫn đến lệch.
3. **Phân quyền dữ liệu phụ huynh-học sinh** phải chặt chẽ tuyệt đối (Guard kiểm tra `ParentStudent` relation ở mọi route, viết unit test riêng cho Guard này) vì đây là dữ liệu liên quan trẻ em.
4. **Xử lý ảnh và generate PDF nên chạy qua BullMQ queue**, không xử lý đồng bộ trong request/response cycle của NestJS, để tránh timeout khi nhiều giáo viên quét bài hoặc in đề cùng lúc.
5. **Prisma + PostgreSQL transaction**: khi lưu `ExamResult` + nhiều `ExamResultDetail` cùng lúc, bắt buộc dùng `prisma.$transaction([...])` để đảm bảo tính nhất quán (không bị lưu nửa chừng nếu lỗi giữa đường).
6. **Ngân hàng câu hỏi phải đủ phong phú** trước khi launch — nên có bước seed dữ liệu mẫu lớp 1-5, Toán + Tiếng Việt, đủ 3 mức độ khó, đủ cả Cơ bản/Nâng cao, để demo wizard tạo đề không bị lỗi "không đủ câu hỏi".
7. **NextAuth + NestJS JWT phải đồng bộ thời gian sống token (expiry)** — nếu NestJS JWT hết hạn nhưng NextAuth session vẫn còn, cần xử lý refresh token đúng cách (Credentials Provider callback gọi `/auth/refresh` của NestJS) để tránh lỗi 401 đột ngột giữa lúc đang dùng.

---

## 9. HƯỚNG DẪN DÙNG TÀI LIỆU NÀY VỚI AI CODE

Khi đưa cho AI (Claude Code, Cursor, v.v.) để code dần, nên triển khai **theo từng module nhỏ**, không yêu cầu code toàn bộ 1 lần:

```
Ví dụ prompt con cho từng buổi làm việc:

"Dựa trên tài liệu đặc tả [đính kèm file này], hãy viết Prisma schema đầy đủ 
cho các model: User, Student, ParentStudent, Classroom, ClassroomStudent, 
Subject, Grade theo đúng cấu trúc đã mô tả ở mục 3, kèm migration."

"Tiếp theo, code exam-generator.service.ts trong NestJS theo logic pseudocode 
ở mục 4.1, xử lý đầy đủ trường hợp không đủ câu hỏi trong ngân hàng (throw 
InsufficientQuestionsException kèm message rõ thiếu bao nhiêu câu loại nào), 
viết kèm unit test bằng Jest."

"Code component Next.js exam-wizard.tsx và 6 step con theo mô tả ở mục 4.1 và 
cấu trúc thư mục ở mục 2, dùng Zustand để giữ state qua các bước, TailwindCSS 
để style theo dạng Stepper ngang, đánh dấu rõ component nào là Client Component."
```

Nên giữ nguyên file này làm "nguồn sự thật" (source of truth) xuyên suốt dự án, cập nhật lại mục nào thay đổi khi yêu cầu thực tế phát sinh thêm.

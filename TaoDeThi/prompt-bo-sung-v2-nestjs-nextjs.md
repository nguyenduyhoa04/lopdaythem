# PROMPT BỔ SUNG (v2): Mở Rộng Hệ Thống Tạo Đề Thi & Quản Lý Học Tập Tiểu Học
## (Stack: NestJS + PostgreSQL + Next.js — nối tiếp tài liệu gốc `prompt-website-tao-de-thi-nestjs-nextjs.md`)

> Tài liệu này **bổ sung và mở rộng** tài liệu đặc tả gốc, không thay thế. Đánh số mục tiếp nối từ mục 10 để dùng song song với file gốc khi đưa cho AI code. Mọi tên bảng/field/enum đã có ở file gốc (mục 1-9) được giữ nguyên; các thay đổi (ALTER) hoặc bảng mới đều ghi rõ là **mở rộng từ schema cũ**.

---

## 10. PHÂN LOẠI ĐỀ THI: THEO BÀI HỌC HOẶC THEO KỲ HỌC

### 10.1. Mô tả nghiệp vụ

Sau bước **chọn Lớp + Môn** trong Wizard tạo đề (Bước 2 ở mục 4.1 file gốc), thêm **Bước 2.5 mới**: chọn đề thi được tạo theo **Bài học** hay theo **Kỳ học**.

```
[Bước 2] Chọn lớp + môn  (giữ nguyên như file gốc)
        ↓
[Bước 2.5 - MỚI] Chọn phạm vi đề thi
   ○ Theo Bài học     ○ Theo Kỳ học
        ↓
   ┌─── Nếu chọn "Theo Bài học" ───┐    ┌─── Nếu chọn "Theo Kỳ học" ───┐
   │ Hiện danh sách Bài học        │    │ Chọn 1 trong 5:                │
   │ thuộc Lớp + Môn đã chọn        │    │  ○ Giữa kỳ 1                   │
   │ (vd: "Bài 5: Phép cộng có nhớ")│    │  ○ Cuối kỳ 1                   │
   │ → chọn 1 hoặc nhiều bài học     │    │  ○ Giữa kỳ 2                   │
   └────────────────────────────────┘    │  ○ Cuối kỳ 2                   │
                                          │  ○ Cả năm học                  │
                                          └────────────────────────────────┘
        ↓
[Bước 3] Chọn độ khó  (giữ nguyên như file gốc)
        ↓
... (tiếp tục các bước 4, 5, 6 giữ nguyên như file gốc)
```

**Nguyên tắc lọc câu hỏi (Question Bank Filter):**
- Nếu chọn **Theo Bài học**: hệ thống chỉ random câu hỏi có `lessonId` thuộc danh sách bài học đã chọn.
- Nếu chọn **Theo Kỳ học**: hệ thống chỉ random câu hỏi có `examPeriodScope` khớp với kỳ đã chọn (xem giải thích `examPeriodScope` ở mục 10.2 — đây chính là "trường để phân biệt câu hỏi được sắp xếp ở kỳ nào" theo yêu cầu).
- Một câu hỏi **có thể vừa gắn 1 Bài học cụ thể, vừa đánh dấu thuộc 1 hoặc nhiều Kỳ học** (đã xác nhận: 1 câu hỏi dùng được cho cả 2 luồng tạo đề) — xem quan hệ many-to-many ở `QuestionExamPeriod` trong mục 10.2.

### 10.2. Mở rộng Database (Prisma Schema)

**Bảng mới: `Lesson` (Bài học)** — gắn với Lớp + Môn, dùng để chia chương trình học thành các bài cụ thể.

```prisma
model Lesson {
  id         String   @id @default(uuid())
  subjectId  String
  gradeId    String
  topicId    String?           // liên kết tùy chọn tới Topic (chương/chủ đề) đã có ở file gốc
  name       String             // VD: "Bài 5: Phép cộng có nhớ trong phạm vi 100"
  orderNo    Int                // thứ tự bài trong chương trình học, dùng để sắp xếp danh sách
  description String?
  createdAt  DateTime @default(now())

  subject   Subject @relation(fields: [subjectId], references: [id])
  grade     Grade   @relation(fields: [gradeId], references: [id])
  topic     Topic?  @relation(fields: [topicId], references: [id])
  questions Question[]
}
```

**Enum mới: `ExamPeriod`** — đại diện cho "kho câu hỏi của kỳ" như yêu cầu, dùng để phân biệt câu hỏi thuộc kỳ nào.

```prisma
enum ExamPeriod {
  GIUA_KI_1
  CUOI_KI_1
  GIUA_KI_2
  CUOI_KI_2
  CA_NAM
}
```

**Bảng mới: `QuestionExamPeriod`** — quan hệ nhiều-nhiều giữa `Question` và `ExamPeriod`, vì 1 câu hỏi có thể dùng cho nhiều kỳ (vd: câu ôn tập "Cả năm" có thể cũng hợp lệ dùng lại ở "Cuối kỳ 2").

```prisma
model QuestionExamPeriod {
  id         String     @id @default(uuid())
  questionId String
  period     ExamPeriod

  question Question @relation(fields: [questionId], references: [id])

  @@unique([questionId, period])
}
```

**Sửa bảng `Question` đã có ở file gốc (ALTER — thêm field, KHÔNG xóa field cũ):**

```prisma
model Question {
  // ... toàn bộ field cũ giữ nguyên: id, topicId, gradeId, subjectId, type,
  //     difficulty, examCategory, content, answerText, score, createdById

  lessonId String?   // [MỚI] liên kết tới Lesson — null nếu câu hỏi chỉ dùng cho đề theo Kỳ, không thuộc bài cụ thể

  lesson           Lesson?               @relation(fields: [lessonId], references: [id])
  examPeriods      QuestionExamPeriod[]  // [MỚI] danh sách kỳ học câu hỏi này áp dụng được
  // ... các relation cũ giữ nguyên: topic, createdBy, options, examQuestions
}
```

**Sửa bảng `Exam` đã có ở file gốc (ALTER — thêm field để lưu lại đề được tạo theo phạm vi gì):**

```prisma
model Exam {
  // ... toàn bộ field cũ giữ nguyên

  scopeType  ExamScopeType   // [MỚI] LESSON | PERIOD — đề này tạo theo Bài học hay theo Kỳ
  examPeriod ExamPeriod?     // [MỚI] chỉ có giá trị nếu scopeType = PERIOD

  examLessons ExamLesson[]   // [MỚI] nếu scopeType = LESSON, đề có thể gồm nhiều bài học
}

enum ExamScopeType {
  LESSON
  PERIOD
}

model ExamLesson {
  id       String @id @default(uuid())
  examId   String
  lessonId String

  exam   Exam   @relation(fields: [examId], references: [id])
  lesson Lesson @relation(fields: [lessonId], references: [id])

  @@unique([examId, lessonId])
}
```

> **Lưu ý cho AI khi migrate:** Vì `Question.lessonId` là optional (`String?`) và `QuestionExamPeriod` là bảng quan hệ riêng (không phải field trực tiếp trên `Question`), việc thêm các field/bảng này **không phá vỡ dữ liệu Question đã seed từ Bước 1** — câu hỏi cũ vẫn hợp lệ, chỉ là chưa gắn `lessonId`/`examPeriods` (sẽ cần chạy 1 script gán bổ sung nếu muốn dữ liệu cũ dùng được ngay cho 2 luồng mới).

### 10.3. API bổ sung

- `GET /lessons?subjectId=&gradeId=` — danh sách bài học theo lớp + môn, sắp xếp theo `orderNo`, dùng cho Bước 2.5 khi chọn "Theo Bài học"
- Mở rộng `POST /exams/preview` và `POST /exams` (đã có ở file gốc): body `GenerateExamDto` thêm 2 field:
  - `scopeType: 'LESSON' | 'PERIOD'`
  - `lessonIds?: string[]` (bắt buộc nếu `scopeType = LESSON`) **hoặc** `examPeriod?: ExamPeriod` (bắt buộc nếu `scopeType = PERIOD`)
- Mở rộng `exam-generator.service.ts`: thêm điều kiện `where` lọc theo `lessonId IN (...)` hoặc `examPeriods.some({ period })` tùy `scopeType`, validate đủ số câu giống logic `InsufficientQuestionsException` đã có ở file gốc mục 4.1.
- CRUD `Lesson` cho giáo viên/admin: `POST /lessons`, `PATCH /lessons/:id`, `DELETE /lessons/:id` — quản lý chương trình bài học theo lớp/môn.

### 10.4. Trang liên quan cần cập nhật (Next.js)

| Trang | Cập nhật |
|---|---|
| `app/(teacher)/exams/create/page.tsx` (Wizard) | Thêm `step-2.5-scope-type.tsx` (chọn Bài học/Kỳ học) ngay sau bước chọn lớp+môn |
| Component mới `components/exam-wizard/step-2.5-scope-type.tsx` | Hiện 2 lựa chọn; nếu "Bài học" → load `GET /lessons` hiện multi-select; nếu "Kỳ học" → hiện radio 5 lựa chọn (Giữa kỳ 1...Cả năm) |
| `stores/exam-wizard-store.ts` | Thêm state `scopeType`, `lessonIds`, `examPeriod` |
| Trang quản lý ngân hàng câu hỏi (giáo viên/admin) | Form tạo/sửa câu hỏi thêm: chọn `Lesson` (dropdown theo lớp+môn đã chọn) + multi-checkbox chọn `ExamPeriod` áp dụng |
| **Mới**: `app/(teacher)/lessons/page.tsx` | CRUD danh sách bài học theo từng lớp/môn, sắp xếp theo `orderNo` (kéo-thả để đổi thứ tự nếu có thời gian, không bắt buộc MVP) |

---

## 11. TRANG CHỦ (LANDING PAGE) & CÁC LUỒNG LIÊN QUAN

### 11.1. Mô tả nghiệp vụ

Trang chủ (`app/page.tsx`, public, chưa cần đăng nhập) là điểm vào chính, gồm các khối:

1. **Đăng ký học (Phụ huynh đăng ký lịch học cho con)** — form/CTA dẫn tới luồng đăng ký, nếu chưa có tài khoản thì điều hướng sang trang đăng ký trước (mục 12), nếu đã đăng nhập thì vào thẳng luồng "Đăng ký lịch học mới" (tạo `EnrollmentRequest`, xem mục 11.2).
2. **Xem lịch học / ca học** — bảng ca học công khai (các lớp đang mở, giờ học, môn, lớp) để phụ huynh tham khảo trước khi đăng ký.
3. **Cửa hàng bài giảng + PPT + video AI** — đã xác nhận: đây là nơi **giáo viên upload bài giảng/PPT/video có sẵn để bán hoặc chia sẻ cho phụ huynh/học sinh** (không phải AI tự sinh nội dung). "video AI" trong yêu cầu hiểu là **video bài giảng có thể được giáo viên tạo bằng công cụ AI dựng video bên ngoài rồi upload vào hệ thống**, không phải tính năng tự sinh video trong app này.

### 11.2. Mở rộng Database

```prisma
enum EnrollmentStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model EnrollmentRequest {
  id           String           @id @default(uuid())
  parentUserId String
  studentId    String
  classroomId  String
  status       EnrollmentStatus @default(PENDING)
  note         String?
  createdAt    DateTime         @default(now())
  reviewedAt   DateTime?
  reviewedById String?           // giáo viên/admin duyệt

  parent    User      @relation(fields: [parentUserId], references: [id])
  student   Student   @relation(fields: [studentId], references: [id])
  classroom Classroom @relation(fields: [classroomId], references: [id])
}

enum MaterialType {
  SLIDE_PPT
  VIDEO
  DOCUMENT
}

enum MaterialAccessType {
  FREE
  PAID
}

model LearningMaterial {
  id           String              @id @default(uuid())
  teacherId    String
  title        String
  description  String?
  type         MaterialType
  subjectId    String
  gradeId      String
  fileUrl      String              // đường dẫn file PPT/video/document trên storage
  thumbnailUrl String?
  accessType   MaterialAccessType  @default(FREE)
  price        Decimal?            // null nếu FREE
  createdAt    DateTime            @default(now())

  teacher  User     @relation(fields: [teacherId], references: [id])
  subject  Subject  @relation(fields: [subjectId], references: [id])
  grade    Grade    @relation(fields: [gradeId], references: [id])
  purchases MaterialPurchase[]
}

model MaterialPurchase {
  id          String   @id @default(uuid())
  materialId  String
  parentUserId String
  purchasedAt DateTime @default(now())
  pricePaid   Decimal?

  material LearningMaterial @relation(fields: [materialId], references: [id])
  parent   User             @relation(fields: [parentUserId], references: [id])

  @@unique([materialId, parentUserId])
}
```

> **Ghi chú phạm vi MVP:** Thanh toán thật (`pricePaid`, cổng thanh toán) thuộc Giai đoạn 3 theo roadmap file gốc (mục 7). Ở các bước triển khai gần, `MaterialPurchase` có thể tạo thủ công (giáo viên đánh dấu "đã thanh toán offline") — chưa cần tích hợp cổng thanh toán thật.

### 11.3. API bổ sung

- `GET /classrooms/public` — danh sách lớp/ca học công khai (không cần đăng nhập) để hiện ở trang chủ
- `POST /enrollment-requests` — phụ huynh gửi yêu cầu đăng ký lịch học cho con (cần đăng nhập)
- `GET /enrollment-requests?status=` — giáo viên/admin xem danh sách yêu cầu chờ duyệt
- `PATCH /enrollment-requests/:id/approve` / `PATCH /enrollment-requests/:id/reject`
- `GET /materials?subjectId=&gradeId=&type=` — danh sách bài giảng/PPT/video (cửa hàng), public xem được danh sách + preview, nhưng `fileUrl` chỉ trả về đầy đủ nếu đã `MaterialPurchase` (hoặc `accessType = FREE`)
- `POST /materials` — giáo viên upload bài giảng mới
- `POST /materials/:id/purchase` — phụ huynh "mua"/nhận tài liệu (MVP: tạo `MaterialPurchase` ngay, chưa cần cổng thanh toán)

### 11.4. Trang liên quan (Next.js)

| Trang | Nội dung |
|---|---|
| `app/page.tsx` | Landing page public: Hero section, khối "Đăng ký học", khối "Lịch ca học" (bảng/lưới ca học công khai), khối "Cửa hàng bài giảng" (preview vài tài liệu nổi bật + nút "Xem tất cả") |
| `app/(public)/schedule-preview/page.tsx` | Trang xem đầy đủ lịch ca học công khai (filter theo lớp/môn) |
| `app/(public)/materials/page.tsx` | Cửa hàng bài giảng đầy đủ — danh sách + filter theo môn/lớp/loại (PPT/video/document) |
| `app/(public)/materials/[id]/page.tsx` | Chi tiết 1 tài liệu, nút "Mua/Nhận" (yêu cầu đăng nhập) |
| `app/(parent)/enrollment/page.tsx` | Phụ huynh tạo yêu cầu đăng ký lịch học mới cho con, xem trạng thái các yêu cầu đã gửi (Pending/Approved/Rejected) |
| `app/(teacher)/materials/upload/page.tsx` | Giáo viên upload bài giảng/PPT/video mới lên cửa hàng |
| `app/(teacher)/enrollment-requests/page.tsx` | Giáo viên/admin duyệt yêu cầu đăng ký học |

---

## 12. ĐĂNG KÝ TÀI KHOẢN ĐA VAI TRÒ (Học sinh, Phụ huynh)

### 12.1. Mô tả nghiệp vụ

Mở rộng `UserRole` (đã có ở file gốc: `ADMIN`, `TEACHER`, `PARENT`) thêm `STUDENT` — **đã xác nhận: Học sinh có tài khoản đăng nhập riêng**, liên kết 1-1 với bảng `Student` đã có.

**Trang đăng ký** (`app/(auth)/register/page.tsx`) cho người dùng tự đăng ký 2 vai trò: **Phụ huynh** hoặc **Học sinh** (chọn role ngay trong form đăng ký bằng radio/segmented control). `ADMIN` và `TEACHER` **không tự đăng ký công khai** — tài khoản này do Admin tạo thủ công qua trang quản lý (mục 13.1), tránh ai cũng tự tạo được tài khoản giáo viên.

### 12.2. Cơ chế chống trùng lặp hồ sơ Học sinh (đã xác nhận)

Nguyên tắc: **"Ai tạo Student trước thì là chủ hồ sơ, người tạo sau chỉ được LINK vào hồ sơ đã có"** — không cho phép tạo 2 bản ghi `Student` trùng cho cùng 1 đứa trẻ. Cụ thể:

- **Trường hợp A — Giáo viên/Admin tạo Student trước** (vì quản lý lớp, nhập danh sách học sinh vào lớp trước khi có phụ huynh dùng hệ thống):
  1. Giáo viên/Admin tạo `Student` (chưa có `userId` liên kết — học sinh chưa có tài khoản đăng nhập) và **đồng thời tạo sẵn 1 "lời mời liên kết"** (`InvitationCode` — xem schema dưới) gắn với `Student` đó, có thể kèm theo cả tạo `ParentStudent` placeholder nếu giáo viên đã biết thông tin phụ huynh.
  2. Khi Phụ huynh đăng ký tài khoản (vai trò PARENT) hoặc khi Học sinh tự đăng ký (vai trò STUDENT), họ nhập **mã mời** (`InvitationCode.code`) do giáo viên cung cấp (qua Zalo/giấy/email ngoài hệ thống) → hệ thống **LINK** tài khoản mới vào `Student` đã tồn tại sẵn, không tạo `Student` mới.

- **Trường hợp B — Phụ huynh tự đăng ký và tự thêm con trước** (chưa có giáo viên nào nhập học sinh này vào hệ thống):
  1. Phụ huynh đăng ký tài khoản (vai trò PARENT) → vào trang "Thêm con" (`app/(parent)/children/add/page.tsx`) → tạo `Student` mới (Phụ huynh trở thành **chủ hồ sơ** qua `ParentStudent.isOwner = true`, xem schema).
  2. Khi giáo viên sau đó muốn thêm học sinh này vào lớp, giáo viên **tìm kiếm** học sinh đã tồn tại (theo họ tên + ngày sinh, hoặc theo mã học sinh nếu phụ huynh cung cấp) thay vì tạo mới — UI nên có bước "Tìm học sinh đã có" trước khi cho phép "Tạo học sinh mới" ở phía giáo viên, để giảm thiểu trùng lặp (xem mục 13.2).

> **Lưu ý cho AI:** Vì validate trùng lặp 100% tự động (so khớp tên + ngày sinh) khó chính xác tuyệt đối (trùng tên, sai ngày sinh do nhập liệu), nên triển khai theo hướng **gợi ý cảnh báo** ("Đã tìm thấy 2 học sinh tên tương tự, bạn có chắc muốn tạo mới?") thay vì chặn cứng — quyết định cuối vẫn do người dùng (giáo viên/admin) xác nhận.

### 12.3. Mở rộng Database

**Sửa `UserRole` (ALTER enum — thêm giá trị mới, không xóa giá trị cũ):**
```prisma
enum UserRole {
  ADMIN
  TEACHER
  PARENT
  STUDENT   // [MỚI]
}
```

**Sửa bảng `Student` (ALTER — thêm liên kết tài khoản đăng nhập):**
```prisma
model Student {
  // ... toàn bộ field cũ giữ nguyên: id, fullName, dob, gradeId, createdByTeacherId

  userId String? @unique   // [MỚI] null nếu học sinh chưa có tài khoản đăng nhập riêng

  user User? @relation(fields: [userId], references: [id])  // [MỚI]
  // ... các relation cũ giữ nguyên: parentStudents, classroomStudents, examResults
}
```

**Sửa bảng `ParentStudent` (ALTER — thêm cờ đánh dấu chủ hồ sơ):**
```prisma
model ParentStudent {
  // ... field cũ giữ nguyên: id, parentUserId, studentId, relationship

  isOwner Boolean @default(false)  // [MỚI] true nếu phụ huynh này là người tạo hồ sơ Student đầu tiên
}
```

**Bảng mới: `InvitationCode`** — dùng cho cơ chế Link tài khoản vào hồ sơ Student đã có sẵn (Trường hợp A ở mục 12.2):

```prisma
enum InvitationTargetRole {
  PARENT
  STUDENT
}

model InvitationCode {
  id           String                @id @default(uuid())
  code         String                @unique   // mã mời ngắn, dễ đọc, VD: "HS-7F3K2A"
  studentId    String
  targetRole   InvitationTargetRole            // mã này dùng để link Phụ huynh hay link chính Học sinh
  createdById  String                          // giáo viên/admin tạo mã
  isUsed       Boolean               @default(false)
  usedByUserId String?
  expiresAt    DateTime?
  createdAt    DateTime              @default(now())

  student     Student @relation(fields: [studentId], references: [id])
  createdBy   User    @relation("InvitationCreator", fields: [createdById], references: [id])
  usedByUser  User?   @relation("InvitationUser", fields: [usedByUserId], references: [id])
}
```

### 12.4. API bổ sung

- `POST /auth/register` (mở rộng DTO `RegisterDto` đã có ở file gốc): thêm field `role: 'PARENT' | 'STUDENT'`, và `invitationCode?: string` (optional — nếu có, hệ thống link vào `Student` đã tồn tại thay vì để trống)
- `POST /students` (Phụ huynh tự thêm con — Trường hợp B): tạo `Student` mới + tự động tạo `ParentStudent { isOwner: true }`
- `POST /students/search?fullName=&dob=` (giáo viên/admin dùng để tìm học sinh đã có trước khi tạo mới — Trường hợp B bước 2)
- `POST /invitation-codes` (giáo viên/admin tạo mã mời gắn với 1 `Student` — Trường hợp A)
- `POST /invitation-codes/:code/redeem` (người dùng nhập mã mời để tự link tài khoản mình vào `Student` đã có)

### 12.5. Trang liên quan (Next.js)

| Trang | Nội dung |
|---|---|
| `app/(auth)/register/page.tsx` | Form đăng ký, có radio chọn role **Phụ huynh** / **Học sinh**, field "Mã mời" (optional, hiện tooltip giải thích "Nếu giáo viên đã cung cấp mã, nhập vào đây để liên kết đúng hồ sơ con/em bạn") |
| `app/(parent)/children/add/page.tsx` | Phụ huynh tự thêm con (Trường hợp B) |
| `app/(teacher)/students/page.tsx` | Danh sách học sinh do giáo viên quản lý, có nút "Tìm học sinh đã có" trước "Tạo học sinh mới", và nút "Tạo mã mời" cho từng học sinh để gửi phụ huynh |

---

## 13. TRANG CHỦ THEO VAI TRÒ (Role-Based Dashboards) — CHI TIẾT 4 ROLE

> Mục này mở rộng chi tiết cho mục 5 (Yêu cầu giao diện) của file gốc, vốn mới chỉ mô tả khái quát Dashboard giáo viên/phụ huynh. Dưới đây bổ sung đầy đủ 4 role: Admin, Giáo viên, Học sinh, Phụ huynh.

### 13.1. ADMIN — `app/(admin)/...`

Yêu cầu: **đầy đủ tính năng CRUD** cho toàn bộ entity quản trị.

| Trang | Chức năng CRUD |
|---|---|
| `app/(admin)/dashboard/page.tsx` | Tổng quan: số giáo viên, học sinh, phụ huynh, đề thi đã tạo, doanh thu cửa hàng (nếu có) |
| `app/(admin)/users/page.tsx` | CRUD tài khoản (tạo tài khoản Giáo viên mới — vì Teacher không tự đăng ký được theo mục 12.1, sửa/khóa tài khoản bất kỳ role) |
| `app/(admin)/students/page.tsx` | CRUD học sinh toàn hệ thống, xem `ParentStudent` liên kết |
| `app/(admin)/subjects-grades/page.tsx` | CRUD `Subject`, `Grade` |
| `app/(admin)/lessons/page.tsx` | CRUD `Lesson` toàn hệ thống (mục 10) |
| `app/(admin)/questions/page.tsx` | CRUD ngân hàng câu hỏi toàn hệ thống (duyệt câu hỏi do giáo viên đóng góp, nếu cần kiểm duyệt) |
| `app/(admin)/classrooms/page.tsx` | CRUD lớp học toàn hệ thống |
| `app/(admin)/materials/page.tsx` | CRUD/duyệt bài giảng cửa hàng (mục 11) |
| `app/(admin)/enrollment-requests/page.tsx` | Xem/duyệt toàn bộ yêu cầu đăng ký học (mục 11.3) |
| `app/(admin)/invitation-codes/page.tsx` | Xem/quản lý mã mời toàn hệ thống (mục 12) |

> Tất cả trang Admin dùng pattern chung: **DataTable** (sort, filter, pagination — có thể dùng TanStack Table) + **Modal/Drawer Form** (React Hook Form + Zod) cho Create/Edit, **Confirm Dialog** cho Delete. Nên tạo 1 component generic `components/admin/crud-table.tsx` tái dùng cho tất cả các trang CRUD này để tránh lặp code.

### 13.2. GIÁO VIÊN — `app/(teacher)/...`

Đã có ở file gốc: Dashboard, Tạo đề (Wizard), Danh sách đề, Scan chấm điểm, Lớp học, Lịch học. **Bổ sung thêm:**

| Trang mới | Chức năng |
|---|---|
| `app/(teacher)/exams/collected/page.tsx` | **"Thêm đề thi sưu tầm"** — giáo viên upload đề thi có sẵn (file PDF/Word từ nguồn ngoài) vào hệ thống làm tài liệu lưu trữ riêng, **không** đi qua Wizard sinh đề tự động. Lưu vào bảng mới `CollectedExam` (xem schema dưới), có thể gắn lớp/môn/mô tả để dễ tìm lại, KHÔNG cần chấm điểm tự động qua OMR (vì không có mã đề/layout chuẩn). |
| `app/(teacher)/exams/history/page.tsx` | **"Lịch sử đề đã tạo"** — tách riêng khỏi danh sách đề thường (đã có `app/(teacher)/exams/page.tsx` ở file gốc) để có view dạng timeline theo thời gian, filter theo lớp/học sinh đã làm đề đó |
| `app/(teacher)/grading/page.tsx` | **"Các bài chấm điểm của học sinh"** — tổng hợp toàn bộ `ExamResult` theo từng học sinh/lớp, khác với `scan/page.tsx` (vốn là màn hình quét trực tiếp) — đây là màn hình tra cứu lại kết quả đã chấm trước đó, cho sửa điểm tay nếu cần |
| `app/(teacher)/students/page.tsx` | (đã đề cập ở mục 12.5) — tìm/tạo học sinh, tạo mã mời |

**Schema mới cho "đề thi sưu tầm":**
```prisma
model CollectedExam {
  id          String   @id @default(uuid())
  teacherId   String
  title       String
  subjectId   String?
  gradeId     String?
  fileUrl     String           // file PDF/Word gốc được upload
  note        String?
  createdAt   DateTime @default(now())

  teacher User     @relation(fields: [teacherId], references: [id])
  subject Subject? @relation(fields: [subjectId], references: [id])
  grade   Grade?   @relation(fields: [gradeId], references: [id])
}
```

### 13.3. HỌC SINH — `app/(student)/...` (MỚI HOÀN TOÀN)

| Trang | Chức năng |
|---|---|
| `app/(student)/dashboard/page.tsx` | Tổng quan: điểm trung bình gần nhất, lịch học sắp tới, thông báo |
| `app/(student)/my-results/page.tsx` | **"Xem bài đã làm + kết quả"** — danh sách `ExamResult` của chính học sinh (query theo `studentId` lấy từ `Student.userId` đang đăng nhập), xem chi tiết từng câu đúng/sai |
| `app/(student)/mock-exam/page.tsx` | **"Thi thử"** — học sinh tự chọn Lớp (mặc định = lớp của mình)/Môn/Bài học hoặc Kỳ học → hệ thống tự sinh 1 đề trắc nghiệm ngẫu nhiên (tái dùng `ExamGeneratorService` đã có) → học sinh làm trực tiếp trên web (chọn đáp án bằng click, không cần in giấy/quét OMR) → chấm điểm ngay tại chỗ, lưu kết quả vào `ExamResult` với cờ `isMockExam: true` (cần thêm field này vào `ExamResult`, xem dưới) để phân biệt với bài thi thật chấm qua quét giấy |
| `app/(student)/schedule/page.tsx` | **"Lịch học của bản thân"** — lấy từ `ClassroomStudent` → `Classroom` → `Schedule`, giống logic phía Phụ huynh ở mục 4.4 file gốc nhưng filter theo chính học sinh đó |

**Sửa bảng `ExamResult` đã có ở file gốc (ALTER — thêm cờ phân biệt bài thi thử):**
```prisma
model ExamResult {
  // ... toàn bộ field cũ giữ nguyên

  isMockExam Boolean @default(false)  // [MỚI] true = học sinh tự làm online (thi thử), false = chấm qua quét giấy thật
}
```

> **Phân quyền:** Route trong `app/(student)/...` cần Guard kiểm tra `request.user.role === 'STUDENT'` **và** dữ liệu trả về luôn lọc theo `Student.userId = request.user.id` — học sinh chỉ xem được dữ liệu của chính mình, không truyền `studentId` tùy ý qua query param mà thiếu kiểm tra (tương tự logic `ParentOwnsStudentGuard` đã có ở file gốc mục 4.4, viết thêm 1 Guard `StudentOwnsResourceGuard` cùng nguyên lý).

### 13.4. PHỤ HUYNH — `app/(parent)/...`

Đã có ở file gốc: Dashboard, xem điểm/lịch sử bài thi, lịch học (mục 4.4). **Bổ sung thêm 4 trang theo đúng yêu cầu:**

| Trang mới | Chức năng |
|---|---|
| `app/(parent)/classroom-camera/page.tsx` | **"Xem camera lớp học"** — đã xác nhận: **CHƯA tích hợp camera thật ở giai đoạn này**, chỉ làm UI/placeholder. Thiết kế: khung video placeholder (ảnh tĩnh "Camera đang offline" hoặc icon), dropdown chọn lớp của con (nếu phụ huynh có nhiều con/nhiều lớp), text mô tả "Tính năng xem camera trực tiếp sẽ sớm ra mắt". Để sẵn cấu trúc component `components/parent-dashboard/classroom-camera-player.tsx` nhận prop `streamUrl?: string` (hiện chưa có giá trị thật) để dễ tích hợp RTSP/HLS thật ở giai đoạn sau mà không phải sửa lại layout trang. |
| `app/(parent)/children/[studentId]/schedule/page.tsx` | **"Lịch học của con"** — đã có tương đương ở file gốc (`app/(parent)/schedule/page.tsx`), ở đây tách rõ theo từng con cụ thể nếu phụ huynh có nhiều con (route theo `studentId`) |
| `app/(parent)/children/[studentId]/results/page.tsx` | **"Xem các bài làm của con"** — tương đương phần đã có ở file gốc mục 4.4 (`children/[studentId]/page.tsx`), đặt lại đúng route con để rõ ràng hơn khi có nhiều trang con (schedule, results, progress) |
| `app/(parent)/children/[studentId]/progress/page.tsx` | **"Xem độ tiến bộ của con"** — xem chi tiết ở mục 14 (Trang tiến trình học tập), dùng chung component với phía giáo viên |
| `app/(parent)/children/add/page.tsx` | (đã đề cập mục 12.5) — phụ huynh tự thêm con |

> **Điều hướng:** Nên có `app/(parent)/children/[studentId]/layout.tsx` dùng Tab/SubNav (Lịch học / Bài làm / Tiến bộ) để chuyển giữa 3 trang con cùng 1 học sinh mà không lặp lại header chọn-con ở mỗi trang.

---

## 14. TRANG TIẾN TRÌNH HỌC TẬP (Student Progress) — DÙNG CHUNG GIÁO VIÊN & PHỤ HUYNH

### 14.1. Mô tả nghiệp vụ

Một trang/component hiển thị **tiến trình phát triển của 1 học sinh theo thời gian**, dùng chung cho 2 phía:
- Giáo viên xem qua: `app/(teacher)/students/[studentId]/progress/page.tsx`
- Phụ huynh xem qua: `app/(parent)/children/[studentId]/progress/page.tsx` (đã nêu ở mục 13.4)

Cả 2 route gọi chung 1 API và tái dùng chung 1 component hiển thị (`components/progress/student-progress-view.tsx`), chỉ khác Guard phân quyền phía sau (Giáo viên cần là giáo viên của lớp học sinh đó đang học; Phụ huynh cần là `ParentStudent` của học sinh đó — tái dùng `ParentOwnsStudentGuard` đã có).

**Nội dung trang tiến trình gồm:**
1. **Biểu đồ điểm theo thời gian**, tách riêng theo từng Môn (Toán/Tiếng Việt) — line chart Recharts, có thể lọc theo khoảng thời gian
2. **Biểu đồ tỷ lệ đúng/sai theo độ khó** (Nhận biết/Thông hiểu/Vận dụng) — giúp thấy học sinh yếu ở mức độ nào
3. **Biểu đồ tỷ lệ đúng/sai theo Chủ đề/Bài học** (`Topic`/`Lesson`) — giúp thấy học sinh yếu phần kiến thức nào cụ thể (vd: "yếu phần Phép chia có dư")
4. **So sánh Thi thử vs Thi thật** (dùng cờ `isMockExam` ở mục 13.3) — xem học sinh có tự luyện thêm ở nhà (thi thử) hay không, và mức độ chênh lệch kết quả
5. **Nhận xét định kỳ** (optional, có thể để Giai đoạn 2): giáo viên có thể nhập nhận xét text ngắn gắn theo mốc thời gian, hiển thị dạng timeline bên dưới biểu đồ

### 14.2. API bổ sung

- `GET /students/:studentId/progress?subjectId=&from=&to=` — trả về dữ liệu tổng hợp cho toàn bộ 4 biểu đồ trên trong 1 response (tránh nhiều round-trip), cấu trúc gợi ý:
```json
{
  "success": true,
  "data": {
    "scoreTimeline": [{ "date": "...", "subjectId": "...", "score": 8.5, "isMockExam": false }],
    "difficultyBreakdown": [{ "difficulty": "NHAN_BIET", "correctRate": 0.92 }],
    "topicBreakdown": [{ "topicId": "...", "topicName": "...", "correctRate": 0.65 }],
    "mockVsRealComparison": { "mockAvgScore": 7.8, "realAvgScore": 8.1 }
  }
}
```
- Service `progress.service.ts` (module mới `modules/progress/`) tổng hợp dữ liệu từ `ExamResult` + `ExamResultDetail` + join qua `ExamQuestion` → `Question` → `Topic`/`Lesson`/`difficulty`.
- Guard riêng cho route này cần chấp nhận **cả 2 role** (Teacher hoặc Parent), khác với Guard cũ chỉ check 1 role — nên viết `StudentProgressAccessGuard` kiểm tra: nếu role = TEACHER thì check học sinh có thuộc lớp giáo viên dạy; nếu role = PARENT thì check `ParentStudent`; nếu role = STUDENT thì chỉ cho xem chính mình.

### 14.3. Trang/Component liên quan

| Vị trí | Nội dung |
|---|---|
| `components/progress/student-progress-view.tsx` | Component dùng chung, nhận prop `studentId`, tự gọi API, render 4 khối biểu đồ ở mục 14.1 |
| `app/(teacher)/students/[studentId]/progress/page.tsx` | Wrapper gọi component trên, phía giáo viên |
| `app/(parent)/children/[studentId]/progress/page.tsx` | Wrapper gọi component trên, phía phụ huynh (đã nêu mục 13.4) |
| `app/(student)/my-progress/page.tsx` | (Bổ sung hợp lý) — học sinh cũng nên tự xem được tiến trình của chính mình, dùng chung component, Guard chỉ cho xem `studentId` = chính mình |

---

## 15. CẬP NHẬT TỔNG HỢP CẤU TRÚC THƯ MỤC (Diff so với file gốc)

> Chỉ liệt kê phần **thêm mới** so với cấu trúc đã có ở mục 2 file gốc — không lặp lại các thư mục không đổi.

```
apps/
├── api/src/modules/
│   ├── lessons/                          # [MỚI] mục 10
│   ├── enrollment-requests/               # [MỚI] mục 11
│   ├── materials/                         # [MỚI] mục 11 (cửa hàng bài giảng)
│   ├── invitation-codes/                  # [MỚI] mục 12
│   ├── collected-exams/                   # [MỚI] mục 13.2
│   ├── progress/                          # [MỚI] mục 14
│   └── exams/
│       └── mock-exam.service.ts           # [MỚI] mục 13.3 (thi thử online, tái dùng ExamGeneratorService)
│
└── web/app/
    ├── (public)/                          # [MỚI] route group cho landing page + nội dung public
    │   ├── schedule-preview/page.tsx
    │   └── materials/
    │       ├── page.tsx
    │       └── [id]/page.tsx
    ├── (admin)/                           # [MỚI] toàn bộ route group Admin — mục 13.1
    │   ├── dashboard/page.tsx
    │   ├── users/page.tsx
    │   ├── students/page.tsx
    │   ├── subjects-grades/page.tsx
    │   ├── lessons/page.tsx
    │   ├── questions/page.tsx
    │   ├── classrooms/page.tsx
    │   ├── materials/page.tsx
    │   ├── enrollment-requests/page.tsx
    │   └── invitation-codes/page.tsx
    ├── (student)/                         # [MỚI] toàn bộ route group Học sinh — mục 13.3
    │   ├── dashboard/page.tsx
    │   ├── my-results/page.tsx
    │   ├── mock-exam/page.tsx
    │   ├── my-progress/page.tsx
    │   └── schedule/page.tsx
    ├── (teacher)/
    │   ├── exams/
    │   │   ├── collected/page.tsx         # [MỚI] mục 13.2
    │   │   └── history/page.tsx           # [MỚI] mục 13.2
    │   ├── grading/page.tsx               # [MỚI] mục 13.2
    │   ├── students/
    │   │   └── [studentId]/progress/page.tsx  # [MỚI] mục 14
    │   ├── lessons/page.tsx               # [MỚI] mục 10.4
    │   ├── materials/upload/page.tsx      # [MỚI] mục 11.4
    │   └── enrollment-requests/page.tsx   # [MỚI] mục 11.4
    └── (parent)/
        ├── children/
        │   ├── add/page.tsx               # [MỚI] mục 12.5
        │   └── [studentId]/
        │       ├── layout.tsx             # [MỚI] mục 13.4 (sub-nav)
        │       ├── schedule/page.tsx
        │       ├── results/page.tsx
        │       └── progress/page.tsx      # [MỚI] mục 14
        ├── classroom-camera/page.tsx      # [MỚI] mục 13.4 (placeholder)
        └── enrollment/page.tsx            # [MỚI] mục 11.4

components/
├── admin/
│   └── crud-table.tsx                     # [MỚI] component generic dùng cho toàn bộ trang Admin
├── progress/
│   └── student-progress-view.tsx          # [MỚI] mục 14
├── exam-wizard/
│   └── step-2.5-scope-type.tsx            # [MỚI] mục 10
└── parent-dashboard/
    └── classroom-camera-player.tsx        # [MỚI] mục 13.4 (placeholder component)
```

---

## 16. TỔNG HỢP RỦI RO & LƯU Ý KỸ THUẬT BỔ SUNG

1. **Độ phức tạp phân quyền tăng lên đáng kể** với 4 role thay vì 3 — khuyến nghị viết bộ test E2E riêng cho từng Guard (`ParentOwnsStudentGuard`, `StudentOwnsResourceGuard`, `StudentProgressAccessGuard`) trước khi triển khai UI, để chắc chắn không bị lộ dữ liệu chéo giữa các phụ huynh/học sinh khác nhau.
2. **Cơ chế chống trùng lặp Student (mục 12.2)** không thể tự động hóa hoàn toàn — cần chấp nhận một phần phải xử lý thủ công (giáo viên/admin merge hồ sơ trùng nếu phát sinh). Có thể để 1 trang Admin riêng "Merge học sinh trùng" ở Giai đoạn 2 nếu thực tế phát sinh nhiều.
3. **Trang "Thi thử" (mục 13.3)** dùng lại `ExamGeneratorService` đã có nhưng đầu ra khác (học sinh làm trực tiếp trên web, không in giấy) — cần tách rõ luồng nộp bài: `POST /mock-exam/:examId/submit` nhận `{ questionId, selectedOptionLabel }[]` từ phía client, chấm điểm ngay (so sánh với `QuestionOption.isCorrect`), không đi qua luồng OMR/quét ảnh.
4. **"Cửa hàng bài giảng"** nếu sau này thực sự cần thanh toán thật, cần tách riêng hẳn 1 bước tích hợp cổng thanh toán (VNPay/Momo/Stripe) — hiện tại schema `MaterialPurchase.pricePaid` chỉ là ghi nhận, chưa xử lý giao dịch thật.
5. **Trang Camera lớp học** chỉ là placeholder ở giai đoạn này theo xác nhận — khi triển khai thật ở tương lai cần khảo sát kỹ giao thức camera thực tế tại lớp học (RTSP/ONVIF) trước khi chọn công nghệ stream (HLS.js, WebRTC) cho Next.js, vì đây là quyết định kỹ thuật ảnh hưởng lớn tới hạ tầng (cần media server riêng như MediaMTX hoặc Ant Media Server), không nằm trong phạm vi tài liệu này.

---

## 17. HƯỚNG DẪN DÙNG TÀI LIỆU BỔ SUNG NÀY VỚI AI CODE

Giữ nguyên nguyên tắc ở mục 9 file gốc: **chia nhỏ theo module, không code toàn bộ 1 lần**. Vì tài liệu này phụ thuộc vào schema đã có ở file gốc, nên đưa AI **cả 2 file cùng lúc** khi bắt đầu mỗi module mới. Gợi ý thứ tự triển khai hợp lý cho các phần bổ sung này (sau khi đã hoàn thành Auth + Wizard cơ bản theo roadmap file gốc):

```
Thứ tự đề xuất:
1. Migrate schema mở rộng (mục 10, 11, 12, 13.2, 13.3, 14) — chạy 1 lần, review kỹ trước khi áp dụng
   lên dữ liệu đã có từ Bước 1.
2. Module Lesson + cập nhật Wizard (mục 10) — vì đây là điều kiện để các module sau có dữ liệu dùng.
3. Module Auth mở rộng role STUDENT + InvitationCode (mục 12) — làm trước Dashboard theo role.
4. 4 Dashboard theo role (mục 13) — có thể làm song song nếu nhiều người, vì độc lập nhau
   (chỉ chia sẻ chung crud-table.tsx và Guard).
5. Module Progress (mục 14) — làm sau cùng vì phụ thuộc dữ liệu ExamResult/ExamResultDetail
   đã đủ phong phú để có gì hiển thị.
6. Trang chủ + Cửa hàng bài giảng + Enrollment (mục 11) — có thể làm độc lập, song song bất kỳ lúc nào
   vì ít phụ thuộc các module khác.

Ví dụ prompt con cho từng buổi làm việc:

"Dựa trên tài liệu đặc tả gốc [file 1] và tài liệu bổ sung [file 2] mục 10, hãy viết migration
Prisma ALTER cho các thay đổi: thêm model Lesson, enum ExamPeriod, model QuestionExamPeriod,
thêm field lessonId vào Question, thêm field scopeType/examPeriod vào Exam, thêm model ExamLesson.
Đảm bảo không phá vỡ dữ liệu Question/Exam đã seed từ trước."

"Tiếp theo, code modules/lessons/ (controller, service, dto) theo API đã mô tả ở mục 10.3,
và component step-2.5-scope-type.tsx theo mô tả ở mục 10.4."
```

# 🚀 Hướng Dẫn Sử Dụng: Thêm Câu Hỏi từ File/Link/Text với AI

## 📋 Tính Năng

Chức năng này cho phép giáo viên thêm câu hỏi vào cơ sở dữ liệu bằng cách:
1. **Upload File Word (.docx)** - Tự động nhận diện nội dung từ file
2. **Upload Ảnh (JPG, PNG)** - OCR (Optical Character Recognition) nhận diện text từ ảnh scan
3. **Nhập URL** - Lấy nội dung đề thi từ link web
4. **Dán Text** - Nhập trực tiếp nội dung đề thi

**AI sẽ tự động:**
- Nhận diện từng câu hỏi
- Xác định loại câu (Trắc nghiệm/Tự luận)
- Phân loại độ khó (Nhận biết/Thông hiểu/Vận dụng)
- Trích xuất câu trả lời và đáp án

---

## 🎯 Các Bước Sử Dụng

### **Bước 1: Vào Trang Thêm Câu Hỏi**

1. Đăng nhập bằng tài khoản **Giáo viên**
2. Vào **Dashboard** → Tìm card **"Import từ file/URL"**
3. Hoặc truy cập trực tiếp: `/teacher/questions/add`

### **Bước 2: Chọn Môn Học & Khối Lớp**

- Chọn **Môn Học** từ dropdown (Toán, Tiếng Anh, v.v.)
- Chọn **Khối Lớp** từ dropdown (Lớp 1, 2, 3, v.v.)

### **Bước 3: Chọn Cách Thêm Câu Hỏi**

#### **Cách 1: Upload File Word**
```
1. Nhấn tab "Upload file"
2. Kéo file .docx vào hoặc nhấn "Chọn file"
3. Đợi AI xử lý (5-30 giây tùy kích thước file)
```

#### **Cách 2: Upload Ảnh**
```
1. Nhấn tab "Upload file"
2. Kéo ảnh scan (.jpg, .png) hoặc nhấn "Chọn file"
3. OCR sẽ nhận diện text từ ảnh
```

#### **Cách 3: Nhập URL**
```
1. Nhấn tab "Nhập URL"
2. Paste link: https://example.com/exam
3. Hệ thống lấy nội dung từ trang web
4. AI phân tích nội dung
```

#### **Cách 4: Dán Text**
```
1. Nhấn tab "Dán text"
2. Copy-paste nội dung đề thi vào ô text
3. Nhấn "Phân tích đề"
```

### **Bước 4: Xem Lại & Chỉnh Sửa Câu Hỏi**

AI sẽ hiển thị danh sách câu hỏi được nhận diện:

- **Xem chi tiết:** Mỗi câu sẽ hiển thị:
  - Nội dung câu hỏi
  - Loại câu (Trắc nghiệm/Tự luận)
  - Độ khó (Nhận biết/Thông hiểu/Vận dụng)
  - Các tùy chọn (A, B, C, D) và đáp án đúng
  - Bài giải (nếu là tự luận)

- **Sửa câu hỏi:** 
  - Nhấn nút **"Sửa"** trên mỗi câu
  - Chỉnh sửa nội dung, đáp án, bài giải
  - Nhấn **"Lưu"** hoặc **"Hủy"**

- **Xóa câu hỏi:**
  - Nhấn nút **"Xóa"** trên mỗi câu
  - Câu sẽ bị loại khỏi danh sách

### **Bước 5: Lưu Vào Cơ Sở Dữ Liệu**

```
1. Sau khi hoàn chỉnh tất cả câu hỏi
2. Nhấn nút "Lưu N câu hỏi" ở cuối trang
3. Chờ hoàn tất (~2-5 giây)
4. Nhận thông báo "Lưu thành công!"
```

---

## 📝 Định Dạng Nội Dung Đề Thi

Để AI nhận diện chính xác, hãy định dạng đề thi như sau:

### **Trắc Nghiệm:**
```
Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Hồ Chí Minh
C. Đà Nẵng
D. Cần Thơ
Đáp án: A

Câu 2: 2 + 2 = ?
A. 3
B. 4
C. 5
D. 6
Đáp án: B
```

### **Tự Luận:**
```
Câu 1: Viết một bài văn về "Mùa xuân"
Bài giải: 
Mùa xuân là mùa thứ nhất trong năm... [bài giải đầy đủ]

Câu 2: Giải phương trình: x + 5 = 10
Bài giải:
x + 5 = 10
x = 10 - 5
x = 5
```

---

## 🔧 Cấu Hình (Nhà Phát Triển)

### **Yêu Cầu Cấu Hình .env:**

Thêm vào `apps/api/.env`:
```bash
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxx"
```

Lấy API Key từ: https://console.anthropic.com/

### **Các Gói Được Cài:**
- `mammoth` - Đọc file Word
- `tesseract.js` - OCR ảnh
- `@anthropic-ai/sdk` - Claude AI API
- `axios` - HTTP requests

### **Backend Endpoints:**

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| POST | `/questions/extract-from-file` | Upload file Word/ảnh |
| POST | `/questions/extract-from-url` | Lấy từ URL |
| POST | `/questions/parse-text` | Phân tích text |
| POST | `/questions/save-extracted` | Lưu câu hỏi vào DB |

---

## ⚙️ Ghi Chú Kỹ Thuật

### **Luồng Xử Lý:**
```
1. Frontend: User chọn file/URL/text
        ↓
2. Backend: Extract text (Word → mammoth, Image → Tesseract, URL → axios)
        ↓
3. Claude AI: Phân tích nội dung → Tạo structured JSON
        ↓
4. Frontend: Hiển thị preview, cho phép sửa
        ↓
5. Backend: Lưu vào DB (Prisma + PostgreSQL)
```

### **Loại Câu Hỏi:**
- `TRAC_NGHIEM` - Trắc nghiệm (4 tùy chọn)
- `TU_LUAN` - Tự luận (có bài giải)

### **Độ Khó:**
- `NHAN_BIET` - Nhận biết
- `THONG_HIEU` - Thông hiểu
- `VAN_DUNG` - Vận dụng

### **Danh Mục Đề:**
- `CO_BAN` - Cơ bản
- `NANG_CAO` - Nâng cao

---

## 🐛 Xử Lý Lỗi

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|----------|
| "File không hợp lệ" | File không phải .docx hoặc ảnh | Chọn file đúng định dạng |
| "Không thể lấy URL" | URL không hợp lệ | Kiểm tra URL hoặc thử link khác |
| "Không phân tích được" | Nội dung quá phức tạp | Định dạng lại nội dung |
| "Lỗi lưu DB" | Lỗi kết nối DB | Kiểm tra kết nối PostgreSQL |

---

## 💡 Mẹo Sử Dụng

1. **Để có kết quả tốt nhất:**
   - Ảnh scan nên rõ nét, không bị đen/mờ
   - File Word nên có định dạng rõ ràng (không có lỗi font)
   - Text copy từ PDF nên được format lại

2. **Kiểm tra sau mỗi import:**
   - Xem lại tất cả câu hỏi trước khi lưu
   - Sửa những câu AI nhận diện sai
   - Xóa câu hỏi không cần thiết

3. **Sử dụng hiệu quả:**
   - Import từng bộ đề 20-50 câu (tránh quá dài)
   - Lưu theo môn học, khối lớp riêng biệt
   - Có thể import liên tiếp nhiều đề

---

## 📞 Liên Hệ Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra lại nội dung đề (định dạng)
2. Thử upload file khác
3. Liên hệ nhà phát triển nếu lỗi vẫn xảy ra

---

**Phiên bản:** 1.0  
**Cập nhật:** 2026-06-21

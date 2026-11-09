# Thiệp Điện Tử AI – Tri Ân Ngày Nhà Giáo Việt Nam 20/11 🎓💐

> **Ứng dụng Full-stack tạo thiệp chúc mừng 20/11 thông minh tích hợp Google Gemini AI, xuất thiệp Canvas HD 1080×1440 và gửi email trực tiếp qua Gmail API / SMTP.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20GenAI-gemini--3.8--flash-orange.svg)](https://ai.google.dev/)

---

## 🌟 Điểm Nổi Bật & Tính Năng Chính

1. **Sinh Lời Chúc AI Với Google Gemini 3.8 Flash (`@google/genai`)**:
   - Tự động sinh nội dung thiệp cá nhân hóa dựa trên: Tên thầy/cô, môn học, lớp, tên học sinh và kỷ niệm riêng.
   - 5 phong cách giọng điệu đa dạng: *Cảm động, Hài hước, Trang trọng, Thơ lục bát, Tuổi học trò*.
   - Bộ sinh dự phòng thông minh (Curated Fallback Engine) đảm bảo hoạt động 100% ngay cả khi chưa có API key.

2. **Vẽ & Kết Xuất Thiệp Siêu Nét Bằng HTML5 Canvas (1080 × 1440 HD)**:
   - Vẽ trực tiếp chữ tiếng Việt có dấu với độ phân giải cao, tránh hoàn toàn lỗi méo chữ hay biến dạng font khi dùng AI sinh ảnh.
   - 4 chủ đề giao diện truyền thống:
     - 🌿 *Bảng Đen Phấn Trắng* (Kinh điển)
     - 📜 *Trang Sách Cổ Điển* (Vintage Kraft)
     - 🌸 *Hoa Sen & Thư Pháp* (Tôn nghiêm mạ vàng)
     - ☀️ *Ánh Nắng Sân Trường* (Ấm áp san hô)
   - Cho phép sửa trực tiếp tiêu đề và lời chúc trước khi xuất ảnh.
   - Tải về tệp ảnh định dạng PNG chuẩn tỉ lệ 3:4.

3. **Hai Phương Thức Gửi Email Tri Ân Kèm Thiệp**:
   - **Tab 1: Gửi bằng Gmail Của Tôi (OAuth 2.0)**:
     - Tích hợp Google Workspace Gmail API (`https://www.googleapis.com/auth/gmail.send`).
     - Email xuất phát từ chính tài khoản Gmail của bạn; lưu trong thư mục *Sent* của Gmail.
   - **Tab 2: Gửi qua Máy chủ SMTP / Hộp thư Demo Ethereal**:
     - Cho phép bất kỳ ai gửi thư mà không bị giới hạn Google Cloud Test Users.
     - Hỗ trợ gắn `replyTo` về email học sinh để thầy/cô bấm Reply phản hồi trực tiếp.
     - Tích hợp **Hộp thư kiểm thử trực tuyến (Ethereal Preview URL)**: Bấm vào xem ngay email mẫu và ảnh thiệp thực tế.
     - Tùy chọn gửi thật tức thì với Mật khẩu ứng dụng Gmail (App Password 16 ký tự).

4. **Bảo Mật Quyền Riêng Tư (Privacy First & Zero-Log)**:
   - Nghiêm cấm ghi log địa chỉ email của người nhận và người gửi trên server.
   - Bắt buộc xác nhận đồng ý gửi từ người dùng trước khi gọi API.

5. **Tích Hợp Sẵn Mô Hình Chatbot Viber**:
   - Cung cấp kiến trúc và mã nguồn Webhook Node.js để kết nối Bot Viber: nhận tin nhắn học sinh, gọi Gemini sinh thiệp và gửi ảnh ngược lại qua Viber.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```bash
thiep-dien-tu-20-11/
├── README.md                      # Tài liệu dự án
├── .env.example                   # Mẫu cấu hình biến môi trường
├── .gitignore                     # Bỏ qua node_modules, .env, dist
├── package.json                   # Dependencies & Scripts
├── tsconfig.json                  # Cấu hình TypeScript
├── vite.config.ts                 # Cấu hình Vite & TailwindCSS v4
├── index.html                     # Entry HTML & Meta OpenGraph
├── metadata.json                  # Khai báo AI Studio Permissions
├── server.ts                      # Backend Express: Gemini, Nodemailer, Gmail OAuth, Rate Limit
└── src/
    ├── App.tsx                    # Component chính tích hợp Form + Editor + Modal
    ├── main.tsx                   # Entry React 19
    ├── index.css                  # TailwindCSS v4 theme styles
    ├── types.ts                   # Định nghĩa Interface TypeScript
    ├── components/
    │   ├── Header.tsx             # Header, trạng thái đăng nhập Gmail & các nút Modal
    │   ├── GreetingForm.tsx       # Form nhập thông tin thầy cô, môn học, tone
    │   ├── CardEditor.tsx         # Canvas Preview, chọn 4 theme, tải PNG 1080x1440
    │   ├── SendEmailModal.tsx     # Modal gửi email (Tab 1 Gmail OAuth & Tab 2 SMTP/Demo)
    │   ├── ViberBotGuideModal.tsx # Hướng dẫn & mã nguồn Viber bot
    │   └── LocalRunGuideModal.tsx # Hướng dẫn chạy local & cấu hình SMTP
    └── utils/
        ├── canvasRenderer.ts      # Engine vẽ thiệp Canvas 1080x1440 chuẩn typo tiếng Việt
        └── firebaseAuth.ts        # Quản lý Google OAuth 2.0 & Token
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Trên Máy Cá Nhân (Local)

### 1. Yêu cầu môi trường
* Node.js v18 trở lên (`node -v`)
* Trình quản lý gói `npm` hoặc `pnpm` / `bun`

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Chỉnh sửa nội dung file `.env`:
```env
# Khóa API Gemini (Lấy miễn phí tại https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSy..."

# Cổng khởi chạy (Mặc định: 3000)
PORT=3000

# (Tùy chọn) Cấu hình SMTP để gửi email thật qua Tab 2
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="ten-email-cua-ban@gmail.com"
# Mật khẩu ứng dụng 16 ký tự tạo trong: Google Account > Bảo mật > Mật khẩu ứng dụng
SMTP_PASS="xxxx yyyy zzzz wwww"
SMTP_SECURE="false"
EMAIL_FROM="Thiệp Tri Ân 20/11 <ten-email-cua-ban@gmail.com>"
```

### 4. Khởi chạy ứng dụng
```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 🛠️ Lệnh Đẩy Code Lên GitHub

Nếu bạn muốn tạo một repository mới trên GitHub của mình:

```bash
# 1. Khởi tạo Git & Commit
git init
git add .
git commit -m "feat: Thiệp điện tử AI – Lời tri ân 20/11"

# 2. Đổi tên nhánh chính thành main
git branch -M main

# 3. Thêm kho lưu trữ từ xa (Thay URL bằng repository GitHub của bạn)
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git

# 4. Đẩy code lên GitHub
git push -u origin main
```

---

## 🤖 Kiến Trúc Tích Hợp Viber Bot

Ứng dụng hỗ trợ mở rộng thành Viber Bot để gửi thiệp trực tiếp qua tin nhắn di động:

```
[Người dùng nhắn Viber] ➡️ [Viber Bot Webhook (server.ts)] 
  ➡️ [Gọi Gemini API sinh lời chúc] 
  ➡️ [Render Canvas xuất ảnh PNG / Hosting] 
  ➡️ [Viber Send Message API kèm ảnh thiệp]
```

Mã nguồn mẫu Webhook và tài liệu hướng dẫn đã được tích hợp sẵn ngay trong nút **"Mô hình Viber Bot"** trên thanh tiêu đề ứng dụng.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phát triển theo giấy phép Apache-2.0.
Kính chúc toàn thể Quý Thầy Cô một ngày Nhà giáo Việt Nam 20/11 luôn dồi dào sức khỏe, hạnh phúc và tràn đầy nhiệt huyết trên bục giảng! 🎓

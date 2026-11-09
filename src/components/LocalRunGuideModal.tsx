import React, { useState } from 'react';
import { X, Terminal, FolderTree, KeyRound, Copy, Check, CheckCircle2, Play } from 'lucide-react';

interface LocalRunGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalRunGuideModal: React.FC<LocalRunGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const envSample = `# Khóa bí mật Gemini AI (tự động nhận từ AI Studio hoặc tạo tại aistudio.google.com)
GEMINI_API_KEY="AIzaSy..."

# Cấu hình máy chủ gửi Email SMTP (Ví dụ dùng Gmail cá nhân hoặc doanh nghiệp)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="ten-cua-ban@gmail.com"
# Mật khẩu ứng dụng 16 ký tự tạo trong: Google Account > Bảo mật > Mật khẩu ứng dụng
SMTP_PASS="xxxx yyyy zzzz wwww"
SMTP_SECURE="false"
EMAIL_FROM="Tri Ân 20/11 <ten-cua-ban@gmail.com>"
PORT=3000`;

  const runSteps = `# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Tạo file .env từ mẫu .env.example
cp .env.example .env

# 3. Khởi chạy máy chủ Full-stack (Express + Vite trên cùng port 3000)
npm run dev

# 4. Mở trình duyệt tại địa chỉ:
# http://localhost:3000`;

  const folderStructure = `thiep-dien-tu-20-11/
├── .env.example               # Biến môi trường mẫu
├── index.html                 # Entry HTML (Meta tags, Google Fonts tiếng Việt)
├── metadata.json              # Khai báo quyền & khả năng Gemini server-side
├── package.json               # Cấu hình scripts & dependencies
├── server.ts                  # Backend Express: Gemini 3.8 Flash, SMTP Nodemailer, Rate Limit
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Cấu hình Vite & TailwindCSS
└── src/
    ├── App.tsx                # Trang chủ tích hợp Form + Editor + Modal
    ├── main.tsx               # Entry React
    ├── index.css              # TailwindCSS v4 imports
    ├── types.ts               # Định nghĩa kiểu dữ liệu TypeScript
    ├── components/
    │   ├── Header.tsx         # Thanh tiêu đề, logo, trạng thái hệ thống
    │   ├── GreetingForm.tsx   # Form nhập thông tin thầy cô, môn học, tone
    │   ├── CardEditor.tsx     # Preview thiệp, chọn 4 theme, tải PNG 1080x1440
    │   ├── SendEmailModal.tsx # Gửi email đính kèm thiệp (chính sách bảo mật zero-log)
    │   ├── ViberBotGuideModal.tsx # Hướng dẫn & mã nguồn Viber bot
    │   └── LocalRunGuideModal.tsx # Hướng dẫn chạy local & cấu hình SMTP
    └── utils/
        └── canvasRenderer.ts  # Vẽ thiệp Canvas HD 1080x1440 với font chữ tiếng Việt`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-300 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-700 flex items-center justify-center text-amber-300 border border-stone-600">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-100">
                Hướng Dẫn Chạy Local & Cấu Trúc Dự Án
              </h3>
              <p className="text-xs text-stone-400">
                Chạy máy chủ Node.js + React Vite + Nodemailer trên máy cá nhân
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-sm">
          {/* Step 1: Run commands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-600" />
                Lệnh Chạy Dự Án (Terminal)
              </h4>
              <button
                type="button"
                onClick={() => handleCopy(runSteps, 'run')}
                className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
              >
                {copiedKey === 'run' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép lệnh</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-700">
              {runSteps}
            </pre>
          </div>

          {/* Step 2: .env Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Cấu Hình Biến Môi Trường (.env)
              </h4>
              <button
                type="button"
                onClick={() => handleCopy(envSample, 'env')}
                className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
              >
                {copiedKey === 'env' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mẫu .env</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-amber-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-stone-700">
              {envSample}
            </pre>
            <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <div className="font-bold">Mẹo tạo Mật khẩu ứng dụng Gmail (App Password):</div>
              <ol className="list-decimal pl-5 space-y-0.5 text-stone-700">
                <li>Truy cập Google Account &gt; tab <strong>Bảo mật (Security)</strong>.</li>
                <li>Bật <strong>Xác thực 2 bước (2-Step Verification)</strong>.</li>
                <li>Tìm mục <strong>Mật khẩu ứng dụng (App passwords)</strong>.</li>
                <li>Tạo một tên ứng dụng (ví dụ: "Thiep 20-11") và sao chép 16 chữ cái điền vào <code className="bg-amber-100 px-1 rounded font-mono">SMTP_PASS</code>.</li>
              </ol>
            </div>
          </div>

          {/* Step 3: Folder Structure */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-stone-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                Cấu Trúc Thư Mục Toàn Dự Án
              </h4>
              <button
                type="button"
                onClick={() => handleCopy(folderStructure, 'tree')}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
              >
                {copiedKey === 'tree' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép cây thư mục</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-200 rounded-xl text-xs font-mono overflow-x-auto max-h-56 leading-relaxed border border-stone-700">
              {folderStructure}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-stone-800 hover:bg-stone-900 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

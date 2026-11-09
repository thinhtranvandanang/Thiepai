import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Mail,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  Palette,
  Sparkles,
  Server,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CardTheme, CardThemeId, GreetingFormData, GreetingResult } from '../types';
import { renderCardToCanvas } from '../utils/canvasRenderer';

interface CardEditorProps {
  formData: GreetingFormData;
  greetingResult: GreetingResult;
  onRegenerate: () => void;
  onOpenEmailModal: (imageBase64: string, initialMethod?: 'gmail' | 'smtp') => void;
  isLoading: boolean;
}

const THEMES: CardTheme[] = [
  {
    id: 'chalkboard',
    name: 'Bảng Đen Phấn Trắng',
    description: 'Vân bảng đá, khung gỗ sồi, phấn trắng phấn vàng hoài niệm',
    badge: 'Kinh điển',
    primaryColor: '#16231c',
    textColor: '#fef08a',
    accentColor: '#f59e0b',
  },
  {
    id: 'vintage_parchment',
    name: 'Trang Sách Cổ Điển',
    description: 'Giấy kraft sepia, viền hoa văn hoàng gia, mực nâu trầm ấm',
    badge: 'Trang nhã',
    primaryColor: '#fbf3dc',
    textColor: '#78350f',
    accentColor: '#b45309',
  },
  {
    id: 'lotus_red',
    name: 'Hoa Sen & Thư Pháp',
    description: 'Sắc đỏ son truyền thống, hoa sen thanh khiết, chữ mạ vàng',
    badge: 'Tôn nghiêm',
    primaryColor: '#7f1d1d',
    textColor: '#fef08a',
    accentColor: '#fbbf24',
  },
  {
    id: 'warm_sunlight',
    name: 'Ánh Nắng Sân Trường',
    description: 'Tông cam san hô rạng rỡ, hoa hướng dương và bình minh',
    badge: 'Ấm áp',
    primaryColor: '#fed7aa',
    textColor: '#9a3412',
    accentColor: '#ea580c',
  },
];

export const CardEditor: React.FC<CardEditorProps> = ({
  formData,
  greetingResult,
  onRegenerate,
  onOpenEmailModal,
  isLoading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('chalkboard');
  const [cardTitle, setCardTitle] = useState(greetingResult.card_title);
  const [greetingText, setGreetingText] = useState(greetingResult.greeting_text);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  // Sync state when greetingResult updates
  useEffect(() => {
    setCardTitle(greetingResult.card_title);
    setGreetingText(greetingResult.greeting_text);
  }, [greetingResult]);

  // Re-render canvas when theme or text changes
  useEffect(() => {
    if (!canvasRef.current) return;
    renderCardToCanvas(canvasRef.current, {
      themeId: selectedTheme,
      cardTitle,
      greetingText,
      teacherName: formData.teacher_name,
      subject: formData.subject,
      senderName: formData.sender_name,
      className: formData.class_name,
    });
  }, [selectedTheme, cardTitle, greetingText, formData]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
      const safeTeacher = (formData.teacher_name || 'Thay_Co')
        .replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/g, '_')
        .toLowerCase();
      const link = document.createElement('a');
      link.download = `Thiep_20_11_${safeTeacher}.png`;
      link.href = dataUrl;
      link.click();

      // Trigger celebrate confetti
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
      });
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
    }
  };

  const handlePrepareEmail = (method: 'gmail' | 'smtp') => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 0.95);
    onOpenEmailModal(dataUrl, method);
  };

  const handleCopyText = async () => {
    try {
      const fullText = `${cardTitle}\n\nKính tặng Thầy/Cô ${formData.teacher_name} - Môn ${formData.subject}\n\n${greetingText}\n\n${
        formData.sender_name ? `Học trò: ${formData.sender_name}` : ''
      }${formData.class_name ? ` (${formData.class_name})` : ''}`;

      await navigator.clipboard.writeText(fullText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Không thể sao chép văn bản:', err);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-amber-950/5 border border-amber-200/80 p-5 sm:p-7">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-amber-100">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-800">
              <Palette className="w-4 h-4" />
            </span>
            Thiết Kế & Tùy Chỉnh Thiệp
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Xem trước ảnh thiệp xuất chuẩn 1080x1440, chọn mẫu nền và tải về hoặc gửi email
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingText(!isEditingText)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isEditingText
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingText ? 'Đang Sửa Lời Chúc' : 'Sửa Chữ Trực Tiếp'}</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 transition-all cursor-pointer disabled:opacity-50"
            title="Nhờ AI viết lại lời chúc khác"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Viết Lại Với AI</span>
          </button>
        </div>
      </div>

      {/* Theme selector tabs */}
      <div className="mt-5">
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2.5">
          Chọn Phong Cách Nền Thiệp
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {THEMES.map((th) => {
            const isSelected = selectedTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setSelectedTheme(th.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30 shadow-md -translate-y-0.5'
                    : 'border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: th.primaryColor }}
                  />
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-200/70 text-stone-600'
                    }`}
                  >
                    {th.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-stone-900 truncate">{th.name}</div>
                <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                  {th.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable fields if editing mode toggled */}
      {isEditingText && (
        <div className="mt-5 p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1">
              Tiêu Đề Thiệp:
            </label>
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1">
              Nội Dung Lời Chúc (Có thể xuống dòng tự do):
            </label>
            <textarea
              rows={4}
              value={greetingText}
              onChange={(e) => setGreetingText(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative group max-w-[420px] w-full rounded-2xl overflow-hidden shadow-2xl shadow-stone-950/20 border-4 border-white bg-stone-900 transition-transform">
          {/* Canvas Element: Hidden native resolution 1080x1440, displayed scaled */}
          <canvas
            ref={canvasRef}
            className="w-full h-auto block select-none pointer-events-none"
            style={{ aspectRatio: '1080 / 1440' }}
          />

          {/* Quick badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-amber-300 border border-amber-400/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            1080 × 1440 HD
          </div>
        </div>

        {/* Short Version Caption */}
        {greetingResult.short_version && (
          <div className="mt-3 text-center max-w-lg px-3">
            <p className="text-xs italic text-stone-600 bg-amber-50/80 px-3 py-1.5 rounded-lg border border-amber-200/60 inline-block">
              💬 <span className="font-semibold text-amber-900">Thông điệp ngắn:</span>{' '}
              {greetingResult.short_version}
            </p>
          </div>
        )}
      </div>

      {/* Primary Download Button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleDownloadPng}
          className="w-full py-3.5 px-5 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>Tải Thiệp PNG (1080 × 1440 HD)</span>
        </button>
      </div>

      {/* TWO EXPLICIT EMAIL SENDING OPTIONS */}
      <div className="mt-5 pt-5 border-t border-amber-100">
        <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-amber-700" />
          <span>Phương Thức Gửi Email Cho Thầy / Cô:</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* TAB 1: Gửi bằng Gmail Của Tôi */}
          <button
            type="button"
            onClick={() => handlePrepareEmail('gmail')}
            className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 hover:border-emerald-500 text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Tab 1: Gửi bằng Gmail Của Tôi (OAuth 2.0)</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded shrink-0">
                  Gmail API
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
                Dùng cho tài khoản quản trị hoặc tài khoản đã thêm vào Test Users.
              </p>
            </div>
            <div className="mt-3 font-bold text-xs text-emerald-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Mở giao diện Tab 1</span>
              <span>&rarr;</span>
            </div>
          </button>

          {/* TAB 2: Gửi qua Máy chủ SMTP / Demo */}
          <button
            type="button"
            onClick={() => handlePrepareEmail('smtp')}
            className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100/70 hover:border-amber-500 text-left transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Tab 2: Gửi qua Máy chủ SMTP / Demo</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 text-amber-950 rounded shrink-0">
                  Khuyên dùng
                </span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-relaxed mt-1">
                Bất kỳ ai cũng có thể gửi thiệp tới thầy cô mà không cần tài khoản nằm trong danh sách thử nghiệm của Google!
              </p>
            </div>
            <div className="mt-3 font-bold text-xs text-amber-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Mở giao diện Tab 2</span>
              <span>&rarr;</span>
            </div>
          </button>
        </div>
      </div>

      {/* Copy full greeting text utility */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleCopyText}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Đã sao chép nội dung lời chúc!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>Sao chép toàn bộ văn bản lời chúc</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

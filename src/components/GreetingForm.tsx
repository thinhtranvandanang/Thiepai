import React, { useState } from 'react';
import {
  Sparkles,
  User,
  GraduationCap,
  Smile,
  HeartHandshake,
  Scroll,
  SmilePlus,
  Flame,
  MessageSquareQuote,
  Layers,
  Wand2,
} from 'lucide-react';
import { GreetingFormData, ToneType } from '../types';

interface GreetingFormProps {
  onSubmit: (data: GreetingFormData) => void;
  isLoading: boolean;
}

const QUICK_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Tin học',
  'Lịch sử',
  'Sinh học',
  'Chủ nhiệm',
];

const TONE_OPTIONS: { id: ToneType; label: string; desc: string; icon: any; color: string }[] = [
  {
    id: 'cam_dong',
    label: 'Cảm động & Sâu lắng',
    desc: 'Tri ân công ơn dìu dắt, tận tụy như người cha người mẹ',
    icon: HeartHandshake,
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'hai_huoc',
    label: 'Hài hước & Dí dỏm',
    desc: 'Vui vẻ, liên hệ bài kiểm tra, điểm số và khoảnh khắc trên lớp',
    icon: SmilePlus,
    color: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'trang_trong',
    label: 'Trang trọng & Kính cẩn',
    desc: 'Văn phong chuẩn mực sư phạm, tôn sư trọng đạo',
    icon: GraduationCap,
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'tho_luc_bat',
    label: 'Vần thơ Lục bát',
    desc: 'Câu thơ ngọt ngào về chuyến đò xưa và phấn trắng',
    icon: Scroll,
    color: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'tuoi_hoc_tro',
    label: 'Tuổi học trò tinh nghịch',
    desc: 'Hồn nhiên, ấm áp của những kỷ niệm phấn bảng sân trường',
    icon: Smile,
    color: 'from-orange-500 to-amber-600',
  },
];

export const GreetingForm: React.FC<GreetingFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<GreetingFormData>({
    teacher_name: '',
    subject: '',
    tone: 'cam_dong',
    sender_name: '',
    class_name: '',
    memory: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_name.trim()) {
      setValidationError('Vui lòng nhập họ và tên của Thầy hoặc Cô giáo!');
      return;
    }
    if (!formData.subject.trim()) {
      setValidationError('Vui lòng nhập môn học Thầy hoặc Cô đang phụ trách!');
      return;
    }
    setValidationError(null);
    onSubmit(formData);
  };

  const handleSelectQuickSubject = (sub: string) => {
    setFormData((prev) => ({ ...prev, subject: sub }));
  };

  const handleAutoFillSample = (sampleType: 'toan' | 'van' | 'tin') => {
    if (sampleType === 'toan') {
      setFormData({
        teacher_name: 'Thầy Nguyễn Văn Nam',
        subject: 'Toán học',
        tone: 'hai_huoc',
        sender_name: 'Minh Quân',
        class_name: '12A1',
        memory: 'Những lần thầy dặn: "Đừng để phương trình cuộc đời em vô nghiệm nhé!"',
      });
    } else if (sampleType === 'van') {
      setFormData({
        teacher_name: 'Cô Trần Thị Mai',
        subject: 'Ngữ văn',
        tone: 'cam_dong',
        sender_name: 'Ngọc Ánh',
        class_name: '11 Chuyên Văn',
        memory: 'Tiết học đọc thơ Tây Tiến bên khung cửa sổ mùa thu thơm ngát lá vàng',
      });
    } else {
      setFormData({
        teacher_name: 'Thầy Lê Hoàng',
        subject: 'Tin học & Lập trình',
        tone: 'tho_luc_bat',
        sender_name: 'Nhóm học sinh Olimpia',
        class_name: 'Khóa 2024-2027',
        memory: 'Lần đầu tiên em gõ dòng code Hello World chạy thành công không có bug',
      });
    }
    setValidationError(null);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-amber-950/5 border border-amber-200/80 p-5 sm:p-7 transition-all">
      {/* Form Title & Quick Fill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-amber-100">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-800">
              <Sparkles className="w-4 h-4" />
            </span>
            Thông Tin Lời Tri Ân
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Nhập thông tin để AI chắp bút viết nên lời chúc ý nghĩa và sâu sắc nhất
          </p>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-stone-500 font-medium">Mẫu thử:</span>
          <button
            type="button"
            onClick={() => handleAutoFillSample('toan')}
            className="px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
          >
            Thầy Toán 📐
          </button>
          <button
            type="button"
            onClick={() => handleAutoFillSample('van')}
            className="px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            Cô Văn 📖
          </button>
          <button
            type="button"
            onClick={() => handleAutoFillSample('tin')}
            className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            Thầy Tin 💻
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Row 1: Teacher Name & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Họ & Tên Thầy / Cô <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ví dụ: Cô Nguyễn Thị Lan, Thầy Trần Hải..."
                value={formData.teacher_name}
                maxLength={80}
                onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Môn Học Giảng Dạy <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ví dụ: Toán học, Ngữ văn, Lịch sử..."
                value={formData.subject}
                maxLength={80}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 transition-all outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Quick subject suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-xs text-stone-400">Gợi ý nhanh:</span>
          {QUICK_SUBJECTS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => handleSelectQuickSubject(sub)}
              className={`px-2 py-0.5 rounded-md text-xs transition-colors ${
                formData.subject === sub
                  ? 'bg-amber-600 text-white font-medium'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Row 2: Tone Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            Phong Cách / Giọng Điệu Lời Chúc
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {TONE_OPTIONS.map((t) => {
              const Icon = t.icon;
              const isSelected = formData.tone === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setFormData({ ...formData, tone: t.id })}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-left relative overflow-hidden ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/30 shadow-sm'
                      : 'border-stone-200 hover:border-amber-300 bg-white hover:bg-stone-50/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">{t.label}</div>
                      <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{t.desc}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: Sender Name & Class */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Tên Người Gửi <span className="text-stone-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Em Hoàng Nam, Nhóm học sinh lớp..."
              value={formData.sender_name}
              maxLength={80}
              onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Lớp / Niên Khóa <span className="text-stone-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: 12A3, Khóa 2023 - 2026..."
              value={formData.class_name}
              maxLength={80}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 transition-all outline-none"
            />
          </div>
        </div>

        {/* Row 4: Memory or Personal Note */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-stone-400" />
              Kỷ Niệm Đáng Nhớ Hoặc Lời Nhắn Riêng <span className="text-stone-400 font-normal">(Tùy chọn)</span>
            </span>
            <span className="text-[11px] text-stone-400">{formData.memory.length}/600</span>
          </label>
          <textarea
            rows={2}
            placeholder="Ví dụ: Em nhớ mãi lời thầy dặn trước kỳ thi đội tuyển, hay những lần cô kiên nhẫn giảng lại bài hình học lúc tan trường..."
            value={formData.memory}
            maxLength={600}
            onChange={(e) => setFormData({ ...formData, memory: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 transition-all outline-none resize-none"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isLoading
                ? 'bg-amber-700/80 cursor-wait'
                : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 shadow-amber-900/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>AI Đang Soạn Lời Chúc Tri Ân...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-amber-200" />
                <span>Sinh Lời Chúc & Tạo Thiệp 20/11</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

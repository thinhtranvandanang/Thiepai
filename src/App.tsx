import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Heart, AlertCircle, GraduationCap } from 'lucide-react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { GreetingForm } from './components/GreetingForm';
import { CardEditor } from './components/CardEditor';
import { SendEmailModal } from './components/SendEmailModal';
import { ViberBotGuideModal } from './components/ViberBotGuideModal';
import { LocalRunGuideModal } from './components/LocalRunGuideModal';
import { GreetingFormData, GreetingResult } from './types';
import { initAuth, googleSignIn, logout } from './utils/firebaseAuth';

// Default initial card so users have a gorgeous live preview immediately upon landing
const INITIAL_FORM: GreetingFormData = {
  teacher_name: 'Thầy Nguyễn Văn Nam',
  subject: 'Toán học',
  tone: 'cam_dong',
  sender_name: 'Minh Quân',
  class_name: '12A1',
  memory: 'Lời thầy dặn trước kỳ thi: "Đừng sợ bài toán khó, chỉ sợ ta thiếu kiên nhẫn"',
};

const INITIAL_RESULT: GreetingResult = {
  card_title: 'Lời Tri Ân Gửi Người Thầy Kính Yêu',
  greeting_text:
    'Có một nghề bụi phấn bám đầy tay, người ta bảo là nghề trong sạch nhất.\nCảm ơn thầy vì từng bài giảng Toán học tâm huyết, từng phép tính khai mở tư duy và sự kiên nhẫn chở che suốt năm tháng học trò.\nKính chúc thầy một ngày 20/11 ngập tràn hoa thắm, sức khỏe dồi dào và bình an!',
  short_version: 'Cảm ơn Thầy đã chắp cánh ước mơ và thắp sáng niềm tin trong chúng em!',
  image_prompt:
    'Chalkboard with chalkboard texture, fresh red roses and chalk dust, warm glow from window, heartwarming nostalgic atmosphere',
  email_subject: '[Tri Ân 20/11] Lời chúc mừng Ngày Nhà giáo Việt Nam gửi Thầy Nguyễn Văn Nam',
  email_body:
    'Kính gửi Thầy Nguyễn Văn Nam,\n\nNhân ngày Nhà giáo Việt Nam 20/11, em xin gửi tới Thầy tấm thiệp nhỏ này như lời cảm ơn chân thành tự đáy lòng. Cảm ơn Thầy đã dìu dắt chúng em trong môn Toán học và trao cho chúng em niềm say mê học hỏi.\n\nNhớ mãi lời thầy dặn trước kỳ thi: "Đừng sợ bài toán khó, chỉ sợ ta thiếu kiên nhẫn".\n\nKính chúc Thầy luôn dồi dào sức khỏe, ngập tràn niềm vui và giữ mãi ngọn lửa nhiệt huyết bên bảng đen, phấn trắng.\n\nHọc trò của Thầy,\nMinh Quân (Lớp 12A1)',
};

export default function App() {
  const [formData, setFormData] = useState<GreetingFormData>(INITIAL_FORM);
  const [greetingResult, setGreetingResult] = useState<GreetingResult>(INITIAL_RESULT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Google / Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [sendMethodChoice, setSendMethodChoice] = useState<'gmail' | 'smtp'>('smtp');
  const [isViberModalOpen, setIsViberModalOpen] = useState(false);
  const [isLocalGuideOpen, setIsLocalGuideOpen] = useState(false);
  const [currentImageBase64, setCurrentImageBase64] = useState<string>('');
  const [smtpReady, setSmtpReady] = useState(false);

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
        if (user.displayName && !formData.sender_name) {
          setFormData((prev) => ({ ...prev, sender_name: user.displayName || '' }));
        }
      },
      () => {
        setCurrentUser(null);
      }
    );

    // Check SMTP status
    fetch('/api/system-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.smtpReady) {
          setSmtpReady(true);
        }
      })
      .catch((err) => console.log('Không thể kiểm tra trạng thái SMTP:', err));

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setApiError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        if (result.user.displayName && !formData.sender_name) {
          setFormData((prev) => ({ ...prev, sender_name: result.user.displayName || '' }));
        }
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.2 },
        });
      }
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google:', err);
      const msg = err?.message || '';
      if (
        msg.includes('access_denied') ||
        msg.includes('verification process') ||
        msg.includes('developer-approved testers') ||
        err?.code === 'auth/access-denied'
      ) {
        setApiError(
          'Tài khoản Gmail này chưa được thêm vào mục "Test Users" (Người dùng thử nghiệm) trên Google Cloud Console của dự án gen-lang-client-0794434867. Bạn có thể đăng nhập bằng tài khoản tạo dự án (thinhtv15@fpt.edu.vn), hoặc thêm email vào Test Users trong Google Cloud, hoặc dùng chức năng gửi qua Máy chủ SMTP.'
        );
      } else {
        setApiError(err.message || 'Không thể đăng nhập tài khoản Google. Vui lòng thử lại!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Lỗi đăng xuất:', err);
    }
  };

  const handleGenerate = async (dataToSubmit: GreetingFormData) => {
    setIsLoading(true);
    setApiError(null);
    setFormData(dataToSubmit);

    try {
      const response = await fetch('/api/generate-greeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Lỗi khi gọi API sinh thiệp 20/11');
      }

      setGreetingResult(json.data);

      // Fireworks / celebration
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#dc2626', '#10b981'],
      });
    } catch (err: any) {
      console.error('Lỗi sinh thiệp:', err);
      setApiError(err.message || 'Đã có lỗi xảy ra trong quá trình sinh lời chúc. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmailModal = (imageBase64: string, initialMethod: 'gmail' | 'smtp' = 'smtp') => {
    setCurrentImageBase64(imageBase64);
    setSendMethodChoice(initialMethod);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenLocalGuide={() => setIsLocalGuideOpen(true)}
        onOpenViberGuide={() => setIsViberModalOpen(true)}
        smtpReady={smtpReady}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
      />

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-b from-amber-800/10 via-amber-50/50 to-transparent pt-6 pb-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300/80 shadow-xs">
            <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
            <span>Ngày Hội Tri Ân Thầy Cô 20/11</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight">
            Gửi Trọn Yêu Thương Đến Người Lái Đò Thầm Lặng
          </h2>
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto">
            Hệ thống ứng dụng trí tuệ nhân tạo Gemini để sáng tác lời chúc trau chuốt theo từng môn học,
            thiết kế thiệp bảng phấn hoa sen nghệ thuật và gửi thư trực tiếp từ hộp thư Gmail của chính bạn.
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => handleGenerate(formData)}
              className="text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer ml-4"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Input (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            <GreetingForm onSubmit={handleGenerate} isLoading={isLoading} />

            {/* Cultural Quotes Card */}
            <div className="bg-gradient-to-br from-amber-900 to-stone-900 text-amber-100 rounded-2xl p-5 shadow-lg border border-amber-800/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Nét Đẹp Văn Hóa Sư Phạm Việt Nam</span>
              </div>
              <p className="text-xs sm:text-sm italic text-amber-200/90 leading-relaxed font-serif">
                "Muốn sang thì bắc cầu Kiều, muốn con hay chữ thì yêu lấy thầy."
              </p>
              <div className="pt-2 border-t border-amber-800/60 flex items-center justify-between text-[11px] text-amber-300/80">
                <span>Xuất ảnh 1080 × 1440 HD</span>
                <span>Gửi qua Gmail chính chủ</span>
              </div>
            </div>
          </div>

          {/* Right Column: Card Editor & High Resolution Canvas Preview (7 cols) */}
          <div className="lg:col-span-7">
            <CardEditor
              formData={formData}
              greetingResult={greetingResult}
              onRegenerate={() => handleGenerate(formData)}
              onOpenEmailModal={handleOpenEmailModal}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-medium text-stone-700">
            Hệ Thống Thiệp Điện Tử AI Tri Ân Ngày Nhà Giáo Việt Nam 20/11
          </p>
          <p className="text-stone-400">
            Phát triển với React 19, TailwindCSS, Canvas HTML5, Google Gemini 3.8 Flash & Gmail API OAuth 2.0.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        imageBase64={currentImageBase64}
        formData={formData}
        greetingResult={greetingResult}
        currentUser={currentUser}
        onUserLoggedIn={(user) => setCurrentUser(user)}
        initialMethod={sendMethodChoice}
      />

      <ViberBotGuideModal
        isOpen={isViberModalOpen}
        onClose={() => setIsViberModalOpen(false)}
      />

      <LocalRunGuideModal
        isOpen={isLocalGuideOpen}
        onClose={() => setIsLocalGuideOpen(false)}
      />
    </div>
  );
}

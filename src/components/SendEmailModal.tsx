import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  LogIn,
  UserCheck,
  Server,
  HelpCircle,
  ExternalLink,
  Reply,
  Sparkles,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Inbox,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import { GreetingFormData, GreetingResult } from '../types';
import { getAccessToken, googleSignIn } from '../utils/firebaseAuth';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBase64: string;
  formData: GreetingFormData;
  greetingResult: GreetingResult;
  currentUser: User | null;
  onUserLoggedIn: (user: User) => void;
  initialMethod?: 'gmail' | 'smtp';
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  imageBase64,
  formData,
  greetingResult,
  currentUser,
  onUserLoggedIn,
  initialMethod = 'smtp',
}) => {
  const [sendMethod, setSendMethod] = useState<'gmail' | 'smtp'>(initialMethod);
  const [systemStatus, setSystemStatus] = useState<{ smtpReady: boolean; smtpHost?: string; smtpUser?: string } | null>(null);

  // Sync sendMethod if initialMethod changes or modal reopens
  useEffect(() => {
    if (initialMethod) {
      setSendMethod(initialMethod);
    }
  }, [initialMethod, isOpen]);

  // Check server SMTP status on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/system-status')
        .then((res) => res.json())
        .then((data) => setSystemStatus(data))
        .catch(() => setSystemStatus({ smtpReady: false }));
    }
  }, [isOpen]);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderEmail, setSenderEmail] = useState(currentUser?.email || '');
  const [senderName, setSenderName] = useState(formData.sender_name || currentUser?.displayName || '');
  const [subject, setSubject] = useState(
    greetingResult.email_subject || `[Tri Ân 20/11] Kính gửi Thầy/Cô ${formData.teacher_name}`
  );
  const [body, setBody] = useState(greetingResult.email_body || '');
  const [confirmed, setConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTestUserError, setIsTestUserError] = useState(false);
  const [showTestUserGuide, setShowTestUserGuide] = useState(false);

  // Custom SMTP optional form state (Allows sending real emails with user's Gmail App Password)
  const [showCustomSmtp, setShowCustomSmtp] = useState(false);
  const [customSmtpEmail, setCustomSmtpEmail] = useState('');
  const [customSmtpPass, setCustomSmtpPass] = useState('');

  // Result info after sending
  const [successInfo, setSuccessInfo] = useState<{
    mode: string;
    message: string;
    senderEmail?: string;
    previewUrl?: string;
    messageId?: string;
    details?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleLoginInsideModal = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    setIsTestUserError(false);
    try {
      const result = await googleSignIn();
      if (result) {
        onUserLoggedIn(result.user);
        setSendMethod('gmail');
        if (result.user.email) setSenderEmail(result.user.email);
        if (result.user.displayName && !senderName) setSenderName(result.user.displayName);
      }
    } catch (err: any) {
      console.error('Đăng nhập thất bại:', err);
      const errMsg = err?.message || '';
      if (
        errMsg.includes('access_denied') ||
        errMsg.includes('verification process') ||
        errMsg.includes('developer-approved testers') ||
        err?.code === 'auth/access-denied'
      ) {
        setIsTestUserError(true);
        setErrorMessage(
          'Tài khoản này chưa có trong danh sách Test Users của Google Cloud. Bạn không cần đăng nhập Google, hãy chọn Tab 2 (Gửi qua Máy chủ SMTP) bên dưới để gửi ngay!'
        );
      } else {
        setErrorMessage(errMsg || 'Không thể đăng nhập tài khoản Google. Vui lòng thử lại!');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsTestUserError(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail.trim() || !emailRegex.test(recipientEmail.trim())) {
      setErrorMessage('Địa chỉ email của Thầy/Cô không hợp lệ. Ví dụ: thayco@truong.edu.vn');
      return;
    }

    if (senderEmail.trim() && !emailRegex.test(senderEmail.trim())) {
      setErrorMessage('Địa chỉ email của bạn không đúng định dạng. Ví dụ: learnit927@gmail.com');
      return;
    }

    if (!confirmed) {
      setErrorMessage('Vui lòng tích chọn ô xác nhận đồng ý gửi trước khi thực hiện!');
      return;
    }

    setIsSending(true);

    try {
      if (sendMethod === 'gmail') {
        // Gửi qua Gmail OAuth (Tab 1)
        let accessToken = await getAccessToken();

        // If user session lost access token on reload, prompt renewal
        if (!accessToken && currentUser) {
          try {
            const freshAuth = await googleSignIn();
            if (freshAuth) {
              accessToken = freshAuth.accessToken;
              onUserLoggedIn(freshAuth.user);
            } else {
              // Đang chuyển hướng trang (signInWithRedirect)
              return;
            }
          } catch (signInErr: any) {
            const msg = signInErr?.message || '';
            if (msg.includes('access_denied') || msg.includes('developer-approved testers')) {
              setIsTestUserError(true);
              throw new Error(
                'Tài khoản Google chưa được duyệt Test User. Bạn hãy bấm chọn phương thức "Tab 2: Gửi qua Máy chủ SMTP" bên cạnh để gửi ngay lập tức mà không cần xác minh!'
              );
            }
            throw new Error(msg || 'Vui lòng hoàn tất đăng nhập Google để cấp quyền gửi Gmail.');
          }
        }

        if (!accessToken || !currentUser) {
          throw new Error('Bạn chưa đăng nhập Gmail. Vui lòng bấm nút "Đăng nhập Gmail" hoặc chuyển sang "Tab 2: Máy chủ SMTP / Demo" để gửi ngay.');
        }

        const response = await fetch('/api/send-gmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: recipientEmail.trim(),
            teacher_name: formData.teacher_name,
            subject: subject.trim(),
            email_body: body.trim(),
            image_base64: imageBase64,
            sender_name: senderName.trim() || currentUser.displayName || 'Học trò',
            sender_email: currentUser.email || senderEmail.trim(),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Có lỗi xảy ra khi gửi email qua Gmail.');
        }

        setSuccessInfo({
          mode: 'gmail_oauth',
          senderEmail: data.senderEmail || currentUser.email || '',
          message: data.message,
          messageId: data.messageId,
        });
      } else {
        // Gửi qua Máy chủ SMTP / Demo (Tab 2)
        const payload: any = {
          to: recipientEmail.trim(),
          teacher_name: formData.teacher_name,
          subject: subject.trim(),
          email_body: body.trim(),
          image_base64: imageBase64,
          sender_name: senderName.trim() || 'Học trò',
          sender_email: senderEmail.trim(),
        };

        // If user provided their own Gmail App Password to send real email
        if (showCustomSmtp && customSmtpEmail.trim() && customSmtpPass.trim()) {
          payload.custom_smtp = {
            host: 'smtp.gmail.com',
            port: 465,
            user: customSmtpEmail.trim(),
            pass: customSmtpPass.trim().replace(/\s+/g, ''),
          };
        }

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Có lỗi xảy ra khi gửi email qua máy chủ.');
        }

        setSuccessInfo({
          mode: data.mode,
          senderEmail: senderEmail.trim() || (showCustomSmtp ? customSmtpEmail.trim() : ''),
          message: data.message,
          previewUrl: data.previewUrl,
          messageId: data.messageId,
          details: data.details,
        });
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#dc2626', '#10b981', '#3b82f6'],
      });
    } catch (err: any) {
      console.error('Lỗi gửi email:', err);
      const msg = err.message || '';
      if (msg.includes('access_denied') || msg.includes('developer-approved testers')) {
        setIsTestUserError(true);
      }
      setErrorMessage(msg || 'Không thể gửi email. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600/60 flex items-center justify-center text-amber-200 border border-amber-400/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-50">Gửi Thiệp Tri Ân Đến Thầy / Cô</h3>
              <p className="text-xs text-amber-200/80">
                Đính kèm thiệp độ nét cao 1080×1440 HD • Có hỗ trợ phản hồi trực tiếp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {successInfo ? (
            /* ================= SUCCESS STATE WITH CLEAR EXPLANATION ================= */
            <div className="py-4 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h4 className="text-xl font-bold text-stone-900">
                  {successInfo.mode === 'gmail_oauth'
                    ? 'Đã Gửi Thành Công Từ Hộp Thư Gmail Của Bạn!'
                    : successInfo.mode === 'real_smtp'
                    ? 'Đã Gửi Email Thật Thành Công Tới Hộp Thư Thầy/Cô!'
                    : 'Đã Chuyển Phát Thành Công Vào Hộp Thư Thử Nghiệm Trực Tuyến!'}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
                  {successInfo.message}
                </p>
              </div>

              {/* SPECIAL ETHEREAL PREVIEW BUTTON IF SENT VIA DEMO MODE */}
              {successInfo.previewUrl && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-2 border-amber-400/80 text-stone-900 text-center space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-amber-950 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>Xem Trực Tiếp Bức Thư Vừa Gửi Trên Máy Chủ Kiểm Thử Ethereal</span>
                  </div>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    Bạn có thể bấm nút bên dưới để mở giao diện email thực tế hiển thị thư, lời chúc tiếng Việt và hình ảnh thiệp 1080×1440 HD đính kèm:
                  </p>
                  <div>
                    <a
                      href={successInfo.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 shadow-md transition-all cursor-pointer text-sm"
                    >
                      <Inbox className="w-4 h-4" />
                      <span>📬 Mở Xem Thư & Thiệp Thực Tế (Ethereal Preview)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Delivery Receipt Card */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="font-bold text-stone-800 flex items-center justify-between pb-1.5 border-b border-stone-200">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Chi Tiết Bức Thư Đã Xử Lý</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    {successInfo.mode === 'gmail_oauth' ? 'Gmail API' : successInfo.mode === 'real_smtp' ? 'SMTP Thật' : 'Demo Ethereal'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600">
                  <div><strong>Người nhận:</strong> {formData.teacher_name} ({recipientEmail})</div>
                  <div><strong>Người gửi:</strong> {senderName || 'Học trò'} {successInfo.senderEmail ? `(${successInfo.senderEmail})` : ''}</div>
                  <div><strong>Tiêu đề:</strong> {subject}</div>
                  <div><strong>Đính kèm:</strong> Thiep_Tri_An_20_11.png (1080×1440 HD)</div>
                  {successInfo.messageId && (
                    <div className="sm:col-span-2 text-[11px] font-mono text-stone-500 truncate">
                      <strong>Message-ID:</strong> {successInfo.messageId}
                    </div>
                  )}
                </div>
              </div>

              {/* EXPLANATION: WHY YOU MIGHT NOT HAVE RECEIVED IT & HOW TO SEND REAL */}
              {successInfo.mode === 'demo_ethereal' && (
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs space-y-2.5">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5 text-sm">
                    <Info className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Làm sao biết email đã được gửi và tại sao chưa nhận được trong hộp thư cá nhân?</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] leading-relaxed text-blue-900/90">
                    <p>
                      <strong>1. Làm sao biết email đã gửi:</strong> Khi ở chế độ Demo, máy chủ gửi thư lên dịch vụ kiểm thử trực tuyến <strong>Ethereal Mail</strong>. Bạn bấm vào nút <em>"Mở Xem Thư & Thiệp Thực Tế"</em> ở trên để kiểm tra toàn bộ giao diện thư và tệp đính kèm.
                    </p>
                    <p>
                      <strong>2. Vì sao chưa nhận được trong hộp thư thật:</strong> Vì máy chủ cloud xem trước hiện tại chưa có tài khoản bưu cục SMTP thật cấu hình sẵn trên server nên không thể tự động phát tán email ra Internet.
                    </p>
                    <p className="pt-1 font-semibold text-blue-950">
                      👉 Để gửi thư THẬT 100% đến hộp thư của Thầy/Cô:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-blue-900">
                      <li>
                        <strong>Cách 1 (Tốt nhất & Thật 100%):</strong> Dùng <strong>Tab 1 (Gửi bằng Gmail Của Tôi)</strong>. Đăng nhập tài khoản Google của bạn để gửi trực tiếp. Thư sẽ xuất hiện ngay trong mục <em>"Thư đã gửi (Sent)"</em> của Gmail bạn và hòm thư đến của Thầy/Cô.
                      </li>
                      <li>
                        <strong>Cách 2:</strong> Nhập <strong>Mật khẩu ứng dụng Gmail (App Password 16 ký tự)</strong> của bạn ở mục cấu hình SMTP trong Tab 2 để gửi thật ngay trên web.
                      </li>
                      <li>
                        <strong>Cách 3:</strong> Khi chạy ứng dụng local trên máy tính, điền thông tin SMTP vào file <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">.env</code>.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-amber-800 hover:bg-amber-900 shadow-md transition-all cursor-pointer text-sm"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>
            </div>
          ) : (
            /* ================= INPUT FORM ================= */
            <form onSubmit={handleSend} className="space-y-4">
              {/* Method Selector Tabs */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Chọn 1 trong 2 Phương Thức Gửi Thư:</span>
                  <span className="text-[11px] font-semibold text-amber-800">
                    {sendMethod === 'gmail' ? '• Đang chọn Tab 1 (Gmail OAuth)' : '• Đang chọn Tab 2 (SMTP / Demo)'}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* TAB 1 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSendMethod('gmail');
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      sendMethod === 'gmail'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'bg-stone-50 border-stone-200 hover:border-emerald-300 text-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span>Tab 1: Gửi bằng Gmail Của Tôi</span>
                      </span>
                      {sendMethod === 'gmail' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2">
                      Gửi thư thật trực tiếp từ hộp thư Gmail của bạn.
                    </p>
                  </button>

                  {/* TAB 2 */}
                  <button
                    type="button"
                    onClick={() => {
                      setSendMethod('smtp');
                      setErrorMessage(null);
                      setIsTestUserError(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      sendMethod === 'smtp'
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                        : 'bg-stone-50 border-stone-200 hover:border-amber-300 text-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Tab 2: Gửi qua Máy chủ SMTP / Demo</span>
                      </span>
                      {sendMethod === 'smtp' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2">
                      Gửi không cần đăng nhập Google OAuth • Có link xem thư trực tiếp & tùy chọn gửi thật.
                    </p>
                  </button>
                </div>
              </div>

              {/* Status explanation for Tab 2 */}
              {sendMethod === 'smtp' && (
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-stone-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-700" />
                        <span>Chế Độ Gửi Thư Qua Máy Chủ (Không cần đăng nhập Google)</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        systemStatus?.smtpReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {systemStatus?.smtpReady ? '🟢 SMTP Thật Sẵn Sàng' : '🟡 Hộp Thư Thử Nghiệm (Ethereal Preview)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {systemStatus?.smtpReady
                        ? 'Máy chủ đã cấu hình SMTP thật. Thư sẽ được gửi trực tiếp tới email Thầy/Cô và có gắn email phản hồi của bạn!'
                        : 'Môi trường cloud xem trước đang hoạt động ở chế độ Demo. Khi bấm gửi, hệ thống sẽ tạo bức thư và cung cấp ngay Link Mở Xem Thư Thực Tế (Ethereal Preview) để bạn kiểm chứng!'}
                    </p>
                  </div>

                  {/* OPTIONAL: SEND REAL VIA USER'S OWN GMAIL APP PASSWORD */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setShowCustomSmtp(!showCustomSmtp)}
                      className="w-full p-2.5 px-3 flex items-center justify-between text-left font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-amber-900">
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Muốn gửi THẬT ngay tới hộp thư Thầy/Cô? (Dùng Mật khẩu ứng dụng Gmail)</span>
                      </span>
                      {showCustomSmtp ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                    </button>

                    {showCustomSmtp && (
                      <div className="p-3 pt-0 border-t border-stone-200 space-y-2.5 bg-white">
                        <p className="text-[11px] text-stone-600 mt-2">
                          Bạn có thể nhập địa chỉ Gmail và Mật khẩu ứng dụng 16 ký tự của bạn để hệ thống kết nối gửi THẬT 100% đến hộp thư Thầy/Cô mà không cần qua xét duyệt Google Test Users:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Gmail của bạn:
                            </label>
                            <input
                              type="email"
                              placeholder="ví dụ: learnit927@gmail.com"
                              value={customSmtpEmail}
                              onChange={(e) => setCustomSmtpEmail(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 outline-none focus:border-amber-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Mật khẩu ứng dụng (16 chữ cái):
                            </label>
                            <input
                              type="password"
                              placeholder="xxxx yyyy zzzz wwww"
                              value={customSmtpPass}
                              onChange={(e) => setCustomSmtpPass(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 outline-none focus:border-amber-600 font-mono"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500">
                          (Cách tạo: Vào Google Account &gt; Bảo mật &gt; Xác thực 2 bước &gt; Mật khẩu ứng dụng &gt; Tạo mật khẩu 16 chữ cái).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gmail Mode Account Banner */}
              {sendMethod === 'gmail' && (
                <div>
                  {currentUser ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {currentUser.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-emerald-300"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                            {(currentUser.displayName || 'G')[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Đã đăng nhập:</span>
                            <span className="text-emerald-700">{currentUser.displayName}</span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-mono">
                            {currentUser.email}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                        Gmail API Sẵn sàng
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <LogIn className="w-4 h-4 text-amber-700" />
                          Đăng nhập tài khoản Gmail để gửi:
                        </div>
                        <p className="text-stone-600 text-[11px]">
                          Thư sẽ xuất phát từ chính tài khoản Gmail của bạn (Áp dụng cho tài khoản quản trị hoặc tài khoản đã thêm vào Test Users).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLoginInsideModal}
                        disabled={isLoggingIn}
                        className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 border border-stone-300 font-bold text-stone-800 shadow-xs transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập Gmail'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="leading-relaxed">{errorMessage}</p>
                    </div>
                  </div>

                  {isTestUserError && (
                    <div className="pt-2 border-t border-rose-200 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSendMethod('smtp');
                          setErrorMessage(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        ✓ Chuyển sang Tab 2 (Gửi qua Máy chủ SMTP)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTestUserGuide(!showTestUserGuide)}
                        className="text-[11px] font-bold text-rose-800 hover:text-rose-950 underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Xem hướng dẫn thêm Test User</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Expandable Test User Guide */}
              {showTestUserGuide && (
                <div className="p-3.5 rounded-xl bg-stone-900 text-stone-200 text-xs space-y-2 border border-stone-700 font-sans">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <span>Thêm email vào Google Cloud Console:</span>
                    <button
                      type="button"
                      onClick={() => setShowTestUserGuide(false)}
                      className="text-stone-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-[11px] text-stone-300">
                    <li>
                      Dùng tài khoản chủ dự án (<span className="text-amber-200 font-mono">thinhtv15@fpt.edu.vn</span>) mở{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials/consent"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline inline-flex items-center gap-0.5"
                      >
                        Google Cloud Console &gt; OAuth consent screen <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Chọn project: <code className="bg-stone-800 px-1 py-0.5 rounded text-amber-300">gen-lang-client-0794434867</code></li>
                    <li>Cuộn xuống mục <strong>Test users</strong> &gt; Bấm <strong>ADD USERS</strong> &gt; Điền email của bạn &gt; Bấm <strong>SAVE</strong>.</li>
                  </ol>
                </div>
              )}

              {/* Sender Info (for SMTP mode) */}
              {sendMethod === 'smtp' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Họ & Tên Người Gửi (Học sinh)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Em Nguyễn Văn An (12A1)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-amber-600 text-stone-900 text-xs bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                      <Reply className="w-3 h-3 text-amber-600" />
                      <span>Email của bạn (Để Thầy/Cô Reply)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Ví dụ: learnit927@gmail.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-amber-600 text-stone-900 text-xs bg-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Recipient Email */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Địa Chỉ Email Của Thầy / Cô <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="Ví dụ: thaynam.toan@truong.edu.vn (hoặc email của bạn để thử)"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 outline-none"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Bảo mật quyền riêng tư: Hệ thống cam kết không ghi log email người nhận.
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Tiêu Đề Email
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 outline-none"
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Nội Dung Thư Điện Tử
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-900 text-sm bg-stone-50/50 outline-none resize-none font-sans"
                />
              </div>

              {/* Attached Card Thumbnail preview */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                <div className="w-14 h-18 rounded-lg overflow-hidden border border-amber-300 shadow-sm shrink-0 bg-stone-900">
                  <img
                    src={imageBase64}
                    alt="Thiệp đính kèm"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-amber-950 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                    Đính kèm: Thiep_Tri_An_20_11.png (1080 × 1440 HD)
                  </div>
                  <p className="text-stone-600 mt-0.5">
                    Ảnh thiệp sẽ được nhúng trực tiếp trong email và kèm tệp đính kèm độ nét cao.
                  </p>
                </div>
              </div>

              {/* Privacy & Consent Confirmation */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                  />
                  <span>
                    {sendMethod === 'gmail' && currentUser ? (
                      <>
                        Em xác nhận cho phép ứng dụng gửi bức thư tri ân này{' '}
                        <strong>trực tiếp từ tài khoản Gmail ({currentUser.email})</strong> tới địa chỉ Thầy/Cô đã nhập.
                      </>
                    ) : (
                      <>
                        Em xác nhận thông tin địa chỉ email của Thầy/Cô là chính xác và đồng ý gửi bức thiệp tri ân này.
                      </>
                    )}
                  </span>
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-md flex items-center gap-2 cursor-pointer ${
                    isSending
                      ? 'bg-amber-700 cursor-wait'
                      : sendMethod === 'gmail'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
                      : 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900'
                  }`}
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{sendMethod === 'gmail' ? 'Đang Gửi Qua Gmail...' : 'Đang Gửi Thư...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{sendMethod === 'gmail' ? 'Gửi Bằng Gmail Của Tôi' : 'Gửi Thiệp Tới Thầy/Cô Ngay'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

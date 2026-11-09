import React from 'react';
import { BookOpen, Bot, Terminal, LogOut, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  onOpenLocalGuide: () => void;
  onOpenViberGuide: () => void;
  smtpReady: boolean;
  currentUser: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLocalGuide,
  onOpenViberGuide,
  smtpReady,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  isLoggingIn,
}) => {
  return (
    <header className="relative bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white shadow-xl border-b border-amber-700/50">
      <div className="absolute inset-0 bg-[radial-gradient(#fde68a_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5 text-center md:text-left">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/40 text-white font-bold ring-2 ring-amber-300/40">
                <BookOpen className="w-6 h-6 text-amber-950" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-amber-100 flex items-center gap-1.5">
                  Thiệp Điện Tử AI <span className="text-amber-400">– Tri Ân 20/11</span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-amber-200/80 font-medium">
                Chào mừng Ngày Nhà giáo Việt Nam 20/11 • Gửi trực tiếp từ Gmail cá nhân
              </p>
            </div>
          </div>

          {/* Right Area: Google Account & Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
            {/* Google / Gmail Sign In Area */}
            {currentUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-amber-300/30 text-white shadow-sm">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full border border-amber-300 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-amber-950 font-bold flex items-center justify-center text-xs">
                    {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left leading-tight pr-1">
                  <div className="font-bold text-amber-200 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{currentUser.displayName || 'Tài khoản Google'}</span>
                  </div>
                  <div className="text-[11px] text-amber-100/80 truncate max-w-[150px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  title="Đăng xuất tài khoản Gmail"
                  className="p-1.5 rounded-lg hover:bg-white/20 text-amber-200 hover:text-white transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-semibold shadow-md transition-all hover:shadow-lg cursor-pointer border border-stone-200 active:scale-95"
              >
                {/* Official Google Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập Gmail'}</span>
              </button>
            )}

            {/* Viber Bot Guide Button */}
            <button
              onClick={onOpenViberGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/60 hover:bg-purple-800/80 border border-purple-400/40 text-purple-200 transition-all font-medium cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-purple-300" />
              <span>Mô hình Viber Bot</span>
            </button>

            {/* Local Run Guide Button */}
            <button
              onClick={onOpenLocalGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 border border-stone-600/50 text-stone-200 transition-all font-medium cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-stone-300" />
              <span>Chạy Local</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

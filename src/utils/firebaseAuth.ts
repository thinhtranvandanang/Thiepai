import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import rawFirebaseConfig from '../../firebase-applet-config.json';

/**
 * 1. Kiểm tra và chuẩn hóa cấu hình Firebase Config
 * Hỗ trợ nạp từ biến môi trường VITE_ hoặc fallback về file cấu hình json.
 * Đảm bảo authDomain luôn có dạng ten-project.firebaseapp.com
 */
const projectId =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
  rawFirebaseConfig.projectId ||
  '';

const rawAuthDomain =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
  rawFirebaseConfig.authDomain ||
  '';

// Đảm bảo authDomain luôn đúng dạng ten-project.firebaseapp.com
const authDomain =
  rawAuthDomain && rawAuthDomain.includes('.firebaseapp.com')
    ? rawAuthDomain
    : projectId
    ? `${projectId}.firebaseapp.com`
    : '';

export const firebaseConfig = {
  apiKey:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    rawFirebaseConfig.apiKey ||
    '',
  authDomain: authDomain,
  projectId: projectId,
  appId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    rawFirebaseConfig.appId ||
    '',
  storageBucket:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    rawFirebaseConfig.storageBucket ||
    (projectId ? `${projectId}.firebasestorage.app` : ''),
  messagingSenderId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    rawFirebaseConfig.messagingSenderId ||
    '',
};

// Kiểm tra tính hợp lệ của các trường cấu hình bắt buộc
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error(
    'Lỗi Firebase: Cấu hình thiếu các thông tin bắt buộc (apiKey, projectId, appId). Vui lòng kiểm tra file firebase-applet-config.json hoặc biến môi trường.'
  );
}

// Khởi tạo Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Cấu hình Google Auth Provider với quyền gửi Gmail
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'online',
});

// Cờ chống race condition trong lúc gọi đăng nhập
let isSigningIn = false;

// Bộ nhớ đệm token truy cập trong phiên làm việc
let cachedAccessToken: string | null = null;
const STORAGE_TOKEN_KEY = 'thiep_ai_cached_gmail_access_token';

/**
 * 3. Chuyển đổi mã lỗi Firebase thành thông báo tiếng Việt dễ hiểu
 */
export const getFriendlyAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || '';
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'tên miền của bạn';

  // Lỗi tên miền chưa được cấp phép trong Firebase Auth (auth/unauthorized-domain)
  if (code === 'auth/unauthorized-domain' || message.includes('auth/unauthorized-domain')) {
    return `Tên miền hiện tại ("${currentHostname}") chưa được thêm vào danh sách cho phép (Authorized domains) của Firebase Auth. Hướng dẫn khắc phục: Vào Firebase Console > Dự án "${firebaseConfig.projectId || 'của bạn'}" > Authentication > Settings > mục "Authorized domains" > Bấm "Add domain" và thêm: ${currentHostname}`;
  }

  // Lỗi trình duyệt chặn popup (auth/popup-blocked)
  if (
    code === 'auth/popup-blocked' ||
    message.includes('auth/popup-blocked') ||
    message.includes('popup-blocked')
  ) {
    return 'Trình duyệt đã chặn cửa sổ đăng nhập Popup của Google. Hệ thống đang tự động chuyển hướng đăng nhập (Redirect), hoặc bạn vui lòng bấm cho phép popup trên thanh địa chỉ trình duyệt.';
  }

  // Lỗi người dùng đóng popup trước khi hoàn tất (auth/popup-closed-by-user)
  if (
    code === 'auth/popup-closed-by-user' ||
    message.includes('auth/popup-closed-by-user')
  ) {
    return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất xác thực. Vui lòng bấm nút đăng nhập lại để tiếp tục.';
  }

  // Lỗi mạng hoặc mất kết nối (auth/network-request-failed)
  if (
    code === 'auth/network-request-failed' ||
    message.includes('auth/network-request-failed')
  ) {
    return 'Lỗi kết nối mạng khi liên lạc với máy chủ xác thực của Google. Vui lòng kiểm tra lại đường truyền Internet và thử lại.';
  }

  // Lỗi yêu cầu bị hủy do mở nhiều popup (auth/cancelled-popup-request)
  if (
    code === 'auth/cancelled-popup-request' ||
    message.includes('auth/cancelled-popup-request')
  ) {
    return 'Yêu cầu đăng nhập đã bị hủy do có một cửa sổ đăng nhập khác đang mở.';
  }

  // Lỗi chưa có trong Test Users của Google Cloud Console
  if (
    code === 'auth/access-denied' ||
    message.includes('access_denied') ||
    message.includes('verification process') ||
    message.includes('developer-approved testers')
  ) {
    return 'Tài khoản Gmail này chưa được thêm vào "Test Users" (Người dùng thử nghiệm) trên Google Cloud Console của dự án. Vui lòng thêm email vào danh sách Test Users hoặc dùng Tab 2 để gửi qua SMTP.';
  }

  return message || 'Đã xảy ra lỗi khi xác thực tài khoản Google. Vui lòng thử lại!';
};

/**
 * Khởi tạo listener lắng nghe trạng thái đăng nhập và xử lý getRedirectResult khi tải lại trang.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void,
  onError?: (errorMessage: string) => void
) => {
  // 2. Xử lý kết quả đăng nhập chuyển hướng (getRedirectResult) khi người dùng quay lại trang
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          try {
            sessionStorage.setItem(STORAGE_TOKEN_KEY, credential.accessToken);
          } catch {
            // bỏ qua nếu trình duyệt chặn sessionStorage
          }
        }
        if (onAuthSuccess) {
          onAuthSuccess(result.user, cachedAccessToken);
        }
      }
    })
    .catch((error) => {
      console.error('Lỗi sau khi chuyển hướng đăng nhập (getRedirectResult):', error);
      const friendlyMessage = getFriendlyAuthErrorMessage(error);
      if (onError) {
        onError(friendlyMessage);
      }
    });

  // Lắng nghe thay đổi trạng thái người dùng (onAuthStateChanged)
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        try {
          cachedAccessToken = sessionStorage.getItem(STORAGE_TOKEN_KEY);
        } catch {
          // bỏ qua
        }
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(STORAGE_TOKEN_KEY);
        } catch {
          // bỏ qua
        }
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * 2. Đăng nhập Google:
 * Ưu tiên signInWithPopup; nếu popup bị chặn hoặc lỗi auth/popup-blocked thì tự động
 * chuyển sang signInWithRedirect. Bắt lỗi try/catch với thông báo tiếng Việt thân thiện.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result;

    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupError: any) {
      const code = popupError?.code || '';
      const message = popupError?.message || '';

      // Tự động chuyển sang signInWithRedirect nếu popup bị chặn
      if (
        code === 'auth/popup-blocked' ||
        message.includes('popup-blocked') ||
        message.includes('blocked by the browser')
      ) {
        console.warn('Cửa sổ Popup bị trình duyệt chặn, tự động chuyển sang chế độ chuyển hướng (signInWithRedirect)...');
        await signInWithRedirect(auth, provider);
        return null; // Trình duyệt sẽ chuyển hướng sang trang đăng nhập Google
      }

      // Các lỗi khác (unauthorized-domain, popup-closed-by-user, network,...) thì ném tiếp để xử lý
      throw popupError;
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không thể lấy mã truy cập OAuth (Access Token) từ tài khoản Google.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      sessionStorage.setItem(STORAGE_TOKEN_KEY, credential.accessToken);
    } catch {
      // bỏ qua
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi trong quá trình đăng nhập Google:', error);
    const friendlyMessage = getFriendlyAuthErrorMessage(error);
    const customError = new Error(friendlyMessage);
    (customError as any).code = error?.code;
    (customError as any).originalError = error;
    throw customError;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Lấy token truy cập OAuth từ bộ nhớ đệm
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(STORAGE_TOKEN_KEY);
      if (stored) {
        cachedAccessToken = stored;
        return stored;
      }
    } catch {
      // bỏ qua
    }
  }
  return null;
};

/**
 * Đăng xuất tài khoản và xóa token
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_TOKEN_KEY);
      } catch {
        // bỏ qua
      }
    }
  }
};

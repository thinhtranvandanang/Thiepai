import React, { useState } from 'react';
import { X, Bot, ArrowRight, Code2, Copy, Check, MessageSquare, Send, Sparkles } from 'lucide-react';

interface ViberBotGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ViberBotGuideModal: React.FC<ViberBotGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const viberCodeSample = `/**
 * viber-bot-server.js
 * Triển khai Bot Viber "Thiệp Tri Ân 20/11"
 * Yêu cầu: npm install viber-bot express axios
 */

const { Bot, Events, Message } = require('viber-bot');
const express = require('express');
const axios = require('axios');

const TextMessage = Message.Text;
const PictureMessage = Message.Picture;

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

const bot = new Bot({
  authToken: process.env.VIBER_BOT_TOKEN,
  name: "Tri Ân 20/11 Bot",
  avatar: "https://example.com/teacher-day-avatar.png"
});

// Trạng thái hội thoại đơn giản của từng người dùng
const userSessions = new Map();

bot.on(Events.SUBSCRIBED, response => {
  response.send(new TextMessage("Chào bạn! Hãy cùng gửi thiệp tri ân 20/11 đến Thầy/Cô nhé! Vui lòng nhập Tên Thầy/Cô:"));
  userSessions.set(response.userProfile.id, { step: 'WAITING_TEACHER_NAME' });
});

bot.on(Events.MESSAGE_RECEIVED, async (message, response) => {
  const userId = response.userProfile.id;
  const session = userSessions.get(userId) || { step: 'WAITING_TEACHER_NAME' };
  const text = message.text;

  if (session.step === 'WAITING_TEACHER_NAME') {
    session.teacher_name = text;
    session.step = 'WAITING_SUBJECT';
    userSessions.set(userId, session);
    return response.send(new TextMessage(\`Thầy/Cô \${text} dạy bộ môn nào vậy bạn?\`));
  }

  if (session.step === 'WAITING_SUBJECT') {
    session.subject = text;
    session.step = 'WAITING_TONE';
    userSessions.set(userId, session);
    
    return response.send(new TextMessage(
      "Chọn phong cách lời chúc:\\n1. Cảm động\\n2. Hài hước\\n3. Trang trọng\\n4. Thơ lục bát"
    ));
  }

  if (session.step === 'WAITING_TONE') {
    const toneMap = { '1': 'cam_dong', '2': 'hai_huoc', '3': 'trang_trong', '4': 'tho_luc_bat' };
    const tone = toneMap[text] || 'cam_dong';

    response.send(new TextMessage("AI đang dệt lời chúc và vẽ thiệp 20/11, xin đợi giây lát... ✨"));

    try {
      // 1. Gọi backend AI Studio để tạo lời chúc
      const aiRes = await axios.post(\`\${BACKEND_API_URL}/api/generate-greeting\`, {
        teacher_name: session.teacher_name,
        subject: session.subject,
        tone: tone,
        sender_name: response.userProfile.name
      });

      const card = aiRes.data.data;
      
      // 2. Gửi lời chúc văn bản
      await response.send(new TextMessage(\`💌 \${card.card_title}\\n\\n\${card.greeting_text}\`));

      // 3. Gửi ảnh thiệp qua Viber PictureMessage
      // (Trong thực tế: lưu ảnh render vào public CDN hoặc gửi base64/URL công khai)
      const imageUrl = \`\${BACKEND_API_URL}/api/render-card-image?title=\${encodeURIComponent(card.card_title)}&teacher=\${encodeURIComponent(session.teacher_name)}\`;
      
      await response.send(new PictureMessage(imageUrl, "Tấm thiệp tri ân 20/11 gửi tặng Thầy/Cô"));

      // 4. Tùy chọn gửi email (nếu học sinh muốn gửi trực tiếp)
      await response.send(new TextMessage(
        "Bạn có muốn gửi thiệp này tới email của Thầy/Cô không? Nếu có, hãy nhập địa chỉ email Thầy/Cô nhé!"
      ));
      session.step = 'OPTIONAL_EMAIL';
      session.cardData = card;
      userSessions.set(userId, session);
    } catch (err) {
      response.send(new TextMessage("Đã có lỗi khi tạo thiệp. Vui lòng thử lại bằng lệnh /start"));
      userSessions.delete(userId);
    }
  }
});

const app = express();
app.use("/viber/webhook", bot.middleware());
app.listen(8080, () => {
  console.log("Viber Bot webhook dang chay tai port 8080");
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-purple-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-700/60 flex items-center justify-center text-purple-200 border border-purple-400/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-purple-50">
                Kiến Trúc & Tích Hợp Viber Bot
              </h3>
              <p className="text-xs text-purple-200/80">
                Nhận input từ chat Viber → Gọi AI tạo ảnh thiệp → Trả ảnh trực tiếp qua tin nhắn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800 text-sm">
          {/* Workflow Diagram */}
          <div>
            <h4 className="font-bold text-base text-purple-950 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Quy Trình Hoạt Động (Workflow)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Viber Chatbot
                </div>
                <p className="text-stone-600">
                  Người dùng chat với Bot: Nhập tên Thầy/Cô, Môn học, Chọn phong cách lời chúc.
                </p>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 text-indigo-900 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Backend AI Studio
                </div>
                <p className="text-stone-600">
                  Bot gọi API <code className="bg-white px-1 py-0.5 rounded text-[11px]">/api/generate-greeting</code> kích hoạt Gemini 3.8 Flash.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  Vẽ Ảnh Thiệp
                </div>
                <p className="text-stone-600">
                  Backend sinh ảnh thiệp (bảng phấn, hoa sen, vintage) độ phân giải chuẩn.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  Gửi Tin Nhắn Viber
                </div>
                <p className="text-stone-600">
                  Bot gửi PictureMessage trả lại ảnh thiệp cho học sinh. Tùy chọn gửi email nếu muốn!
                </p>
              </div>
            </div>
          </div>

          {/* Key Viber Architecture Points */}
          <div className="space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-700">
            <h5 className="font-bold text-stone-900 text-sm">Ghi chú kỹ thuật khi tích hợp Viber Bot:</h5>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              <li>
                <strong>Đăng ký Token:</strong> Tạo Viber Bot tại{' '}
                <span className="font-mono text-purple-700">partners.viber.com</span> để nhận{' '}
                <code className="bg-stone-200 px-1 py-0.5 rounded">VIBER_BOT_TOKEN</code>.
              </li>
              <li>
                <strong>Webhook bắt buộc HTTPS:</strong> Viber yêu cầu Webhook phải chạy qua SSL (HTTPS). Khi chạy thử nghiệm local, bạn có thể dùng{' '}
                <code className="bg-stone-200 px-1 py-0.5 rounded">ngrok http 8080</code> để cấp tunnel HTTPS.
              </li>
              <li>
                <strong>Định dạng ảnh gửi qua Viber:</strong> Viber hỗ trợ{' '}
                <code className="bg-stone-200 px-1 py-0.5 rounded">PictureMessage(mediaUrl, text)</code> với URL ảnh công khai định dạng PNG/JPEG dưới 1MB.
              </li>
              <li>
                <strong>Email là tùy chọn:</strong> Nếu người dùng không nhập email, bot chỉ gửi ảnh trực tiếp trong hội thoại Viber để học sinh tự lưu hoặc chia sẻ lên nhóm lớp.
              </li>
            </ul>
          </div>

          {/* Code Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-purple-600" />
                Mã nguồn mẫu Node.js cho Viber Bot (viber-bot-server.js):
              </span>
              <button
                type="button"
                onClick={() => handleCopy(viberCodeSample, 1)}
                className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
              >
                {copiedIndex === 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-stone-900 text-stone-100 rounded-xl text-xs font-mono overflow-x-auto max-h-64 leading-relaxed border border-stone-700">
              {viberCodeSample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-800 hover:bg-purple-900 transition-colors cursor-pointer"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

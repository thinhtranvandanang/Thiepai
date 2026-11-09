import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import nodemailer, { type Transporter } from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for sending 1080x1440 PNG base64 in emails
app.use(express.json({ limit: '35mb' }));

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        error: 'Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau giây lát!',
      });
    }

    entry.count += 1;
    next();
  };
}

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Lỗi khởi tạo Gemini SDK:', err);
  }
}

// Check SMTP configuration
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass && !host.includes('example.com') && !user.includes('example.com')) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }
  return null;
}

// Custom user-provided SMTP transporter (e.g. Gmail App Password provided by user)
function getCustomSmtpTransporter(custom?: { host?: string; port?: number; user?: string; pass?: string }) {
  if (custom && custom.host && custom.user && custom.pass) {
    const isGmail = custom.host.includes('gmail');
    const port = custom.port ? parseInt(String(custom.port), 10) : (isGmail ? 465 : 587);
    const secure = port === 465;
    return nodemailer.createTransport({
      host: custom.host.trim(),
      port,
      secure,
      auth: {
        user: custom.user.trim(),
        pass: custom.pass.trim(),
      },
    });
  }
  return null;
}

// Cached Ethereal test transporter for Demo mode so users can view the actual email live
let etherealTransporter: Transporter | null = null;
async function getEtherealTransporter() {
  if (!etherealTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return etherealTransporter;
}

// API: Check system status (SMTP configured, Gemini configured)
app.get('/api/system-status', (_req: Request, res: Response) => {
  const isSmtpConfigured = Boolean(getSmtpTransporter());
  const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    geminiReady: isGeminiConfigured,
    smtpReady: isSmtpConfigured,
    smtpHost: isSmtpConfigured ? process.env.SMTP_HOST : null,
    smtpUser: isSmtpConfigured && process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
    demoMailboxAvailable: true,
  });
});

// API: Generate 20/11 Greeting Card Content with Gemini
app.post('/api/generate-greeting', rateLimiter(20, 60 * 1000), async (req: Request, res: Response) => {
  try {
    const { teacher_name, subject, tone = 'cam_dong', sender_name = '', class_name = '', memory = '' } = req.body;

    // Validation
    if (!teacher_name || typeof teacher_name !== 'string' || !teacher_name.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tên thầy/cô giáo!' });
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập môn học thầy/cô giảng dạy!' });
    }

    if (teacher_name.length > 80 || subject.length > 80) {
      return res.status(400).json({ error: 'Tên hoặc môn học vượt quá độ dài cho phép (tối đa 80 ký tự).' });
    }
    if (sender_name && sender_name.length > 80) {
      return res.status(400).json({ error: 'Tên người gửi vượt quá 80 ký tự.' });
    }
    if (class_name && class_name.length > 80) {
      return res.status(400).json({ error: 'Tên lớp vượt quá 80 ký tự.' });
    }
    if (memory && memory.length > 600) {
      return res.status(400).json({ error: 'Kỷ niệm chia sẻ vượt quá 600 ký tự.' });
    }

    const toneDescriptions: Record<string, string> = {
      cam_dong: 'Chân thành, xúc động, sâu lắng, gợi nhớ công ơn dạy dỗ và sự tận tụy như người cha người mẹ thứ hai.',
      hai_huoc: 'Dí dỏm, thông minh, hóm hỉnh, liên hệ hài hước đến môn học, bài kiểm tra, lời dặn dò trên lớp mà vẫn giữ sự tôn kính.',
      trang_trong: 'Trang nghiêm, kính cẩn, chuẩn mực sư phạm, dùng từ ngữ thanh tao, tri ân sâu sắc truyền thống tôn sư trọng đạo.',
      tho_luc_bat: 'Thơ lục bát hoặc thơ 4-7 chữ ngọt ngào, đậm chất văn học Việt Nam, vần điệu tha thiết về phấn trắng bảng đen.',
      tuoi_hoc_tro: 'Tinh nghịch, trong sáng, ấm áp hồn nhiên tuổi học trò, tái hiện khoảnh khắc rộn rã sân trường và tấm lòng tri ân chân phương.',
    };

    const selectedToneDesc = toneDescriptions[tone] || toneDescriptions.cam_dong;

    // If Gemini API is available, call Gemini 3.8 Flash
    if (process.env.GEMINI_API_KEY) {
      try {
        const client = geminiClient || new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `Bạn là một chuyên gia sáng tác và viết thư tri ân Ngày Nhà giáo Việt Nam 20/11 với văn phong tiếng Việt truyền cảm, giàu cảm xúc và đậm chất văn học.
Hãy tạo nội dung thiệp chúc mừng 20/11 theo các thông tin sau:
- Thầy/Cô: ${teacher_name.trim()}
- Bộ môn: ${subject.trim()}
- Phong cách / Giọng điệu: ${selectedToneDesc}
- Người gửi: ${sender_name.trim() || 'Học trò'}
- Lớp: ${class_name.trim() || 'Niên khóa dấu yêu'}
- Kỷ niệm / Lời nhắn riêng: ${memory.trim() || 'Không có kỷ niệm cụ thể, hãy viết về những bài giảng say mê và sự ân cần trên bục giảng'}

Yêu cầu cụ thể:
1. "card_title": Tiêu đề thiệp ngắn gọn (4-8 từ), trang trọng hoặc ấn tượng (ví dụ: "Lời Tri Ân Gửi Người Gieo Hạt", "Bụi Phấn Còn Vương Bước Đường",...).
2. "greeting_text": Đoạn văn chúc mừng trên thiệp chính (khoảng 3 đến 5 câu súc tích hoặc một đoạn thơ 4-8 câu tùy tone). Cực kỳ trau chuốt, ấm áp, lồng ghép khéo léo môn học ${subject.trim()}${memory.trim() ? ' và kỷ niệm đã nêu' : ''}.
3. "short_version": Câu đề tựa hoặc lời chúc cô đọng 1-2 câu.
4. "image_prompt": Mô tả phong cảnh nền thiệp bằng tiếng Anh phù hợp (ví dụ: "A poetic chalkboard with elegant chalk calligraphy, subtle lotus flower and red flamboyant petals, warm golden sunlight streaming through school classroom window, vintage aesthetic").
5. "email_subject": Tiêu đề thư gửi thầy/cô lịch sự, ấm áp, có tên thầy cô và ngày 20/11.
6. "email_body": Thư điện tử hoàn chỉnh, có lời thưa gửi lễ phép, đoạn tri ân, chúc sức khỏe và lời ký tên.`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Bạn là chuyên gia ngôn ngữ và sư phạm Việt Nam, am hiểu sâu sắc ngày 20/11 và tình thầy trò.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                card_title: { type: Type.STRING, description: 'Tiêu đề ngắn của tấm thiệp' },
                greeting_text: { type: Type.STRING, description: 'Lời chúc chính in trên thiệp' },
                short_version: { type: Type.STRING, description: 'Phiên bản lời chúc ngắn 1-2 câu' },
                image_prompt: { type: Type.STRING, description: 'Mô tả hình nền thiệp phù hợp' },
                email_subject: { type: Type.STRING, description: 'Tiêu đề email gửi thầy cô' },
                email_body: { type: Type.STRING, description: 'Toàn bộ nội dung email gửi kèm thiệp' },
              },
              required: ['card_title', 'greeting_text', 'short_version', 'image_prompt', 'email_subject', 'email_body'],
            },
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return res.json({
            success: true,
            data: parsed,
            source: 'gemini-3.8-flash',
          });
        }
      } catch (geminiError: any) {
        console.error('Lỗi khi gọi Gemini API, chuyển sang bộ sinh dự phòng thông minh:', geminiError?.message || geminiError);
      }
    }

    // High quality fallback generator if no API key or API temporarily unavailable
    const fallbackData = generateFallbackGreeting({
      teacher_name: teacher_name.trim(),
      subject: subject.trim(),
      tone,
      sender_name: sender_name.trim(),
      class_name: class_name.trim(),
      memory: memory.trim(),
    });

    return res.json({
      success: true,
      data: fallbackData,
      source: 'curated-generator',
    });
  } catch (error: any) {
    console.error('Lỗi tạo lời chúc:', error);
    return res.status(500).json({ error: 'Đã có lỗi xảy ra trong quá trình sinh lời chúc. Vui lòng thử lại!' });
  }
});

// Helper: Curated generator for instant fallback and high reliability
function generateFallbackGreeting({
  teacher_name,
  subject,
  tone,
  sender_name,
  class_name,
  memory,
}: {
  teacher_name: string;
  subject: string;
  tone: string;
  sender_name: string;
  class_name: string;
  memory: string;
}) {
  const who = sender_name ? (class_name ? `${sender_name} (Lớp ${class_name})` : sender_name) : (class_name ? `Tập thể lớp ${class_name}` : 'Chúng em');
  const memClause = memory ? ` Nhớ mãi kỷ niệm: "${memory}".` : '';

  if (tone === 'hai_huoc') {
    return {
      card_title: `Gửi Thầy/Cô ${teacher_name} - Thần tượng Môn ${subject}`,
      greeting_text: `Nhân ngày 20/11, chúng em xin kính chúc thầy/cô luôn giữ chỉ số hạnh phúc đạt cực đại, niềm vui không bao giờ tiệm cận về 0 và huyết áp luôn ổn định mỗi mùa chấm bài kiểm tra môn ${subject}! Cảm ơn thầy/cô vì những giờ học không bao giờ nhàm chán.${memClause}`,
      short_version: `Chúc thầy/cô môn ${subject} luôn vui vẻ, trẻ trung và mỗi kỳ thi điểm 10 bay phấp phới!`,
      image_prompt: 'Chalkboard with humorous cute math physics formulas, colorful chalk drawings, happy school vibes, high resolution',
      email_subject: `[Tri Ân 20/11] Lời chúc vui vẻ và biết ơn từ ${who} gửi Thầy/Cô ${teacher_name}`,
      email_body: `Kính gửi Thầy/Cô ${teacher_name},\n\nNhân ngày Nhà giáo Việt Nam 20/11, em/chúng em xin gửi tới Thầy/Cô tấm thiệp tri ân cùng lời chúc dồi dào sức khỏe, luôn dạt dào năng lượng và ngập tràn niềm vui bên bục giảng môn ${subject}!\n\n${memClause}\n\nKính chúc Thầy/Cô một ngày lễ thật ý nghĩa!\n\nHọc trò,\n${who}`,
    };
  }

  if (tone === 'tho_luc_bat') {
    return {
      card_title: `Khúc Ca Bụi Phấn Tri Ân Thầy/Cô ${teacher_name}`,
      greeting_text: `Bao mùa chở chuyến đò ngang,\nBao trang giáo án nồng nàn yêu thương.\nMôn ${subject} chắp cánh muôn phương,\nBụi bay mái tóc còn vương ân tình.\nKính chúc thầy/cô mãi an khang, tràn đầy nhiệt huyết trên bục giảng!${memClause}`,
      short_version: `Bụi phấn bay bay vương mái tóc - Lòng trò mãi nhớ chuyến đò xưa. Kính chúc Thầy/Cô 20/11 vạn sự như ý!`,
      image_prompt: 'Poetic Vietnamese landscape with red flamboyant flowers, vintage fountain pen on an open notebook, soft golden sunlight, traditional elegance',
      email_subject: `[20/11 Tri Ân] Kính tặng Thầy/Cô ${teacher_name} - Người lái đò tận tụy`,
      email_body: `Kính gửi Thầy/Cô ${teacher_name},\n\n"Một nét chữ, một tấm lòng\nMênh mông tri thức gửi từng trang thơ."\n\nNhân ngày 20/11, ${who} xin kính gửi đến Thầy/Cô tấm lòng biết ơn sâu sắc nhất cho những bài học môn ${subject} quý giá và sự dìu dắt bao dung.${memClause}\n\nKính chúc Thầy/Cô luôn dồi dào sức khỏe và hạnh phúc viên mãn.\n\nHọc trò,\n${who}`,
    };
  }

  if (tone === 'trang_trong') {
    return {
      card_title: `Tri Ân Tôn Sư Trọng Đạo - Thầy/Cô ${teacher_name}`,
      greeting_text: `Nhân Ngày Nhà giáo Việt Nam 20/11, em xin bày tỏ lòng tri ân sâu sắc nhất tới thầy/cô. Cảm ơn thầy/cô đã trao gửi tri thức môn ${subject}, uốn nắn nhân cách và truyền cảm hứng sống cao đẹp cho bao thế hệ học trò. Kính chúc thầy/cô luôn dồi dào sức khỏe, an khang và thành công trên con đường trồng người.${memClause}`,
      short_version: `Kính chúc Thầy/Cô luôn mạnh khỏe, thanh tâm và mãi là ngọn hải đăng soi sáng tri thức cho chúng em.`,
      image_prompt: 'Prestigious award and scroll with golden lotus emblem, chalkboard background with neat Vietnamese calligraphy, dignified and elegant',
      email_subject: `Kính gửi lời tri ân sâu sắc nhân ngày 20/11 tới Thầy/Cô ${teacher_name}`,
      email_body: `Kính gửi Thầy/Cô ${teacher_name},\n\nNhân dịp kỷ niệm Ngày Nhà giáo Việt Nam 20/11, ${who} xin trân trọng gửi tới Thầy/Cô lời chúc mừng tốt đẹp và lòng biết ơn chân thành nhất.\n\nKính chúc Thầy/Cô luôn mạnh khỏe, hạnh phúc và gặt hái thêm nhiều thành tựu rực rỡ trong sự nghiệp trồng người cao quý.\n\nKính thư,\n${who}`,
    };
  }

  // Default / Cảm động
  return {
    card_title: `Lời Tri Ân Gửi Người Thầy/Cô ${teacher_name} Kính Yêu`,
    greeting_text: `Có một nghề bụi phấn bám đầy tay, người ta bảo là nghề trong sạch nhất. Cảm ơn thầy/cô vì từng bài giảng môn ${subject} tâm huyết, từng ánh mắt động viên và sự kiên nhẫn chở che suốt năm tháng học trò. Kính chúc thầy/cô một ngày 20/11 ngập tràn hoa thắm, bình an và hạnh phúc!${memClause}`,
    short_version: `Cảm ơn Thầy/Cô đã chắp cánh ước mơ và thắp sáng niềm tin trong chúng em. Chúc Thầy/Cô 20/11 an yên trọn vẹn!`,
    image_prompt: 'Chalkboard with chalkboard texture, fresh roses and chalk dust, warm glow from window, heartwarming nostalgic atmosphere',
    email_subject: `[20/11 Yêu Thương] Lời tri ân chân thành gửi Thầy/Cô ${teacher_name}`,
    email_body: `Kính gửi Thầy/Cô ${teacher_name},\n\nNhân ngày Nhà giáo Việt Nam 20/11, em xin gửi tới Thầy/Cô tấm thiệp nhỏ này như lời cảm ơn chân thành tự đáy lòng. Cảm ơn Thầy/Cô đã dìu dắt chúng em trong môn ${subject} và trao cho chúng em niềm say mê học tập.\n\n${memClause}\n\nKính chúc Thầy/Cô luôn dồi dào sức khỏe, tràn đầy niềm vui và giữ mãi ngọn lửa nhiệt huyết với bảng đen, phấn trắng.\n\nHọc trò của Thầy/Cô,\n${who}`,
  };
}

// API: Send Greeting Card via Email
app.post('/api/send-email', rateLimiter(25, 5 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const {
      to,
      teacher_name,
      subject,
      email_body,
      image_base64,
      sender_name = '',
      sender_email = '',
      custom_smtp,
    } = req.body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !emailRegex.test(to.trim())) {
      return res.status(400).json({ error: 'Địa chỉ email thầy/cô không hợp lệ! Vui lòng kiểm tra lại.' });
    }

    if (!teacher_name || !image_base64) {
      return res.status(400).json({ error: 'Thiếu thông tin thiệp hoặc hình ảnh thiệp.' });
    }

    // Prepare image buffer from base64
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 1. Check if user passed their own custom SMTP credentials or server has SMTP configured
    const userCustomTransporter = getCustomSmtpTransporter(custom_smtp);
    const serverTransporter = getSmtpTransporter();
    const activeRealTransporter = userCustomTransporter || serverTransporter;

    // Notice: We strictly adhere to privacy rules - NEVER log the recipient's email address in console or storage!
    console.log(
      `[Email Service - SMTP] Xử lý gửi thiệp 20/11 cho thầy/cô: "${teacher_name}" từ học trò "${
        sender_name || 'Học trò'
      }". Phương thức: ${activeRealTransporter ? 'SMTP Thật' : 'Hộp thư Thử nghiệm Ethereal (Demo Live)'}.`
    );

    // HTML Email Template with embedded inline card image and warm greeting
    const fromAddress = activeRealTransporter
      ? (custom_smtp?.user ? `"${sender_name || 'Tri Ân 20/11'}" <${custom_smtp.user}>` : (process.env.EMAIL_FROM || `Thiệp Tri Ân 20/11 <${process.env.SMTP_USER}>`))
      : `"${sender_name || 'Thiệp Tri Ân 20/11'}" <demo@ethereal.email>`;

    const mailOptions: any = {
      from: fromAddress,
      to: to.trim(),
      subject: subject || `Tri ân Ngày Nhà giáo Việt Nam 20/11 - Kính gửi Thầy/Cô ${teacher_name}`,
      text: email_body || `Kính gửi Thầy/Cô ${teacher_name}, chúc mừng Ngày Nhà giáo Việt Nam 20/11!`,
      html: `
        <div style="max-width: 650px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #b45309, #d97706, #92400e); padding: 24px; text-align: center; color: #ffffff;">
            <p style="text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0; font-size: 13px; opacity: 0.9;">Tri Ân Ngày Nhà Giáo Việt Nam</p>
            <h1 style="margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">20 THÁNG 11</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; font-style: italic;">"Nghề giáo là nghề cao quý nhất trong những nghề cao quý"</p>
          </div>
          
          <div style="padding: 28px 24px; color: #374151; font-size: 15px; line-height: 1.7;">
            <p style="font-weight: 600; color: #92400e; font-size: 17px; margin-top: 0;">Kính gửi Thầy/Cô: ${teacher_name},</p>
            <div style="white-space: pre-line; background-color: #ffffff; padding: 18px 20px; border-left: 4px solid #d97706; border-radius: 6px; margin: 16px 0;">
              ${(email_body || '').replace(/\n/g, '<br/>')}
            </div>

            <p style="text-align: center; font-weight: 600; color: #78350f; margin-top: 24px; margin-bottom: 12px;">
              💌 Tấm thiệp điện tử đặc biệt gửi tặng Thầy/Cô:
            </p>

            <div style="text-align: center; margin: 16px 0;">
              <img src="cid:thiep2011" alt="Thiệp Tri Ân 20/11" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.15); border: 2px solid #fcd34d;" />
            </div>

            <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
              (Tấm thiệp độ phân giải cao 1080x1440 cũng đã được đính kèm trực tiếp trong tệp đính kèm của email này).
            </p>

            ${sender_email ? `
            <div style="margin-top: 20px; padding: 12px 16px; background-color: #fef3c7; border-radius: 8px; font-size: 13px; color: #78350f;">
              📨 <strong>Phản hồi cho học trò:</strong> Thầy/Cô có thể bấm nút "Trả lời (Reply)" thư này để gửi phản hồi trực tiếp tới email của học trò: <strong>${sender_email}</strong>.
            </div>
            ` : ''}
          </div>

          <div style="background-color: #fef3c7; border-top: 1px solid #fde68a; padding: 16px; text-align: center; font-size: 13px; color: #92400e;">
            Thiệp được gửi từ <strong>Hệ thống Thiệp điện tử Tri Ân 20/11</strong> • Tôn sư trọng đạo
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Thiep_Tri_An_20_11_${teacher_name.replace(/\s+/g, '_')}.png`,
          content: imageBuffer,
          cid: 'thiep2011', // Inline image in html
        },
      ],
    };

    if (sender_email && emailRegex.test(sender_email.trim())) {
      mailOptions.replyTo = sender_name ? `"${sender_name}" <${sender_email.trim()}>` : sender_email.trim();
    }

    // 2A. If Real SMTP is available (Server ENV or User custom SMTP)
    if (activeRealTransporter) {
      const info = await activeRealTransporter.sendMail(mailOptions);
      console.log(`[Email Service] Gửi thành công thư thật tới người nhận với Message ID: ${info.messageId}`);
      return res.json({
        success: true,
        mode: 'real_smtp',
        messageId: info.messageId,
        message: `Thiệp tri ân và email đã được chuyển phát thành công qua máy chủ SMTP tới hộp thư của Thầy/Cô! Thầy cô có thể trả lời trực tiếp về email của bạn.`,
        details: {
          recipientName: teacher_name,
          recipientEmail: to.trim(),
          senderName: sender_name || 'Học trò',
          senderEmail: sender_email || null,
          subject: subject || `Lời chúc mừng Ngày Nhà giáo Việt Nam 20/11`,
          messageId: info.messageId,
          hasAttachment: true,
          sizeKb: Math.round(imageBuffer.length / 1024),
        },
      });
    }

    // 2B. If No Real SMTP is configured on server -> Send via Ethereal test mailbox with instant Preview URL
    const ethereal = await getEtherealTransporter();
    const info = await ethereal.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`[Email Service - Ethereal] Thư thử nghiệm tạo thành công. Preview URL: ${previewUrl}`);

    return res.json({
      success: true,
      mode: 'demo_ethereal',
      previewUrl: previewUrl || undefined,
      messageId: info.messageId,
      message: `Hệ thống đã chuyển phát thành công bức thư vào Hộp Thư Thử Nghiệm Trực Tuyến (Ethereal Preview)! Bạn có thể bấm vào nút "Xem Thư Thật Tại Ethereal" bên dưới để xem tận mắt giao diện thư và thiệp đính kèm.`,
      details: {
        recipientName: teacher_name,
        recipientEmail: to.trim(),
        senderName: sender_name || 'Học trò',
        senderEmail: sender_email || null,
        subject: subject || `Lời chúc mừng Ngày Nhà giáo Việt Nam 20/11`,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined,
        hasAttachment: true,
        sizeKb: Math.round(imageBuffer.length / 1024),
      },
    });
  } catch (error: any) {
    console.error('Lỗi khi gửi email qua SMTP:', error?.message || error);
    return res.status(500).json({
      error: `Không thể gửi email: ${error?.message || 'Lỗi kết nối máy chủ thư điện tử'}. Vui lòng kiểm tra lại thông tin SMTP trong cấu hình.`,
    });
  }
});

// API: Send Greeting Card via official Gmail API using user's logged in OAuth access token
app.post('/api/send-gmail', rateLimiter(12, 5 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa có mã ủy quyền Gmail (Access Token). Vui lòng đăng nhập Gmail!' });
    }
    const accessToken = authHeader.split(' ')[1];

    const { to, teacher_name, subject, email_body, image_base64, sender_name = '' } = req.body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !emailRegex.test(to.trim())) {
      return res.status(400).json({ error: 'Địa chỉ email thầy/cô không hợp lệ! Vui lòng kiểm tra lại.' });
    }

    if (!teacher_name || !image_base64) {
      return res.status(400).json({ error: 'Thiếu thông tin thiệp hoặc hình ảnh thiệp.' });
    }

    // 1. Get verified sender email via Google OAuth2 userinfo (supported by userinfo.email scope)
    let senderEmail = (req.body.sender_email || '').trim();

    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        if (userInfo.email) {
          senderEmail = userInfo.email;
        }
      } else {
        // Fallback: check tokeninfo endpoint
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
        if (tokenInfoRes.ok) {
          const tokenInfo = await tokenInfoRes.json();
          if (tokenInfo.email) {
            senderEmail = tokenInfo.email;
          }
        }
      }
    } catch (e) {
      console.warn('Lưu ý: Không thể lấy userinfo trước khi gửi, tiếp tục gửi trực tiếp qua Gmail API:', e);
    }

    // 2. Prepare clean base64 image data
    const cleanBase64 = image_base64.replace(/^data:image\/\w+;base64,/, '');

    // 3. Build HTML body
    const htmlContent = `
      <div style="max-width: 650px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #b45309, #d97706, #92400e); padding: 24px; text-align: center; color: #ffffff;">
          <p style="text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0; font-size: 13px; opacity: 0.9;">Tri Ân Ngày Nhà Giáo Việt Nam</p>
          <h1 style="margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">20 THÁNG 11</h1>
          <p style="margin: 8px 0 0 0; font-size: 15px; font-style: italic;">"Nghề giáo là nghề cao quý nhất trong những nghề cao quý"</p>
        </div>
        
        <div style="padding: 28px 24px; color: #374151; font-size: 15px; line-height: 1.7;">
          <p style="font-weight: 600; color: #92400e; font-size: 17px; margin-top: 0;">Kính gửi Thầy/Cô: ${teacher_name},</p>
          <div style="white-space: pre-line; background-color: #ffffff; padding: 18px 20px; border-left: 4px solid #d97706; border-radius: 6px; margin: 16px 0;">
            ${(email_body || '').replace(/\n/g, '<br/>')}
          </div>

          <p style="text-align: center; font-weight: 600; color: #78350f; margin-top: 24px; margin-bottom: 12px;">
            💌 Tấm thiệp điện tử đặc biệt gửi tặng Thầy/Cô:
          </p>

          <div style="text-align: center; margin: 16px 0;">
            <img src="cid:thiep2011" alt="Thiệp Tri Ân 20/11" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 6px 18px rgba(0,0,0,0.15); border: 2px solid #fcd34d;" />
          </div>

          <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
            (Thiệp độ phân giải cao 1080x1440 cũng đã được đính kèm trực tiếp trong tệp đính kèm của thư này).
          </p>
        </div>

        <div style="background-color: #fef3c7; border-top: 1px solid #fde68a; padding: 16px; text-align: center; font-size: 13px; color: #92400e;">
          Thư được gửi trực tiếp từ tài khoản Gmail: <strong>${senderEmail}</strong> • Hệ thống Thiệp điện tử Tri Ân 20/11
        </div>
      </div>
    `;

    // 4. Construct RFC 2822 Multipart MIME
    const mixedBoundary = '====mixed_' + Date.now() + '====';
    const relatedBoundary = '====related_' + Date.now() + '====';

    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject || `Tri ân 20/11 - Kính gửi Thầy/Cô ${teacher_name}`).toString('base64')}?=`;
    const fromName = sender_name ? `=?UTF-8?B?${Buffer.from(sender_name).toString('base64')}?=` : '';
    const fromHeader = fromName ? `${fromName} <${senderEmail}>` : senderEmail;

    const mimeLines = [
      `From: ${fromHeader}`,
      `To: ${to.trim()}`,
      `Subject: ${encodedSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      ``,
      `--${mixedBoundary}`,
      `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
      ``,
      `--${relatedBoundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlContent,
      ``,
      `--${relatedBoundary}`,
      `Content-Type: image/png; name="Thiep_Tri_An_20_11.png"`,
      `Content-ID: <thiep2011>`,
      `Content-Disposition: inline; filename="Thiep_Tri_An_20_11.png"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      cleanBase64,
      ``,
      `--${relatedBoundary}--`,
      ``,
      `--${mixedBoundary}--`,
    ].join('\r\n');

    // Base64URL encode for Gmail API
    const base64UrlMessage = Buffer.from(mimeLines, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 5. Send message via Gmail API
    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64UrlMessage }),
    });

    if (!sendRes.ok) {
      const errorJson = await sendRes.json().catch(() => ({}));
      console.error('Lỗi Gmail API messages.send:', errorJson);
      return res.status(sendRes.status).json({
        error: `Không thể gửi thư qua Gmail: ${errorJson?.error?.message || 'Lỗi cấp quyền Gmail API'}. Vui lòng thử lại.`,
      });
    }

    const sendResult = await sendRes.json();
    console.log(`[Gmail Service] Đã gửi thành công thư từ tài khoản Gmail người dùng, Message ID: ${sendResult.id}`);

    return res.json({
      success: true,
      mode: 'gmail_oauth',
      messageId: sendResult.id,
      senderEmail,
      message: `Thư tri ân và thiệp 20/11 đã được gửi thành công trực tiếp từ tài khoản Gmail của bạn (${senderEmail})! Thầy cô sẽ nhận được email xuất phát từ chính địa chỉ của bạn.`,
    });
  } catch (err: any) {
    console.error('Lỗi khi gửi qua Gmail API:', err);
    return res.status(500).json({
      error: `Lỗi máy chủ khi gửi qua Gmail: ${err?.message || 'Không rõ nguyên nhân'}`,
    });
  }
});

// Setup Vite middlewares in dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tri An 20/11 Server] Dang chay tai http://0.0.0.0:${PORT}`);
  });
}

startServer();

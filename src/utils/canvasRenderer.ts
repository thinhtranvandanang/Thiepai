import { CardThemeId } from '../types';

interface RenderOptions {
  themeId: CardThemeId;
  cardTitle: string;
  greetingText: string;
  teacherName: string;
  subject: string;
  senderName?: string;
  className?: string;
}

export function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1080;
  const height = 1440;
  canvas.width = width;
  canvas.height = height;

  ctx.save();

  switch (options.themeId) {
    case 'chalkboard':
      renderChalkboardTheme(ctx, width, height, options);
      break;
    case 'vintage_parchment':
      renderParchmentTheme(ctx, width, height, options);
      break;
    case 'lotus_red':
      renderLotusRedTheme(ctx, width, height, options);
      break;
    case 'warm_sunlight':
    default:
      renderWarmSunlightTheme(ctx, width, height, options);
      break;
  }

  ctx.restore();
}

/**
 * THEME 1: BẢNG ĐEN PHẤN TRẮNG
 */
function renderChalkboardTheme(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opt: RenderOptions
) {
  // 1. Khung viền gỗ bao quanh
  const frameWidth = 44;
  ctx.fillStyle = '#451a03'; // Gỗ sồi đậm
  ctx.fillRect(0, 0, w, h);

  // Vân gỗ viền
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // 2. Lòng bảng đen xanh rêu đậm
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 750);
  bgGrad.addColorStop(0, '#213329');
  bgGrad.addColorStop(0.7, '#16231c');
  bgGrad.addColorStop(1, '#0e1712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(frameWidth, frameWidth, w - frameWidth * 2, h - frameWidth * 2);

  // Bụi phấn mờ trên bảng
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let i = 0; i < 40; i++) {
    const rx = frameWidth + Math.random() * (w - frameWidth * 2);
    const ry = frameWidth + Math.random() * (h - frameWidth * 2);
    const rrad = 30 + Math.random() * 80;
    ctx.beginPath();
    ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Khung phấn trắng bên trong nét đứt/hoa văn
  ctx.save();
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(65, 65, w - 130, h - 130);
  ctx.setLineDash([]);
  ctx.restore();

  // Góc trang trí hoa văn phấn ở 4 góc
  drawChalkCorner(ctx, 80, 80, 1, 1);
  drawChalkCorner(ctx, w - 80, 80, -1, 1);
  drawChalkCorner(ctx, 80, h - 80, 1, -1);
  drawChalkCorner(ctx, w - 80, h - 80, -1, -1);

  // 3. Header: 20 THÁNG 11
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde047'; // Phấn vàng
  ctx.font = 'bold 30px "Patrick Hand", "Be Vietnam Pro", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('TRI ÂN NGÀY NHÀ GIÁO VIỆT NAM', w / 2, 135);
  ctx.letterSpacing = '0px';

  // Huy hiệu 20/11
  drawRibbonBadge(ctx, w / 2, 205, '20 • 11', '#f59e0b', '#78350f');

  // Lời đề tặng người nhận
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "Caveat", "Dancing Script", "Be Vietnam Pro", cursive';
  ctx.fillText(`Kính tặng Thầy/Cô: ${opt.teacherName}`, w / 2, 290);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 24px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`Bộ môn: ${opt.subject}`, w / 2, 335);

  // Đường kẻ phấn trang trí
  drawChalkDivider(ctx, w / 2, 365, 340);

  // Tiêu đề thiệp
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px "Patrick Hand", "Caveat", "Be Vietnam Pro", sans-serif';
  wrapText(ctx, `"${opt.cardTitle}"`, w / 2, 430, 860, 52, true);

  // Lời chúc chính
  ctx.fillStyle = '#f8fafc';
  ctx.font = '28px "Patrick Hand", "Caveat", "Be Vietnam Pro", sans-serif';
  const startGreetingY = 530;
  wrapText(ctx, opt.greetingText, w / 2, startGreetingY, 820, 48, true);

  // Footer: Học trò gửi & Châm ngôn
  drawChalkDivider(ctx, w / 2, h - 230, 400);

  const senderInfo = opt.senderName
    ? opt.className
      ? `Học trò: ${opt.senderName} • Lớp ${opt.className}`
      : `Học trò: ${opt.senderName}`
    : opt.className
    ? `Tập thể Lớp: ${opt.className}`
    : 'Học trò kính chúc';

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 32px "Caveat", "Dancing Script", cursive';
  ctx.fillText(senderInfo, w / 2, h - 170);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = 'italic 20px "Be Vietnam Pro", sans-serif';
  ctx.fillText('Nhất tự vi sư, bán tự vi sư • Uống nước nhớ nguồn', w / 2, h - 110);
}

/**
 * THEME 2: TRANG SÁCH & GIẤY PARCHMENT CỔ ĐIỂN
 */
function renderParchmentTheme(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opt: RenderOptions
) {
  // Nền giấy vintage mộc mạc
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#fefbf3');
  bg.addColorStop(0.5, '#fbf3dc');
  bg.addColorStop(1, '#f5e7c8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Viền hoa văn kim loại cổ
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, w - 104, h - 104);

  // Dấu triện đỏ 20/11 góc trên
  drawRedSeal(ctx, w - 130, 130, 'TRI ÂN\n20/11');

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 26px "Playfair Display", "Be Vietnam Pro", serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('TRI ÂN NGÀY NHÀ GIÁO VIỆT NAM', w / 2, 140);
  ctx.letterSpacing = '0px';

  // Huy hiệu
  drawRibbonBadge(ctx, w / 2, 210, '20 THÁNG 11', '#b45309', '#fef3c7');

  // Thầy Cô
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 38px "Dancing Script", "Playfair Display", cursive';
  ctx.fillText(`Kính gửi Thầy/Cô: ${opt.teacherName}`, w / 2, 300);

  ctx.fillStyle = '#451a03';
  ctx.font = '600 24px "Be Vietnam Pro", serif';
  ctx.fillText(`Bộ môn: ${opt.subject}`, w / 2, 345);

  drawVintageFloralDivider(ctx, w / 2, 385, 380, '#b45309');

  // Tiêu đề
  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 42px "Playfair Display", "Be Vietnam Pro", serif';
  wrapText(ctx, `"${opt.cardTitle}"`, w / 2, 450, 840, 54, true);

  // Lời chúc
  ctx.fillStyle = '#292524';
  ctx.font = '27px "Playfair Display", "Be Vietnam Pro", serif';
  wrapText(ctx, opt.greetingText, w / 2, 550, 820, 50, true);

  // Footer
  drawVintageFloralDivider(ctx, w / 2, h - 230, 400, '#b45309');

  const senderInfo = opt.senderName
    ? opt.className
      ? `Học trò kính dâng: ${opt.senderName} (${opt.className})`
      : `Học trò kính dâng: ${opt.senderName}`
    : opt.className
    ? `Tập thể Lớp: ${opt.className}`
    : 'Học trò kính dâng';

  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 34px "Dancing Script", cursive';
  ctx.fillText(senderInfo, w / 2, h - 165);

  ctx.fillStyle = '#78716c';
  ctx.font = 'italic 20px "Playfair Display", serif';
  ctx.fillText('Ân sư vĩnh ghi lòng • Nghĩa thầy ngàn năm nhớ', w / 2, h - 110);
}

/**
 * THEME 3: HOA SEN & THƯ PHÁP TRANG TRỌNG
 */
function renderLotusRedTheme(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opt: RenderOptions
) {
  // Nền đỏ thắm truyền thống
  const bg = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, 800);
  bg.addColorStop(0, '#991b1b');
  bg.addColorStop(0.7, '#7f1d1d');
  bg.addColorStop(1, '#450a0a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Khung mạ vàng hoàng gia
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  // Vẽ hoa sen cách điệu góc dưới
  drawLotusMotif(ctx, 130, h - 130, 60, '#fef08a');
  drawLotusMotif(ctx, w - 130, h - 130, 60, '#fef08a');

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 28px "Playfair Display", "Be Vietnam Pro", serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('TRI ÂN NGÀY NHÀ GIÁO VIỆT NAM', w / 2, 135);
  ctx.letterSpacing = '0px';

  // Huy hiệu vàng
  drawRibbonBadge(ctx, w / 2, 205, '20 • 11', '#fbbf24', '#78350f');

  // Thầy Cô
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px "Dancing Script", "Playfair Display", cursive';
  ctx.fillText(`Kính tặng Thầy/Cô: ${opt.teacherName}`, w / 2, 295);

  ctx.fillStyle = '#fde68a';
  ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`Bộ môn: ${opt.subject}`, w / 2, 340);

  // Divider vàng
  drawGoldDivider(ctx, w / 2, 375, 360);

  // Tiêu đề
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 44px "Dancing Script", "Playfair Display", cursive';
  wrapText(ctx, `"${opt.cardTitle}"`, w / 2, 445, 840, 54, true);

  // Lời chúc
  ctx.fillStyle = '#ffffff';
  ctx.font = '27px "Playfair Display", "Be Vietnam Pro", serif';
  wrapText(ctx, opt.greetingText, w / 2, 545, 820, 50, true);

  // Footer
  drawGoldDivider(ctx, w / 2, h - 230, 400);

  const senderInfo = opt.senderName
    ? opt.className
      ? `Học trò: ${opt.senderName} • Lớp ${opt.className}`
      : `Học trò: ${opt.senderName}`
    : opt.className
    ? `Tập thể Lớp: ${opt.className}`
    : 'Học trò kính chúc';

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 34px "Dancing Script", cursive';
  ctx.fillText(senderInfo, w / 2, h - 165);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = 'italic 20px "Be Vietnam Pro", sans-serif';
  ctx.fillText('Tôn sư trọng đạo • Đạo học ngàn thu toả sáng', w / 2, h - 110);
}

/**
 * THEME 4: ÁNH NẮNG BAN MAI & SÂN TRƯỜNG HIỆN ĐẠI
 */
function renderWarmSunlightTheme(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opt: RenderOptions
) {
  // Nền ấm áp gradient cam san hô - vàng mật ong
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#fffbeb');
  bg.addColorStop(0.3, '#fef3c7');
  bg.addColorStop(0.7, '#ffedd5');
  bg.addColorStop(1, '#fde68a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Khung viền thanh lịch
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, w - 100, h - 100);

  // Họa tiết cánh hoa mềm mại góc
  drawSunFlowerCorner(ctx, 110, 110);
  drawSunFlowerCorner(ctx, w - 110, 110);

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 26px "Be Vietnam Pro", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('TRI ÂN NGÀY NHÀ GIÁO VIỆT NAM', w / 2, 140);
  ctx.letterSpacing = '0px';

  // Huy hiệu 20/11
  drawRibbonBadge(ctx, w / 2, 210, '20 • 11', '#ea580c', '#ffffff');

  // Thầy Cô
  ctx.fillStyle = '#c2410c';
  ctx.font = 'bold 38px "Dancing Script", "Playfair Display", cursive';
  ctx.fillText(`Kính tặng Thầy/Cô: ${opt.teacherName}`, w / 2, 300);

  ctx.fillStyle = '#78350f';
  ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
  ctx.fillText(`Môn học: ${opt.subject}`, w / 2, 345);

  drawVintageFloralDivider(ctx, w / 2, 385, 360, '#ea580c');

  // Tiêu đề
  ctx.fillStyle = '#9a3412';
  ctx.font = 'bold 42px "Playfair Display", "Be Vietnam Pro", serif';
  wrapText(ctx, `"${opt.cardTitle}"`, w / 2, 450, 840, 54, true);

  // Lời chúc
  ctx.fillStyle = '#431407';
  ctx.font = '27px "Be Vietnam Pro", sans-serif';
  wrapText(ctx, opt.greetingText, w / 2, 550, 820, 50, true);

  // Footer
  drawVintageFloralDivider(ctx, w / 2, h - 230, 400, '#ea580c');

  const senderInfo = opt.senderName
    ? opt.className
      ? `Học trò kính chúc: ${opt.senderName} (${opt.className})`
      : `Học trò kính chúc: ${opt.senderName}`
    : opt.className
    ? `Tập thể Lớp: ${opt.className}`
    : 'Học trò kính chúc';

  ctx.fillStyle = '#c2410c';
  ctx.font = 'bold 34px "Dancing Script", cursive';
  ctx.fillText(senderInfo, w / 2, h - 165);

  ctx.fillStyle = '#9a3412';
  ctx.font = 'italic 20px "Be Vietnam Pro", sans-serif';
  ctx.fillText('Kính chúc Thầy/Cô luôn dồi dào sức khỏe, hạnh phúc và an vui!', w / 2, h - 110);
}

// ======================= HELPER DRAWING FUNCTIONS =======================

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  centered: boolean
): number {
  const paragraphs = text.split('\n');
  let currentY = y;

  for (const para of paragraphs) {
    if (!para.trim()) {
      currentY += lineHeight * 0.7;
      continue;
    }

    const words = para.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        if (centered) {
          ctx.fillText(line.trim(), x, currentY);
        } else {
          ctx.fillText(line.trim(), x - maxWidth / 2, currentY);
        }
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (centered) {
      ctx.fillText(line.trim(), x, currentY);
    } else {
      ctx.fillText(line.trim(), x - maxWidth / 2, currentY);
    }
    currentY += lineHeight;
  }

  return currentY;
}

function drawRibbonBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  bgColor: string,
  textColor: string
) {
  ctx.save();
  const bw = 200;
  const bh = 54;
  const radius = 27;

  // Background pill
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, cy - bh / 2, bw, bh, radius);
  ctx.fill();

  // Shadow / border
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 28px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '3px';
  ctx.fillText(label, cx, cy + 1);
  ctx.letterSpacing = '0px';

  ctx.restore();
}

function drawChalkDivider(ctx: CanvasRenderingContext2D, cx: number, cy: number, length: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - length / 2, cy);
  ctx.lineTo(cx + length / 2, cy);
  ctx.stroke();

  // Little diamond in center
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 6, cy);
  ctx.lineTo(cx, cy + 6);
  ctx.lineTo(cx - 6, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawChalkCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(0, 0);
  ctx.lineTo(30, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(8, 8, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
  ctx.fill();

  ctx.restore();
}

function drawVintageFloralDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  len: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(cx - len / 2, cy);
  ctx.lineTo(cx - 24, cy);
  ctx.moveTo(cx + 24, cy);
  ctx.lineTo(cx + len / 2, cy);
  ctx.stroke();

  // Decorative leaf / center icon
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - 14, cy, 3, 0, Math.PI * 2);
  ctx.arc(cx + 14, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGoldDivider(ctx: CanvasRenderingContext2D, cx: number, cy: number, len: number) {
  ctx.save();
  const grad = ctx.createLinearGradient(cx - len / 2, cy, cx + len / 2, cy);
  grad.addColorStop(0, 'rgba(251, 191, 36, 0.1)');
  grad.addColorStop(0.5, 'rgba(251, 191, 36, 1)');
  grad.addColorStop(1, 'rgba(251, 191, 36, 0.1)');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(cx - len / 2, cy);
  ctx.lineTo(cx + len / 2, cy);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRedSeal(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.roundRect(-42, -42, 84, 84, 16);
  ctx.fill();

  ctx.strokeStyle = '#fef2f2';
  ctx.lineWidth = 2;
  ctx.strokeRect(-36, -36, 72, 72);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = text.split('\n');
  if (lines.length > 1) {
    ctx.fillText(lines[0], 0, -10);
    ctx.fillText(lines[1], 0, 12);
  } else {
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

function drawLotusMotif(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;

  // Lotus Petal center
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.4, size * 0.22, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left & right petals
  ctx.beginPath();
  ctx.ellipse(-size * 0.25, -size * 0.3, size * 0.18, size * 0.38, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(size * 0.25, -size * 0.3, size * 0.18, size * 0.38, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSunFlowerCorner(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f59e0b';
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 8; i++) {
    ctx.rotate((Math.PI * 2) / 8);
    ctx.beginPath();
    ctx.ellipse(0, 16, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

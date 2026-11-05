/** 사진 워터마크 (관리자에서 사진 올릴 때 자동으로 찍힘) */

export type WmStyle = 'right' | 'left' | 'tile' | 'corner' | 'center';
export type WmConfig = {
  on: boolean;
  text: string;
  logo: string; // 로고 PNG 주소 (있으면 글자 대신 로고)
  style: WmStyle;
  opacity: number; // 5~80 (%)
  size: number; // 1=작게 2=보통 3=크게
  reviews: boolean; // 후기 사진에도 넣기
};

export const WM_KEYS = ['wm_on', 'wm_text', 'wm_logo', 'wm_style', 'wm_opacity', 'wm_size', 'wm_reviews'] as const;

export function readWm(s: Record<string, string | undefined>): WmConfig {
  const styles: WmStyle[] = ['right', 'left', 'tile', 'corner', 'center'];
  const style = styles.includes(s.wm_style as WmStyle) ? (s.wm_style as WmStyle) : 'right';
  return {
    on: s.wm_on === 'Y',
    text: (s.wm_text || s.site_name || '').trim(),
    logo: (s.wm_logo || '').trim(),
    style,
    opacity: Math.min(80, Math.max(5, Number(s.wm_opacity) || 30)),
    size: Math.min(3, Math.max(1, Number(s.wm_size) || 2)),
    reviews: s.wm_reviews !== 'N',
  };
}

const logoCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadLogo(url: string) {
  if (!logoCache.has(url)) {
    logoCache.set(
      url,
      new Promise((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = url;
      }),
    );
  }
  return logoCache.get(url)!;
}

/** 캔버스(이미 사진이 그려진 상태) 위에 워터마크를 그림 */
export async function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, cfg: WmConfig) {
  if (!cfg.on || (!cfg.text && !cfg.logo)) return;
  const base = Math.min(w, h);
  const scale = [0, 0.7, 1, 1.4][cfg.size];
  const logo = cfg.logo ? await loadLogo(cfg.logo) : null;

  // 은은하게: 가운데에서 살짝 옆, 작은 글자를 넓게 띄워 쓰고 그림자만 살짝
  if (cfg.style === 'right' || cfg.style === 'left') {
    const px = Math.round(base * 0.028 * [0, 0.8, 1, 1.3][cfg.size]);
    const f = `500 ${px}px Montserrat, "Pretendard", sans-serif`;
    try {
      await document.fonts?.load(f);
    } catch {
      /* 기본 글꼴 */
    }
    const cx = w / 2 + (cfg.style === 'right' ? 1 : -1) * w * 0.2;
    const cy = h * 0.5;
    ctx.save();
    ctx.globalAlpha = cfg.opacity / 100;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = px * 0.6;
    if (logo) {
      const lw = base * 0.12 * [0, 0.8, 1, 1.3][cfg.size];
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, cx - lw / 2, cy - lh / 2, lw, lh);
    } else {
      ctx.font = f;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(px * 0.45)}px`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(cfg.text.toUpperCase(), cx, cy);
    }
    ctx.restore();
    return;
  }

  // 글자 크기·모양별
  const fontPx = Math.round(base * (cfg.style === 'tile' ? 0.045 : cfg.style === 'center' ? 0.09 : 0.04) * scale);
  const font = `600 ${fontPx}px Montserrat, "Pretendard", "Apple SD Gothic Neo", sans-serif`;
  try {
    await document.fonts?.load(font);
  } catch {
    /* 글꼴을 못 불러오면 기본 글꼴 */
  }

  // 한 개 찍는 함수 (중심 좌표 기준)
  const stamp = (cx: number, cy: number) => {
    if (logo) {
      const lw = base * (cfg.style === 'tile' ? 0.22 : cfg.style === 'center' ? 0.42 : 0.2) * scale;
      const lh = (logo.height / logo.width) * lw;
      ctx.drawImage(logo, cx - lw / 2, cy - lh / 2, lw, lh);
    } else {
      // 흰 글자 + 얇은 어두운 테두리 → 밝은 사진·어두운 사진 모두에서 보임
      ctx.lineWidth = Math.max(1, fontPx * 0.06);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(cfg.text, cx, cy);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(cfg.text, cx, cy);
    }
  };

  ctx.save();
  ctx.globalAlpha = cfg.opacity / 100;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(fontPx * 0.12)}px`;

  if (cfg.style === 'tile') {
    // 비스듬히 반복
    const itemW = logo ? base * 0.22 * scale : ctx.measureText(cfg.text).width;
    const gapX = itemW + base * 0.16;
    const gapY = base * 0.2 * scale;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 7);
    const R = Math.hypot(w, h) / 2 + gapX;
    let row = 0;
    for (let y = -R; y <= R; y += gapY, row++) {
      for (let x = -R + (row % 2 ? gapX / 2 : 0); x <= R; x += gapX) stamp(x, y);
    }
  } else if (cfg.style === 'center') {
    stamp(w / 2, h / 2);
  } else {
    // 오른쪽 아래
    const pad = base * 0.04;
    if (logo) {
      const lw = base * 0.2 * scale;
      const lh = (logo.height / logo.width) * lw;
      stamp(w - pad - lw / 2, h - pad - lh / 2);
    } else {
      const tw = ctx.measureText(cfg.text).width;
      stamp(w - pad - tw / 2, h - pad - fontPx / 2);
    }
  }
  ctx.restore();
}

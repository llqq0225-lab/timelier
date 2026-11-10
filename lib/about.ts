/** About(메종 이야기) 페이지 블록 — 관리자에서 편집, site_settings 'about_blocks'에 JSON으로 저장 */

/** 블록마다 따로 정하는 글자·사진 설정 (비우면 보통) */
export type BlockStyle = { fs?: 's' | 'm' | 'l' | 'xl'; fw?: 'light' | 'regular' | 'bold'; ts?: 's' | 'm' | 'l'; wm?: boolean };

export type AboutBlock = BlockStyle & (
  | { type: 'hero'; image: string; eyebrow: string; title: string; subtitle: string }
  | { type: 'text'; eyebrow: string; title: string; body: string }
  | { type: 'image'; image: string; image2?: string; caption: string; wide: boolean }
  | { type: 'split'; image: string; image2?: string; eyebrow: string; title: string; body: string; side: 'left' | 'center' | 'right' }
  | { type: 'quote'; text: string; cite: string }
  | { type: 'pillars'; eyebrow: string; title: string; items: { title: string; body: string }[] }
);

export const BLOCK_LABELS: Record<AboutBlock['type'], string> = {
  hero: '첫 화면 (큰 사진 + 제목)',
  text: '글',
  image: '사진',
  split: '사진 + 글',
  quote: '인용구',
  pillars: '약속 (I · II · III)',
};

export function emptyBlock(type: AboutBlock['type']): AboutBlock {
  switch (type) {
    case 'hero':
      return { type, image: '', eyebrow: '', title: '', subtitle: '' };
    case 'text':
      return { type, eyebrow: '', title: '', body: '' };
    case 'image':
      return { type, image: '', image2: '', caption: '', wide: false };
    case 'split':
      return { type, image: '', image2: '', eyebrow: '', title: '', body: '', side: 'center' };
    case 'quote':
      return { type, text: '', cite: '' };
    case 'pillars':
      return { type, eyebrow: '', title: '', items: [{ title: '', body: '' }, { title: '', body: '' }, { title: '', body: '' }] };
  }
}

/** 처음 보여줄 기본 문구 (관리자에서 저장하면 그 내용으로 바뀜) */
export const DEFAULT_ABOUT: AboutBlock[] = [
  {
    type: 'hero',
    image: '',
    eyebrow: 'The Maison',
    title: '시간을 고르는 일',
    subtitle: 'Timelier — Fine Timepieces, Inspected by Hand',
  },
  {
    type: 'text',
    eyebrow: 'Our Story',
    title: '좋은 시계는\n오래 곁에 남습니다',
    body:
      '타임리에는 하나의 질문에서 시작했습니다. 평생 손목 위에 둘 시계를, 우리는 얼마나 신중하게 고르고 있을까.\n\n그래서 많이 소개하기보다 제대로 고르는 일을 택했습니다. 한 점의 시계가 손님께 닿기까지, 우리는 그 시계를 가장 먼저 그리고 가장 오래 들여다보는 사람이 되고자 합니다.',
  },
  {
    type: 'split',
    image: '',
    eyebrow: 'Selection',
    title: '고르는 안목',
    body: '브랜드와 모델의 이름보다, 그 시계가 지나온 시간과 지금의 상태를 먼저 봅니다. 기준에 닿지 않는 시계는 소개하지 않습니다.',
    side: 'left',
  },
  {
    type: 'quote',
    text: '시계는 시간을 알려주지만,\n좋은 시계는 시간을 기억하게 합니다.',
    cite: 'Timelier',
  },
  {
    type: 'split',
    image: '',
    eyebrow: 'Inspection',
    title: '한 점, 한 번 더',
    body: '입고된 모든 시계는 외관과 구성품, 각인과 마감, 작동 상태까지 하나씩 확인합니다. 그 과정을 사진과 영상으로 기록해, 손님께 그대로 보여드립니다.',
    side: 'right',
  },
  {
    type: 'pillars',
    eyebrow: 'Our Promise',
    title: '타임리에의 세 가지 약속',
    items: [
      { title: '직접 검수', body: '모든 시계는 출고 전 실물을 한 점씩 확인합니다.' },
      { title: '숨김없는 기록', body: '검수 과정을 사진과 영상으로 남겨 그대로 보여드립니다.' },
      { title: '1:1 컨시어지', body: '찾으시는 시계와 예산에 맞춰 끝까지 함께 고릅니다.' },
    ],
  },
  { type: 'image', image: '', caption: '', wide: true },
  {
    type: 'text',
    eyebrow: 'Concierge',
    title: '당신의 시간에\n어울리는 한 점을',
    body: '처음 하이엔드 시계를 고르시는 분도, 오래 찾아온 모델이 있는 분도 편하게 말씀해 주세요. 타임리에가 함께 고르겠습니다.',
  },
];

export function parseAbout(raw?: string | null): AboutBlock[] {
  if (!raw) return DEFAULT_ABOUT;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) && v.length ? (v as AboutBlock[]) : DEFAULT_ABOUT;
  } catch {
    return DEFAULT_ABOUT;
  }
}

/* ---------------- 글자·사진 설정 (site_settings 'about_style') ---------------- */

export type AboutStyle = {
  size: 's' | 'm' | 'l' | 'xl'; // 본문 글자 크기
  weight: 'light' | 'regular' | 'bold'; // 본문 굵기
  title: 's' | 'm' | 'l'; // 제목 크기
  wm: boolean; // 본문 사진에 워터마크
};

export const DEFAULT_STYLE: AboutStyle = { size: 'm', weight: 'light', title: 'm', wm: true };

export const SIZE_LABELS = { s: '작게', m: '보통', l: '크게', xl: '아주 크게' } as const;
export const WEIGHT_LABELS = { light: '가늘게', regular: '보통', bold: '두껍게' } as const;
export const TITLE_LABELS = { s: '작게', m: '보통', l: '크게' } as const;

export function parseStyle(raw?: string | null): AboutStyle {
  try {
    return { ...DEFAULT_STYLE, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_STYLE;
  }
}

/** 블록 설정 → 전체 설정 위에 덮어씀 */
export function blockStyle(base: AboutStyle, b: BlockStyle): AboutStyle {
  return { size: b.fs ?? base.size, weight: b.fw ?? base.weight, title: b.ts ?? base.title, wm: b.wm ?? base.wm };
}

/** 페이지에 넣을 CSS 변수 */
export function styleVars(s: AboutStyle): Record<string, string> {
  const fs = { s: '14px', m: '15px', l: '16.5px', xl: '18px' }[s.size];
  const fw = { light: '300', regular: '400', bold: '500' }[s.weight];
  const op = { light: '0.74', regular: '0.82', bold: '0.9' }[s.weight];
  const tw = s.weight === 'bold' ? '500' : s.weight === 'regular' ? '400' : '300';
  const ts = { s: '0.88', m: '1', l: '1.14' }[s.title];
  return { '--ab-fs': fs, '--ab-fw': fw, '--ab-op': op, '--ab-tw': tw, '--ab-ts': ts };
}

/* ---------------- 글 안에서 부분 강조 ----------------
   "문구"   → 두껍게 (따옴표는 안 보임)
   ((문구)) → 작게                                       */
export type Piece = { t: string; k: 'n' | 'b' | 's' };
export function splitRich(text: string): Piece[] {
  const out: Piece[] = [];
  const re = /"([^"\n]+)"|“([^”\n]+)”|\(\(([^\n]+?)\)\)/g;
  let last = 0;
  for (let m; (m = re.exec(text)); ) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), k: 'n' });
    out.push(m[3] != null ? { t: m[3], k: 's' } : { t: m[1] ?? m[2], k: 'b' });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ t: text.slice(last), k: 'n' });
  return out;
}

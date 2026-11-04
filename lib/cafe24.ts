/** 카페24 상품 엑셀(CSV) 한 줄 → 새 사이트로 옮길 작업 단위 */

export type ImportJob = {
  kind: 'product' | 'shipping';
  no: string; // 카페24 상품번호
  name: string;
  brandSlug: string | null;
  domestic: boolean;
  visible: boolean;
  createdAt: string | null;
  shippedAt: string | null;
  mainImage: string | null; // 카페24 상품이미지 경로 (예: 202610/abc.jpg)
  detailImages: string[]; // 상세설명 안의 사진 주소
  video: string | null; // 찰나 영상 주소
};

const DOMESTIC_CATEGORY = '65'; // 실시간 국내재고 > WATCH

// 상품명 맨 앞 단어 → 브랜드 주소(slug)
const BRAND_PREFIX: [RegExp, string][] = [
  [/^롤렉스/, 'rolex'],
  [/^파텍/, 'patek-philippe'],
  [/^오데마/, 'audemars-piguet'],
  [/^까르띠에/, 'cartier'],
  [/^리[차처]드\s?밀/, 'richard-mille'],
  [/^오메가/, 'omega'],
  [/^위블로/, 'hublot'],
  [/^IWC/i, 'iwc'],
  [/^바쉐론/, 'vacheron-constantin'],
  [/^파네라이/, 'panerai'],
  [/^샤넬/, 'chanel'],
];

const SHIPPING_TITLE = /^\d{2}[.\-]\d{1,3}[.\-]/; // "26.10.22 용** 고객"

function brandOf(name: string) {
  const n = name.trim();
  return BRAND_PREFIX.find(([re]) => re.test(n))?.[1] ?? null;
}

function shippedDate(name: string, fallback: string | null) {
  const m = name.match(/^(\d{2})[.\-](\d{1,3})[.\-](\d{1,2})/);
  if (m) {
    const [y, mo, d] = [2000 + +m[1], +m[2], +m[3]];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return fallback;
}

function extractImages(html: string) {
  const out: string[] = [];
  for (const m of html.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi)) {
    const src = m[1].trim();
    if (!/^(https?:)?\/\//.test(src) && !src.startsWith('/web/')) continue; // 이상한 경로 제외
    if (!out.includes(src)) out.push(src);
  }
  return out;
}

function extractVideo(html: string) {
  const m = html.match(/player\.charlla\.io\/([A-Za-z0-9_-]+)/);
  return m ? `https://player.charlla.io/${m[1]}` : null;
}

export function rowsToJobs(rows: Record<string, string>[]): ImportJob[] {
  const jobs: ImportJob[] = [];
  for (const r of rows) {
    const name = (r['상품명'] ?? '').trim();
    const no = (r['상품번호'] ?? '').trim();
    if (!name || !no || name.startsWith('샘플상품')) continue;

    const html = r['상품 상세설명'] || r['모바일 상품 상세설명'] || '';
    const date = (r['상품등록일'] ?? '').trim() || null;
    // 같은 날 등록된 상품끼리 원래 순서가 유지되도록 상품번호만큼 초를 더함
    const createdAt = date
      ? new Date(Date.parse(`${date}T00:00:00+09:00`) + Number(no) * 1000).toISOString()
      : null;
    const isShipping = SHIPPING_TITLE.test(name);

    jobs.push({
      kind: isShipping ? 'shipping' : 'product',
      no,
      name,
      brandSlug: isShipping ? null : brandOf(name),
      domestic: (r['상품분류 번호'] ?? '').split('|').includes(DOMESTIC_CATEGORY),
      visible: (r['진열상태'] ?? 'Y') === 'Y',
      createdAt,
      shippedAt: isShipping ? shippedDate(name, date) : null,
      mainImage: (r['이미지등록(상세)'] || r['이미지등록(목록)'] || '').trim() || null,
      detailImages: extractImages(html),
      video: extractVideo(html),
    });
  }
  return jobs;
}

/** 카페24 주소 → 내려받을 실제 주소 */
export function sourceUrl(host: string, src: string, kind: 'main' | 'detail') {
  const base = host.replace(/\/+$/, '');
  if (kind === 'main') return `${base}/web/product/big/${src.replace(/^\/+/, '')}`;
  if (src.startsWith('//')) return `https:${src}`;
  if (/^https?:\/\//.test(src)) return src;
  return `${base}${src.startsWith('/') ? '' : '/'}${src}`;
}

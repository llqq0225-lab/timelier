/** 필터에 쓰는 소재 · 스트랩 · 성별 목록과, 상품명으로 자동 분류하는 규칙 */

export const MATERIALS = ['스틸', '옐로우골드', '로즈골드', '화이트골드', '콤비', '플래티넘', '티타늄', '세라믹'] as const;
export const STRAPS = ['메탈', '가죽', '러버'] as const;
export const GENDERS = ['남성', '여성'] as const;

/** 화면에 같이 보여줄 영문 이름 */
export const EN: Record<string, string> = {
  스틸: 'Steel',
  옐로우골드: 'Yellow Gold',
  로즈골드: 'Rose Gold',
  화이트골드: 'White Gold',
  콤비: 'Two-tone',
  플래티넘: 'Platinum',
  티타늄: 'Titanium',
  세라믹: 'Ceramic',
  메탈: 'Metal Bracelet',
  가죽: 'Leather',
  러버: 'Rubber',
  남성: 'Men',
  여성: 'Women',
};

/** 상품명 → 소재 (모르면 null) */
export function guessMaterial(name: string): string | null {
  const n = name.replace(/\s+/g, '').toLowerCase();
  if (/콤비|투톤|롤레조|rolesor|two-?tone|스틸골드|골드스틸/.test(n)) return '콤비';
  if (/화이트골드|백금|whitegold|\bwg\b/.test(n)) return '화이트골드';
  if (/로즈골드|에버로즈|핑크골드|레드골드|세드나|킹골드|rosegold|everose|\brg\b/.test(n)) return '로즈골드';
  if (/플래티넘|플레티넘|플래티늄|platinum|\bpt\b/.test(n)) return '플래티넘';
  if (/옐로우골드|옐로골드|yellowgold|\byg\b|금통|골드/.test(n)) return '옐로우골드';
  if (/티타늄|titanium/.test(n)) return '티타늄';
  if (/세라믹|ceramic/.test(n)) return '세라믹';
  if (/스틸|스테인리스|스테인레스|오이스터스틸|steel/.test(n)) return '스틸';
  return null;
}

/** 상품명 → 스트랩 (모르면 null) */
export function guessStrap(name: string): string | null {
  const n = name.replace(/\s+/g, '').toLowerCase();
  if (/러버|오이스터플렉스|고무|rubber/.test(n)) return '러버';
  if (/가죽|레더|악어|앨리게이터|엘리게이터|카프|leather|alligator|스트랩/.test(n)) return '가죽';
  if (/브레이슬릿|브슬|쥬빌리|주빌리|오이스터|프레지던트|메탈|밴드|bracelet|금통|통금/.test(n)) return '메탈';
  return null;
}

/** 주소의 필터 값들 (?m=스틸,로즈골드&s=가죽&g=남성&c=탱크) */
export type Filters = { m: string[]; s: string[]; g: string[]; c: string[]; d: string[] };

export function readFilters(sp: Record<string, string | undefined>): Filters {
  const list = (v?: string) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
  return { m: list(sp.m), s: list(sp.s), g: list(sp.g), c: list(sp.c), d: sp.d === '1' ? ['1'] : [] };
}

/** 성별: '남성'을 고르면 공용도 같이 보여줌 */
export function genderValues(g: string[]) {
  return g.length ? [...new Set([...g, '공용'])] : [];
}

/** Supabase 쿼리에 필터 붙이기 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters<Q extends { in: (col: string, vals: string[]) => any; eq: (col: string, val: string) => any }>(q: Q, f: Filters): Q {
  let out = q;
  if (f.m.length) out = out.in('material', f.m);
  if (f.s.length) out = out.in('strap', f.s);
  if (f.g.length) out = out.in('gender', genderValues(f.g));
  if (f.c.length) out = out.in('collection', f.c);
  if (f.d.length) out = out.eq('stock_type', 'domestic');
  return out;
}

/** 필터 창에서 개수 세는 데 쓰는 가벼운 상품 정보 */
export type FacetRow = { material: string | null; strap: string | null; gender: string | null; collection: string | null; stock_type?: string | null };

export const FACET_FIELDS = 'material, strap, gender, collection, stock_type';

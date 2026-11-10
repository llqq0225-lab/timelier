/** 메인 화면 '배너 + 제품 줄' 묶음 — 관리자에서 편집, site_settings 'home_showcases'에 JSON으로 저장 */

export type Showcase = {
  image: string; // 가로로 긴 배너 사진
  title: string; // 예: PATEK PHILIPPE
  subtitle: string; // 작은 설명 (선택)
  mode: 'brand' | 'pick'; // brand = 브랜드·모델로 자동 / pick = 직접 고른 상품
  brand_id: number | null;
  collection: string; // 비우면 브랜드 전체
  product_ids: number[];
  limit: number;
};

export const emptyShowcase = (): Showcase => ({
  image: '',
  title: '',
  subtitle: '',
  mode: 'brand',
  brand_id: null,
  collection: '',
  product_ids: [],
  limit: 8,
});

/** 저장된 적이 없으면 null (→ 메인은 상품 많은 모델 3개로 자동 구성) */
export function parseShowcases(raw?: string | null): Showcase[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return null;
    return v.map((s) => ({ ...emptyShowcase(), ...s }));
  } catch {
    return null;
  }
}

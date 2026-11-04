'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveProduct, deleteProduct } from '@/app/admin/actions';
import ImageUpload from './ImageUpload';
import ImagesField from './ImagesField';
import NewBrandBox from './NewBrandBox';
import type { Brand, Product } from '@/lib/types';
import { MATERIALS, STRAPS } from '@/lib/attributes';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? '저장 중…' : '저장하기'}</button>;
}

export default function ProductForm({
  product,
  brands,
  collections = [],
}: {
  product?: Product;
  brands: Brand[];
  collections?: string[];
}) {
  const [thumb, setThumb] = useState(product?.thumbnail_url ?? '');
  const [brandList, setBrandList] = useState(brands.map((b) => ({ id: b.id, name_ko: b.name_ko })));
  const [brandId, setBrandId] = useState(String(product?.brand_id ?? ''));
  const [addingBrand, setAddingBrand] = useState(false);
  const initialImages = (product?.product_images ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.url);

  return (
    <div className="space-y-6">
      <form action={saveProduct} className="bg-white border border-line p-6 space-y-6 max-w-3xl">
        {product && <input type="hidden" name="id" value={product.id} />}
        <input type="hidden" name="thumbnail_url" value={thumb} />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">상품명 *</label>
            <input name="name" className="input" defaultValue={product?.name} required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">브랜드</label>
              {!addingBrand && (
                <button type="button" onClick={() => setAddingBrand(true)} className="mb-1 text-xs font-medium text-gold underline">
                  + 새 브랜드
                </button>
              )}
            </div>
            <select
              name="brand_id"
              className="input"
              value={brandId}
              onChange={(e) => (e.target.value === '__new' ? setAddingBrand(true) : setBrandId(e.target.value))}
            >
              <option value="">선택 안 함</option>
              {brandList.map((b) => (
                <option key={b.id} value={b.id}>{b.name_ko}</option>
              ))}
              <option value="__new">+ 새 브랜드 추가…</option>
            </select>
            {addingBrand && (
              <div className="mt-2">
                <NewBrandBox
                  onCancel={() => setAddingBrand(false)}
                  onCreated={(b) => {
                    setBrandList((l) => (l.some((x) => x.id === b.id) ? l : [...l, { id: b.id, name_ko: b.name_ko }]));
                    setBrandId(String(b.id));
                    setAddingBrand(false);
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="label">컬렉션 (상세분류)</label>
            <input name="collection" list="collection-list" className="input" defaultValue={product?.collection ?? ''} placeholder="예: 데이저스트 (비우면 상품명으로 자동)" />
            <datalist id="collection-list">
              {collections.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="label">성별</label>
            <select name="gender" className="input" defaultValue={product?.gender ?? '공용'}>
              <option>공용</option>
              <option>남성</option>
              <option>여성</option>
            </select>
          </div>
          <div>
            <label className="label">소재 (필터)</label>
            <select name="material" className="input" defaultValue={product?.material ?? ''}>
              <option value="">자동 (상품명으로)</option>
              {MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">스트랩 (필터)</label>
            <select name="strap" className="input" defaultValue={product?.strap ?? ''}>
              <option value="">자동 (상품명으로)</option>
              {STRAPS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">모델번호 (Ref.)</label>
            <input name="model_no" className="input" defaultValue={product?.model_no ?? ''} />
          </div>
          <div>
            <label className="label">가격 (원) — 비우면 &lsquo;가격 문의&rsquo;</label>
            <input name="price" className="input" inputMode="numeric" defaultValue={product?.price ?? ''} />
          </div>
          <div>
            <label className="label">배송 구분</label>
            <select name="stock_type" className="input" defaultValue={product?.stock_type ?? 'order'}>
              <option value="order">주문 후 배송</option>
              <option value="domestic">국내재고 (바로배송)</option>
            </select>
          </div>
          <div>
            <label className="label">최근판매 건수 (랭킹 순서)</label>
            <input name="recent_sales" className="input" inputMode="numeric" defaultValue={product?.recent_sales ?? 0} />
          </div>
          <div>
            <label className="label">정렬 순서 (작을수록 앞)</label>
            <input name="sort_order" className="input" inputMode="numeric" defaultValue={product?.sort_order ?? 0} />
          </div>
          <div className="md:col-span-2">
            <label className="label">출고영상 (찰나 링크 또는 영상코드)</label>
            <input name="video_url" className="input" placeholder="https://player.charlla.io/xxxxxxx" defaultValue={product?.video_url ?? ''} />
            <p className="text-xs text-neutral-500 mt-1">넣으면 상품 상세에 &lsquo;실제 제품 출고영상 미리보기&rsquo; 박스로 바로 재생돼요.</p>
          </div>
        </div>

        <div>
          <label className="label">대표 사진</label>
          <ImageUpload value={thumb} onChange={setThumb} />
        </div>

        <ImagesField initial={initialImages} />

        <div>
          <label className="label">상세 설명 (글, 선택)</label>
          <textarea name="description" rows={6} className="input" defaultValue={product?.description ?? ''} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_visible" defaultChecked={product?.is_visible ?? true} />
          사이트에 노출
        </label>

        <div className="flex gap-2">
          <SubmitButton />
          <a href="/admin/products" className="btn-line">취소</a>
        </div>
      </form>

      {product && (
        <form
          action={deleteProduct}
          onSubmit={(e) => { if (!confirm('이 상품을 삭제할까요? 되돌릴 수 없어요.')) e.preventDefault(); }}
        >
          <input type="hidden" name="id" value={product.id} />
          <button className="text-sm text-red-600 underline">상품 삭제</button>
        </form>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveShipping, deleteShipping } from '@/app/admin/actions';
import ImageUpload from './ImageUpload';
import ImagesField from './ImagesField';
import ProductPicker from './ProductPicker';
import type { Brand, Shipping } from '@/lib/types';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? '저장 중…' : '저장하기'}</button>;
}

export default function ShippingForm({ item, brands }: { item?: Shipping; brands: Brand[] }) {
  const [thumb, setThumb] = useState(item?.thumbnail_url ?? '');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

  return (
    <div className="space-y-6 max-w-3xl">
      <form action={saveShipping} className="bg-white border border-line p-6 space-y-6">
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="thumbnail_url" value={thumb} />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">제목 *</label>
            <input name="title" className="input" defaultValue={item?.title ?? ''} placeholder="예: 26.10.27 김** 고객" required />
          </div>
          <div>
            <label className="label">출고일</label>
            <input name="shipped_at" type="date" className="input" defaultValue={item?.shipped_at ?? today} />
          </div>
          <div>
            <label className="label">브랜드 (메인 탭 분류용)</label>
            <select name="brand_id" className="input" defaultValue={item?.brand_id ?? ''}>
              <option value="">선택 안 함</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name_ko}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">출고영상 (찰나 링크 또는 영상코드, 없으면 비워두기)</label>
            <input name="video_url" className="input" placeholder="https://player.charlla.io/xxxxxxx" defaultValue={item?.video_url ?? ''} />
          </div>
          <div className="md:col-span-2">
            <label className="label">어떤 상품의 출고인가요? (연결하면 그 상품 상세의 &lsquo;실시간 검수&rsquo;에 나와요)</label>
            <ProductPicker initialId={item?.product_id} />
          </div>
        </div>

        <div>
          <label className="label">대표 사진</label>
          <ImageUpload value={thumb} onChange={setThumb} folder="shipping" />
        </div>

        <ImagesField initial={item?.images ?? []} folder="shipping" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_visible" defaultChecked={item?.is_visible ?? true} />
          사이트에 노출
        </label>

        <div className="flex gap-2">
          <SubmitButton />
          <a href="/admin/shipping" className="btn-line">취소</a>
        </div>
      </form>

      {item && (
        <form action={deleteShipping} onSubmit={(e) => { if (!confirm('이 출고 게시물을 삭제할까요?')) e.preventDefault(); }}>
          <input type="hidden" name="id" value={item.id} />
          <button className="text-sm text-red-600 underline">삭제</button>
        </form>
      )}
    </div>
  );
}

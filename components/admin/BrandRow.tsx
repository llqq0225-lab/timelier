'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveBrand } from '@/app/admin/actions';
import ImageUpload from './ImageUpload';
import type { Brand } from '@/lib/types';
import { toast } from '@/components/Toaster';

function Save() {
  const { pending } = useFormStatus();
  return <button className="btn text-xs" disabled={pending}>{pending ? '저장 중…' : '저장'}</button>;
}

export default function BrandRow({ brand }: { brand: Brand }) {
  const [logo, setLogo] = useState(brand.logo_url ?? '');
  return (
    <form
      action={async (fd) => {
        await saveBrand(fd);
        toast(`${brand.name_ko} 저장했어요`);
      }}
      className="bg-white border border-line p-4 flex flex-wrap items-end gap-4"
    >
      <input type="hidden" name="id" value={brand.id} />
      <input type="hidden" name="logo_url" value={logo} />
      <div>
        <p className="label">로고</p>
        <ImageUpload value={logo} onChange={setLogo} folder="brands" />
      </div>
      <div className="grid grid-cols-2 gap-3 flex-1 min-w-64">
        <div>
          <label className="label">한글 이름</label>
          <input name="name_ko" defaultValue={brand.name_ko} className="input" />
        </div>
        <div>
          <label className="label">영문 이름</label>
          <input name="name_en" defaultValue={brand.name_en ?? ''} className="input" />
        </div>
        <div>
          <label className="label">순서</label>
          <input name="sort_order" defaultValue={brand.sort_order} inputMode="numeric" className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm self-end pb-2">
          <input type="checkbox" name="is_featured" defaultChecked={brand.is_featured} />
          메인 퀵메뉴에 노출
        </label>
      </div>
      <Save />
    </form>
  );
}

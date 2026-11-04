'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewBrandBox from './NewBrandBox';
import { toast } from '../Toaster';

/** 브랜드 화면 맨 위 '+ 새 브랜드 추가' */
export default function AddBrand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <div className="mb-6 max-w-xl">
      {open ? (
        <NewBrandBox
          onCancel={() => setOpen(false)}
          onCreated={(b) => {
            toast(b.existed ? `'${b.name_ko}'는 이미 있어요` : `'${b.name_ko}' 브랜드를 추가했어요`);
            setOpen(false);
            router.refresh();
          }}
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn">+ 새 브랜드 추가</button>
      )}
    </div>
  );
}

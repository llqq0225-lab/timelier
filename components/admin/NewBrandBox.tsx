'use client';

import { useState } from 'react';
import { createBrand } from '@/app/admin/actions';

/** 새 브랜드 추가 입력칸 (한글 이름 + 영문 이름) */
export default function NewBrandBox({
  onCreated,
  onCancel,
}: {
  onCreated: (b: { id: number; name_ko: string; existed: boolean }) => void;
  onCancel?: () => void;
}) {
  const [ko, setKo] = useState('');
  const [en, setEn] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function add() {
    if (!ko.trim()) return setMsg('한글 이름을 입력해주세요.');
    setBusy(true);
    setMsg('');
    try {
      const b = await createBrand(ko, en);
      onCreated(b);
      setKo('');
      setEn('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '추가하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  // 상품 폼 안에 들어가므로 <form> 대신 버튼으로 처리 (엔터 = 추가)
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div className="rounded-lg border border-gold/50 bg-[#faf7f1] p-3 space-y-2">
      <p className="text-xs font-bold">새 브랜드 추가</p>
      <div className="grid grid-cols-2 gap-2">
        <input value={ko} onChange={(e) => setKo(e.target.value)} onKeyDown={onKey} className="input" placeholder="한글 이름 * (예: 튜더)" autoFocus />
        <input value={en} onChange={(e) => setEn(e.target.value)} onKeyDown={onKey} className="input" placeholder="영문 이름 (예: Tudor)" />
      </div>
      <p className="text-[11px] text-neutral-500">영문 이름은 주소에 쓰여요 (예: /brand/tudor). 로고는 나중에 &lsquo;브랜드&rsquo; 메뉴에서 넣으면 돼요.</p>
      {msg && <p className="text-xs text-red-600">{msg}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={add} disabled={busy} className="btn !py-2 text-sm">{busy ? '추가 중…' : '추가'}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-line !py-2 text-sm">닫기</button>}
      </div>
    </div>
  );
}

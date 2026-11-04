'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('이메일 또는 비밀번호가 맞지 않아요.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="admin-theme min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-8 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-center mb-2">관리자 로그인</h1>
        <div>
          <label className="label">이메일</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">비밀번호</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={loading}>{loading ? '로그인 중…' : '로그인'}</button>
      </form>
    </div>
  );
}

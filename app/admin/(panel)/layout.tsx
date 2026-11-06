import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/supabase/server';
import { signOut } from '../actions';
import AdminMark from '@/components/admin/AdminMark';

export const dynamic = 'force-dynamic';

const MENU = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/stats', label: '방문 통계' },
  { href: '/admin/products', label: '상품 관리' },
  { href: '/admin/arrange', label: '진열 순서' },
  { href: '/admin/shipping', label: '출고 게시물' },
  { href: '/admin/reviews', label: '후기' },
  { href: '/admin/brands', label: '브랜드 · 로고' },
  { href: '/admin/notices', label: '공지사항' },
  { href: '/admin/settings', label: '배너 · 사이트 설정' },
  { href: '/admin/about', label: '메종 이야기 (About)' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getAdmin();
  if (!user) redirect('/admin/login');

  if (!isAdmin) {
    return (
      <div className="admin-theme min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-bold">관리자 권한이 없는 계정이에요.</p>
        <p className="text-sm text-neutral-500">Supabase SQL Editor에서 admins 테이블에 이 계정({user.email})을 등록해 주세요.</p>
        <form action={signOut}><button className="btn-line">로그아웃</button></form>
      </div>
    );
  }

  return (
    <div className="admin-theme min-h-screen md:flex bg-neutral-50">
      <aside className="md:w-56 md:min-h-screen bg-ink text-white shrink-0">
        <div className="p-5 font-bold tracking-widest">ADMIN</div>
        <nav className="flex md:flex-col overflow-x-auto no-scrollbar text-sm">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} className="px-5 py-3 whitespace-nowrap hover:bg-white/10">
              {m.label}
            </Link>
          ))}
          <Link href="/" target="_blank" className="px-5 py-3 whitespace-nowrap text-neutral-400 hover:bg-white/10">
            사이트 보기 ↗
          </Link>
          <form action={signOut}>
            <button className="px-5 py-3 whitespace-nowrap text-neutral-400 hover:bg-white/10 w-full text-left">로그아웃</button>
          </form>
        </nav>
      </aside>
      <AdminMark />
      <div className="flex-1 p-5 md:p-10 min-w-0">{children}</div>
    </div>
  );
}

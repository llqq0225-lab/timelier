import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import RecentPanel from '@/components/RecentPanel';
import Toaster from '@/components/Toaster';
import Tracker from '@/components/Tracker';
import InstallPrompt from '@/components/InstallPrompt';
import { KakaoFloat } from '@/components/KakaoButton';
import Wordmark from '@/components/Wordmark';
import AppSide from '@/components/AppSide';
import DragScroll from '@/components/DragScroll';
import { EntryPopup, RecommendPopup } from '@/components/Popups';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings, kakaoOf, siteUrl, type Brand, type BrandCollection } from '@/lib/types';

// 1분마다 새로 만들고, 관리자에서 저장하면 바로 갱신됨
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings(createPublicClient());
  const name = settings.site_name || 'TIMELIER';
  const title = settings.seo_title || name;
  const description = settings.seo_description || '검수된 하이엔드 시계, 타임리에';
  const image = settings.og_image || undefined;
  const icon = settings.icon_url || undefined;
  return {
    metadataBase: new URL(siteUrl(settings)),
    title: { default: title, template: `%s | ${name}` },
    description,
    keywords: settings.seo_keywords ? settings.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
    // 카톡·문자·인스타 등에 링크 보낼 때 뜨는 미리보기
    openGraph: { siteName: name, type: 'website', locale: 'ko_KR', title, description, images: image ? [{ url: image, width: 1200, height: 630 }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
    // 브라우저 탭·북마크·홈 화면 아이콘
    icons: icon ? { icon: [{ url: icon }], apple: [{ url: icon }], shortcut: [{ url: icon }] } : undefined,
    // 구글·네이버 사이트 소유 확인
    verification: {
      google: settings.google_verification || undefined,
      other: settings.naver_verification ? { 'naver-site-verification': settings.naver_verification } : undefined,
    },
  };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = createPublicClient();
  const [{ data: brands }, { data: collections }, settings] = await Promise.all([
    supabase.from('brands').select('*').order('sort_order'),
    supabase.from('brand_collections').select('*'),
    getSettings(supabase),
  ]);
  const siteName = settings.site_name || 'TIMELIER';
  const kakao = kakaoOf(settings);
  const entryPopup =
    settings.popup_enabled === 'Y' && (settings.popup_image || settings.popup_title)
      ? { image: settings.popup_image, link: settings.popup_link, title: settings.popup_title, text: settings.popup_text }
      : null;

  return (
    <>
      <AppSide url={siteUrl(settings)} kakao={kakao} />
      <div className="app-shell">
      <Header
        siteName={siteName}
        brands={(brands ?? []) as Brand[]}
        collections={(collections ?? []) as BrandCollection[]}
        announce={settings.announce_text ?? '구매 및 모든 문의는 **카카오톡 전문가상담**을 통해 부탁드립니다!'}
        kakao={kakao}
      />
      <main className="min-h-[60vh]">{children}</main>

      <footer className="bg-abyss text-fg/45 text-[12px]">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-12 ">
          <div className="text-center">
            <Wordmark sub className="text-[30px] text-fg" />
          </div>
          <div className="mt-16 grid grid-cols-2 gap-10 border-t border-rule pt-12">
            <div>
              <p className="eyebrow">The Maison</p>
              <ul className="mt-5 space-y-2.5 text-fg/70">
                <li><Link href="/ranking" className="hover:text-accent">셀렉션</Link></li>
                <li><Link href="/brands" className="hover:text-accent">컬렉션</Link></li>
                <li><Link href="/brand/domestic" className="hover:text-accent">바로 배송</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">Assurance</p>
              <ul className="mt-5 space-y-2.5 text-fg/70">
                <li><Link href="/shipping" className="hover:text-accent">검수 아틀리에</Link></li>
                <li><Link href="/reviews" className="hover:text-accent">고객 이야기</Link></li>
                <li><Link href="/notice" className="hover:text-accent">공지사항</Link></li>
              </ul>
            </div>
            <div className="col-span-2">
              <p className="eyebrow">Client Services</p>
              <p className="mt-5 leading-[1.9] text-fg/70">상담 · 주문은 카카오톡 프라이빗 상담으로 도와드립니다.</p>
              {settings.bank_info && <p className="mt-2 text-fg/55">입금계좌 {settings.bank_info}</p>}
            </div>
          </div>
          <p className="mt-14 whitespace-pre-line leading-[1.9]">{settings.footer_info}</p>
          <p className="mt-4 font-display text-[10px] uppercase tracking-[0.25em] text-fg/30">© {new Date().getFullYear()} {siteName}</p>
        </div>
      </footer>
      </div>

      {(kakao.friend || kakao.openchat) && <KakaoFloat urls={kakao} />}
      <RecentPanel />
      <EntryPopup data={entryPopup} />
      <RecommendPopup kakao={kakao} />
      <Toaster />
      <Tracker />
      <InstallPrompt />
      <DragScroll />
    </>
  );
}

import QRCode from 'qrcode';
import Wordmark from './Wordmark';
import KakaoLink from './KakaoLink';
import type { KakaoUrls } from '@/lib/kakao';

/** PC 화면 왼쪽: 브랜드 소개 + 휴대폰으로 여는 QR (넓은 화면에서만 보임) */
export default async function AppSide({ url, kakao }: { url: string; kakao: KakaoUrls }) {
  const qr = await QRCode.toString(url, { type: 'svg', margin: 0, color: { dark: '#f3eadb', light: '#00000000' } }).catch(() => '');
  return (
    <aside className="app-side items-center justify-end pr-16 xl:pr-24" aria-hidden="true">
      <div className="max-w-[380px]">
        <Wordmark sub className="text-[34px] text-fg" />
        <p className="display mt-14 text-[44px] text-fg">
          The Art of Time,
          <br />
          <span className="italic text-accent">inspected by hand.</span>
        </p>
        <p className="mt-6 text-[14px] leading-[1.9] text-fg/55">
          한 점 한 점 직접 검수한 시계만을 소개합니다.
          <br />
          휴대폰에서 더 편하게 둘러보세요.
        </p>
        <div className="mt-10 flex items-center gap-5 border border-rule p-4">
          {qr && <span className="block h-[88px] w-[88px] shrink-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />}
          <div>
            <p className="eyebrow">Mobile</p>
            <p className="mt-2 text-[13px] leading-relaxed text-fg/75">카메라로 찍으면
              <br />휴대폰에서 바로 열려요</p>
          </div>
        </div>
        {(kakao.friend || kakao.openchat) && (
          <KakaoLink urls={kakao} className="cta mt-6 w-full">Private Consultation</KakaoLink>
        )}
      </div>
    </aside>
  );
}

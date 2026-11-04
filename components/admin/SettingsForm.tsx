'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveSettings } from '@/app/admin/actions';
import ImageUpload from './ImageUpload';

export type Banner = { id: number; title: string | null; subtitle: string | null; image_url: string; link_url: string | null; is_active: boolean };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="btn sticky bottom-4 shadow-lg" disabled={pending}>{pending ? '저장 중…' : '전체 저장하기'}</button>;
}

function BannerSlot({ n, banner }: { n: number; banner?: Banner }) {
  const [img, setImg] = useState(banner?.image_url ?? '');
  const p = `banner${n}_`;
  return (
    <div className="border border-line rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <b className="text-sm">배너 {n}</b>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={`${p}active`} defaultChecked={banner ? banner.is_active : true} /> 노출
        </label>
      </div>
      {banner && <input type="hidden" name={`${p}id`} value={banner.id} />}
      <input type="hidden" name={`${p}image`} value={img} />
      <ImageUpload value={img} onChange={setImg} folder="banners" />
      <textarea name={`${p}title`} rows={2} className="input" defaultValue={banner?.title ?? ''} placeholder="큰 문구 (줄바꿈 가능)" />
      <input name={`${p}subtitle`} className="input" defaultValue={banner?.subtitle ?? ''} placeholder="작은 문구" />
      <input name={`${p}link`} className="input" defaultValue={banner?.link_url ?? ''} placeholder="누르면 이동할 곳 (예: /brand/rolex)" />
    </div>
  );
}

export default function SettingsForm({ settings, banners }: { settings: Record<string, string>; banners: Banner[] }) {
  const [popupImg, setPopupImg] = useState(settings.popup_image ?? '');
  const [ogImg, setOgImg] = useState(settings.og_image ?? '');
  const [iconImg, setIconImg] = useState(settings.icon_url ?? '');

  return (
    <form action={saveSettings} className="space-y-8 max-w-3xl">
      <section className="bg-white border border-line p-6 space-y-4">
        <div>
          <h2 className="font-bold">메인 배너 (최대 3장)</h2>
          <p className="text-xs text-neutral-500 mt-1">가로로 긴 사진(약 1600×800)이 좋아요. 사진이 있는 배너만 순서대로 5초마다 넘어가요.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <BannerSlot key={n} n={n} banner={banners[n - 1]} />
          ))}
        </div>
      </section>

      <section className="bg-white border border-line p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">첫 접속 팝업</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="popup_enabled" defaultChecked={settings.popup_enabled === 'Y'} /> 사용
          </label>
        </div>
        <p className="text-xs text-neutral-500">메인 화면에 처음 들어왔을 때 한 번 떠요. 손님이 &lsquo;오늘 하루 보지 않기&rsquo;를 누르면 그날은 안 떠요.</p>
        <input type="hidden" name="popup_image" value={popupImg} />
        <ImageUpload value={popupImg} onChange={setPopupImg} folder="popup" />
        <input name="popup_title" className="input" defaultValue={settings.popup_title} placeholder="제목 (선택)" />
        <textarea name="popup_text" rows={2} className="input" defaultValue={settings.popup_text} placeholder="내용 (선택)" />
        <input name="popup_link" className="input" defaultValue={settings.popup_link} placeholder="누르면 이동할 곳 (선택, 예: /brand/domestic)" />
      </section>

      <section className="bg-white border border-line p-6 space-y-4">
        <h2 className="font-bold">사이트 정보</h2>
        <div>
          <label className="label">맨 위 검은 공지줄 문구 (**굵게** 쓰면 노란색)</label>
          <input
            name="announce_text"
            className="input"
            defaultValue={settings.announce_text ?? '구매 및 모든 문의는 **카카오톡 전문가상담**을 통해 부탁드립니다!'}
          />
        </div>
        <div>
          <label className="label">사이트 이름</label>
          <input name="site_name" className="input" defaultValue={settings.site_name} />
        </div>
        <div className="rounded-lg bg-neutral-50 p-4 space-y-3">
          <p className="text-xs text-neutral-500">
            카톡 버튼은 접속 환경에 따라 자동으로 바뀌어요. <b>PC · 휴대폰 크롬 → 오픈채팅</b>, <b>그 외 휴대폰(사파리·삼성인터넷·카톡/네이버 앱) → 채널 친구추가</b>.
            한쪽만 넣으면 모두 그 링크로 가요.
          </p>
          <div>
            <label className="label">오픈채팅 링크 (PC · 크롬)</label>
            <input name="kakao_openchat_url" className="input" defaultValue={settings.kakao_openchat_url} placeholder="https://open.kakao.com/o/..." />
          </div>
          <div>
            <label className="label">채널 친구추가 링크 (그 외 모바일)</label>
            <input name="kakao_url" className="input" defaultValue={settings.kakao_url} placeholder="https://pf.kakao.com/_xxxx/friend" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">배송 방법 (상품 상세)</label>
            <input name="shipping_method" className="input" defaultValue={settings.shipping_method ?? '택배'} />
          </div>
          <div>
            <label className="label">배송비 (상품 상세)</label>
            <input name="shipping_fee" className="input" defaultValue={settings.shipping_fee ?? '기본 무료'} />
          </div>
        </div>
        <div>
          <label className="label">입금 계좌 (하단에 표시)</label>
          <input name="bank_info" className="input" defaultValue={settings.bank_info} />
        </div>
        <div>
          <label className="label">하단 사업자 정보</label>
          <textarea name="footer_info" rows={4} className="input" defaultValue={settings.footer_info} />
        </div>
      </section>

      <section className="bg-white border border-line p-6 space-y-5">
        <div>
          <h2 className="font-bold">공유 · 검색 · 아이콘</h2>
          <p className="text-xs text-neutral-500 mt-1">카톡·문자로 사이트 주소를 보낼 때, 네이버·구글 검색 결과에 나오는 모습이에요. 상품 링크는 그 상품 사진과 이름으로 자동으로 나와요.</p>
        </div>

        {/* 미리보기 */}
        <div className="max-w-sm overflow-hidden rounded-xl border border-line bg-neutral-50">
          <div className="aspect-[1200/630] bg-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {ogImg ? <img src={ogImg} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-neutral-400">공유 이미지 없음</div>}
          </div>
          <div className="p-3">
            <p className="text-sm font-bold line-clamp-1">{settings.seo_title || settings.site_name || 'TIMELIER'}</p>
            <p className="text-xs text-neutral-500 line-clamp-2">{settings.seo_description || '검수된 하이엔드 시계, 타임리에'}</p>
          </div>
        </div>
        <p className="-mt-3 text-[11px] text-neutral-400">↑ 카톡 미리보기 대략적인 모양 (저장 후 새로고침하면 반영)</p>

        <div>
          <label className="label">공유 이미지 (가로 1200 × 세로 630 권장)</label>
          <input type="hidden" name="og_image" value={ogImg} />
          <ImageUpload value={ogImg} onChange={setOgImg} folder="seo" />
        </div>
        <div>
          <label className="label">제목 (검색 결과·카톡 미리보기 큰 글씨)</label>
          <input name="seo_title" className="input" defaultValue={settings.seo_title} placeholder="예: TIMELIER | 실시간 검수 명품시계" />
        </div>
        <div>
          <label className="label">설명 (80자 안쪽 권장)</label>
          <textarea name="seo_description" rows={2} className="input" defaultValue={settings.seo_description} placeholder="예: 출고 전 실제 제품을 영상으로 확인하고 구매하세요. 롤렉스·파텍필립·오데마피게 국내재고 바로배송" />
        </div>
        <div>
          <label className="label">검색 키워드 (쉼표로 구분)</label>
          <input name="seo_keywords" className="input" defaultValue={settings.seo_keywords} placeholder="예: 명품시계, 롤렉스, 데이토나, 서브마리너, 파텍필립" />
        </div>

        <div className="border-t border-line pt-5">
          <label className="label">사이트 아이콘 (정사각형 PNG, 512×512 권장)</label>
          <p className="mb-2 text-xs text-neutral-500">브라우저 탭, 북마크, 휴대폰 홈 화면에 나오는 아이콘이에요. 비워두면 지금의 TIMELIER 아이콘을 써요.</p>
          <input type="hidden" name="icon_url" value={iconImg} />
          <ImageUpload value={iconImg} onChange={setIconImg} folder="seo" />
        </div>

        <div className="border-t border-line pt-5 space-y-3">
          <div>
            <label className="label">사이트 주소 (도메인 연결 후 입력)</label>
            <input name="site_url" className="input" defaultValue={settings.site_url} placeholder="https://새도메인.com" />
          </div>
          <div>
            <label className="label">구글 소유확인 코드</label>
            <input name="google_verification" className="input" defaultValue={settings.google_verification} placeholder="google-site-verification 의 content 값만" />
          </div>
          <div>
            <label className="label">네이버 소유확인 코드</label>
            <input name="naver_verification" className="input" defaultValue={settings.naver_verification} placeholder="naver-site-verification 의 content 값만" />
          </div>
          <p className="text-xs text-neutral-500">사이트맵 주소: <b>사이트주소/sitemap.xml</b> (구글 서치콘솔·네이버 서치어드바이저에 등록)</p>
        </div>
      </section>

      <SubmitButton />
    </form>
  );
}

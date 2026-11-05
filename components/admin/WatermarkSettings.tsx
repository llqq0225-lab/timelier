'use client';

import { useEffect, useRef, useState } from 'react';
import ImageUpload, { resetWatermarkCache } from './ImageUpload';
import { drawWatermark, readWm, type WmStyle } from '@/lib/watermark';

/** 관리자 > 배너·사이트 설정 안의 '사진 워터마크' 칸 (미리보기 포함) */
export default function WatermarkSettings({ settings }: { settings: Record<string, string> }) {
  const init = readWm(settings);
  const [on, setOn] = useState(settings.wm_on ? init.on : false);
  const [text, setText] = useState(settings.wm_text ?? settings.site_name ?? '');
  const [logo, setLogo] = useState(init.logo);
  const [style, setStyle] = useState<WmStyle>(init.style);
  const [opacity, setOpacity] = useState(init.opacity);
  const [size, setSize] = useState(init.size);
  const [reviews, setReviews] = useState(init.reviews);
  const [sample, setSample] = useState<ImageBitmap | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => resetWatermarkCache(), [on, text, logo, style, opacity, size, reviews]);

  // 미리보기 그리기
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const w = c.width;
    const h = c.height;
    if (sample) {
      const s = Math.max(w / sample.width, h / sample.height);
      ctx.drawImage(sample, (w - sample.width * s) / 2, (h - sample.height * s) / 2, sample.width * s, sample.height * s);
    } else {
      // 예시: 왼쪽 밝은 배경 + 오른쪽 어두운 배경 (둘 다 잘 보이는지 확인용)
      ctx.fillStyle = '#ece8e1';
      ctx.fillRect(0, 0, w / 2, h);
      ctx.fillStyle = '#2b0a15';
      ctx.fillRect(w / 2, 0, w / 2, h);
      ctx.fillStyle = '#9a9a9a';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1f2f4a';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.23, 0, Math.PI * 2);
      ctx.fill();
    }
    drawWatermark(ctx, w, h, { on: true, text: text.trim(), logo, style, opacity, size, reviews });
  }, [text, logo, style, opacity, size, sample, reviews]);

  return (
    <section className="bg-white border border-line p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">사진 워터마크</h2>
          <p className="text-xs text-neutral-500 mt-1">
            켜두면 <b>상품 사진 · 검수 사진 · 후기 사진</b>을 올릴 때 자동으로 찍혀요. 배너·로고·팝업 사진에는 안 찍혀요.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm shrink-0">
          <input type="checkbox" name="wm_on" checked={on} onChange={(e) => setOn(e.target.checked)} /> 사용
        </label>
      </div>

      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-4">
          <div>
            <label className="label">문구</label>
            <input name="wm_text" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="예: TIMELIER" />
          </div>
          <div>
            <label className="label">로고 이미지 (선택 · 배경이 투명한 PNG) — 넣으면 문구 대신 로고가 찍혀요</label>
            <input type="hidden" name="wm_logo" value={logo} />
            <ImageUpload value={logo} onChange={setLogo} folder="watermark" />
          </div>
          <div>
            <label className="label">모양</label>
            <input type="hidden" name="wm_style" value={style} />
            <div className="flex gap-2">
              {(
                [
                  ['tile', '사선 반복'],
                  ['center', '가운데 크게'],
                  ['corner', '오른쪽 아래'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setStyle(v)} className={`btn-line text-xs ${style === v ? '!border-ink font-bold' : ''}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">진하기 {opacity}%</label>
              <input type="range" name="wm_opacity" min={5} max={80} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="label">크기 {['', '작게', '보통', '크게'][size]}</label>
              <input type="range" name="wm_size" min={1} max={3} step={1} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reviews} onChange={(e) => setReviews(e.target.checked)} />
            <input type="hidden" name="wm_reviews" value={reviews ? 'Y' : 'N'} />
            후기 사진에도 넣기
          </label>
        </div>

        <div>
          <canvas ref={canvas} width={520} height={650} className="w-full border border-line bg-neutral-100" />
          <label className="mt-2 block cursor-pointer text-center text-xs text-neutral-500 underline">
            내 사진으로 미리보기
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setSample(await createImageBitmap(f, { imageOrientation: 'from-image' }));
                e.target.value = '';
              }}
            />
          </label>
          <p className="mt-1 text-center text-[11px] text-neutral-400">미리보기 사진은 저장되지 않아요</p>
        </div>
      </div>
      <p className="text-xs text-neutral-500">※ 이미 올라가 있는 사진에는 적용되지 않고, 설정을 저장한 뒤 새로 올리는 사진부터 찍혀요.</p>
    </section>
  );
}

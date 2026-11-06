import type { Metadata } from 'next';
import Link from 'next/link';
import Reveal from '@/components/about/Reveal';
import KakaoLink from '@/components/KakaoLink';
import { createPublicClient } from '@/lib/supabase/public';
import { getSettings, kakaoOf } from '@/lib/types';
import { hasKakao } from '@/lib/kakao';
import { parseAbout, type AboutBlock } from '@/lib/about';

export const revalidate = 60;
export const metadata: Metadata = { title: 'The Maison', description: '타임리에 이야기 — 시간을 고르는 일' };

/** 문단 나누기: 빈 줄 = 새 문단, 줄바꿈 = 줄바꿈 */
function Paras({ text, className = '' }: { text: string; className?: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className={`whitespace-pre-line ${className} ${i ? 'mt-6' : ''}`}>
            {p.trim()}
          </p>
        ))}
    </>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) =>
  children ? <p className="font-display text-[10px] font-medium uppercase tracking-[0.42em] text-accent">{children}</p> : null;

/** 얇은 금색 장식 선 */
const Ornament = () => (
  <div className="flex items-center justify-center gap-3 text-accent/60" aria-hidden="true">
    <span className="h-px w-10 bg-current" />
    <span className="h-1.5 w-1.5 rotate-45 border border-current" />
    <span className="h-px w-10 bg-current" />
  </div>
);

function Block({ b, i }: { b: AboutBlock; i: number }) {
  switch (b.type) {
    case 'hero':
      return (
        <section className="relative h-[92svh] min-h-[560px] overflow-hidden bg-abyss">
          {b.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.image} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a0509]/40 via-[#1a0509]/25 via-45% to-[#1a0509]" />
          <div className="absolute inset-x-0 bottom-0 px-8 pb-20 text-center">
            <div className="reveal">
              <Eyebrow>{b.eyebrow}</Eyebrow>
              <h1 className="mt-7 font-kserif text-[40px] font-light leading-[1.25] tracking-[-0.01em] text-fg whitespace-pre-line [text-shadow:0_2px_24px_rgba(26,5,9,0.6)]">{b.title}</h1>
              {b.subtitle && <p className="mt-6 font-serif text-[15px] italic text-fg/65">{b.subtitle}</p>}
            </div>
            <div className="mt-14 flex justify-center" aria-hidden="true">
              <span className="block h-12 w-px animate-pulse bg-gradient-to-b from-accent/70 to-transparent" />
            </div>
          </div>
        </section>
      );

    case 'text':
      return (
        <section className="px-8 py-24 text-center">
          <div className="reveal mx-auto max-w-[22rem]">
            <Eyebrow>{b.eyebrow}</Eyebrow>
            {b.title && <h2 className="mt-6 font-kserif text-[28px] font-light leading-[1.45] text-fg whitespace-pre-line">{b.title}</h2>}
            <div className="my-9">
              <Ornament />
            </div>
            <div className="font-kserif text-[15px] font-light leading-[2.15] text-fg/72">
              <Paras text={b.body} />
            </div>
          </div>
        </section>
      );

    case 'image':
      if (!b.image) return null;
      return (
        <figure className={`reveal ${b.wide ? '' : 'px-8'} py-6`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.image} alt={b.caption} loading="lazy" className={`w-full object-cover ${b.wide ? 'aspect-[4/5]' : 'aspect-[4/5]'}`} />
          {b.caption && <figcaption className="mt-4 px-8 text-center font-serif text-[13px] italic text-fg/45">{b.caption}</figcaption>}
        </figure>
      );

    case 'split': {
      const right = b.side === 'right';
      return (
        <section className="py-16">
          {b.image && (
            <div className={`reveal ${right ? 'pl-16' : 'pr-16'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
            </div>
          )}
          <div className={`reveal px-8 ${b.image ? 'mt-10' : ''} ${right ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-4 ${right ? 'flex-row-reverse' : ''}`}>
              <span className="font-serif text-[15px] italic text-accent/80">{String(i).padStart(2, '0')}</span>
              <span className="h-px w-8 bg-accent/40" />
              <Eyebrow>{b.eyebrow}</Eyebrow>
            </div>
            {b.title && <h3 className="mt-5 font-kserif text-[26px] font-light leading-[1.45] text-fg whitespace-pre-line">{b.title}</h3>}
            <div className="mt-5 font-kserif text-[14.5px] font-light leading-[2.1] text-fg/70">
              <Paras text={b.body} />
            </div>
          </div>
        </section>
      );
    }

    case 'quote':
      return (
        <section className="bg-abyss px-8 py-24 text-center">
          <div className="reveal mx-auto max-w-[22rem]">
            <span className="block font-serif text-[64px] leading-none text-accent/70" aria-hidden="true">“</span>
            <blockquote className="mt-2 font-kserif text-[20px] font-light leading-[1.8] text-fg/90 whitespace-pre-line">{b.text}</blockquote>
            {b.cite && <p className="mt-8 font-display text-[10px] uppercase tracking-[0.4em] text-accent">— {b.cite}</p>}
          </div>
        </section>
      );

    case 'pillars':
      return (
        <section className="px-8 py-24">
          <div className="reveal text-center">
            <Eyebrow>{b.eyebrow}</Eyebrow>
            {b.title && <h2 className="mt-6 font-kserif text-[26px] font-light leading-[1.45] text-fg whitespace-pre-line">{b.title}</h2>}
          </div>
          <ol className="mt-14 border-t border-rule">
            {b.items
              .filter((it) => it.title || it.body)
              .map((it, k) => (
                <li key={k} className="reveal grid grid-cols-[48px_1fr] gap-4 border-b border-rule py-8">
                  <span className="font-serif text-[26px] font-light leading-none text-accent">{['I', 'II', 'III', 'IV', 'V', 'VI'][k]}</span>
                  <div>
                    <p className="font-kserif text-[17px] text-fg">{it.title}</p>
                    <p className="mt-2 font-kserif text-[14px] font-light leading-[2] text-fg/65">{it.body}</p>
                  </div>
                </li>
              ))}
          </ol>
        </section>
      );
  }
}

export default async function AboutPage() {
  const supabase = createPublicClient();
  const settings = await getSettings(supabase);
  const blocks = parseAbout(settings.about_blocks);
  const kakao = kakaoOf(settings);

  return (
    <article>
      {/* 한글 명조체 (Noto Serif KR) */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&display=swap" precedence="default" />
      <Reveal />
      {blocks.map((b, i) => (
        <Block key={i} b={b} i={blocks.slice(0, i + 1).filter((x) => x.type === 'split').length} />
      ))}

      {/* 마무리: 상담 */}
      <section className="border-t border-rule px-8 py-24 text-center">
        <div className="reveal">
          <Ornament />
          <p className="mt-10 font-serif text-[34px] font-light text-fg">Private Consultation</p>
          <p className="mx-auto mt-4 max-w-[18rem] font-kserif text-[14px] font-light leading-[2] text-fg/60">
            타임리에의 컨시어지가 1:1로 안내해 드립니다.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            {hasKakao(kakao) && <KakaoLink urls={kakao} className="cta-solid w-full max-w-[18rem]">Book a consultation</KakaoLink>}
            <Link href="/ranking" className="cta w-full max-w-[18rem]">The Selection</Link>
          </div>
        </div>
      </section>
    </article>
  );
}

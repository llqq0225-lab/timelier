/** TIMELIER 글자 로고 (세리프) */
export default function Wordmark({ className = '', sub = false }: { className?: string; sub?: boolean }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="font-serif font-normal tracking-[0.34em] -mr-[0.34em]">TIMELIER</span>
      {sub && <span className="mt-1.5 font-display text-[0.3em] font-medium tracking-[0.5em] -mr-[0.5em] opacity-60">FINE TIMEPIECES</span>}
    </span>
  );
}

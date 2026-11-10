import { splitRich } from '@/lib/about';

/** "문구" → 두껍게, ((문구)) → 작게 */
export default function Rich({ text }: { text: string }) {
  return (
    <>
      {splitRich(text).map((p, i) =>
        p.k === 'b' ? (
          <strong key={i} className="font-semibold text-fg">{p.t}</strong>
        ) : p.k === 's' ? (
          <small key={i} className="text-[0.84em] opacity-70">{p.t}</small>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}

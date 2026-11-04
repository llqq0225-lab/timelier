/** 페이지를 누르면 바로 보이는 회색 뼈대 (기다리는 느낌 줄이기) */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-pulse" aria-busy="true" aria-label="불러오는 중">
      <div className="h-6 w-40 rounded-full bg-panel" />
      <div className="mt-3 h-4 w-64 rounded-full bg-panel" />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square rounded-md bg-panel" />
            <div className="mt-3 h-3 w-1/3 rounded-full bg-panel" />
            <div className="mt-2 h-4 w-4/5 rounded-full bg-panel" />
            <div className="mt-2 h-4 w-1/2 rounded-full bg-panel" />
          </div>
        ))}
      </div>
    </div>
  );
}

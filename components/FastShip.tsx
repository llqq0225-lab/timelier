/** 국내재고: ⚡빠른배송 내일 도착 예정 */
export default function FastShip({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <p className={`flex items-center font-semibold ${size === 'md' ? 'text-sm' : 'text-[12px]'}`}>
      <svg viewBox="4 2 14 20" className={`mr-[3px] ${size === 'md' ? 'h-[14px] w-[10px]' : 'h-3 w-[9px]'}`} aria-hidden="true">
        <path fill="#c9a56e" d="M13 2 4 14h6l-1 8 9-12h-6z" />
      </svg>
      <span className="text-[#c9a56e]">빠른배송</span>
      <span className="ml-1 font-normal text-fg/65">내일 도착 예정</span>
    </p>
  );
}

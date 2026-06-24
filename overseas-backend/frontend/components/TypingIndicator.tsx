/**
 * AI 正在输入指示器 — 三个点跳动动画
 */
import { BRAND_COLORS } from '../constants';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-[10px]">
      {/* AI 头像 */}
      <div
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, #7C3AED)` }}
      >
        AI
      </div>

      {/* 跳动点 */}
      <div
        className="flex gap-[5px] items-center rounded-bl-none rounded-br-2xl rounded-tl-sm rounded-tr-2xl border border-[#E2E8F0] px-[18px] py-3"
        style={{ background: '#F8FAFC' }}
      >
        <span
          className="inline-block h-[6px] w-[6px] rounded-full bg-[#94A3B8] animate-bounce"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="inline-block h-[6px] w-[6px] rounded-full bg-[#94A3B8] animate-bounce"
          style={{ animationDelay: '0.18s' }}
        />
        <span
          className="inline-block h-[6px] w-[6px] rounded-full bg-[#94A3B8] animate-bounce"
          style={{ animationDelay: '0.36s' }}
        />
      </div>
    </div>
  );
}

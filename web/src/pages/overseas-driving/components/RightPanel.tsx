/**
 * 右侧面板 — 相关文件检索结果展示
 */
import { TAG_COLORS } from '../constants';
import type { DocItem } from '../types';
import { DocumentIcon, ExternalLinkIcon, ImagePlaceholderIcon } from './Icons';

interface RightPanelProps {
  /** 是否正在检索 */
  loading: boolean;
  /** 检索到的文档列表 */
  docs: DocItem[];
}

/** 骨架卡片 */
function SkeletonCard() {
  return (
    <div className="rounded-[10px] border border-[#F1F5F9] bg-white px-[14px] py-[14px]">
      <div
        className="mb-2 h-[11px] w-[60%] rounded-md animate-pulse"
        style={{
          background:
            'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
          backgroundSize: '400px 100%',
        }}
      />
      <div
        className="mb-[6px] h-[11px] w-[90%] rounded-md animate-pulse"
        style={{
          background:
            'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
          backgroundSize: '400px 100%',
        }}
      />
      <div
        className="h-[11px] w-[75%] rounded-md animate-pulse"
        style={{
          background:
            'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
          backgroundSize: '400px 100%',
        }}
      />
    </div>
  );
}

export default function RightPanel({ loading, docs }: RightPanelProps) {
  return (
    <aside
      className="flex w-[272px] shrink-0 flex-col overflow-hidden px-4 py-5"
      style={{ background: '#FAFBFF' }}
    >
      {/* 标题 */}
      <div className="mb-4 flex items-center gap-[7px] border-b border-[#E2E8F0] pb-[14px]">
        <DocumentIcon size={15} stroke="#4F46E5" strokeWidth={2.2} />
        <span className="text-[13.5px] font-bold text-[#1E293B] tracking-tight">
          相关文件检索
        </span>
      </div>

      {/* 空状态 */}
      {!loading && docs.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div className="mb-[6px] text-[#CBD5E1]">
            <DocumentIcon size={28} strokeWidth={1.5} />
          </div>
          <p className="text-[13px] font-medium text-[#94A3B8]">发起咨询后</p>
          <p className="text-center text-[11.5px] text-[#CBD5E1]">
            相关政策文件将显示于此
          </p>
        </div>
      )}

      {/* 加载中骨架 */}
      {loading && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
          <p className="mt-1 text-center text-xs text-[#94A3B8]">
            正在检索相关文件…
          </p>
        </div>
      )}

      {/* 文档结果列表 */}
      {!loading && docs.length > 0 && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          <p className="mb-0.5 text-[11.5px] font-medium text-[#64748B]">
            共检索到 {docs.length} 份文件
          </p>
          {docs.map((doc) => {
            const tc = TAG_COLORS[doc.tag] ?? { bg: '#F1F5F9', text: '#475569' };
            return (
              <div
                key={doc.id}
                className="rounded-[10px] border border-[#E2E8F0] bg-white px-[13px] py-[13px] transition-shadow hover:shadow-sm"
              >
                {/* 标签行 */}
                <div className="mb-[7px] flex items-center justify-between">
                  <span
                    className="rounded-[5px] px-[7px] py-0.5 text-[10.5px] font-semibold tracking-wide"
                    style={{ background: tc.bg, color: tc.text }}
                  >
                    {doc.tag}
                  </span>
                  <ExternalLinkIcon size={12} className="shrink-0" stroke="#94A3B8" strokeWidth={2} />
                </div>

                {/* 标题 */}
                <p className="mb-[6px] text-[12.5px] font-semibold leading-snug text-[#1E293B]">
                  {doc.title}
                </p>

                {/* 摘要 */}
                <p className="mb-[10px] text-[11.5px] leading-relaxed text-[#64748B] line-clamp-3">
                  {doc.excerpt}
                </p>

                {/* 文件示意图 */}
                <div
                  className="flex h-[60px] w-full flex-col items-center justify-center gap-[3px] rounded-md border border-dashed overflow-hidden"
                  style={{ background: '#F5F7FF', borderColor: '#C7D2FE' }}
                >
                  {doc.img ? (
                    <img src={doc.img} alt={doc.title} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <ImagePlaceholderIcon size={18} stroke="#C7D2FE" strokeWidth={1.5} />
                      <span className="text-[11px]" style={{ color: '#A5B4FC' }}>
                        文件示意图
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

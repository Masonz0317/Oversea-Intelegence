/**
 * 帮助弹窗 — 居中弹出
 */
import { useEffect } from 'react';
import { BRAND_COLORS, SHARED_KEYFRAMES } from '../constants';
import { CloseIcon } from './Icons';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  // 键盘快捷键
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <style>{SHARED_KEYFRAMES}</style>

      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />

      {/* 居中弹窗 */}
      <div className="animate-overseas-modal-in fixed left-1/2 top-1/2 z-50 w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* 顶部标题 */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-5 py-4 sticky top-0 z-10"
          style={{ background: BRAND_COLORS.sidebarBg }}
        >
          <h2 className="text-[15px] font-semibold text-white">帮助</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* 内容区 */}
        <div className="space-y-5 p-6">
          <div className="space-y-2 text-[13px] leading-relaxed text-[#64748B]">
            <p className="text-[15px] font-semibold text-[#1E293B]">智能驾驶出海咨询大模型</p>
            <p>覆盖全球主要市场法规、标准、认证与准入政策</p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] p-4">
            <p className="mb-2 text-[13px] font-medium text-[#1E293B]">使用说明</p>
            <ul className="list-disc space-y-2 pl-4 text-[13px] leading-relaxed text-[#64748B]">
              <li>在聊天框输入问题，按 <kbd className="rounded border border-[#E2E8F0] bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] text-[#475569]">Enter</kbd> 发送</li>
              <li>右侧面板可查看检索到的相关文件</li>
              <li>左侧可管理对话历史</li>
            </ul>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] p-4">
            <p className="mb-2 text-[13px] font-medium text-[#1E293B]">关于</p>
            <p className="text-[13px] leading-relaxed text-[#64748B]">
              本系统由中国汽研（CAERI）提供，基于大语言模型与知识库检索技术，为智能驾驶出海提供专业的法规、标准、认证与准入政策咨询服务。
            </p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] p-4">
            <p className="mb-2 text-[13px] font-medium text-[#1E293B]">联系方式</p>
            <p className="text-[13px] leading-relaxed text-[#64748B]">
              如有问题或建议，请联系管理员获取支持。
            </p>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex justify-end rounded-b-2xl border-t border-[#F1F5F9] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium text-[#0F172A] hover:bg-[#F1F5F9]"
          >
            Esc 关闭
          </button>
        </div>
      </div>
    </>
  );
}

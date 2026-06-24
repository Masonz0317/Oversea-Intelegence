/**
 * 设置弹出面板 — 右侧滑出
 */
import { useState, useEffect } from 'react';
import { BRAND_COLORS, SHARED_KEYFRAMES } from '../constants';
import { api } from '../api';
import { CloseIcon } from './Icons';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  // 个人资料：先从 localStorage 读取初始值（确保 API 失败时也有数据显示）
  const [nickname, setNickname] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}').nickname || ''; } catch { return ''; }
  });
  const [userEmail, setUserEmail] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}').email || ''; } catch { return ''; }
  });
  const [userOrg, setUserOrg] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}').org || ''; } catch { return ''; }
  });

  // 加载用户资料
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    api.getProfile().then((res) => {
      if (res.code === 0 && res.data) {
        setNickname(res.data.nickname || '');
        setUserEmail(res.data.email || '');
        setUserOrg(res.data.org || '');
      }
    }).catch(() => {});
  }, [open]);

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
      {/* 共享 keyframes 注入一次 */}
      <style>{SHARED_KEYFRAMES}</style>

      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* 右侧滑出面板 */}
      <div className="animate-overseas-slide-in fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-2xl">
        {/* 顶部标题 */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: BRAND_COLORS.sidebarBg }}
        >
          <h2 className="text-[16px] font-semibold text-white">个人资料</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <p className="text-[12px] text-[#94A3B8]">以下信息从注册账号同步</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#64748B]">昵称</label>
                <input
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2 text-[13px] text-[#1E293B] outline-none disabled:text-[#475569]"
                  value={nickname}
                  disabled
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#64748B]">邮箱</label>
                <input
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2 text-[13px] text-[#1E293B] outline-none disabled:text-[#475569]"
                  value={userEmail}
                  disabled
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[#64748B]">组织</label>
                <input
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2 text-[13px] text-[#1E293B] outline-none disabled:text-[#475569]"
                  value={userOrg}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* 底部版本 */}
        <div className="border-t border-[#E2E8F0] px-6 py-3 text-[11px] text-[#94A3B8]">
          中国汽研 CAERI · 智驾出海咨询大模型 v1.0
        </div>
      </div>
    </>
  );
}

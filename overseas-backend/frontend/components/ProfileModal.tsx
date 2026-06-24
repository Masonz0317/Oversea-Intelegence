/**
 * 个人资料弹窗 — 对接后端 API
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { BRAND_COLORS, SHARED_KEYFRAMES } from '../constants';
import { api } from '../api';
import { CloseIcon, LockIcon } from './Icons';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  userOrg: string;
  onSave: (name: string, avatar: string, org: string) => void;
}

export default function ProfileModal({ open, onClose, userName, userAvatar, userOrg, onSave }: ProfileModalProps) {
  const getSavedInfo = () => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}'); } catch { return {}; }
  };
  const savedInfo = getSavedInfo();

  const [name, setName] = useState(userName);
  const [avatar, setAvatar] = useState(userAvatar);
  const [email, setEmail] = useState(savedInfo.email || '');
  const [org, setOrg] = useState(savedInfo.org || userOrg || '');
  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 用 ref 保存最新值，避免键盘事件的闭包过期
  const stateRef = useRef({ name, email, org, avatar });
  stateRef.current = { name, email, org, avatar };

  // 打开时从后端加载最新资料
  useEffect(() => {
    if (!open) return;
    const saved = getSavedInfo();
    setName(saved.nickname || userName);
    setEmail(saved.email || '');
    setOrg(saved.org || '');
    if (saved.avatar) setAvatar(saved.avatar);
    if (saved.org) setOrg(saved.org);
    else if (userOrg) setOrg(userOrg);

    setLoading(true);
    api.getProfile().then((res) => {
      if (res.code === 0 && res.data) {
        const u = res.data;
        setName(u.nickname || saved.nickname || userName);
        setEmail(u.email || saved.email || '');
        setOrg(u.org || saved.org || userOrg || '');
        if (u.avatar) setAvatar(u.avatar);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [open, userName, userOrg]);

  const handleSave = useCallback(async () => {
    const { name: n, email: e, org: o, avatar: a } = stateRef.current;
    setLoading(true);
    const res = await api.updateProfile({ nickname: n, email: e, org: o, avatar: a });
    setLoading(false);
    if (res.code === 0) {
      try {
        const info = JSON.parse(localStorage.getItem('userInfo') || '{}');
        info.nickname = n;
        info.email = e;
        info.org = o;
        info.avatar = a;
        localStorage.setItem('userInfo', JSON.stringify(info));
      } catch {}
      onSave(n, a, o);
    }
  }, [onSave]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleChangePwd = async () => {
    if (!oldPwd || !newPwd) { setPwdMsg('请填写所有密码字段'); return; }
    if (newPwd.length < 8 || newPwd.length > 16) { setPwdMsg('新密码需为 8-16 位'); return; }
    if (!/[a-zA-Z]/.test(newPwd)) { setPwdMsg('新密码必须包含字母'); return; }
    if (!/[0-9]/.test(newPwd)) { setPwdMsg('新密码必须包含数字'); return; }
    const res = await api.changePassword(oldPwd, newPwd);
    if (res.code === 0) {
      setPwdMsg('密码修改成功');
      setOldPwd(''); setNewPwd('');
      setTimeout(() => setPwdMsg(''), 2000);
    } else {
      setPwdMsg(res.message || '修改失败');
    }
  };

  // 键盘快捷键（使用 ref 避免闭包过期）
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        handleSave();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, handleSave]);

  if (!open) return null;

  return (
    <>
      <style>{SHARED_KEYFRAMES}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose} />
      <div className="animate-overseas-modal-in fixed left-1/2 top-1/2 z-50 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between rounded-t-2xl px-5 py-4 sticky top-0 z-10"
          style={{ background: BRAND_COLORS.sidebarBg }}>
          <h2 className="text-[15px] font-semibold text-white">个人资料</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
            <CloseIcon size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-5 p-5">
            {/* 头像 */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#EEF2FF] text-xl font-bold text-[#4F46E5] hover:opacity-80"
                onClick={() => fileRef.current?.click()} title="点击更换头像">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
              </div>
              <div>
                <button className="text-[12px] font-medium text-[#4F46E5] hover:underline" onClick={() => fileRef.current?.click()}>更换头像</button>
                <p className="text-[11px] text-[#1E293B] mt-0.5">支持 JPG、PNG</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">昵称</label>
                <input className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2.5 text-[13px] text-[#475569] outline-none"
                  value={name} disabled /></div>
              <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">邮箱</label>
                <input className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2.5 text-[13px] text-[#475569] outline-none"
                  value={email} disabled /></div>
            </div>
            <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">组织</label>
              <input className="w-full rounded-lg border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-2.5 text-[13px] text-[#475569] outline-none"
                value={org} disabled /></div>

            <div className="border-t border-[#F1F5F9] pt-4">
              <button onClick={() => setShowPwd(!showPwd)} className="flex items-center gap-2 text-[13px] font-medium text-[#0F172A] hover:text-[#4F46E5]">
                <LockIcon size={14} />
                修改密码
              </button>
              {showPwd && (
                <div className="mt-3 space-y-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <input type="password" className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5] placeholder:text-[#94A3B8]" placeholder="旧密码"
                    value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
                  <input type="password" className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5] placeholder:text-[#94A3B8]" placeholder="新密码（8-16位，含字母和数字）"
                    value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                  {pwdMsg && <p className={`text-[12px] ${pwdMsg.includes('成功') ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>{pwdMsg}</p>}
                  <button onClick={handleChangePwd} className="w-full rounded-lg py-2.5 text-[13px] font-medium text-white hover:opacity-90"
                    style={{ background: BRAND_COLORS.primary }}>确认修改密码</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-[#F1F5F9] px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium text-[#0F172A] hover:bg-[#F1F5F9]">Esc 取消</button>
          <button onClick={handleSave} disabled={loading} className="rounded-lg px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: BRAND_COLORS.primary }}>{loading ? '保存中…' : 'Enter 保存'}</button>
        </div>
      </div>
    </>
  );
}

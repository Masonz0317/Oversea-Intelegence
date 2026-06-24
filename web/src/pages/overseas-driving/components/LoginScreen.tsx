/**
 * 登录页 — 左侧品牌区 + 右侧高斯模糊
 * 点击登录 → 关闭模糊 → 显示邮箱登录表单
 */
import { useState, useRef, useEffect } from 'react';
import { BRAND_COLORS, LOGO_PATH, BRAND_NAME, PAGE_TITLE, PAGE_SUBTITLE, SHARED_KEYFRAMES } from '../constants';
import { api, setToken } from '../api';
import { Authorization } from '@/constants/authorization';
import { rsaPsw } from '@/utils/index';
import authorizationUtil from '@/utils/authorization-util';
import userService from '@/services/user-service';

interface LoginScreenProps {
  onLogin: (name: string, email: string, avatar: string, org: string) => void;
}

type LoginMethod = 'password' | 'code';

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showForm, setShowForm] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sendCode = async () => {
    if (!email.trim()) { setError('请输入邮箱'); return; }
    setLoading(true);
    const res = await api.sendCode(email.trim());
    setLoading(false);
    if (res.code === 0) {
      setCodeMsg(res.message);
      setError('');
      setCountdown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
      }, 1000);
    } else {
      setError(res.message);
    }
  };

  /** 用相同凭据登录 RAGFlow，获取 Authorization token */
  const loginToRagflow = async (nickname: string, pwd: string) => {
    try {
      const encrypted = rsaPsw(pwd) as string;
      const { data: ragRes, response } = await userService.login({ email: email.trim(), password: encrypted });

      if (ragRes?.code !== 0 && ragRes?.message?.includes('not registered')) {
        const { data: regRes } = await userService.register({ email: email.trim(), password: encrypted, nickname: nickname || email.trim().split('@')[0] });
        if (regRes?.code === 0) {
          const { data: reLoginRes, response: reResp } = await userService.login({ email: email.trim(), password: encrypted });
          if (reLoginRes?.code === 0 && reResp) {
            const auth = reResp.headers.get(Authorization);
            if (auth) authorizationUtil.setItems({ Authorization: auth, userInfo: JSON.stringify({ avatar: '', nickname, email: email.trim() }), Token: reLoginRes.data?.access_token || '' });
          }
        }
      } else if (ragRes?.code === 0 && response) {
        const auth = response.headers.get(Authorization);
        if (auth) authorizationUtil.setItems({ Authorization: auth, userInfo: JSON.stringify({ avatar: '', nickname, email: email.trim() }), Token: ragRes.data?.access_token || '' });
      }
    } catch { /* 忽略 RAGFlow 登录失败 */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('请输入邮箱'); return; }
    setError('');
    setLoading(true);

    if (loginMethod === 'password') {
      if (!password) { setError('请输入密码'); setLoading(false); return; }
      const res = await api.login(email.trim(), password);
      if (res.code === 0) {
        setToken(res.data.token);
        const u = res.data.user;
        localStorage.setItem('userInfo', JSON.stringify(u));
        loginToRagflow(u.nickname, password);
        onLogin(u.nickname, u.email, u.avatar || '', u.org || '');
      } else {
        setError(res.message);
      }
    } else {
      if (!code || code.length !== 6) { setError('请输入 6 位验证码'); setLoading(false); return; }
      const res = await api.codeLogin(email.trim(), code);
      if (res.code === 0) {
        setToken(res.data.token);
        const u = res.data.user;
        localStorage.setItem('userInfo', JSON.stringify(u));
        loginToRagflow(u.nickname, code);
        onLogin(u.nickname, u.email, u.avatar || '', u.org || '');
      } else {
        setError(res.message);
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* ── 左侧品牌区（始终显示）── */}
      <div
        className="hidden w-[440px] shrink-0 flex-col items-center justify-center px-10 lg:flex"
        style={{ background: 'linear-gradient(135deg, #0E5FAF 0%, #1a3a5c 100%)' }}
      >
        <img src={LOGO_PATH} alt="CAERI" className="mb-8 h-10 object-contain" />
        <div className="flex items-center gap-7 mb-6">
          <h1 className="text-[28px] font-bold text-white tracking-wide">{BRAND_NAME}</h1>
          <img src="/caeri-logo.png" alt="" className="h-12 object-contain" />
        </div>
        <h2 className="mb-2 text-[18px] font-semibold text-white/90">{PAGE_TITLE}</h2>
        <p className="text-center text-[14px] leading-relaxed text-white/60">{PAGE_SUBTITLE}</p>
      </div>

      {/* ── 右侧高斯模糊区 ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* 高斯模糊背景 */}
        <div className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80')",
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
        {/* 半透明遮罩 */}
        <div className="absolute inset-0 bg-black/30" />

        {/* 移动端 Logo */}
        <div className="mb-8 text-center lg:hidden">
          <img src={LOGO_PATH} alt="CAERI" className="mx-auto mb-3 h-8" />
          <h1 className="text-[20px] font-bold text-white">{BRAND_NAME}</h1>
        </div>

        {!showForm ? (
          /* ── 欢迎页 ── */
          <div className="relative z-10 text-center">
            <h2 className="mb-4 text-[32px] font-bold text-white drop-shadow-lg">
              欢迎咨询中国汽研
            </h2>
            <p className="mb-8 text-[15px] text-white/80">
              智能驾驶出海咨询大模型
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl px-10 py-3.5 text-[15px] font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              style={{ background: BRAND_COLORS.primary }}
            >
              登录
            </button>
            <p className="mt-8 text-[13px] text-white/60">
              需要账号？请联系：待定
            </p>
          </div>
        ) : (
          /* ── 登录表单 ── */
          <div className="animate-overseas-fade-in relative z-10 w-[380px] rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 text-center">
              <h2 className="text-[18px] font-bold text-[#1E293B]">邮箱登录</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 登录方式切换 */}
              <div className="flex rounded-lg bg-[#F1F5F9] p-1">
                <button type="button"
                  className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-colors ${loginMethod === 'password' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#475569]'}`}
                  onClick={() => { setLoginMethod('password'); setError(''); }}
                >密码登录</button>
                <button type="button"
                  className={`flex-1 rounded-md py-2 text-[13px] font-medium transition-colors ${loginMethod === 'code' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#475569]'}`}
                  onClick={() => { setLoginMethod('code'); setError(''); }}
                >验证码登录</button>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#0F172A]">邮箱</label>
                <input type="email"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#1E293B] outline-none transition-colors focus:border-[#4F46E5]"
                  placeholder="请输入邮箱" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown}
                />
              </div>

              {loginMethod === 'password' ? (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#0F172A]">密码</label>
                  <input type="password"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#1E293B] outline-none transition-colors focus:border-[#4F46E5]"
                    placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown}
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#0F172A]">验证码</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-[14px] text-[#1E293B] outline-none transition-colors focus:border-[#4F46E5]"
                      placeholder="6位验证码" maxLength={6} value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={handleKeyDown}
                    />
                    <button type="button" disabled={countdown > 0 || loading}
                      className={`shrink-0 rounded-xl px-4 text-[13px] font-medium transition-colors ${countdown > 0 ? 'bg-[#F1F5F9] text-[#475569] cursor-not-allowed' : 'text-white hover:opacity-90'}`}
                      style={countdown > 0 ? {} : { background: BRAND_COLORS.primary }} onClick={sendCode}
                    >{countdown > 0 ? `${countdown}s` : '发送验证码'}</button>
                  </div>
                  {codeMsg && <p className="mt-1.5 text-[11px] text-[#16A34A]">{codeMsg}</p>}
                </div>
              )}

              {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ background: BRAND_COLORS.primary }}
              >{loading ? '请稍候…' : '登录'}</button>
            </form>

            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="mt-4 w-full text-center text-[13px] text-[#475569] hover:text-[#64748B] transition-colors"
            >
              返回
            </button>
          </div>
        )}
      </div>

      <style>{SHARED_KEYFRAMES}</style>
    </div>
  );
}

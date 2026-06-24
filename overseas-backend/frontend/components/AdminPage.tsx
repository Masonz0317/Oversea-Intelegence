/**
 * 管理员后台 — 用户管理
 */
import { useState, useEffect, useMemo } from 'react';
import { BRAND_COLORS } from '../constants';
import { api, setToken as saveToken } from '../api';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './Icons';

/** 将 ISO 时间字符串格式化为中国时间 */
function formatChinaTime(isoStr: string | undefined, showTime = true): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.slice(0, showTime ? 16 : 10);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Shanghai',
      year: 'numeric', month: '2-digit', day: '2-digit',
      ...(showTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    };
    return d.toLocaleString('zh-CN', options).replace(/\//g, '-');
  } catch {
    return isoStr.slice(0, showTime ? 16 : 10);
  }
}

interface UserRow {
  id: string;
  nickname: string;
  email: string;
  phone: string;
  org: string;
  created_at: string;
  last_login: string;
  last_ip: string;
  token_used: number;
}

const PAGE_SIZE = 10;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPwd, setAdminPwd] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ nickname: '', email: '', password: '', phone: '', org: '' });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  // 聊天记录弹窗
  const [chatUser, setChatUser] = useState<UserRow | null>(null);
  const [chatList, setChatList] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDetail, setChatDetail] = useState<any | null>(null);

  const loadUsers = async () => {
    const res = await api.adminListUsers();
    if (res.code === 0) setUsers(res.data);
  };

  useEffect(() => { if (authed) loadUsers(); }, [authed]);

  // 搜索过滤
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter((u) =>
      u.id?.toLowerCase().includes(term) ||
      u.nickname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.org?.toLowerCase().includes(term) ||
      u.phone?.includes(term) ||
      u.last_ip?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  useEffect(() => { setPage(1); }, [searchTerm]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const res = await api.adminLogin(adminName, adminPwd);
    setLoginLoading(false);
    if (res.code === 0) {
      saveToken(res.data.token);
      localStorage.setItem('admin_token', '1');
      setAuthed(true);
    } else {
      setLoginError(res.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault(); setAddError(''); setAddSuccess('');
    const res = await api.adminAddUser(newUser);
    if (res.code === 0) {
      setNewUser({ nickname: '', email: '', password: '', phone: '', org: '' });
      setShowAdd(false);
      setAddSuccess('添加成功');
      setTimeout(() => setAddSuccess(''), 2000);
      loadUsers();
    } else {
      setAddError(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    await api.adminDeleteUser(id);
    setDeleteConfirm(null);
    loadUsers();
  };

  const handleExport = async () => {
    const res = await api.adminExportUsers(searchTerm.trim() || undefined);
    if (res.code === 0 && res.data.length > 0) {
      const csv = [
        Object.keys(res.data[0]).join(','),
        ...res.data.map((r: any) => Object.values(r).map((v: any) => `"${v || ''}"`).join(',')),
      ].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `用户数据_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
  };

  // 查看用户聊天记录
  const handleViewChats = async (user: UserRow) => {
    setChatUser(user);
    setChatDetail(null);
    setChatLoading(true);
    const res = await api.adminGetUserChats(user.id);
    setChatLoading(false);
    if (res.code === 0) setChatList(res.data);
  };

  const handleViewChatDetail = async (recordId: string) => {
    setChatLoading(true);
    const res = await api.adminGetChatDetail(recordId);
    setChatLoading(false);
    if (res.code === 0) setChatDetail(res.data);
  };

  // 登录页面
  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="w-[360px] rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-[20px] font-bold text-[#1E293B]">管理员后台</h1>
            <p className="mt-1 text-[13px] text-[#94A3B8]">请输入管理员账号和密码</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] text-[#1E293B] outline-none focus:border-[#4F46E5] placeholder:text-[#94A3B8]"
              placeholder="管理员账号"
              value={adminName} onChange={(e) => setAdminName(e.target.value)} autoFocus
            />
            <input
              type="password"
              className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[14px] text-[#1E293B] outline-none focus:border-[#4F46E5] placeholder:text-[#94A3B8]"
              placeholder="管理员密码"
              value={adminPwd} onChange={(e) => setAdminPwd(e.target.value)}
            />
            {loginError && <p className="text-[12px] text-[#EF4444]">{loginError}</p>}
            <button type="submit" disabled={loginLoading}
              className="w-full rounded-xl py-3 text-[14px] font-semibold text-white transition-colors hover:opacity-90"
              style={{ background: BRAND_COLORS.primary }}>{loginLoading ? '登录中…' : '登录'}</button>
          </form>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="flex h-screen flex-col bg-[#F1F5F9]">
      <header className="flex items-center justify-between px-6 py-4" style={{ background: BRAND_COLORS.sidebarBg }}>
        <h1 className="text-[16px] font-bold text-white">管理员后台</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleExport}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-white/25"
          >导出 CSV</button>
          <button onClick={() => { setAuthed(false); localStorage.removeItem('admin_token'); }}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-[12px] text-white transition-colors hover:bg-white/25"
          >退出</button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#1E293B]">
            用户管理（共 {filteredUsers.length} 人{filteredUsers.length !== users.length ? ` / 总计 ${users.length}` : ''}）
          </h2>
          <button onClick={() => { setShowAdd(!showAdd); setAddError(''); setAddSuccess(''); }}
            className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90"
            style={{ background: showAdd ? '#94A3B8' : BRAND_COLORS.primary }}
          >{showAdd ? '取消' : '+ 添加用户'}</button>
        </div>

        {/* 搜索栏 */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-[360px]">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-8 text-[13px] text-[#1E293B] outline-none transition-colors focus:border-[#4F46E5] placeholder:text-[#94A3B8]"
              placeholder="搜索用户（昵称 / 邮箱 / 组织 / 手机号）"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#475569]"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 添加用户表单 */}
        {showAdd && (
          <form onSubmit={handleAddUser} className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-5">
            <h3 className="mb-3 text-[14px] font-semibold text-[#1E293B]">添加新用户（管理员授权）</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">昵称 *</label>
                <input className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5]"
                  value={newUser.nickname} onChange={(e) => setNewUser({ ...newUser, nickname: e.target.value })} /></div>
              <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">邮箱 *</label>
                <input type="email" className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5]"
                  value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
              <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">密码 *</label>
                <input type="password" className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5]"
                  value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="8-16位含字母数字" /></div>
              <div><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">手机号</label>
                <input className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5]"
                  value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} /></div>
              <div className="col-span-2"><label className="mb-1 block text-[12px] font-medium text-[#0F172A]">组织</label>
                <input className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] text-[#1E293B] outline-none focus:border-[#4F46E5]"
                  value={newUser.org} onChange={(e) => setNewUser({ ...newUser, org: e.target.value })} placeholder="中国汽研 CAERI" /></div>
            </div>
            {addError && <p className="mb-2 text-[12px] text-[#EF4444]">{addError}</p>}
            {addSuccess && <p className="mb-2 text-[12px] text-[#16A34A]">{addSuccess}</p>}
            <button type="submit" className="rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90"
              style={{ background: BRAND_COLORS.primary }}>确认添加</button>
          </form>
        )}

        {/* 用户表格 */}
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-medium text-[#0F172A]">
                <th className="px-4 py-3">用户ID</th>
                <th className="px-4 py-3">昵称</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">手机号</th>
                <th className="px-4 py-3">组织</th>
                <th className="px-4 py-3">注册时间</th>
                <th className="px-4 py-3">IP地址</th>
                <th className="px-4 py-3">最后登录</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-[13px] text-[#94A3B8]">{searchTerm ? '无匹配用户' : '暂无用户'}</td></tr>}
              {pagedUsers.map((u) => (
                <tr key={u.id} className="border-b border-[#F1F5F9] text-[13px] text-[#334155] last:border-none hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[11px] text-[#94A3B8] font-mono">{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.nickname}</td>
                  <td className="px-4 py-3">{u.email || '-'}</td>
                  <td className="px-4 py-3">{u.phone || '-'}</td>
                  <td className="px-4 py-3">{u.org || '-'}</td>
                  <td className="px-4 py-3 text-[#64748B]">{formatChinaTime(u.created_at, false)}</td>
                  <td className="px-4 py-3 text-[11px] text-[#94A3B8] font-mono">{u.last_ip || '-'}</td>
                  <td className="px-4 py-3 text-[#64748B]">{formatChinaTime(u.last_login)}</td>
                  <td className="px-4 py-3">{u.token_used}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => handleViewChats(u)} className="text-[12px] font-medium text-[#4F46E5] transition-colors hover:underline">聊天</button>
                      {deleteConfirm === u.id ? (
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => handleDelete(u.id)} className="text-[11px] font-medium text-[#EF4444] hover:underline">确认删除</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-[11px] text-[#475569] hover:underline">取消</button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleteConfirm(u.id)} className="text-[12px] font-medium text-[#EF4444] transition-colors hover:underline">删除</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-[#94A3B8]">
              第 {page} / {totalPages} 页，共 {filteredUsers.length} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40"
              ><ChevronLeftIcon size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('ellipsis');
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-1 text-[12px] text-[#94A3B8]">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className="flex h-8 min-w-[32px] items-center justify-center rounded-lg border text-[12px] font-medium transition-colors"
                      style={{
                        background: page === item ? BRAND_COLORS.primary : '#fff',
                        color: page === item ? '#fff' : '#475569',
                        borderColor: page === item ? BRAND_COLORS.primary : '#E2E8F0',
                      }}
                    >{item}</button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40"
              ><ChevronRightIcon size={14} /></button>
            </div>
          </div>
        )}

        {/* 聊天记录弹窗 */}
        {chatUser && (
          <>
            <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setChatUser(null); setChatDetail(null); }} />
            <div className="fixed right-0 top-0 z-50 flex h-full w-[520px] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4" style={{ background: BRAND_COLORS.sidebarBg }}>
                <div>
                  <h2 className="text-[15px] font-semibold text-white">{chatUser.nickname} 的聊天记录</h2>
                  <p className="text-[11px] text-white/60">{chatUser.email}</p>
                </div>
                <button onClick={() => { setChatUser(null); setChatDetail(null); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10">
                  <CloseIcon size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {chatLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
                  </div>
                ) : chatDetail ? (
                  <div className="p-5">
                    <button onClick={() => setChatDetail(null)} className="mb-4 text-[12px] text-[#4F46E5] hover:underline flex items-center gap-1">
                      <ChevronLeftIcon size={12} /> 返回列表
                    </button>
                    <h3 className="mb-3 text-[14px] font-semibold text-[#1E293B]">{chatDetail.title || '无标题'}</h3>
                    <div className="space-y-3">
                      {(chatDetail.messages || []).map((msg: any, i: number) => (
                        <div key={i} className={`rounded-xl px-4 py-3 text-[13px] leading-relaxed ${
                          msg.role === 'user' ? 'bg-[#EEF2FF] text-[#1E293B]' : 'bg-[#F1F5F9] text-[#334155]'
                        }`}>
                          <span className="mb-1 block text-[11px] font-medium text-[#94A3B8]">
                            {msg.role === 'user' ? '用户' : 'AI 助手'}
                          </span>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : chatList.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-[13px] text-[#94A3B8]">暂无聊天记录</div>
                ) : (
                  <div className="p-4 space-y-2">
                    {chatList.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => handleViewChatDetail(c.id)}
                        className="w-full rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:bg-[#F8FAFC]"
                      >
                        <div className="text-[13px] font-medium text-[#1E293B]">{c.title || '无标题'}</div>
                        <div className="mt-1 text-[11px] text-[#94A3B8]">{formatChinaTime(c.created_at)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

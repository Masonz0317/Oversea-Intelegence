/**
 * API 客户端 — 连接 FastAPI 后端
 * BASE 通过 Vite 环境变量 VITE_OVERSEAS_API_BASE 配置，默认 http://localhost:9005
 */

/** 获取 API 基地址：优先环境变量，其次已保存的配置，最后回退默认值 */
function getBase(): string {
  // 1. 运行时覆盖（管理员后台设置可写入）
  const saved = localStorage.getItem('overseas_api_base');
  if (saved) return saved.replace(/\/+$/, '');
  // 2. 构建时环境变量
  if (import.meta.env.VITE_OVERSEAS_API_BASE) {
    return import.meta.env.VITE_OVERSEAS_API_BASE.replace(/\/+$/, '');
  }
  // 3. 默认：生产环境走 nginx 代理（同源），开发环境直连
  return import.meta.env.DEV ? 'http://localhost:9005' : '/od-api';
}

function getToken(): string {
  return localStorage.getItem('auth_token') || '';
}

export function setToken(t: string) { localStorage.setItem('auth_token', t); }
export function clearToken() { localStorage.removeItem('auth_token'); }
export function hasToken(): boolean { return !!getToken(); }

/** 保存自定义 API 地址（管理员设置用） */
export function setApiBase(url: string) {
  if (url) {
    localStorage.setItem('overseas_api_base', url.replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('overseas_api_base');
  }
}

async function request(path: string, opts: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const base = getBase();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...opts, headers });
  } catch (e: any) {
    // 网络错误统一返回
    console.error(`[API] ${path} 请求失败:`, e.message || e);
    return { code: -1, message: '网络连接失败，请检查服务是否启动' };
  }

  // 尝试解析 JSON
  let data: any;
  try {
    data = await res.json();
  } catch {
    return { code: -1, message: `服务返回异常 (HTTP ${res.status})` };
  }

  // 401 时清除 token
  if (res.status === 401) {
    clearToken();
  }

  return data;
}

export const api = {
  // 认证
  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  sendCode: (email: string) =>
    request('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) }),

  codeLogin: (email: string, code: string) =>
    request('/api/auth/code-login', { method: 'POST', body: JSON.stringify({ email, code }) }),

  // 用户
  getProfile: () => request('/api/user/profile'),
  updateProfile: (data: any) => request('/api/user/profile', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (old_password: string, new_password: string) =>
    request('/api/user/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) }),

  // 聊天记录
  getChatRecords: () => request('/api/chat/records'),
  saveChatRecord: (title: string, messages: any[]) =>
    request('/api/chat/records', { method: 'POST', body: JSON.stringify({ title, messages }) }),
  deleteChatRecord: (id: string) =>
    request(`/api/chat/records/${id}`, { method: 'DELETE' }),

  // 管理员
  adminLogin: (username: string, password: string) =>
    request('/api/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  adminListUsers: () => request('/api/admin/users'),
  adminAddUser: (data: any) => request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminDeleteUser: (id: string) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminExportUsers: (search?: string) =>
    request(`/api/admin/users/export${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  adminGetUserChats: (userId: string) => request(`/api/admin/chat/records?user_id=${encodeURIComponent(userId)}`),
  adminGetChatDetail: (recordId: string) => request(`/api/admin/chat/records/${recordId}`),

  // LLM 配置
  getLlmConfig: () => request('/api/admin/llm-config'),
  saveLlmConfig: (data: { api_key?: string; api_base?: string; model?: string }) =>
    request('/api/admin/llm-config', { method: 'POST', body: JSON.stringify(data) }),
  getUserLlmConfig: () => request('/api/user/llm-config'),
};

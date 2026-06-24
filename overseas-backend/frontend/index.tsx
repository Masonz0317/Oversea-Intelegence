/**
 * 智能驾驶出海咨询大模型 — 独立页面
 *
 * 三栏布局：左侧蓝边栏 | 中间聊天区 | 右侧文件检索
 * 直接复用 RAGFlow 的 SSE 流式对话和 API 层，不需要独立 FastAPI 后端
 */
import { MessageType } from '@/constants/chat';
import { useSendMessageWithSse } from '@/hooks/logic-hooks';
import { IMessage } from '@/interfaces/database/chat';
import chatService from '@/services/next-chat-service';
import api from '@/utils/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import LeftSidebar from './components/LeftSidebar';
import LoginScreen from './components/LoginScreen';
import MainChat from './components/MainChat';
import ProfileModal from './components/ProfileModal';
import RightPanel from './components/RightPanel';
import SettingsPanel from './components/SettingsPanel';
import HelpModal from './components/HelpModal';
import { hasToken } from './api';
import { DEFAULT_HISTORIES, OVERSEAS_CHAT_NAME } from './constants';
import type { DocResult } from './hooks/use-overseas-chat';
import type { ChatHistoryItem } from './types';

/** 从 SSE reference 中提取文档 */
function extractDocsFromRef(ref: any): DocResult[] {
  const chunks = ref?.chunks ?? ref?.doc_aggs?.flatMap((d: any) => d.chunks ?? []) ?? [];
  if (!Array.isArray(chunks)) return [];
  return chunks.slice(0, 5).map((chunk: any, i: number) => ({
    id: String(i),
    title: chunk?.document_name ?? chunk?.doc_name ?? '相关文档',
    excerpt: (chunk?.content ?? '').slice(0, 120) + '...',
    tag: ((i % 2 === 0) ? '标准' : '法规') as '标准' | '法规' | '政策',
    docId: chunk?.document_id,
  }));
}

export default function OverseasDrivingPage() {
  // ─── 状态 ───
  const [chatId, setChatId] = useState<string>('');
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [docs, setDocs] = useState<DocResult[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [activeHistory, setActiveHistory] = useState<string | null>(null);
  const [histories, setHistories] = useState<ChatHistoryItem[]>(DEFAULT_HISTORIES);

  const currentSessionId = useRef<string>('');
  const sseController = useRef<AbortController>(new AbortController());
  const { send, answer, done, stopOutputMessage } = useSendMessageWithSse();

  // ─── 用户信息（从 RAGFlow storage 读取）───
  const [userName, setUserName] = useState(() => {
    try { const info = JSON.parse(localStorage.getItem('userInfo') || '{}'); return info.nickname || info.name || '用户'; } catch { return '用户'; }
  });
  const [userAvatar, setUserAvatar] = useState(() => {
    try { return JSON.parse(localStorage.getItem('userInfo') || '{}').avatar || ''; } catch { return ''; }
  });
  const [userOrg, setUserOrg] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // ─── 登录状态 ───
  const [loggedIn, setLoggedIn] = useState(() => hasToken());

  const handleLogin = useCallback((name: string, _email: string, avatar: string, org: string) => {
    setUserName(name);
    setUserAvatar(avatar);
    setUserOrg(org);
    setLoggedIn(true);
  }, []);

  // ─── 初始化：获取或创建专用 Chat ───
  useEffect(() => {
    let cancelled = false;

    async function initChat() {
      try {
        // 先查已有 chat
        const { data: listData } = await chatService.listChats({
          params: { page_size: 50, page: 1, keywords: OVERSEAS_CHAT_NAME },
        });
        if (cancelled) return;

        const existing = listData?.data?.chats?.find(
          (c: any) => c.name === OVERSEAS_CHAT_NAME,
        );
        if (existing) {
          setChatId(existing.id);
          return;
        }

        // 不存在则创建
        const { data: createData } = await chatService.createChat({
          name: OVERSEAS_CHAT_NAME,
          description: '智能驾驶出海法规、标准、认证与准入政策咨询',
          prompt_config: {
            prologue:
              '您好！我是智能驾驶出海咨询助手，可为您提供全球主要市场的法规、标准、认证与准入政策咨询服务。请输入您的问题。',
            system:
              '你是一个专注于智能驾驶出海咨询的专家助手，熟悉全球各主要市场的汽车法规、标准、认证和准入政策。请基于知识库内容为用户提供专业、准确的咨询服务。回答时请引用相关法规和标准的来源。',
            quote: false,
            keyword: false,
            tts: false,
            empty_response: '抱歉，我无法回答这个问题，请尝试换个问法。',
            refine_multiturn: true,
            use_kg: false,
            reasoning: false,
            parameters: [{ key: 'knowledge', optional: false }],
            toc_enhance: false,
          },
          similarity_threshold: 0.2,
          vector_similarity_weight: 0.3,
          top_n: 8,
        });
        if (!cancelled && createData?.data?.id) {
          setChatId(createData.data.id);
        }
      } catch (e) {
        console.error('初始化 Chat 失败:', e);
      }
    }

    initChat();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── 加载会话列表 ───
  const loadSessions = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data } = await chatService.listSessions({
        url: api.listSessions(chatId),
        params: { page_size: 50, page: 1 },
      });
      if (data?.code === 0 && data?.data?.sessions) {
        const items: ChatHistoryItem[] = data.data.sessions.map((s: any) => ({
          id: s.id,
          title: s.name ?? '对话',
          preview: (s.messages?.[0]?.content ?? '').slice(0, 30) || '新对话',
        }));
        if (items.length > 0) {
          setHistories(items);
        }
      }
    } catch {
      // 忽略
    }
  }, [chatId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ─── 创建新会话 ───
  const createSession = useCallback(async () => {
    if (!chatId) return '';
    try {
      const { data } = await chatService.createSession({
        url: api.createSession(chatId),
        data: { name: `咨询 ${new Date().toLocaleString('zh-CN')}` },
      });
      if (data?.code === 0 && data?.data?.id) {
        return data.data.id;
      }
    } catch {
      // 忽略
    }
    return '';
  }, [chatId]);

  // ─── 加载指定会话 ───
  const loadConversation = useCallback(
    async (sessionId: string) => {
      if (!chatId) return;
      try {
        const { data } = await chatService.getSession({
          url: api.getSession(chatId, sessionId),
          params: { page_size: 100, page: 1 },
        });
        if (data?.code === 0 && data?.data) {
          currentSessionId.current = sessionId;
          const msgs = data.data.messages ?? data.data.message ?? [];
          const formatted: IMessage[] = (Array.isArray(msgs) ? msgs : []).map(
            (m: any) => ({
              id: m.id ?? uuid(),
              role:
                m.role ??
                (m.from === 'user' ? MessageType.User : MessageType.Assistant),
              content: m.content ?? '',
            }),
          );
          setMessages(formatted);
        }
      } catch {
        // 忽略
      }
    },
    [chatId],
  );

  // ─── 登出 ───
  const handleLogout = useCallback(() => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    setLoggedIn(false);
    setMessages([]);
    setDocs([]);
    setActiveHistory(null);
    currentSessionId.current = '';
  }, []);

  // ─── 删除历史对话 ───
  const handleDeleteHistory = useCallback(
    async (id: string) => {
      if (!chatId) return;
      try {
        await chatService.deleteSession({ url: api.deleteSession(chatId, id) });
        setHistories((prev) => prev.filter((h) => h.id !== id));
        if (activeHistory === id) {
          setActiveHistory(null);
          setMessages([]);
          setDocs([]);
        }
      } catch { /* 忽略 */ }
    },
    [chatId, activeHistory],
  );

  // ─── 新建对话 ───
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setDocs([]);
    setDocsLoading(false);
    setActiveHistory(null);
    currentSessionId.current = '';
    stopOutputMessage();
  }, [stopOutputMessage]);

  // ─── 选择历史对话 ───
  const handleSelectHistory = useCallback(
    async (id: string) => {
      setActiveHistory(id);
      await loadConversation(id);
    },
    [loadConversation],
  );

  // ─── 发送消息 ───
  const handleSend = useCallback(
    async (content: string) => {
      if (!chatId || !content.trim()) return;

      // 确保有会话
      let sid = currentSessionId.current;
      if (!sid) {
        sid = await createSession();
        if (!sid) return;
        currentSessionId.current = sid;
        loadSessions();
      }

      const userMsg: IMessage = {
        id: uuid(),
        role: MessageType.User,
        content,
      } as IMessage;
      const aiPlaceholder: IMessage = {
        id: uuid(),
        role: MessageType.Assistant,
        content: '',
      } as IMessage;

      setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
      setDocsLoading(true);
      setDocs([]);

      sseController.current = new AbortController();

      try {
        // 构建历史消息（用于上下文）
        const prevMsgs = messages
          .filter(
            (m) =>
              m.role === MessageType.User || m.role === MessageType.Assistant,
          )
          .map((m) => ({ role: m.role, content: m.content }));

        await send(
          api.completionUrl,
          {
            chat_id: chatId,
            session_id: sid,
            messages: [...prevMsgs, { role: 'user', content }],
            pass_all_history_messages: true,
          },
          sseController.current,
        );
      } catch (e) {
        console.error('发送失败:', e);
      }
    },
    [chatId, messages, createSession, send, loadSessions],
  );

  // ─── 停止输出 ───
  const handleStop = useCallback(() => {
    sseController.current?.abort();
    stopOutputMessage();
  }, [stopOutputMessage]);

  // ─── SSE 数据实时同步到消息列表 ───
  useEffect(() => {
    if (!answer?.answer) return;

    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].role === MessageType.Assistant) {
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: answer.answer,
          reference: answer.reference as any,
        };
      }
      return updated;
    });

    // 最终 chunk 包含 reference 时更新文档面板
    if (answer.reference && done) {
      const docResults = extractDocsFromRef(answer.reference);
      setDocs(docResults);
      setDocsLoading(false);
    }
  }, [answer, done]);

  // ─── 未登录 ───
  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ─── 初始化中 ───
  if (!chatId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
          <p className="text-sm text-[#94A3B8]">正在初始化…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap');
        * { font-family: 'Noto Sans SC', sans-serif; }
      `}</style>

      {/* 左侧栏 */}
      <LeftSidebar
        histories={histories}
        activeId={activeHistory}
        onSelect={handleSelectHistory}
        onNewChat={handleNewChat}
        onSettingsClick={() => setShowSettings(true)}
        onProfileClick={() => setShowProfile(true)}
        onHelpClick={() => setShowHelp(true)}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
        onDeleteHistory={handleDeleteHistory}
      />

      {/* 中间聊天区 */}
      <MainChat
        messages={messages}
        loading={!done}
        streamingAnswer={answer?.answer ?? ''}
        onSend={handleSend}
        onStop={handleStop}
      />

      {/* 右侧面板 */}
      <RightPanel loading={docsLoading} docs={docs} />

      {/* 设置面板 */}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />

      {/* 个人资料弹窗 */}
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        userName={userName}
        userAvatar={userAvatar}
        userOrg={userOrg}
        onSave={(name, avatar, org) => {
          setUserName(name);
          setUserAvatar(avatar);
          setUserOrg(org);
        }}
      />

      {/* 帮助弹窗 */}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}

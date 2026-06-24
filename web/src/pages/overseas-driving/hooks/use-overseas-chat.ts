/**
 * 智能驾驶出海咨询 — 聊天逻辑 Hook
 * 复用 RAGFlow 现有的 SSE 流式对话和会话管理能力
 */
import { MessageType } from '@/constants/chat';
import { useSendMessageWithSse } from '@/hooks/logic-hooks';
import { IMessage } from '@/interfaces/database/chat';
import chatService from '@/services/next-chat-service';
import api from '@/utils/api';
import { useCallback, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';

/** SSE 响应中 reference 的 chunk 类型 */
interface ReferenceChunk {
  id?: string;
  content?: string;
  document_name?: string;
  document_id?: string;
  image_id?: string;
  positions?: string[];
  url?: string;
}

interface ReferenceData {
  chunks?: ReferenceChunk[];
  doc_aggs?: Array<{
    doc_name?: string;
    doc_id?: string;
    count?: number;
    chunks?: ReferenceChunk[];
  }>;
}

/** SSE answer 数据结构 */
interface SseAnswer {
  answer: string;
  reference?: ReferenceData;
  audio_binary?: string | null;
  prompt?: string;
  id?: string;
  final?: boolean;
}

export interface DocResult {
  id: string;
  title: string;
  excerpt: string;
  tag: '法规' | '标准' | '政策';
  docId?: string;
}

/** 将 reference 转换为文档结果列表 */
function extractDocsFromReference(ref?: ReferenceData): DocResult[] {
  if (!ref?.chunks && !ref?.doc_aggs) return [];

  const chunks = ref.chunks ?? ref.doc_aggs?.flatMap((d) => d.chunks ?? []) ?? [];
  return chunks.slice(0, 5).map((chunk, i) => ({
    id: chunk.id ?? String(i),
    title: chunk.document_name ?? '相关文档',
    excerpt: (chunk.content ?? '').slice(0, 120) + '...',
    tag: (i % 2 === 0 ? '标准' : '法规') as '标准' | '法规',
    docId: chunk.document_id,
  }));
}

export function useOverseasChat(chatId: string) {
  const { send, answer, done, stopOutputMessage } = useSendMessageWithSse();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocResult[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const currentConversationId = useRef<string>('');
  const sseController = useRef<AbortController>(new AbortController());

  /** 创建新会话 */
  const createConversation = useCallback(
    async (name?: string) => {
      try {
        const { data } = await chatService.createSession({
          url: api.createSession(chatId),
          data: { name: name ?? '新对话' },
        });
        if (data?.code === 0 && data?.data?.id) {
          currentConversationId.current = data.data.id;
          return data.data.id;
        }
      } catch (e) {
        console.error('创建会话失败:', e);
      }
      return '';
    },
    [chatId],
  );

  /** 加载历史会话 */
  const loadConversation = useCallback(
    async (sessionId: string) => {
      try {
        const { data } = await chatService.getSession({
          url: api.getSession(chatId, sessionId),
          params: { page_size: 100, page: 1 },
        });
        if (data?.code === 0 && data?.data) {
          currentConversationId.current = sessionId;
          const msgs = data.data.messages ?? data.data.message ?? [];
          const formatted: IMessage[] = msgs.map((m: any) => ({
            id: m.id ?? uuid(),
            role: m.role ?? (m.from === 'user' ? MessageType.User : MessageType.Assistant),
            content: m.content ?? '',
          }));
          setMessages(formatted);
          return formatted;
        }
      } catch (e) {
        console.error('加载会话失败:', e);
      }
      return [];
    },
    [chatId],
  );

  /** 发送消息 */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !chatId) return;

      // 如果没有会话，先创建一个
      if (!currentConversationId.current) {
        const id = await createConversation(content.slice(0, 20));
        if (!id) {
          setMessages((prev) => [
            ...prev,
            {
              id: uuid(),
              role: MessageType.Assistant,
              content: '创建会话失败，请检查服务连接。',
            } as IMessage,
          ]);
          return;
        }
        currentConversationId.current = id;
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
      setLoading(true);
      setDocsLoading(true);
      setDocs([]);

      // 重新创建 AbortController
      sseController.current = new AbortController();

      try {
        const prevMessages = messages
          .filter((m) => m.role === MessageType.User || m.role === MessageType.Assistant)
          .map((m) => ({ role: m.role, content: m.content }));

        await send(
          api.completionUrl,
          {
            chat_id: chatId,
            session_id: currentConversationId.current,
            messages: [...prevMessages, { role: 'user', content }],
            pass_all_history_messages: true,
          },
          sseController.current,
        );

        // answer 在 send 完成后会通过 setAnswer 更新
        // 但由于 useSendMessageWithSse 是异步的，answer 在 send 调用期间实时更新
      } catch (e) {
        console.error('发送消息失败:', e);
      }

      setLoading(false);
    },
    [chatId, messages, createConversation, send],
  );

  /** SSE 响应实时更新 assistant 消息 */
  const updateAssistantMessage = useCallback(
    (ans: SseAnswer) => {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === MessageType.Assistant) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: ans.answer ?? '',
            reference: ans.reference as any,
          };
        }
        return updated;
      });

      if (ans.final && ans.reference) {
        const docResults = extractDocsFromReference(ans.reference);
        setDocs(docResults);
        setDocsLoading(false);
      }

      if (ans.final) {
        setLoading(false);
      }
    },
    [],
  );

  /** 停止输出 */
  const stopOutput = useCallback(() => {
    stopOutputMessage();
    sseController.current?.abort();
    setLoading(false);
  }, [stopOutputMessage]);

  /** 新建对话 */
  const newChat = useCallback(() => {
    setMessages([]);
    setDocs([]);
    setDocsLoading(false);
    currentConversationId.current = '';
    stopOutputMessage();
  }, [stopOutputMessage]);

  return {
    messages,
    loading,
    docs,
    docsLoading,
    sendMessage,
    stopOutput,
    newChat,
    createConversation,
    loadConversation,
    currentConversationId,
    updateAssistantMessage,
    /** 当前 answer（用于实时显示 SSE 流） */
    answer,
    done,
  };
}

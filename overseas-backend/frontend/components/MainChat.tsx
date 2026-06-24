/**
 * 中间聊天区 — 消息列表、用户/AI气泡、输入框、SSE 流式显示
 */
import { MessageType } from '@/constants/chat';
import { IMessage } from '@/interfaces/database/chat';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import { BRAND_COLORS, PAGE_SUBTITLE, PAGE_TITLE } from '../constants';
import TypingIndicator from './TypingIndicator';
import { SendIcon, StopIcon, HelpIcon } from './Icons';

interface MainChatProps {
  /** 消息列表 */
  messages: IMessage[];
  /** 是否正在加载 */
  loading: boolean;
  /** 当前 SSE 流式 answer */
  streamingAnswer: string;
  /** 发送消息 */
  onSend: (content: string) => void;
  /** 停止输出 */
  onStop: () => void;
}

export default function MainChat({
  messages,
  loading,
  streamingAnswer,
  onSend,
  onStop,
}: MainChatProps) {
  const [input, setInput] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingAnswer]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden border-x border-[#E2E8F0] bg-white">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between border-b border-[#F1F5F9] px-7 py-[18px]">
        <div>
          <h1 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
            {PAGE_TITLE}
          </h1>
          <p className="mt-0.5 text-xs text-[#94A3B8]">{PAGE_SUBTITLE}</p>
        </div>

        {/* 在线状态 */}
        <div
          className="flex items-center gap-[6px] rounded-full border px-3 py-[5px] text-xs font-medium"
          style={{
            background: BRAND_COLORS.successBg,
            borderColor: BRAND_COLORS.successBorder,
            color: BRAND_COLORS.successText,
          }}
        >
          <span
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{ background: BRAND_COLORS.success }}
          />
          在线
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {/* 空状态 */}
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 pt-[60px]">
            <div className="mb-2">
              <HelpIcon size={32} stroke="#94A3B8" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-medium text-[#64748B]">
              请输入您的咨询问题
            </p>
            <p className="max-w-[320px] text-center text-[12.5px] leading-relaxed text-[#94A3B8]">
              例如：日本自动驾驶 L3 级别上路的法规要求有哪些？
            </p>
          </div>
        )}

        {/* 消息列表 */}
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => {
            const isUser = msg.role === MessageType.User;
            return (
              <div
                key={msg.id ?? i}
                className="flex items-start gap-[10px]"
                style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
              >
                {/* AI 头像 */}
                {!isUser && (
                  <div
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, #7C3AED)`,
                    }}
                  >
                    AI
                  </div>
                )}

                {/* 气泡 */}
                <div
                  className="max-w-[70%] rounded-2xl px-4 py-[10px] text-sm leading-relaxed"
                  style={
                    isUser
                      ? {
                          background: BRAND_COLORS.primary,
                          color: 'white',
                          borderTopRightRadius: 4,
                        }
                      : {
                          background: '#F8FAFC',
                          color: '#1E293B',
                          border: '1px solid #E2E8F0',
                          borderTopLeftRadius: 4,
                        }
                  }
                >
                  <div className="overflow-hidden whitespace-pre-wrap break-words [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {/* 用户头像 */}
                {isUser && (
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-[#E2E8F0] text-[11px] font-bold text-[#475569]">
                    你
                  </div>
                )}
              </div>
            );
          })}

          {/* SSE 流式实时回答 */}
          {loading && streamingAnswer && (
            <div className="flex items-start gap-[10px]">
              <div
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${BRAND_COLORS.primary}, #7C3AED)`,
                }}
              >
                AI
              </div>
              <div
                className="max-w-[70%] rounded-bl-none rounded-br-2xl rounded-tl-sm rounded-tr-2xl border border-[#E2E8F0] px-4 py-[10px] text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{ background: '#F8FAFC', color: '#1E293B' }}
              >
                <div className="overflow-hidden [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
                  <ReactMarkdown>{streamingAnswer}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* 加载动画（无内容时） */}
          {loading && !streamingAnswer && <TypingIndicator />}

          <div ref={messageEndRef} />
        </div>
      </div>

      {/* 输入栏 */}
      <div className="flex gap-[10px] border-t border-[#F1F5F9] px-6 pb-5 pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入问题，按 Enter 发送…"
          disabled={loading}
          className="flex-1 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFC] px-4 py-[11px] text-sm text-[#1E293B] outline-none transition-colors focus:border-indigo-400 disabled:opacity-50 font-sans"
        />
        <button
          onClick={loading ? onStop : handleSend}
          disabled={!loading && !input.trim()}
          className="flex shrink-0 items-center gap-[7px] rounded-[10px] px-5 py-[11px] text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed"
          style={{
            background: loading
              ? '#EF4444'
              : input.trim()
                ? BRAND_COLORS.primary
                : BRAND_COLORS.primaryDisabled,
          }}
        >
          {loading ? (
            <>
              <StopIcon size={14} />
              停止
            </>
          ) : (
            <>
              <SendIcon size={16} />
              发送
            </>
          )}
        </button>
      </div>
    </main>
  );
}

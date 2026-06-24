/**
 * 左侧蓝色侧边栏 — 品牌Logo、新建对话、历史对话列表
 */
import { useState, useRef, useEffect } from 'react';
import { BRAND_NAME, LOGO_PATH } from '../constants';
import type { ChatHistoryItem } from '../types';
import {
  UserIcon, SettingsIcon, HelpIcon, LogoutIcon,
  PlusIcon, ChatIcon, TrashIcon, ChevronUpIcon,
} from './Icons';

/** 用户菜单按钮 — 左下角账户模块 */
function UserMenu({ onSettingsClick, onProfileClick, onHelpClick, onLogout, userName, userAvatar }: { onSettingsClick: () => void; onProfileClick: () => void; onHelpClick: () => void; onLogout: () => void; userName: string; userAvatar: string }) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 头像首字母
  const avatarLetter = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    setConfirmLogout(true);
  };

  const doLogout = () => {
    localStorage.removeItem('userInfo');
    onLogout();
  };

  const menuItems = [
    {
      label: '个人资料',
      icon: <UserIcon size={14} />,
      onClick: () => { setOpen(false); onProfileClick(); },
    },
    {
      label: '设置',
      icon: <SettingsIcon size={14} />,
      onClick: () => { setOpen(false); onSettingsClick(); },
    },
    {
      label: '帮助',
      icon: <HelpIcon size={14} />,
      onClick: () => { setOpen(false); onHelpClick(); },
    },
    {
      label: '登出',
      icon: <LogoutIcon size={14} />,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/10"
      >
        {/* 头像 */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-medium text-white overflow-hidden">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            avatarLetter
          )}
        </div>
        {/* 用户名 */}
        <span className="text-[13px] font-medium text-white truncate">
          {userName}
        </span>
        {/* 展开箭头 */}
        <ChevronUpIcon size={12} className="ml-auto shrink-0 text-white/60" />
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] text-[#334155] transition-colors hover:bg-[#F1F5F9]"
            >
              <span className="flex h-4 w-4 items-center justify-center text-[#64748B]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* 登出确认弹窗 */}
      {confirmLogout && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setConfirmLogout(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl animate-fade-in">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
                <LogoutIcon size={22} stroke="#EF4444" />
              </div>
              <h3 className="mb-1 text-[15px] font-semibold text-[#1E293B]">确认登出</h3>
              <p className="text-[12px] text-[#94A3B8]">确定要退出当前账号吗？</p>
            </div>
            <div className="flex border-t border-[#F1F5F9]">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-bl-xl py-3 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
              >
                取消
              </button>
              <button
                onClick={doLogout}
                className="flex-1 rounded-br-xl py-3 text-[13px] font-medium text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
              >
                登出
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface LeftSidebarProps {
  /** 历史对话列表 */
  histories: ChatHistoryItem[];
  /** 当前活跃的对话 ID */
  activeId: string | null;
  /** 选择历史对话 */
  onSelect: (id: string) => void;
  /** 新建对话 */
  onNewChat: () => void;
  /** 打开设置面板 */
  onSettingsClick: () => void;
  /** 打开个人资料弹窗 */
  onProfileClick: () => void;
  /** 打开帮助弹窗 */
  onHelpClick: () => void;
  /** 用户名 */
  userName: string;
  /** 用户头像 */
  userAvatar: string;
  /** 登出回调 */
  onLogout: () => void;
  /** 删除对话 */
  onDeleteHistory: (id: string) => void;
}

export default function LeftSidebar({
  histories,
  activeId,
  onSelect,
  onNewChat,
  onSettingsClick,
  onProfileClick,
  onHelpClick,
  userName,
  userAvatar,
  onLogout,
  onDeleteHistory,
}: LeftSidebarProps) {
  return (
    <aside
      className="flex w-[232px] shrink-0 flex-col"
      style={{ background: '#0E5FAF' }}
    >
      {/* 内容区 */}
      <div className="flex flex-1 flex-col overflow-y-auto px-[14px] py-5">
        {/* 品牌区 */}
        <div className="mb-5 flex items-center gap-[10px] px-1">
          <div className="flex shrink-0 items-center">
            <img
              src={LOGO_PATH}
              alt="CAERI"
              className="h-7 max-w-[120px] object-contain"
            />
          </div>
          <span className="font-bold text-[#F1F5F9] tracking-wide whitespace-nowrap shrink-0 leading-none">
            {BRAND_NAME}
          </span>
          <div className="flex shrink-0 items-center">
            <img
              src="/caeri-logo.png"
              alt="中国汽研"
              className="h-10 object-contain"
            />
          </div>
        </div>

        {/* 新建对话按钮 */}
        <button
          onClick={onNewChat}
          className="mb-6 flex w-full items-center justify-center gap-[7px] rounded-lg border border-black bg-white px-0 py-[9px] text-[13px] font-semibold text-black transition-all hover:bg-gray-50"
        >
          <PlusIcon size={14} />
          新建对话
        </button>

        {/* 历史对话标签 */}
        <p className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-wider text-black">
          最近对话
        </p>

        {/* 历史列表 */}
        <div className="flex flex-col gap-0.5">
          {histories.map((chat) => (
            <div
              key={chat.id}
              className="group relative flex items-start gap-2 rounded-md px-[10px] py-2 text-left transition-colors hover:bg-white/10 cursor-pointer"
              onClick={() => onSelect(chat.id)}
              style={{
                background: activeId === chat.id ? 'rgba(255,255,255,0.07)' : 'transparent',
              }}
            >
              {/* 对话图标 */}
              <div className="mt-0.5 shrink-0 text-[#64748B]">
                <ChatIcon size={13} />
              </div>

              <div className="overflow-hidden flex-1 min-w-0">
                <div className="mb-0.5 text-[12.5px] font-medium text-white truncate pr-5">
                  {chat.title}
                </div>
                <div className="text-[11px] text-white/80 truncate">
                  {chat.preview}
                </div>
              </div>

              {/* 删除按钮 */}
              <button
                className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-white/60 hover:text-red-300 hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDeleteHistory(chat.id); }}
              >
                <TrashIcon size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* 底部账户模块 */}
        <div className="mt-auto pt-2 border-t border-white/15">
          <UserMenu onSettingsClick={onSettingsClick} onProfileClick={onProfileClick} onHelpClick={onHelpClick} onLogout={onLogout} userName={userName} userAvatar={userAvatar} />
        </div>
      </div>
    </aside>
  );
}

/** 智能驾驶出海咨询大模型 — 品牌与 UI 配置 */

import type { DocItem, DocTag } from './types';

/** 品牌配色 */
export const BRAND_COLORS = {
  sidebarBg: '#0E5FAF',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryDisabled: '#A5B4FC',
  success: '#22C55E',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  successText: '#16A34A',
} as const;

/** 文档标签配色 */
export const TAG_COLORS: Record<DocTag, { bg: string; text: string }> = {
  法规: { bg: '#EEF2FF', text: '#4F46E5' },
  政策: { bg: '#FFF7ED', text: '#C2410C' },
  标准: { bg: '#F0FDF4', text: '#15803D' },
};

/** 默认历史对话（空列表，保留最近对话功能） */
export const DEFAULT_HISTORIES: { id: string; title: string; preview: string }[] = [];

/** 默认文档示例（初始空状态后可能展示的示例数据） */
export const DEFAULT_DOCS: DocItem[] = [
  {
    id: 1,
    title: 'Road vehicles — Local Interconnect Network',
    tag: '标准',
    excerpt: 'Local Interconnect Network (LIN) protocol for automotive serial data communication, including physical layer, data link layer...',
    img: null,
  },
  {
    id: 2,
    title: 'ENISA',
    tag: '法规',
    excerpt: 'The European Union Agency for Cybersecurity and on information and communications technology cybersecurity certification...',
    img: null,
  },
  {
    id: 3,
    title: 'NHTSA AV 4.0',
    tag: '标准',
    excerpt: '法国交通部建议制造商在设计阶段采用Safety by Design原则，并提交自愿性安全自评估报告...',
    img: null,
  },
];

/** 页面标题 */
export const PAGE_TITLE = '智能驾驶出海咨询大模型';
export const PAGE_SUBTITLE = '覆盖全球主要市场法规、标准、认证与准入政策';
export const BRAND_NAME = '中国汽研';
export const FOOTER_TEXT = '中国汽研 CAERI · 智驾出海咨询大模型';

/** CAERI Logo 路径 */
export const LOGO_PATH = '/CAERI.png';

/** 专用 Chat 名称（用于自动创建的 chat） */
export const OVERSEAS_CHAT_NAME = '智能驾驶出海咨询';

/** 共享 CSS 动画 keyframes（各处弹窗/面板复用，统一注入一次即可） */
export const SHARED_KEYFRAMES = `
  @keyframes overseasFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes overseasSlideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes overseasFadeInModal {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  .animate-overseas-fade-in { animation: overseasFadeIn 0.2s ease-out; }
  .animate-overseas-slide-in { animation: overseasSlideIn 0.2s ease-out; }
  .animate-overseas-modal-in { animation: overseasFadeInModal 0.15s ease-out; }
`;

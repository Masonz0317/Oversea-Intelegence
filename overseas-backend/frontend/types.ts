/** 消息角色 */
export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

/** 单条消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  id?: string;
}

/** 文档标签类型 */
export type DocTag = '标准' | '法规' | '政策';

/** 检索到的文档项 */
export interface DocItem {
  id: number;
  title: string;
  tag: DocTag;
  excerpt: string;
  img: string | null;
}

/** 对话历史项 */
export interface ChatHistoryItem {
  id: string;
  title: string;
  preview: string;
}

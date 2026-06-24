# 智能驾驶出海咨询大模型

## 项目结构

```
├── server.py              # FastAPI 后端服务（端口 9005）
├── data.db                # SQLite 数据库（自动生成，已 gitignore）
└── frontend/              # 前端页面（需集成到 RAGFlow Web 项目中）
    ├── index.tsx           # 主页面 — 三栏聊天布局
    ├── api.ts              # 前端 HTTP 客户端
    ├── types.ts            # TS 类型定义
    ├── constants.ts        # 品牌配色 & 配置
    ├── admin/
    │   └── index.tsx       # 管理员页面入口
    ├── components/
    │   ├── AdminPage.tsx    # 管理员后台
    │   ├── LoginScreen.tsx  # 登录页
    │   ├── LeftSidebar.tsx  # 左侧蓝边栏
    │   ├── MainChat.tsx     # 中间聊天区
    │   ├── RightPanel.tsx   # 右侧检索面板
    │   ├── SettingsPanel.tsx # 设置面板
    │   ├── ProfileModal.tsx  # 个人资料弹窗
    │   ├── TypingIndicator.tsx
    │   └── Icons.tsx        # SVG 图标组件
    └── hooks/
        └── use-overseas-chat.ts
```

## 后端启动

```bash
pip install fastapi uvicorn bcrypt pyjwt httpx
python server.py
# 服务运行在 http://localhost:9005
```

环境变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `JWT_SECRET` | `overseas-driving-secret-key-change-me` | JWT 签名密钥 |
| `ADMIN_USER` | `admin` | 管理员账号 |
| `ADMIN_PWD` | `admin123` | 管理员密码 |
| `SMTP_HOST` | （空） | SMTP 服务器（不配则验证码打印到控制台） |
| `LLM_API_KEY` | （空） | LLM API Key |
| `LLM_API_BASE` | （空） | LLM API 地址（待配置） |
| `LLM_MODEL` | （空） | 模型名称（待配置） |

## 前端集成

> 详细的 RAGFlow 集成步骤参见 [integration/ragflow-setup.md](integration/ragflow-setup.md)

前端代码位于 `frontend/` 目录，**依赖 RAGFlow Web 项目**的基础设施：

| 依赖模块 | 用途 |
|---|---|
| `@/constants/chat` | MessageType 枚举 |
| `@/hooks/logic-hooks` | useSendMessageWithSse（SSE 流式聊天） |
| `@/interfaces/database/chat` | IMessage 类型 |
| `@/services/next-chat-service` | RAGFlow 聊天 API 调用 |
| `@/services/user-service` | RAGFlow 用户 API 调用 |
| `@/utils/api` | RAGFlow API 端点定义 |
| `@/utils/authorization-util` | RAGFlow 认证 token 管理 |
| `@/utils/index` | rsaPsw 密码加密 |

部署方式：将 `frontend/` 目录下的文件复制到 RAGFlow 项目的 `web/src/pages/overseas-driving/`，并在路由中注册。

## API 接口

### 用户认证
- `POST /api/auth/send-code` — 发送邮箱验证码
- `POST /api/auth/login` — 邮箱密码登录
- `POST /api/auth/code-login` — 验证码登录

### 用户
- `GET /api/user/profile` — 获取个人资料
- `POST /api/user/profile` — 更新个人资料
- `POST /api/user/change-password` — 修改密码
- `GET /api/user/llm-config` — 获取 LLM 配置

### 聊天记录
- `GET /api/chat/records` — 获取聊天列表
- `POST /api/chat/records` — 保存聊天
- `DELETE /api/chat/records/{id}` — 删除聊天

### 管理员
- `POST /api/admin/login` — 管理员登录
- `GET /api/admin/users` — 用户列表
- `POST /api/admin/users` — 添加用户
- `DELETE /api/admin/users/{id}` — 删除用户
- `GET /api/admin/users/export` — 导出 CSV
- `GET /api/admin/chat/records` — 查看用户聊天记录
- `GET /api/admin/chat/records/{id}` — 查看聊天详情
- `GET /api/admin/llm-config` — 获取 LLM 配置
- `POST /api/admin/llm-config` — 保存 LLM 配置

### LLM 代理
- `POST /api/chat/completions` — 代理 LLM 请求（支持 SSE 流式 + Token 统计）

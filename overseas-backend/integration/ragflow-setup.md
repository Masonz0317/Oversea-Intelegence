# RAGFlow 集成说明

## 路由注册

在 RAGFlow 项目的 `web/src/routes.tsx` 中添加以下路由枚举和配置：

### 1. 路由枚举

在 `Routes` 对象中添加：
```ts
OverseasDriving = '/overseas-driving',
```

### 2. 路由配置

```tsx
{
  path: Routes.OverseasDriving,
  Component: () => import('@/pages/overseas-driving'),
  layout: false,  // 不套用 RAGFlow 默认布局
},
{
  path: Routes.OverseasDriving + '/admin',
  Component: () => import('@/pages/overseas-driving/admin'),
  layout: false,
},
```

### 3. 根路径重定向（可选）

如果需要将 `/` 重定向到 overseas-driving：
```tsx
// 在 routes.tsx 的根路径配置中
{
  path: '/',
  redirect: Routes.OverseasDriving,
}
```

## 文件位置

将 `frontend/` 目录下的所有文件复制到 RAGFlow 项目中：
```
frontend/  →  web/src/pages/overseas-driving/
```

## 前端依赖

overseas-driving 页面依赖 RAGFlow Web 项目的以下模块：

| 模块路径 | 用途 |
|---|---|
| `@/constants/chat` | MessageType 枚举 |
| `@/hooks/logic-hooks` | useSendMessageWithSse（SSE 流式） |
| `@/interfaces/database/chat` | IMessage 类型 |
| `@/services/next-chat-service` | RAGFlow 聊天 API |
| `@/services/user-service` | RAGFlow 用户 API |
| `@/utils/api` | RAGFlow API 端点 |
| `@/utils/authorization-util` | 认证 token 管理 |
| `@/utils/index` | rsaPsw 密码加密 |

## 构建与部署

```bash
# 1. 将 frontend/ 复制到 RAGFlow Web 项目
cp -r frontend/ /path/to/ragflow/web/src/pages/overseas-driving/

# 2. 注册路由（如上）

# 3. 构建前端
cd /path/to/ragflow/web
npm run build

# 4. 部署 dist/ 到 Web 服务器或 Docker 容器
```

## 环境变量（前端）

在 `.env` 中设置：
```
VITE_OVERSEAS_API_BASE=http://localhost:9005
```

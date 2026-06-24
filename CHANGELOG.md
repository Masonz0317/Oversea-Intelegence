# Changelog

所有值得关注的变更记录。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [0.1.0] — 2026-06-24

### 新增

#### 出海咨询前端页面

- 智能驾驶出海咨询主页面（`/overseas-driving`），三栏布局：左侧会话栏 + 中间聊天区 + 右侧文件检索
- 管理员后台页面（`/overseas-driving/admin`），包含用户管理、聊天记录查看、CSV 导出
- 邮箱验证码 / 密码双模式登录注册
- SSE 流式对话（复用 RAGFlow `useSendMessageWithSse` hook）
- 对话历史管理：新建、切换、删除
- 个人资料弹窗：头像上传、昵称、组织、密码修改
- 设置面板：查看账号信息
- 帮助弹窗：使用说明和联系方式
- 管理员后台：用户 CRUD、搜索、分页、聊天记录查看
- 中国时区（UTC+8）显示

#### 后端服务（overseas-backend）

- FastAPI 服务（端口 9005），SQLite + bcrypt + JWT
- 用户认证 API：邮箱密码登录、验证码登录/发送
- 用户资料 API：查询、更新、修改密码
- 聊天记录 API：保存、列表、删除
- 管理员 API：登录、用户 CRUD、CSV 导出、聊天记录查看
- LLM 配置 API：管理员设置 API Key / Base URL / Model
- LLM 代理 API：SSE 流式转发 + Token 用量统计

#### Docker 配置

- 新增 `overseas-backend` 容器服务
- macOS 适配：`MACOS=1`、内存限制 `MEM_LIMIT=2G`
- 时区设置：`TZ=Asia/Shanghai`

#### 文档

- 后端 API 文档（`overseas-backend/README.md`）
- RAGFlow 集成指南（`overseas-backend/integration/ragflow-setup.md`）
- 更新主 README，添加相较于 RAGFlow 源码的变更说明

### 变更的文件

| 文件 | 说明 |
|---|---|
| `web/src/routes.tsx` | 新增 `/overseas-driving` 和 `/overseas-driving/admin` 路由 |
| `docker/.env` | macOS 适配、中国时区 |
| `docker/docker-compose-base.yml` | overseas-backend 端口映射 |
| `docker/docker-compose-macos.yml` | 新增 overseas-backend 服务 |
| `.gitignore` | 忽略 overseas-data |
| `README.md` | 添加变更说明章节 |

### 新增的文件

| 目录 | 文件数 | 说明 |
|---|---|---|
| `overseas-backend/` | 16 个 | 后端服务 + 前端源码副本 |
| `web/src/pages/overseas-driving/` | 16 个 | 前端页面源码 |
| `web/public/` | 2 个 | CAERI / 中国汽研 Logo |

---

## 版本命名规则

- `v0.1.0` — 初始版本（出海咨询功能 + RAGFlow 集成）
- 后续版本格式：`v<major>.<minor>.<patch>`
  - **major**：重大功能升级或 RAGFlow 大版本合并
  - **minor**：新功能、新页面
  - **patch**：Bug 修复、小优化

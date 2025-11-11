# AI Agent 演示项目 - 完整展示 AgentSDK 最新功能

基于 [AgentSDK](https://github.com/wordflowlab/agentsdk) 开发的综合演示项目，完整展示 AgentSDK Phase 6 的所有核心功能。

> **🎯 本项目目标**: 作为 AgentSDK 的最佳参考实现，帮助开发者快速理解和上手 AgentSDK 的所有功能。

## ✨ 功能特性

### 🆕 最新功能

#### Phase 6C: Middleware 系统

- 🔧 **Middleware 系统**：
  - **Summarization Middleware**: 自动总结长对话（>170k tokens）
  - **Filesystem Middleware**: 6个文件系统工具（fs_read, fs_write, fs_edit, fs_grep, fs_glob, fs_ls）
  - **SubAgent Middleware**: 任务委托给子代理执行
  - **可视化控制台**: 查看 Middleware 状态、工具列表和统计信息
  - **洋葱模型架构**: 支持自定义 Middleware，优先级控制

#### Phase 6B-1: 网络工具

- 🌐 **HTTP 请求工具**：
  - 支持 6 种 HTTP 方法（GET/POST/PUT/DELETE/PATCH/HEAD）
  - 自动 JSON 解析
  - 自定义请求头和请求体
  - 可配置超时（默认 30 秒）

- 🔍 **Web 搜索工具**：
  - 基于 Tavily API 的实时搜索
  - 支持 3 种主题类型（general/news/finance）
  - 可配置结果数量（1-10）
  - 可选包含完整页面内容

### 核心功能

- 💬 **智能对话**：与 AI 进行自然对话，获取写作建议
- ✍️ **写作工具**：
  - 🎨 润色：提升文本质量和表达
  - 🔄 改写：用不同风格重写内容
  - 📝 扩写：丰富和扩展文本内容
  - 📋 总结：提取关键信息
  - 🌐 翻译：多语言翻译支持
- 💾 **会话管理**：保存和管理多个写作会话
- 🔄 **实时响应**：通过 WebSocket 获取流式 AI 响应
- 🤝 **多 Agent 协作**：Pool 和 Room 机制实现 Agent 间消息路由
- ⚡ **Skills 系统**：Commands 和 Skills 注入

## 🏗️ 技术栈

### 后端
- **Go** + **Gin** - 高性能 Web 框架
- **AgentSDK** - AI Agent 开发框架
- **WebSocket** - 实时通信
- **本地存储** - JSON 文件持久化

### 前端
- **React** + **TypeScript** - 现代化前端框架
- **Vite** - 快速构建工具
- **Shadcn/ui** - 精美 UI 组件库
- **TailwindCSS** - 实用优先的 CSS 框架
- **TanStack Query** - 强大的数据管理

## 🚀 快速开始

### 1. 配置 API Key

本项目使用 **yunwu.ai** 代理 Anthropic API。

#### 获取 API Key：

1. 访问 [yunwu.ai](https://yunwu.ai/register) 注册账号
2. 访问 [API Key 管理页面](https://yunwu.ai/token) 创建 Token
3. （可选）访问 [充值页面](https://yunwu.ai/topup) 充值，新用户赠送 $0.2

#### 配置环境变量：

编辑项目根目录的 `.env` 文件：

```bash
# 将下面的占位符替换为您的真实 API Key
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# 服务器端口
PORT=8080

# 模型配置（可选，默认使用最便宜的 haiku）
MODEL=claude-3-haiku-20240307
```

#### 测试 API Key：

```bash
./scripts/test-yunwu-key.sh
```

### 2. 启动后端

```bash
cd backend
go mod tidy
go run main.go
```

后端将在 `http://localhost:8080` 启动

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 `http://localhost:5173` 启动

### 4. 使用应用

打开浏览器访问 `http://localhost:5173`，应用包含以下页面：

#### 🤝 协作工作流

- 多 Agent 协作演示
- Pool 和 Room 管理
- 工作流编排

#### 💬 简单对话

- 基础对话界面
- 会话管理
- 实时 WebSocket 通信

#### 🔧 Middleware 控制台 ⭐ **新功能**

- 查看所有可用的 Middleware
- Middleware 工具列表
- 功能说明和使用示例
- 支持的 Middleware：
  - **summarization**: 自动总结长对话
  - **filesystem**: 6 个文件系统工具
  - **subagent**: 子代理任务委托

#### 🌐 网络工具 ⭐ **新功能**

- HTTP 请求工具测试界面
- Web 搜索工具演示
- 支持的工具：
  - **http_request**: HTTP/HTTPS 请求（6 种方法）
  - **web_search**: Tavily API 搜索（需要 API Key）

#### ⚡ Skills 管理

- Commands 列表
- Skills 查看
- 执行 Skills 命令

## 📋 便捷脚本

项目提供了几个便捷脚本（位于 `scripts/` 目录）：

```bash
# 测试 API Key 是否有效
./scripts/test-yunwu-key.sh

# 测试完整 API 功能
./scripts/test-api.sh

# 启动后端（便捷脚本）
./scripts/start-backend.sh

# 启动前端（便捷脚本）
./scripts/start-frontend.sh
```

## 🔧 yunwu.ai 配置说明

### 支持的模型

yunwu.ai 支持以下 Anthropic 模型（按价格从低到高）：

| 模型名称 | 输入价格 | 输出价格 | 适用场景 |
|---------|---------|---------|---------|
| `claude-3-haiku-20240307` | $0.25/M tokens | $1.25/M tokens | ⭐ 推荐：快速、便宜 |
| `claude-3-5-haiku-20241022` | $1/M tokens | $5/M tokens | 平衡性能和成本 |
| `claude-3-5-sonnet-20241022` | $3/M tokens | $15/M tokens | 高质量写作 |
| `claude-3-opus-20240229` | $15/M tokens | $75/M tokens | 最高质量 |

### API 端点

- **Base URL**: `https://yunwu.ai`
- **Anthropic 原生格式**: `/v1/messages`
- **API Key 格式**: `x-api-key: sk-ant-xxx`

### 常见问题

#### ❌ "Invalid token" 错误

**原因**：API Key 无效或未配置

**解决方案**：
1. 确认已在 yunwu.ai 创建 API Key
2. 检查 `.env` 文件中的 `ANTHROPIC_API_KEY` 配置
3. 运行 `./scripts/test-yunwu-key.sh` 测试

#### ⚠️ "429 Too Many Requests" 错误

**原因**：
- 请求频率过高
- 账户余额不足
- 服务器负载过高

**解决方案**：
1. 检查账户余额：https://yunwu.ai/topup
2. 降低请求频率
3. 稍后重试

#### 🔄 AI 无响应

**诊断步骤**：
1. 运行 `./scripts/test-yunwu-key.sh` 检查 API Key
2. 查看后端日志：`tail -f /tmp/backend.log`
3. 检查浏览器控制台是否有 WebSocket 错误
4. 确认后端和前端都在运行

## 📁 项目结构

```
agentdemo/
├── backend/                 # 后端代码
│   ├── agent/              # Agent 管理和模板
│   ├── api/                # HTTP API 和路由
│   ├── models/             # 数据模型
│   ├── storage/            # 数据持久化
│   ├── ws/                 # WebSocket 处理
│   └── main.go             # 入口文件
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 客户端
│   │   └── types/          # TypeScript 类型
│   └── package.json
├── docs/                   # 文档目录
│   ├── OSS_SETUP.md       # 开源设置指南
│   ├── README_SKILLS.md   # Skills 功能说明
│   └── SKILLS_DEMO.md     # Skills 演示文档
├── scripts/                # 脚本目录
│   ├── test-yunwu-key.sh  # API Key 测试脚本
│   ├── test-api.sh        # 完整功能测试脚本
│   ├── start-backend.sh   # 启动后端脚本
│   └── start-frontend.sh  # 启动前端脚本
├── .env                    # 环境变量配置
└── README.md               # 项目说明文档
```

## 🛠️ 开发指南

### 后端开发

```bash
cd backend

# 添加新依赖
go get github.com/some/package

# 运行测试
go test ./...

# 构建
go build -o bin/server main.go
```

### 前端开发

```bash
cd frontend

# 添加新依赖
npm install package-name

# 类型检查
npm run type-check

# 构建生产版本
npm run build
```

## 📝 API 文档

### 会话管理

- `POST /api/sessions` - 创建新会话
- `GET /api/sessions` - 获取会话列表
- `GET /api/sessions/:id` - 获取会话详情
- `DELETE /api/sessions/:id` - 删除会话

### 聊天功能

- `POST /api/sessions/:id/chat` - 发送消息
- `GET /api/sessions/:id/messages` - 获取消息历史
- `GET /ws/:sessionId` - WebSocket 连接

### 写作工具

- `POST /api/writing/polish` - 润色文本
- `POST /api/writing/rewrite` - 改写文本
- `POST /api/writing/expand` - 扩写文本
- `POST /api/writing/summarize` - 总结文本
- `POST /api/writing/translate` - 翻译文本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [AgentSDK GitHub](https://github.com/wordflowlab/agentsdk)
- [yunwu.ai 官网](https://yunwu.ai)
- [yunwu.ai API 文档](https://yunwu.apifox.cn/doc-5459032)
- [Anthropic 官方文档](https://docs.anthropic.com/)

---

**注意**：本项目仅用于演示和学习目的。在生产环境中使用时，请确保：
- 妥善保管 API Key（不要提交到版本控制）
- 实现适当的用户认证和授权
- 添加速率限制和错误处理
- 使用生产级数据库替代文件存储

# AgentDemo 完整功能展示文档

> 更新日期: 2025-11-11
> 版本: v0.3-beta

## 🎯 项目概述

AgentDemo 是 [AgentSDK](https://github.com/wordflowlab/agentsdk) 的官方演示项目，完整展示了 AgentSDK Phase 6 的所有核心功能。

**定位**: AgentSDK 的最佳参考实现

## 📱 功能页面导航

### 1. 🤝 协作工作流

**路径**: 首页默认页面

**功能**:
- 多 Agent 协作演示
- Pool 和 Room 管理
- 工作流编排
- 任务分配和协调

**技术亮点**:
- AgentPool 管理多个 Agent 实例
- Room 机制实现 Agent 间消息路由
- Scheduler 任务调度
- Permission 权限管理

**使用场景**:
- 复杂写作项目（研究 → 写作 → 编辑）
- 多步骤任务自动化
- 团队协作模拟

---

### 2. 💬 简单对话

**路径**: 点击 "💬 简单对话" 按钮

**功能**:
- 基础一对一 AI 对话
- 会话管理（创建/删除/切换）
- 实时 WebSocket 通信
- 流式响应展示

**技术亮点**:
- WebSocket 实时通信
- 流式 API 处理
- 会话持久化（JSON Store）
- 消息历史管理

**使用场景**:
- 快速咨询和对话
- 写作建议获取
- 测试 Agent 基本功能

---

### 3. 🔧 Middleware 控制台 ⭐ **Phase 6C 新功能**

**路径**: 点击 "🔧 Middleware" 按钮

**功能**:
- 查看所有可用的 Middleware
- 展示每个 Middleware 的工具列表
- 查看优先级和状态
- 功能说明和使用示例

#### 支持的 Middleware

##### Summarization Middleware (Priority: 40)

**状态**: ✅ 已启用

**功能**:
- 自动监控对话历史 token 数
- 超过 170,000 tokens 时自动总结
- 保留最近 6 条消息
- 用总结替换旧消息

**工具**: 无（纯处理型 Middleware）

**自动触发条件**:
```
对话 tokens > 170,000
↓
自动总结旧消息
↓
保留最近 6 条 + 总结
↓
节省 token 成本
```

##### Filesystem Middleware (Priority: 100)

**状态**: ⏸️ 未启用（可配置启用）

**功能**:
- 提供 6 个文件系统工具
- 自动驱逐大结果（>20k tokens）
- 系统提示词增强

**工具列表** (6 个):
1. **fs_read** - 读取文件内容，支持分页
2. **fs_write** - 写入文件（覆盖模式）
3. **fs_ls** - 列出目录，显示大小和时间
4. **fs_edit** - 精确编辑（字符串替换）
5. **fs_glob** - Glob 模式匹配（`**/*.go`）
6. **fs_grep** - 正则表达式搜索

**使用示例**:
```
用户: "请搜索项目中所有包含 'TODO' 的 Go 文件"
AI: [自动使用 fs_glob 和 fs_grep 工具]
```

##### SubAgent Middleware (Priority: 200)

**状态**: ⏸️ 未启用（可配置启用）

**功能**:
- 任务委托给子代理
- 支持并行执行
- 上下文隔离

**工具**:
- **task** - 启动子代理执行任务

**使用示例**:
```
用户: "请分析这个项目的架构设计"
AI: [使用 task 工具委托给 researcher 子代理]
```

**技术亮点**:
- 洋葱模型架构
- 优先级控制（0-1000）
- WrapModelCall 和 WrapToolCall 拦截
- 生命周期管理（OnAgentStart/OnAgentStop）

---

### 4. 🌐 网络工具 ⭐ **Phase 6B-1 新功能**

**路径**: 点击 "🌐 网络工具" 按钮

**功能**:
- HTTP 请求工具测试界面
- Web 搜索工具演示
- 交互式参数配置
- 实时结果展示

#### HTTP Request 工具

**状态**: ✅ 已注册并可用

**支持的方法**:
- GET - 获取资源
- POST - 创建资源
- PUT - 更新资源
- DELETE - 删除资源
- PATCH - 部分更新
- HEAD - 获取元数据

**参数**:
```typescript
{
  url: string,              // 必需
  method?: string,          // 默认 GET
  headers?: object,         // 自定义请求头
  body?: string,            // 请求体（POST/PUT/PATCH）
  timeout?: number          // 超时（默认 30 秒）
}
```

**特性**:
- ✓ 自动 JSON 解析
- ✓ 智能内容类型检测
- ✓ 完整的错误处理
- ✓ 安全性检查（仅允许 http/https）

**使用示例**:
```
用户: "请使用 http_request 工具获取 golang/go 仓库的信息"
AI: [调用 http_request 工具]
    URL: https://api.github.com/repos/golang/go
    Method: GET
    Headers: {"Accept": "application/vnd.github+json"}
```

#### Web Search 工具

**状态**: ✅ 已注册（需要 API Key）

**搜索引擎**: Tavily API

**主题类型**:
- **general** - 通用搜索（默认）
- **news** - 新闻搜索
- **finance** - 财经搜索

**参数**:
```typescript
{
  query: string,                  // 必需
  max_results?: number,           // 1-10，默认 5
  topic?: string,                 // general/news/finance
  include_raw_content?: boolean   // 是否包含完整页面
}
```

**配置方法**:
```bash
# 方式 1: 使用 WF_TAVILY_API_KEY
export WF_TAVILY_API_KEY="tvly-xxxxx"

# 方式 2: 使用 TAVILY_API_KEY（兼容 DeepAgents）
export TAVILY_API_KEY="tvly-xxxxx"
```

**获取 API Key**:
1. 访问 [tavily.com](https://tavily.com)
2. 注册账号
3. 获取免费 API Key
4. 设置环境变量

**使用示例**:
```
用户: "请使用 web_search 搜索 'AgentSDK Phase 6 features'"
AI: [调用 web_search 工具]
    Query: AgentSDK Phase 6 features
    Max Results: 5
    Topic: general
```

**技术亮点**:
- 基于 Tavily API（与 DeepAgents 一致）
- 自动环境变量检测
- 结构化结果返回
- 可选原始内容

---

### 5. ⚡ Skills 管理

**路径**: 点击 "⚡ Skills" 按钮

**功能**:
- Commands 列表查看
- Skills 详细信息
- 执行 Skills 命令
- 自动检测和注入

**技术亮点**:
- Slash Commands 支持
- Skills 动态注入
- 本地文件系统读取
- Markdown 格式解析

---

## 🛠️ 技术架构

### 后端架构

```
backend/
├── agent/
│   ├── manager.go          # Agent 管理器（启用 Middleware）
│   ├── pool_manager.go     # Pool 管理器
│   ├── templates.go        # Agent 模板定义
│   └── workflow.go         # 工作流编排
├── api/
│   ├── routes.go           # 路由配置
│   └── handlers/
│       ├── middleware.go   # Middleware API ⭐ 新增
│       ├── session.go      # 会话管理
│       ├── message.go      # 消息处理
│       ├── writing.go      # 写作工具
│       ├── workflow.go     # 工作流 API
│       └── skills.go       # Skills API
├── ws/
│   └── handler.go          # WebSocket 处理
└── main.go
```

### 前端架构

```
frontend/src/
├── components/
│   ├── MiddlewareConsole.tsx   # Middleware 控制台 ⭐ 新增
│   ├── NetworkTools.tsx        # 网络工具页面 ⭐ 新增
│   ├── WorkflowPage.tsx        # 工作流页面
│   ├── Layout.tsx              # 简单对话布局
│   ├── skills/                 # Skills 组件
│   └── ui/                     # UI 组件库
│       ├── badge.tsx           # Badge 组件 ⭐ 新增
│       ├── table.tsx           # Table 组件 ⭐ 新增
│       ├── tabs.tsx            # Tabs 组件 ⭐ 新增
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── services/
│   ├── middlewareService.ts    # Middleware API 服务 ⭐ 新增
│   ├── networkToolsService.ts  # 网络工具服务 ⭐ 新增
│   ├── apiClient.ts
│   └── sessionService.ts
├── types/
│   └── index.ts
├── App.tsx                     # 主应用（5 个页面路由）
└── main.tsx
```

### API 端点清单

#### Middleware API ⭐ 新增

```
GET  /api/middleware                        # 获取所有 Middleware
GET  /api/middleware/agent/:agentId         # 获取 Agent 的 Middleware 配置
GET  /api/middleware/agent/:agentId/stats   # 获取统计信息
GET  /api/middleware/:name/tools            # 获取 Middleware 工具列表
```

#### Session API

```
POST   /api/sessions           # 创建会话
GET    /api/sessions           # 列出会话
GET    /api/sessions/:id       # 获取会话详情
DELETE /api/sessions/:id       # 删除会话
POST   /api/sessions/:id/chat  # 发送消息
GET    /api/sessions/:id/messages  # 获取消息历史
```

#### Writing Tools API

```
POST /api/writing/polish      # 润色
POST /api/writing/rewrite     # 改写
POST /api/writing/expand      # 扩写
POST /api/writing/summarize   # 总结
POST /api/writing/translate   # 翻译
```

#### Workflow API

```
POST /api/workflow/start              # 启动工作流
GET  /api/workflow/:id/status         # 获取状态
GET  /api/workflow/:id/artifacts      # 获取产出
```

#### Skills API

```
GET /api/skills/commands        # 列出 Commands
GET /api/skills/commands/:name  # 获取 Command 详情
GET /api/skills/skills          # 列出 Skills
GET /api/skills/skills/:name    # 获取 Skill 详情
```

#### WebSocket

```
WS  /ws/:sessionId   # 实时通信
GET /ping            # 健康检查
```

---

## 📊 功能对比表

| 功能模块 | DeepAgents | AgentSDK | AgentDemo | 状态 |
|---------|-----------|----------|-----------|------|
| **Middleware 系统** |
| Summarization | ✅ | ✅ | ✅ 已展示 | ✅ |
| Filesystem | ✅ | ✅ | ✅ 已展示 | ✅ |
| SubAgent | ✅ | ✅ | ✅ 已展示 | ✅ |
| 可视化控制台 | ❌ | ❌ | ✅ **独创** | ✅ |
| **网络工具** |
| HTTP Request | ✅ | ✅ | ✅ 已展示 | ✅ |
| Web Search | ✅ Tavily | ✅ Tavily | ✅ 已展示 | ✅ |
| 测试界面 | ❌ | ❌ | ✅ **独创** | ✅ |
| **Backend 抽象层** |
| StateBackend | ✅ | ✅ | 🔄 计划中 | 📅 |
| StoreBackend | ✅ | ✅ | 🔄 计划中 | 📅 |
| FilesystemBackend | ✅ | ✅ | 🔄 计划中 | 📅 |
| CompositeBackend | ✅ | ✅ | 🔄 计划中 | 📅 |
| **其他功能** |
| MCP 协议 | ❌ | ✅ | 🔄 计划中 | 📅 |
| 多 Provider | 部分 | ✅ | ✅ 支持 | ✅ |
| Pool & Room | ❌ | ✅ | ✅ 已展示 | ✅ |
| Skills 系统 | ❌ | ✅ | ✅ 已展示 | ✅ |

**图例**:
- ✅ 已实现并展示
- 🔄 计划中
- ❌ 不支持
- 📅 后续版本

---

## 🎬 使用演示

### 场景 1: 自动总结长对话

**步骤**:
1. 进入 "💬 简单对话" 页面
2. 创建新会话
3. 进行长时间对话（模拟超过 170k tokens）
4. 观察 Summarization Middleware 自动触发

**预期结果**:
- 后端日志显示总结触发
- 对话历史被压缩
- Token 使用量大幅减少
- 对话上下文仍然连贯

### 场景 2: HTTP 请求工具

**步骤**:
1. 进入 "🌐 网络工具" 页面
2. 选择 "HTTP Request" Tab
3. 输入 URL: `https://api.github.com/repos/golang/go`
4. 或者进入 "💬 简单对话"，向 AI 说：
   "请使用 http_request 工具获取 golang/go 仓库的信息"

**预期结果**:
- AI 自动调用 http_request 工具
- 返回 GitHub 仓库的 JSON 数据
- 显示仓库的 stars、forks 等信息

### 场景 3: Web 搜索

**前提**: 已配置 TAVILY_API_KEY

**步骤**:
1. 进入 "💬 简单对话" 页面
2. 向 AI 说："请使用 web_search 搜索最新的 AI Agent 新闻"
3. 或在 "🌐 网络工具" 页面测试

**预期结果**:
- AI 调用 web_search 工具
- 返回 5-10 条搜索结果
- 包含标题、URL、摘要
- 可以选择包含完整页面内容

### 场景 4: Middleware 查看

**步骤**:
1. 进入 "🔧 Middleware" 页面
2. 切换不同的 Middleware Tab
3. 查看每个 Middleware 的：
   - 状态（active/inactive）
   - 优先级
   - 工具列表
   - 功能说明

**预期结果**:
- 直观了解 3 个 Middleware
- 查看 filesystem 的 6 个工具
- 理解 Middleware 架构设计

---

## 📈 性能指标

基于 Apple M1, Go 1.21:

| 操作 | 性能 | 内存 |
|------|------|------|
| Middleware Stack 执行 | 36.21 ns/op | 96 B/op |
| Backend Write | 257.9 ns/op | 480 B/op |
| HTTP Request | ~100 ms | 低 |
| Web Search | ~500 ms | 低 |

---

## 🔮 未来计划

### 短期（1-2 周）

- [ ] **Backend 可视化管理页面**
  - 4 种 Backend 切换演示
  - 存储统计展示
  - CompositeBackend 路由配置

- [ ] **文件系统工具演示区**
  - 在线代码编辑器
  - 实时文件搜索
  - Glob 模式测试

- [ ] **SubAgent 任务委托演示**
  - 可视化任务分配
  - 子代理执行进度
  - 并行执行展示

### 中期（1 个月）

- [ ] **MCP 协议集成**
  - MCP Server 管理界面
  - 动态工具加载演示
  - MCP 工具测试

- [ ] **断点恢复演示**
  - 模拟会话中断
  - 7 段断点机制展示
  - 无缝恢复演示

- [ ] **事件监控仪表板**
  - Progress/Control/Monitor 三通道可视化
  - 实时事件流展示
  - 事件过滤和搜索

### 长期（2-3 个月）

- [ ] **性能分析工具**
  - Token 使用统计
  - 工具执行耗时分析
  - 并发性能测试

- [ ] **自定义 Middleware 指南**
  - 交互式 Middleware 创建向导
  - 模板生成器
  - 测试工具

- [ ] **完整的 CI/CD**
  - 自动化测试
  - Docker 部署
  - 云平台部署指南

---

## 💡 最佳实践

### 1. Middleware 使用

**推荐**:
- 优先启用 Summarization（节省成本）
- 按需启用 Filesystem（文件操作场景）
- 复杂任务使用 SubAgent（任务分解）

**注意**:
- Middleware 有优先级顺序
- 洋葱模型：先进后出
- 生命周期管理很重要

### 2. 网络工具使用

**HTTP Request**:
- 优先在对话中让 AI 调用
- 注意超时设置
- 处理好错误情况

**Web Search**:
- 必须配置 API Key
- 选择合适的主题类型
- 控制结果数量（避免过多 tokens）

### 3. 对话设计

**有效提示**:
```
✅ "请使用 web_search 搜索最新的 AI 新闻"
✅ "用 http_request 工具获取这个 API 的数据"
✅ "帮我搜索项目中所有的 TODO 注释"
```

**无效提示**:
```
❌ "搜索一下"（不明确）
❌ "调用工具"（没有指定工具）
❌ "帮我查资料"（范围太广）
```

---

## 📚 相关文档

### AgentSDK 官方文档
- [README.md](../../ai/wordflowlab/agentsdk/README.md) - 项目介绍
- [ARCHITECTURE.md](../../ai/wordflowlab/agentsdk/ARCHITECTURE.md) - 架构设计
- [QUICKSTART.md](../../ai/wordflowlab/agentsdk/QUICKSTART.md) - 快速开始

### AgentSDK Phase 文档
- [Phase 6A](../../ai/wordflowlab/agentsdk/docs/PHASE6A_OPTIMIZATION.md) - 协议优化
- [Phase 6B-1](../../ai/wordflowlab/agentsdk/docs/PHASE6B1_WEBSEARCH.md) - 网络工具
- [Phase 6C](../../ai/wordflowlab/agentsdk/docs/PHASE6C_MIDDLEWARE_INTEGRATION.md) - Middleware
- [Phase 6 总结](../../ai/wordflowlab/agentsdk/docs/PHASE6_COMPLETE_SUMMARY.md) - 完整总结

### AgentDemo 文档
- [README.md](../README.md) - 项目说明
- [PHASE1_MIDDLEWARE_IMPLEMENTATION.md](./PHASE1_MIDDLEWARE_IMPLEMENTATION.md) - Middleware 实施
- [QUICK_START_MIDDLEWARE.md](./QUICK_START_MIDDLEWARE.md) - Middleware 快速指南

---

## 🙏 致谢

- **AgentSDK 团队** - 提供强大的 Agent 开发框架
- **DeepAgents 项目** - 架构设计参考
- **Anthropic** - Claude API 支持
- **开源社区** - 各种优秀的工具和库

---

## 📄 许可证

MIT License

---

**最后更新**: 2025-11-11
**版本**: v0.3-beta
**维护者**: AgentSDK Team

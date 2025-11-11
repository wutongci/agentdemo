# Changelog

所有重要的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.3.0-beta] - 2025-11-11

### 🎉 重大更新

这是一次全面的功能升级，将 AgentDemo 从简单的写作助手提升为 **AgentSDK 的最佳参考实现**，完整展示了 Phase 6 的所有核心功能。

### ✨ 新增功能

#### Phase 6C: Middleware 系统集成

##### 后端
- **Middleware 管理 API** (`backend/api/handlers/middleware.go`)
  - `GET /api/middleware` - 获取所有可用的 Middleware
  - `GET /api/middleware/agent/:agentId` - 获取 Agent 的 Middleware 配置
  - `GET /api/middleware/agent/:agentId/stats` - 获取统计信息
  - `GET /api/middleware/:name/tools` - 获取 Middleware 工具列表

- **Agent 配置启用 Middleware** (`backend/agent/manager.go`)
  - 所有 Agent 默认启用 `summarization` Middleware
  - 自动总结长对话（>170k tokens）
  - 保留最近 6 条消息 + 总结

##### 前端
- **Middleware 控制台页面** (`frontend/src/components/MiddlewareConsole.tsx`)
  - Tab 切换查看 3 个 Middleware
  - 展示每个 Middleware 的状态、优先级、工具列表
  - 功能说明和使用示例
  - 精美的 UI 设计

- **Middleware API 服务** (`frontend/src/services/middlewareService.ts`)
  - 完整的 TypeScript 类型定义
  - React Query 集成

- **新增 UI 组件**
  - `Badge` 组件 (`frontend/src/components/ui/badge.tsx`)
  - `Table` 组件 (`frontend/src/components/ui/table.tsx`)
  - `Tabs` 组件 (`frontend/src/components/ui/tabs.tsx`)

##### 支持的 Middleware
- **summarization** (Priority 40) - ✅ 已启用
- **filesystem** (Priority 100) - ⏸️ 未启用（可配置）
- **subagent** (Priority 200) - ⏸️ 未启用（可配置）

#### Phase 6B-1: 网络工具集成

##### 后端
- **网络工具自动注册**
  - `http_request` - HTTP/HTTPS 请求工具（6 种方法）
  - `web_search` - Tavily API 搜索工具

- **工具特性**
  - HTTP Request: 自动 JSON 解析，自定义请求头，可配置超时
  - Web Search: 支持 3 种主题（general/news/finance），1-10 结果数量

##### 前端
- **网络工具测试页面** (`frontend/src/components/NetworkTools.tsx`)
  - HTTP Request 测试界面
  - Web Search 演示界面
  - 交互式参数配置
  - 实时结果展示

- **网络工具 API 服务** (`frontend/src/services/networkToolsService.ts`)
  - TypeScript 类型定义
  - API 调用封装

### 🔧 改进

- **项目定位升级**
  - 从"AI 写作助手"升级为"AI Agent 演示项目"
  - 作为 AgentSDK 的最佳参考实现
  - 完整展示 Phase 6 核心功能

- **导航栏改进**
  - 新增 "🔧 Middleware" 导航按钮
  - 新增 "🌐 网络工具" 导航按钮
  - 支持 5 个页面切换

- **README.md 全面更新**
  - 新增 Phase 6C 和 Phase 6B-1 功能说明
  - 更新页面导航说明
  - 添加网络工具配置指南

### 📚 文档

新增文档（3 个）：
- `docs/PHASE1_MIDDLEWARE_IMPLEMENTATION.md` - Middleware 实施详细文档
- `docs/QUICK_START_MIDDLEWARE.md` - 5 分钟快速体验指南
- `docs/COMPLETE_FEATURE_SHOWCASE.md` - 完整功能展示文档
- `CHANGELOG.md` - 本文档

### 📦 依赖

- **新增**: `@radix-ui/react-tabs` ^1.0.4

### 🐛 修复

- 修复 Markdown 格式警告
- 改进错误处理

### 💻 开发者

- **新增文件**: 14 个
- **修改文件**: 5 个
- **代码行数**: ~2,000 行

### 📊 统计

| 类别 | 数量 |
|------|------|
| 新增后端文件 | 1 |
| 新增前端文件 | 6 |
| 新增 UI 组件 | 3 |
| 新增文档 | 4 |
| 新增 API 端点 | 4 |
| 新增页面 | 2 |
| 代码行数 | ~2,000 |

---

## [0.2.0] - 2025-11-10

### 新增
- 项目结构重组（docs/, scripts/）
- 更新 agentsdk 依赖路径
- 改进前端 SkillsPage 命令执行

### 修复
- 修正 backend/go.mod 中的 agentsdk 路径
- 更新 go.mod 和 go.sum 依赖
- 删除过时的 COMPLETE_FEATURES.md

---

## [0.1.0] - 2025-11-09

### 新增
- 初始项目结构
- 基础 Agent 功能
- 简单对话页面
- 协作工作流页面
- Skills 管理页面
- WebSocket 实时通信
- 会话管理

---

## 计划中的功能

### [0.4.0] - Backend 抽象层可视化
- [ ] 4 种 Backend 切换演示
- [ ] Backend 管理页面
- [ ] 存储统计展示
- [ ] CompositeBackend 路由配置

### [0.5.0] - 文件系统工具增强
- [ ] 在线代码编辑器
- [ ] 实时文件搜索
- [ ] Glob 模式测试
- [ ] 启用 Filesystem Middleware

### [0.6.0] - SubAgent 演示
- [ ] 可视化任务分配
- [ ] 子代理执行进度
- [ ] 并行执行展示
- [ ] 启用 SubAgent Middleware

### [1.0.0] - 生产就绪
- [ ] MCP 协议集成
- [ ] 断点恢复演示
- [ ] 事件监控仪表板
- [ ] 性能分析工具
- [ ] 完整测试覆盖
- [ ] Docker 部署
- [ ] 生产级文档

---

**维护者**: AgentSDK Team
**许可证**: MIT

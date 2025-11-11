# Middleware 功能快速体验指南

> 5 分钟快速体验 AgentSDK Phase 6C Middleware 系统

## 🚀 快速启动

### 1. 安装前端依赖（首次运行）

```bash
cd frontend
npm install
```

这会安装新增的 `@radix-ui/react-tabs` 依赖。

### 2. 启动后端

```bash
cd backend
go run main.go
```

您应该看到：
```
Server starting on port 8080
```

### 3. 启动前端

```bash
cd frontend
npm run dev
```

您应该看到：
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 4. 访问 Middleware 控制台

打开浏览器访问: `http://localhost:5173`

点击顶部导航栏的 **🔧 Middleware** 按钮

## 📋 功能导览

### Summarization Middleware

**位置**: Middleware 控制台 > summarization Tab

**功能说明**:
- ✅ 当前已启用
- 优先级: 40
- 自动监控对话历史的 token 数量
- 超过 170,000 tokens 时自动总结旧消息
- 保留最近 6 条消息 + 总结

**无需手动操作**，该 Middleware 会在后台自动工作！

### Filesystem Middleware

**位置**: Middleware 控制台 > filesystem Tab

**功能说明**:
- ⏸️ 当前未启用
- 优先级: 100
- 提供 6 个文件系统工具

**工具列表**:
| 工具名 | 功能 |
|--------|------|
| fs_read | 读取文件内容，支持分页读取 |
| fs_write | 写入文件内容（覆盖模式） |
| fs_ls | 列出目录内容，显示文件大小和修改时间 |
| fs_edit | 精确编辑文件（字符串替换） |
| fs_glob | 使用 Glob 模式匹配文件（如 **/*.go） |
| fs_grep | 正则表达式搜索文件内容 |

### SubAgent Middleware

**位置**: Middleware 控制台 > subagent Tab

**功能说明**:
- ⏸️ 当前未启用
- 优先级: 200
- 提供 task 工具，用于任务委托

**适用场景**:
- 复杂任务分解
- 并行执行多个子任务
- 专业任务（研究、编码、审查）

## 🧪 测试 API 端点

### 获取所有 Middleware

```bash
curl http://localhost:8080/api/middleware
```

**预期响应**:
```json
{
  "middlewares": [
    {
      "name": "summarization",
      "priority": 40,
      "description": "自动总结长对话历史（超过 170k tokens 时触发）",
      "tools": [],
      "status": "active"
    },
    {
      "name": "filesystem",
      "priority": 100,
      "description": "提供文件系统操作工具，支持自动大结果驱逐",
      "tools": ["fs_read", "fs_write", "fs_ls", "fs_edit", "fs_glob", "fs_grep"],
      "status": "inactive"
    },
    {
      "name": "subagent",
      "priority": 200,
      "description": "支持任务委托给子代理执行",
      "tools": ["task"],
      "status": "inactive"
    }
  ],
  "total": 3
}
```

### 获取 Filesystem 工具列表

```bash
curl http://localhost:8080/api/middleware/filesystem/tools
```

**预期响应**:
```json
{
  "middleware": "filesystem",
  "tools": [
    {
      "name": "fs_read",
      "description": "读取文件内容，支持分页读取",
      "category": "filesystem"
    },
    // ... 其他 5 个工具
  ],
  "total": 6
}
```

## 💡 查看 Middleware 实际工作

### Summarization 自动触发（需要长对话）

1. 进入 **💬 简单对话** 页面
2. 创建新会话
3. 发送多条长消息（模拟超过 170k tokens 的场景）
4. 观察后端日志，您会看到类似输出：

```
[Middleware] Summarization triggered: tokens=180000
[Middleware] Summarizing 20 old messages, keeping recent 6
[Middleware] Summary created, saved 150000 tokens
```

## 🎯 下一步

### 启用更多 Middleware（未来更新）

当前版本只启用了 `summarization` Middleware。

未来更新将支持：
1. **动态启用/禁用** Middleware
2. **Filesystem Middleware** 启用和演示
3. **SubAgent Middleware** 任务委托示例
4. **自定义 Middleware** 创建指南

### 探索其他功能

- **🤝 协作工作流**: 多 Agent 协作演示
- **⚡ Skills**: Commands 和 Skills 管理

## 📚 相关文档

- [PHASE1_MIDDLEWARE_IMPLEMENTATION.md](./PHASE1_MIDDLEWARE_IMPLEMENTATION.md) - 详细实施文档
- [AgentSDK ARCHITECTURE.md](../../ai/wordflowlab/agentsdk/ARCHITECTURE.md) - 架构设计
- [AgentSDK Phase 6C](../../ai/wordflowlab/agentsdk/docs/PHASE6C_MIDDLEWARE_INTEGRATION.md) - 官方文档

## ❓ 常见问题

### Q: 为什么只有 summarization 是 active 状态？

A: 当前版本优先展示最实用的 Summarization Middleware。Filesystem 和 SubAgent 将在后续版本中启用。

### Q: 如何启用其他 Middleware？

A: 修改 `backend/agent/manager.go` 中的配置：

```go
Middlewares: []string{"summarization", "filesystem", "subagent"},
```

### Q: Middleware 会影响性能吗？

A: AgentSDK 的 Middleware 采用高性能设计：
- Middleware Stack 执行: ~36 ns/op
- 内存占用极低: 96 B/op
- 真正的并发支持（Goroutine）

### Q: 可以创建自定义 Middleware 吗？

A: 可以！参考 [AgentSDK 自定义 Middleware 指南](../../ai/wordflowlab/agentsdk/ARCHITECTURE.md#扩展指南)

## 🎉 恭喜！

您已经成功体验了 AgentSDK Phase 6C 的 Middleware 系统！

这只是 AgentSDK 强大功能的冰山一角。继续探索更多功能：
- Backend 抽象层
- 网络工具（HTTP 请求、Web 搜索）
- MCP 协议支持
- 多 Provider 支持

---

有问题或建议？欢迎提交 Issue！

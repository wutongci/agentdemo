# Skills 演示功能使用指南

本文档介绍如何使用 writeflow-sdk 的 Skills 系统演示功能。

## 🎯 功能概述

Skills 系统包含两个核心组件：

### 1. **Slash Commands**（用户主动触发的命令）
在对话框中输入 `/命令名` 即可执行预定义的工作流。

**已实现的命令**：
- `/analyze` - 深入分析代码、文档或数据
- `/explain` - 解释复杂的代码或概念
- `/optimize` - 优化代码性能和架构
- `/review` - 全面的代码审查
- `/plan` - 任务和项目规划

### 2. **Agent Skills**（AI 自动激活的知识库）
根据对话内容和触发条件，相关技能会自动注入到 AI 的系统提示中。

**已实现的技能**：
- **best-practices** - 软件开发最佳实践（SOLID、DRY、KISS 等）
- **code-quality** - 代码质量检查（复杂度、重复、命名等）
- **security** - 安全检查（OWASP Top 10）

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd backend
./agentdemo
```

后端将在 `http://localhost:8080` 启动。

### 2. 启动前端服务

```bash
cd frontend
npm run dev
```

前端将在 `http://localhost:5173` 启动。

### 3. 访问 Skills 管理页面

1. 打开浏览器访问 `http://localhost:5173`
2. 点击顶部导航栏的 **⚡ Skills** 按钮
3. 查看可用的 Commands 和 Skills

---

## 📁 项目结构

```
backend/
├── skills-package/          # Skills 包目录
│   ├── commands/           # Slash Commands 定义
│   │   ├── analyze.md
│   │   ├── explain.md
│   │   ├── optimize.md
│   │   ├── review.md
│   │   └── plan.md
│   ├── skills/            # Agent Skills 定义
│   │   ├── best-practices/
│   │   │   └── SKILL.md
│   │   ├── code-quality/
│   │   │   └── SKILL.md
│   │   └── security/
│   │       └── SKILL.md
│   └── scripts/           # 前置脚本
│       └── bash/
│           └── check-env.sh
│
├── api/handlers/
│   └── skills.go          # Skills API Handler
│
├── agent/
│   └── manager.go         # Agent 管理器（已集成 Skills）
│
frontend/
├── src/
│   ├── components/skills/ # Skills UI 组件
│   │   ├── SkillsPage.tsx
│   │   ├── CommandCard.tsx
│   │   └── SkillCard.tsx
│   ├── services/
│   │   └── skillsService.ts  # Skills API 服务
│   └── types/
│       └── skills.ts         # Skills 类型定义
```

---

## 🔌 API 端点

### Commands 相关

- `GET /api/skills/commands` - 列出所有可用命令
- `GET /api/skills/commands/:name` - 获取单个命令详情

### Skills 相关

- `GET /api/skills/skills` - 列出所有可用技能
- `GET /api/skills/skills/:name` - 获取单个技能详情

---

## 💡 使用示例

### 查看所有命令

```bash
curl http://localhost:8080/api/skills/commands | jq
```

### 查看特定命令

```bash
curl http://localhost:8080/api/skills/commands/analyze | jq
```

### 查看所有技能

```bash
curl http://localhost:8080/api/skills/skills | jq
```

### 查看特定技能

```bash
curl http://localhost:8080/api/skills/skills/best-practices | jq
```

---

## 📝 如何创建自定义 Command

### 1. 创建命令文件

在 `backend/skills-package/commands/` 目录下创建 `your-command.md`：

```markdown
---
description: 你的命令描述
argument-hint: "参数提示"
allowed-tools: ["fs_read", "fs_write", "bash_run"]
models:
  preferred:
    - claude-sonnet-4-5
  minimum-capabilities:
    - tool-calling
---

# 命令工作流

详细描述命令的执行流程...

## 执行步骤

1. 步骤1
2. 步骤2
3. 步骤3
```

### 2. 更新 AgentManager 配置

在 `backend/agent/manager.go` 的 `EnabledCommands` 中添加你的命令：

```go
EnabledCommands: []string{"analyze", "explain", "optimize", "review", "plan", "your-command"},
```

### 3. 重新编译和启动

```bash
cd backend
go build
./agentdemo
```

---

## 🧠 如何创建自定义 Skill

### 1. 创建技能目录和文件

```bash
mkdir -p backend/skills-package/skills/your-skill
```

### 2. 创建 SKILL.md

在 `backend/skills-package/skills/your-skill/SKILL.md`：

```markdown
---
name: your-skill
description: 你的技能描述
allowed-tools: ["fs_read"]
triggers:
  - type: keyword
    keywords: ["关键词1", "关键词2"]
  - type: context
    condition: "during /your-command"
---

# 技能知识库

详细的知识库内容...

## 检查清单

- [ ] 检查项1
- [ ] 检查项2
```

### 3. 更新 AgentManager 配置

在 `backend/agent/manager.go` 的 `EnabledSkills` 中添加你的技能：

```go
EnabledSkills: []string{"best-practices", "code-quality", "security", "your-skill"},
```

### 4. 重新编译和启动

```bash
cd backend
go build
./agentdemo
```

---

## 🎨 前端界面特性

### Skills 管理页面

- **标签页切换**：在 Commands 和 Skills 之间切换
- **卡片展示**：美观的卡片式布局展示每个命令和技能
- **详细信息**：显示描述、参数、触发条件、允许的工具等
- **状态管理**：显示技能的启用/禁用状态
- **响应式设计**：自适应不同屏幕尺寸

### UI 组件

- **CommandCard**：命令卡片组件
  - 显示命令名称和描述
  - 显示参数提示
  - 显示允许的工具
  - 提供执行按钮（待实现）

- **SkillCard**：技能卡片组件
  - 显示技能名称和描述
  - 显示触发条件（关键词、上下文）
  - 显示允许的工具
  - 提供启用/禁用按钮

---

## 🔧 技术实现

### 后端集成

**AgentManager 配置**（`backend/agent/manager.go`）：

```go
config := &types.AgentConfig{
    // ... 其他配置
    SkillsPackage: &types.SkillsPackageConfig{
        Source:          "local",
        Path:            "./skills-package",
        CommandsDir:     "commands",
        SkillsDir:       "skills",
        EnabledCommands: []string{"analyze", "explain", "optimize", "review", "plan"},
        EnabledSkills:   []string{"best-practices", "code-quality", "security"},
    },
}
```

### 前端集成

**API 服务**（`frontend/src/services/skillsService.ts`）：

```typescript
export async function fetchCommands(): Promise<CommandInfo[]> {
  const response = await fetch(`${API_BASE_URL}/skills/commands`);
  const data: CommandsResponse = await response.json();
  return data.commands;
}

export async function fetchSkills(): Promise<SkillInfo[]> {
  const response = await fetch(`${API_BASE_URL}/skills/skills`);
  const data: SkillsResponse = await response.json();
  return data.skills;
}
```

---

## 📊 当前实现进度

### ✅ 已完成（80%）

1. ✅ Skills 包目录结构和示例文件
2. ✅ 5个 Slash Commands 定义
3. ✅ 3个 Agent Skills 定义
4. ✅ 后端 Skills API Handler
5. ✅ 前端 Skills 管理页面
6. ✅ Commands 和 Skills 列表展示
7. ✅ AgentManager Skills 集成
8. ✅ 后端编译成功

### 🔄 待完善（20%）

1. ⏳ 命令执行功能（在对话中输入 `/命令` 执行）
2. ⏳ WebSocket 事件扩展（command_executed, skill_activated）
3. ⏳ Skills 自动激活逻辑测试

---

## 🐛 故障排查

### 后端启动失败

检查端口是否被占用：
```bash
lsof -i :8080
```

### 前端无法连接后端

确保后端已启动并检查 CORS 配置：
```go
AllowOrigins: []string{"http://localhost:5173"},
```

### Skills 不显示

检查 skills-package 目录是否存在：
```bash
ls -la backend/skills-package/
```

---

## 📚 参考资料

- [writeflow-sdk 文档](https://github.com/wordflowlab/agentsdk)
- [Slash Commands 设计规范](../skills-package/commands/)
- [Agent Skills 设计规范](../skills-package/skills/)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

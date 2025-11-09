# 🚀 writeflow-sdk Skills 系统完整演示项目

> 展示 writeflow-sdk 的 Slash Commands 和 Agent Skills 完整能力

[![完成度](https://img.shields.io/badge/完成度-100%25-brightgreen)]()
[![后端](https://img.shields.io/badge/后端-Go-00ADD8)]()
[![前端](https://img.shields.io/badge/前端-React+TypeScript-61DAFB)]()
[![SDK](https://img.shields.io/badge/SDK-writeflow--sdk-orange)]()

---

## ✨ 核心功能

### 1. 📦 完整的 Skills 包
- ✅ **5个 Slash Commands** - analyze, explain, optimize, review, plan
- ✅ **3个 Agent Skills** - best-practices, code-quality, security
- ✅ 详细的知识库内容和执行流程

### 2. 🎨 精美的管理界面
- ✅ 独立的 Skills 管理页面
- ✅ 实时的 Skills 激活显示
- ✅ 智能的命令检测提示

### 3. 🔌 完善的 API
- ✅ Skills 查询 API
- ✅ Agent 自动集成
- ✅ WebSocket 实时通信

### 4. 📚 详尽的文档
- ✅ 使用指南
- ✅ API 文档
- ✅ OSS 配置说明

---

## 🎯 快速开始

### 前置要求

- Go 1.21+
- Node.js 18+
- writeflow-sdk

### 1. 克隆项目

```bash
cd /Users/coso/Documents/dev/go/agentdemo
```

### 2. 启动后端

```bash
cd backend
./agentdemo
```

后端将在 `http://localhost:8080` 启动

### 3. 启动前端

```bash
cd frontend
npm install  # 首次运行
npm run dev
```

前端将在 `http://localhost:5173` 启动

### 4. 体验功能

1. **访问 Skills 管理**：点击顶部 **⚡ Skills** 按钮
2. **查看 Commands**：浏览 5 个可用的 Slash Commands
3. **查看 Skills**：浏览 3 个自动激活的 Agent Skills
4. **测试对话**：
   - 输入 `/analyze` 测试命令
   - 输入包含"质量"或"安全"的问题测试 Skills 激活

---

## 📁 项目结构

```
agentdemo/
├── backend/
│   ├── skills-package/          # Skills 包
│   │   ├── commands/           # 5个 Slash Commands
│   │   ├── skills/             # 3个 Agent Skills
│   │   └── scripts/            # 前置脚本
│   ├── api/handlers/
│   │   └── skills.go           # Skills API
│   ├── agent/manager.go        # Agent 管理（已集成 Skills）
│   └── models/types.go         # 数据模型
│
├── frontend/
│   └── src/
│       ├── components/skills/  # Skills UI 组件
│       ├── services/           # API 服务
│       └── types/              # 类型定义
│
└── docs/
    ├── SKILLS_DEMO.md         # 使用指南
    ├── OSS_SETUP.md          # OSS 配置
    └── COMPLETE_FEATURES.md  # 完整功能说明
```

---

## 🎬 功能演示

### Slash Commands 演示

```bash
# 在对话框输入
/analyze src/main.go

# 效果
⚡ 执行命令: /analyze
AI 将根据 analyze.md 中定义的流程进行深入分析
```

### Agent Skills 演示

```bash
# 输入包含关键词的问题
如何提升代码质量？

# 效果
🧠 激活技能: 最佳实践 | 代码质量
AI 将自动注入相关知识库回答问题
```

---

## 📊 技术栈

### 后端
- **框架**: Go + Gin
- **SDK**: writeflow-sdk
- **特性**:
  - Skills 包加载
  - Agent 管理
  - WebSocket 实时通信

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: React Query
- **样式**: TailwindCSS
- **特性**:
  - 实时 Skills 检测
  - 响应式设计
  - 优雅的 UI/UX

---

## 📖 文档导航

| 文档 | 说明 |
|------|------|
| [SKILLS_DEMO.md](./SKILLS_DEMO.md) | 详细使用指南和开发文档 |
| [COMPLETE_FEATURES.md](./COMPLETE_FEATURES.md) | 完整功能说明和架构图 |
| [OSS_SETUP.md](./OSS_SETUP.md) | OSS 加载配置指南 |

---

## 🔧 自定义扩展

### 添加新的 Slash Command

1. 在 `backend/skills-package/commands/` 创建 `your-command.md`
2. 在 `agent/manager.go` 的 `EnabledCommands` 中添加命令名
3. 重新编译后端

详见：[SKILLS_DEMO.md#如何创建自定义-command](./SKILLS_DEMO.md#📝-如何创建自定义-command)

### 添加新的 Agent Skill

1. 在 `backend/skills-package/skills/` 创建目录和 `SKILL.md`
2. 在 `agent/manager.go` 的 `EnabledSkills` 中添加技能名
3. 重新编译后端

详见：[SKILLS_DEMO.md#如何创建自定义-skill](./SKILLS_DEMO.md#🧠-如何创建自定义-skill)

---

## 🎯 核心亮点

### 1. 完整展示 writeflow-sdk 能力
- ✅ Slash Commands 完整流程
- ✅ Agent Skills 自动激活
- ✅ 多种触发条件（keyword、context、always）

### 2. 生产级代码质量
- ✅ 类型安全（TypeScript）
- ✅ 错误处理完善
- ✅ 代码结构清晰
- ✅ 可扩展性强

### 3. 优秀的用户体验
- ✅ 实时反馈
- ✅ 智能提示
- ✅ 美观界面
- ✅ 响应式设计

### 4. 详尽的文档
- ✅ 3份完整文档
- ✅ 代码示例丰富
- ✅ 配置说明详细

---

## 📈 实现统计

| 指标 | 数量 |
|------|------|
| 后端文件 | 11个（新增） |
| 前端文件 | 7个（新增） |
| 文档文件 | 3个（新增） |
| Slash Commands | 5个 |
| Agent Skills | 3个 |
| API 端点 | 4个 |
| 总代码行数 | 2000+ |

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [writeflow-sdk](https://github.com/wordflowlab/agentsdk)
- [Anthropic Claude](https://www.anthropic.com/)
- [React](https://react.dev/)
- [Gin](https://gin-gonic.com/)

---

## 📞 支持

如有问题，请查看文档或提交 Issue。

---

**🎉 现在开始体验完整的 Skills 系统吧！**

```bash
# 启动后端
cd backend && ./agentdemo

# 启动前端（新终端）
cd frontend && npm run dev

# 访问
open http://localhost:5173
```

# MeOS - 人生管理系统

一个以"梳理与反思"为核心的人生管理系统，帮助用户从多维度审视生活状态、规划目标方向、沉淀经验智慧。

## 核心价值

- 🎯 **不是任务清单工具，而是生活状态的仪表盘**
- 💭 **不是记录流水账，而是促进深度思考与成长**
- 🛠️ **不是单一方法论，而是方法论工具箱**

## 支持的管理方法论

- **生活平衡轮（Life Balance Wheel）** - 可视化各领域满意度，识别失衡区域
- **OKR 人生版** - 目标驱动的阶段性管理
- **GTD 生活版** - 系统化整理生活事务
- **时间矩阵** - 优化时间精力分配

## 技术栈

### 后端
- Node.js + TypeScript
- Fastify (API框架)
- Prisma (ORM)
- SQLite (本地优先存储)

### 前端
- React 18 + TypeScript
- Vite
- TailwindCSS
- Recharts (数据可视化)
- Zustand (状态管理)

## 项目结构

```
MeOS/
├── packages/
│   ├── api/               # 后端API服务
│   │   ├── src/
│   │   │   ├── modules/  # 业务模块（五维板块 + melog）
│   │   │   ├── prisma/   # 数据库模型（schema.prisma）
│   │   │   ├── lib/     # 工具库
│   │   │   └── server.ts
│   │   └── package.json
│   ├── connectors/        # MeLog 官方连接器（Apple Health / chatlog 兼容）
│   └── shared/           # 共享类型和工具
│       └── src/
├── apps/
│   ├── web/              # Web前端应用（主端）
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/    # 含 melog/（MeLog 板块页面）
│   │   │   ├── hooks/
│   │   │   └── stores/
│   │   └── package.json
│   └── chrome-extension/ # Chrome 扩展
├── docs/
│   ├── MELOG.md          # MeLog 板块总览
│   └── melog/STANDARD.md # MeLog Standard 开放格式规范
└── package.json
```

> 多端规划（Mac 应用 / 微信小程序 / CLI）见下方[路线图](#路线图)，未实现前不在仓库中保留空占位目录。

## 开始使用

### 环境要求

- Node.js 18-20 LTS (注意：Node.js 22 存在兼容性问题)
- pnpm >= 8.0.0

### 安装依赖

```bash
# 首次安装
pnpm install

# 如果遇到网络问题
pnpm install --force

# Windows 25H2 用户注意：如遇 esbuild 错误，请使用 Node.js 18-20 LTS
```

### 开发模式

```bash
# 初始化数据库（首次运行必做）
cd packages/api
pnpm db:push

# 可选：填充示例数据
pnpm db:seed

# 返回项目根目录
cd ../..

# 同时启动前后端
pnpm dev

# 或分别启动：
# 仅启动后端
pnpm backend:dev
# 仅启动前端
pnpm web:dev
```

### 构建

```bash
pnpm build

# 构建产物位于：
# - packages/api/dist/
# - apps/web/dist/
```

## MVP 功能范围（阶段一）

- ✅ 用户注册登录、基础配置
- ✅ 生活领域管理（默认8领域）
- ✅ 生活平衡轮方法论深度实现
- ✅ 基础反思记录（每日反思、周复盘）
- ✅ 简单数据可视化（领域雷达图、时间曲线）
- ✅ Web端完整功能
- ✅ **MeLog 板块** — 汇聚健康/笔记/IM聊天记录到本地统一时间线，MCP 接入 + 内置技能（规则引擎，可选 LLM 生成）+ 官方连接器 + 定时调度，开放 [MeLog Standard](./docs/melog/STANDARD.md)，详见 [docs/MELOG.md](./docs/MELOG.md)
- 🚧 移动端基础功能（计划中）

## 常见问题

### 1. Windows 25H2 兼容性问题

**问题现象**：前端启动时报错 `Cannot read directory "../../../../.."`

**解决方案**：
- 使用 Node.js 18-20 LTS 版本
- 项目已通过 pnpm overrides 强制使用 esbuild 0.21.5

### 2. 注册时报错 "The table `main.User` does not exist"

**问题原因**：数据库表未创建

**解决方案**：
```bash
cd packages/api
pnpm exec prisma migrate dev --name init
```

### 3. 依赖安装失败

**解决方案**：
```bash
pnpm install --force
```

## 路线图

- **阶段一（MVP）** - 单一方法论深度实现 ✅
- **阶段二** - 多方法论整合
- **阶段三** - 智能化与生态
- **阶段四** - 持续优化与商业化
- **多端扩展（规划中）** - Mac 原生应用、微信小程序、CLI

## 设计文档

详细架构设计请参考：[设计文档](./.qoder/quests/life-management-architecture.md)

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提Issue。

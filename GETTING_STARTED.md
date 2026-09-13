# MeOS 启动指南

## 1. 环境要求

- Node.js 18–20 LTS（Node 22 存在兼容性问题；CI 使用 Node 20）
- pnpm >= 8.0.0

## 2. 一键启动（推荐）

```bash
./dev.sh
```

脚本自动完成以下流程，适合首次运行：

1. 清理 3000 / 3001 / 5173–5175 端口与残留进程
2. 预检 Node / pnpm 版本 → `pnpm install`
3. 自动生成 `packages/api/.env`（含随机 `JWT_SECRET`）
4. `prisma generate` + `db push` 初始化数据库
5. 启动后端（:3001）与前端（:3000）
6. `/health` 健康检查通过后自动打开浏览器

## 3. 手动启动

```bash
pnpm install

# 初始化数据库（首次运行必做）
cd packages/api
pnpm db:generate     # 生成 Prisma 客户端
pnpm db:push         # 基于 schema 建表
pnpm db:seed         # 可选：填充示例数据
cd ../..

pnpm dev             # 同时启动前后端
# 或分别启动：
pnpm backend:dev     # 仅后端 → http://localhost:3001
pnpm web:dev         # 仅前端 → http://localhost:3000
```

首次访问 http://localhost:3000 ，点击「立即注册」创建账号，系统会自动初始化 8 个默认生活领域（职业、健康、家庭、财务、学习、社交、休闲、精神）。

## 4. 环境变量

| 变量 | 位置 | 说明 |
|---|---|---|
| `JWT_SECRET` | `packages/api/.env` | **生产必填**，未设置时生产环境拒绝启动（`dev.sh` 会自动生成） |
| `MEOS_DEV_AUTH` | `packages/api/.env` | 设为 `true` 时跳过认证，使用 mock 用户 `mock-user-1`（仅开发） |
| `MELOG_LLM_BASE_URL` | `packages/api/.env` | OpenAI 兼容端点（DeepSeek / 通义兼容 / Moonshot / 本地 Ollama 等），启用 MeLog 技能 LLM 运行器 |
| `MELOG_LLM_API_KEY` | `packages/api/.env` | 对应 API Key，本地服务可填任意非空值 |
| `MELOG_LLM_MODEL` | `packages/api/.env` | 模型名，如 `deepseek-chat` |

> 隐私：未配置 `MELOG_LLM_*` 时，MeLog 数据不发生任何外发；配置后条目数据只发送到你自己配置的端点。

## 5. 环境验证

```bash
curl http://localhost:3001/health
pnpm test                                    # 全量测试（Vitest）
pnpm --filter @meos/api db:studio            # Prisma Studio 查看数据
```

## 6. 首次使用导览

| 板块 | 建议的第一步 |
|---|---|
| **Today**（`/`） | 添加今日待办、给习惯打卡，写下第一条每日反思 |
| **方向**（`/direction`） | 写下愿景 → 设一个带关键结果的目标 → 给八领域打平衡轮分数 |
| **行动**（`/action`） | 建立待办看板（inbox/todo/doing/done）与习惯清单 |
| **认知**（`/cognition`） | 开一个课题，沉淀洞察笔记，把在读的书加入阅读清单 |
| **反思**（`/reflection`） | 每日反思会自动汇总当日待办与习惯数据；周末做一次周期复盘 |
| **资源**（`/resources`） | 录入订阅、人脉与健康记录（会自动带入每日反思） |
| **MeLog**（`/melog`） | 创建数据源，用连接器或 Ingest API 推送健康/笔记/聊天数据，运行内置技能 |
| **品牌**（`/brand`） | 填写品牌档案 → 建内容支柱 → 在内容流水线排一期选题 |
| **Workbench**（`/workbench`） | 个人工作台：进行中项目、打卡与学习专题一屏聚合 |

方法论层面（每个板块为什么这样设计、怎么用出效果）见 [docs/理论/方法论/入门.md](./docs/理论/方法论/入门.md) 与 [docs/理论/方法论/总览.md](./docs/理论/方法论/总览.md)。

## 7. Chrome 扩展

```bash
pnpm web:build:extension     # 产物输出至 apps/web/extension-dist/
```

在 Chrome 中以「加载已解压的扩展程序」方式载入 `apps/chrome-extension/`，即可从浏览器快速唤起 MeOS。

## 8. 常见问题

### 数据库表不存在

注册时报 "The table `main.User` does not exist" 说明数据库尚未初始化：

```bash
cd packages/api
pnpm db:push
```

### 依赖安装失败

```bash
pnpm install --force
```

### Windows 25H2 前端启动报错 `Cannot read directory`

使用 Node.js 18–20 LTS；项目已通过 pnpm overrides 强制 esbuild 0.21.5。

### 端口被占用

```bash
./dev.sh        # 脚本会自动清理 3000/3001/5173-5175 端口
```

更多文档见 [README 文档导航](./README.md#文档导航)。

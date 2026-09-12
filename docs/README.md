# MeOS 文档中心

> 全仓库文档地图与导航。产品介绍与快速启动见 [根 README](../README.md)。

---

## 文档全景

MeOS 的文档分四层：**方法论框架**（理论层）→ **板块与产品文档**（实现层）→ **品牌与 IP 知识库**（内容层）→ **工程档案**（过程层）。

```
me-os/
├── README.md / GETTING_STARTED.md / DESIGN.md ...... 产品总览 · 启动指南 · 架构设计
│
├── gtm/ ........................... Go-to-Market：总纲 + 定位/人群/定价/渠道/上线/指标 分册
│
├── docs/ ........................ 文档中心（本目录）
│   │
│   │ ── 方法论框架（五维框架）──
│   ├── OVERVIEW.md ................ 框架总览：五维定义、关系图、应用原则
│   ├── GETTING_STARTED.md ......... 方法论入门：愿景练习 → 行动系统 → 复盘
│   ├── DIRECTION.md / ACTION.md / COGNITION.md / REFLECTION.md / RESOURCES.md
│   │                               五维主文档（每维一个问题 + 一套方法）
│   ├── direction/ action/ cognition/ reflection/ resources/
│   │                               五维子文档（15 篇：VISION/DOMAINS/GOALS/MINDSET…）
│   ├── INTEGRATION.md ............. 五维协同运作与跨维度整合
│   ├── DECISION_FRAMEWORK.md ...... 决策方法论
│   ├── GLOSSARY.md ................ 术语表
│   ├── TROUBLESHOOTING.md ......... 常见问题与解决
│   │
│   │ ── 板块文档 ──
│   ├── MELOG.md ................... MeLog 板块：架构、API、MCP 工具、技能引擎
│   ├── melog/STANDARD.md .......... MeLog Standard v0.1 开放格式规范
│   ├── melog/CAPTURE.md ........... 口述打卡：模板、解析、双写与幂等
│   ├── melog/CONNECTOR_DIDA365.md . 滴答清单连接器：选型、实测接口、测试与运维
│   ├── melog/WEARABLES_RESEARCH.md . 可穿戴设备接入调研：API 分层、国内通道、汇聚层方案
│   ├── BRAND.md ................... 品牌板块总览与品牌蓝本摘要
│   ├── WORKBENCH_RESEARCH.md ...... 个人工作台调研（Agent 时代的工作台设计）
│   │
│   │ ── 品牌与 IP 知识库 ──
│   ├── brand/ ..................... 品牌资料：DESIGN 总蓝本 · ACCOUNT_LAUNCH 起号手册
│   │                               · OPERATIONS 运营 SOP · COPY 文案资产
│   │                               · COMPETITOR_RESEARCH 竞品调研 · BUSINESS 一人公司手册
│   ├── ip/ ........................ 个人 IP 建设全案（逻辑/哲学/方法/思路/实战/全球视角）
│   ├── self-media/ ................ 自媒体实战：总纲 · 9 平台手册 · 方法论大全 · 选题预判
│   ├── INTERVIEW_RESEARCH.md ...... 访谈 IP 调研与定位
│   ├── INTERVIEW_PLAYBOOK.md ...... 访谈节目可执行手册（文案/动线/视觉）
│   ├── COMPETITOR_ANALYSIS.md ..... 访谈赛道竞品深挖
│   ├── FIELD_LOG_001_SHOTLIST.md .. FDE 田野日志 001《园丁》拍摄脚本与分镜
│   ├── EPISODE_PIPELINE.md ........ 系列选题管线
│   ├── assets/brand/ .............. 品牌视觉资产
│   │
│   │ ── 工程档案 ──
│   ├── superpowers/plans|specs/ ... 板块实现计划与设计（品牌控制台等）
│   ├── NAVIGATION_REFACTOR*.md .... 导航重构计划
│   ├── QUALITY_REPORT.md .......... 项目质量评估
│   └── evaluation/ ................ 阶段性项目评估报告
│
└── packages/connectors/README.md .. MeLog 官方连接器使用指南
```

---

## 方法论框架：五维模型

五维框架是 MeOS 的理论基石，将人生管理划分为五个相互关联的维度。

| 维度 | 核心问题 | 关键产出 | 管理频率 |
|------|----------|----------|----------|
| **方向** | 我要去哪里？ | 愿景、领域、目标、心态 | 季度校准 |
| **行动** | 如何做到？ | 待办、习惯、日程 | 每日执行 |
| **认知** | 如何理解？ | 课题、洞察、阅读 | 持续积累 |
| **反思** | 学到了什么？ | 经验、模式、智慧 | 日/周/月/年 |
| **资源** | 凭什么支撑？ | 健康、人脉、工具 | 定期维护 |

核心原则：**方向优先于行动 · 微小一致地执行 · 知识需要转化 · 未经审视的经验只是经历 · 失去健康其他维度无从谈起**。

维度速查：

```
方向 → 我要去哪里？        行动 → 如何做到？         认知 → 如何理解？
├── VISION.md   愿景构建    ├── TASKS.md    GTD 待办   ├── PROJECTS.md 课题研究
├── DOMAINS.md  八领域模型  ├── HABITS.md   习惯养成   ├── INSIGHTS.md 洞察提取
├── GOALS.md    OKR 目标    └── CALENDAR.md 时间块     └── READING.md  高效阅读
└── MINDSET.md  核心心态

反思 → 学到了什么？         资源 → 凭什么支撑？
├── DAILY_REVIEW.md    每日复盘   ├── SUBSCRIPTIONS.md   订阅管理
└── PERIODIC_REVIEW.md 周期复盘   ├── NETWORK.md         人脉建设
                                  └── HEALTH_RECORDS.md  健康追踪
```

---

## 板块与产品文档

| 文档 | 路径 | 内容 |
|------|------|------|
| 架构设计 | [DESIGN.md](../DESIGN.md) | 五维数据模型、跨维度联动、Dashboard 设计、实施路线 |
| MeLog 总览 | [MELOG.md](./MELOG.md) | 四层架构、时间线/数据源/技能/标准、REST API、MCP 工具、LLM 运行器 |
| MeLog 标准 | [melog/STANDARD.md](./melog/STANDARD.md) | 统一事件信封、Ingest 规范、MCP 工具、Skill 清单格式 |
| 记录全景 | [RECORDING.md](./RECORDING.md) | 数据录入通道盘点：便捷度、缺口清单与实施记录 |
| 口述打卡 | [melog/CAPTURE.md](./melog/CAPTURE.md) | 手动文字录入：口述模板、解析规则、双写与幂等、验证记录 |
| 连接器 | [connectors README](../packages/connectors/README.md) | apple-health / chatlog / dida365 连接器安装与使用 |
| 滴答清单连接器 | [melog/CONNECTOR_DIDA365.md](./melog/CONNECTOR_DIDA365.md) | dida365 调研选型、2026-09 实测接口结构、设计映射、端到端测试报告、使用与运维 |
| 可穿戴调研 | [melog/WEARABLES_RESEARCH.md](./melog/WEARABLES_RESEARCH.md) | 可穿戴设备接入能力全景：国际 API 分层、国内厂商通道、iOS/Android 汇聚层方案、me-os 落地路线图 |
| 品牌板块 | [BRAND.md](./BRAND.md) | 定位→内容→分发→复盘闭环、数据模型、品牌蓝本摘要 |
| 品牌板块设计 | [superpowers/specs/](./superpowers/specs/) | 品牌控制台实现设计（数据模型/API/前端） |
| 工作台调研 | [WORKBENCH_RESEARCH.md](./WORKBENCH_RESEARCH.md) | Agent 时代个人工作台的形态结论 |

---

## 品牌与 IP 知识库

品牌板块的「弹药库」—— 从品牌战略到单期拍摄脚本的完整知识体系：

| 文档 | 内容 |
|------|------|
| [brand/DESIGN.md](./brand/DESIGN.md) | 品牌总蓝本：核心/定位/受众/人格/语调/内容战略/口号视觉/伦理/衡量 |
| [brand/ACCOUNT_LAUNCH.md](./brand/ACCOUNT_LAUNCH.md) | 起号与增长作战手册：平台选择/冷启动/数据指挥/增长引擎/90 天 SOP |
| [brand/OPERATIONS.md](./brand/OPERATIONS.md) | 自媒体运营手册：生产/拍摄/发布/数据/复盘/合规/工具栈 |
| [brand/COPY.md](./brand/COPY.md) | 文案资产库：平台简介/片尾口播/邀约话术/商单模板 |
| [brand/COMPETITOR_RESEARCH.md](./brand/COMPETITOR_RESEARCH.md) | 五类竞品拆解与空白生态位分析 |
| [brand/BUSINESS.md](./brand/BUSINESS.md) | 一人公司经营手册：商业模式/产品线/定价/财务法务/风险 |
| [ip/](./ip/README.md) | 个人 IP 建设全案（建设逻辑/哲学/方法/思路/实战/全球 minds 六层） |
| [self-media/](./self-media/README.md) | 自媒体实战知识库：实战总纲/分平台手册/运营方法论/选题预判 |
| [INTERVIEW_RESEARCH.md](./INTERVIEW_RESEARCH.md) → [INTERVIEW_PLAYBOOK.md](./INTERVIEW_PLAYBOOK.md) → [FIELD_LOG_001_SHOTLIST.md](./FIELD_LOG_001_SHOTLIST.md) | 访谈 IP：调研定位 → 执行手册 → 第一期拍摄脚本 |

---

## 工程档案

| 文档 | 内容 |
|------|------|
| [superpowers/plans/](./superpowers/plans/) | 板块实现计划 |
| [superpowers/specs/](./superpowers/specs/) | 板块实现设计文档 |
| [NAVIGATION_REFACTOR.md](./NAVIGATION_REFACTOR.md) / [PHASE2](./NAVIGATION_REFACTOR_PHASE2.md) | 导航重构方案 |
| [QUALITY_REPORT.md](./QUALITY_REPORT.md) | 项目质量评估（8/10） |
| [evaluation/](./evaluation/) | 阶段性代码库与项目评估报告 |

---

## 入门推荐路径

```
1. OVERVIEW.md ................ 理解五维框架（15 分钟）
2. GETTING_STARTED.md ......... 上手方法论（1 小时）
3. direction/VISION.md ........ 建立愿景
4. action/TASKS.md ............ 建立行动系统
5. reflection/DAILY_REVIEW.md . 建立复盘
6. INTEGRATION.md ............. 学习五维整合
7. MELOG.md / BRAND.md ........ 了解数据汇聚与品牌板块
```

---

*文档版本：2.0 | 最后更新：2026-09-12*

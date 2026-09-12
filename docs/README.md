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
│   ├── OPC.md ..................... OPC 板块：深圳一人公司运营知识库总览
│   ├── one-person-company/ ........ OPC 语料：政策福利/社区对比/申报指南/平台解析
│   ├── WORKBENCH_RESEARCH.md ...... 个人工作台调研（Agent 时代的工作台设计）
│   │
│   │ ── 品牌与 IP 知识库 ──
│   ├── brand/ ..................... 品牌资料：DESIGN 总蓝本 · ACCOUNT_LAUNCH 起号手册
│   │                               · OPERATIONS 运营 SOP · COPY 文案资产
│   │                               · COMPETITOR_RESEARCH 竞品调研 · BUSINESS 一人公司手册
│   ├── ip/ ........................ 个人 IP 建设全案（逻辑/哲学/方法/思路/实战/全球视角）
│   ├── personal-brand/ ............ 个人品牌知识库（心理学/定位/视觉/叙事/信任/危机/评估/案例）
│   ├── self-media/ ................ 自媒体实战（总纲/平台/方法论/选题 + 内容科学/算法/爆款/
│   │                               创作心理/观众心理/矩阵/直播/短视频/图文/音频/AI/商业化）
│   ├── one-person-company/ ........ 一人公司知识库（哲学/模式/产品化/定价/销售/客户/财务/法务/工具/规模化）
│   ├── super-individual/ .......... 超级个体知识库（认知/技能/杠杆/时间/能量/网络/系统/反脆弱/自由）
│   ├── INTERVIEW_RESEARCH.md ...... 访谈 IP 调研与定位
│   ├── INTERVIEW_PLAYBOOK.md ...... 访谈节目可执行手册（文案/动线/视觉）
│   ├── COMPETITOR_ANALYSIS.md ..... 访谈赛道竞品深挖
│   ├── EPISODE_000_OPENER.md ...... EP00《发刊词》：自我介绍 · 频道主题 · AI 时代新田野调查
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
| 口述打卡 | [melog/CAPTURE.md](./melog/CAPTURE.md) | 手动文字录入：口述模板、解析规则、双写与幂等、Web 卡片与 CLI（speak）双通道、验证记录 |
| 连接器 | [connectors README](../packages/connectors/README.md) | apple-health / chatlog / dida365 连接器安装与使用 |
| 滴答清单连接器 | [melog/CONNECTOR_DIDA365.md](./melog/CONNECTOR_DIDA365.md) | dida365 调研选型、2026-09 实测接口结构、设计映射、端到端测试报告、使用与运维 |
| 可穿戴调研 | [melog/WEARABLES_RESEARCH.md](./melog/WEARABLES_RESEARCH.md) | 可穿戴设备接入能力全景：国际 API 分层、国内厂商通道、iOS/Android 汇聚层方案、me-os 落地路线图 |
| 品牌板块 | [BRAND.md](./BRAND.md) | 定位→内容→分发→复盘闭环、数据模型、品牌蓝本摘要 |
| 品牌板块设计 | [superpowers/specs/](./superpowers/specs/) | 品牌控制台实现设计（数据模型/API/前端） |
| 工作台调研 | [WORKBENCH_RESEARCH.md](./WORKBENCH_RESEARCH.md) | Agent 时代个人工作台的形态结论 |
| OPC 板块 | [OPC.md](./OPC.md) | 深圳一人公司（OPC）运营知识库总览：政策福利、社区对比、券类补贴申报 |

---

## 一人公司（OPC）知识库

深圳本地 OPC 的政策、园区与补贴申报语料沉淀（服务于自己）：

| 文档 | 内容 |
|------|------|
| [one-person-company/01-深圳OPC政策福利.md](./one-person-company/01-深圳OPC政策福利.md) | 四大核心福利（办公空间/资金/AI 算力/人才安居）+ 一类事注册渠道 + 重点 OPC 社区清单 |
| [one-person-company/02-OPC社区对比与入驻流程.md](./one-person-company/02-OPC社区对比与入驻流程.md) | 模力营 vs 天使荟对比表、双社区入驻流程拆解、材料清单与避坑提醒 |
| [one-person-company/03-模力营官方条件与申报指南.md](./one-person-company/03-模力营官方条件与申报指南.md) | 模型券紧急申报、券类补贴 2026 指南、模力营官方条件、BP 框架、行动清单 |
| [one-person-company/04-户籍与注册地FAQ及社区选择.md](./one-person-company/04-户籍与注册地FAQ及社区选择.md) | 注册地与户口解耦 FAQ、福田主场社区对比、三个选择思路 |
| [one-person-company/05-Ai南山平台政策汇集解析.md](./one-person-company/05-Ai南山平台政策汇集解析.md) | inanshan.org.cn 政策汇集页解析（平台信息/南山政策专栏/政策库） |

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
| [personal-brand/](./personal-brand/README.md) | 个人品牌知识库：品牌心理学/定位深挖/视觉识别/叙事故事力/信任构建/危机管理/资产评估/全球案例（8 篇） |
| [self-media/](./self-media/README.md) | 自媒体实战知识库：实战总纲/分平台手册/运营方法论/选题预判 + 内容科学/算法逻辑/爆款公式/创作心理/观众心理/内容矩阵/直播/短视频/图文/音频播客/AI 创作/商业化（16 篇） |
| [one-person-company/](./one-person-company/README.md) | 一人公司知识库：哲学/商业模式/产品化/定价/销售转化/客户成功/财务税务/法务合规/工具自动化/规模化路径（10 篇） |
| [super-individual/](./super-individual/README.md) | 超级个体知识库：定义/认知升级/技能组合/杠杆构建/时间管理/能量管理/网络效应/个人系统/反脆弱/自由与责任（10 篇） |
| [INTERVIEW_RESEARCH.md](./INTERVIEW_RESEARCH.md) → [INTERVIEW_PLAYBOOK.md](./INTERVIEW_PLAYBOOK.md) → [EPISODE_000_OPENER.md](./EPISODE_000_OPENER.md) → [FIELD_LOG_001_SHOTLIST.md](./FIELD_LOG_001_SHOTLIST.md) | 访谈 IP：调研定位 → 执行手册 → 第 0 期《发刊词》 → 第一期正片拍摄脚本 |

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

# BRAND — 个人品牌板块

> 个人品牌是所有输出（文案、视频、出版物、App/小程序/Web App）的唯一终点。
> 本板块是 MeOS 第七板块「品牌」，承载 定位 → 创作 → 分发 → 复盘 的闭环，
> 板块的产品设计与数据模型见 [设计文档](./superpowers/specs/2026-09-11-brand-console-design.md)。
> 品牌总蓝本（定位/人设/语调等 BrandProfile 字段的取值来源）见 [brand/DESIGN.md](./brand/DESIGN.md)。

## 品牌蓝本摘要

| 维度 | 一句话 |
|---|---|
| 理论基础 | 极致工程：第一性原则 + Maxing everything（把身体、认知、AI Agent 都保养和调教到极致）+ 追求输出的影响力与质量 |
| 内容方法 | 田野调查：把各行各业真实的反馈做进内容（视频为主线） |
| 调性 | 接近真实、接地气（弃用：纪录片调调、冷静） |
| 品牌身份 | 我即品牌：我的所有输出都是我 · build in public |

一句话定位：**基于极致工程的田野调查者 —— 把各行各业最真实的反馈带进内容，所有输出即本人，全程 build in public。**

完整展开（黄金圈/定位/受众/人格/语调/内容战略/伦理/衡量）：[brand/DESIGN.md](./brand/DESIGN.md)

## 板块说明：定位 → 内容 → 分发 → 复盘

| 环节 | 能力 | 承载 |
|---|---|---|
| 定位 | 品牌资产中枢 | BrandProfile（mission / positioning / slogan / personaTags / toneOfVoice / targetAudience / visualNotes）+ BrandPillar 内容支柱 |
| 内容 | 内容流水线 | ContentItem：选题 → 创作 → 审校 → 发布，支持「一鱼多吃」 |
| 分发 | 渠道矩阵与数据 | PlatformChannel + ContentDistribution（每渠道一条记录）+ 手动指标快照 MetricSnapshot |
| 复盘 | 复盘与迭代 | reviewNote（什么有效 / 下次改进）+ 粉丝趋势 + 支柱覆盖统计 |

长期沉淀走**作品库**（Work）：出版物、App、小程序、Web App 等长期工程。

## 板块功能一览

| 功能 | 说明 |
|---|---|
| 总览 | slogan 头图、流水线漏斗、本周/本月发布数、渠道健康卡、粉丝趋势图、支柱覆盖 |
| 品牌资产 | 品牌档案编辑 + 内容支柱 CRUD |
| 内容流水线 | 按状态分组的看板、详情 Modal（编辑 + 分发矩阵 + 发布 + 复盘区） |
| 渠道与数据 | 渠道卡片网格、预置平台一键添加、快照录入、单渠道趋势 |
| 作品库 | 按状态分组的作品卡片 |

## 工程参考

- REST 前缀：`/api/brand`，完整路由与自动化行为见设计文档 §4 / §6。
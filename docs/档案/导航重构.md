# MeOS 导航重构计划

> 基于个人管理最佳实践（GTD、OKR、PARA、Second Brain）的全面导航整合方案。
> 创建时间：2026-05-13

---

## 一、重构目标

将当前 **16 个功能入口** 整合为 **10 个核心入口**，降低认知负担，理顺工作流。

---

## 二、当前 vs 目标对照

| 优先级 | 动作 | 当前状态 | 目标状态 |
|--------|------|----------|----------|
| P0 | 领域 + 平衡轮合并 | 2 个独立菜单 | 1 个入口，内部分 Tab |
| P0 | 反思合并为复盘中心 | 每日反思 + 周期复盘 | 1 个入口，日/周期 Tab |
| P1 | 新增「今日」页面 | 无 | 新增核心入口 |
| P1 | 健康数据迁入习惯追踪 | 健康在资源下 | 并入习惯追踪页 |
| P2 | 愿景页内增加心态区块 | 心态独立菜单 | 并入愿景页 |
| P2 | 订阅 + 开发环境合并 | 2 个独立菜单 | 1 个"资产管理"入口 |
| P3 | 新增项目看板层 | 无 | 补齐战略-执行链条 |
| P3 | 新增笔记与卡片层 | 无 | 补齐认知工作流 |

---

## 三、目标导航结构

```
仪表盘

▸ 今日 (Today)
    今日待办 /today/tasks
    今日习惯 /today/habits
    日程视图 /today/calendar

▸ 目标与项目 (Goals)
    愿景与价值观 /goals/vision
    年度 OKR /goals/okr
    项目看板 /goals/projects
    领域与平衡 /goals/domains

▸ 任务 (Tasks)
    收件箱 /tasks/inbox
    所有任务 /tasks/all
    习惯追踪 /tasks/habits

▸ 认知 (Cognition)
    笔记与卡片 /cognition/notes
    阅读清单 /cognition/reading
    课题研究 /cognition/topics
    洞察库 /cognition/insights

▸ 反思 (Reflection)
    复盘中心 /reflection/review
      ├─ 每日反思 (Tab)
      └─ 周期复盘 (Tab: 周/月/季/年)

▸ 资源 (Resources)
    人脉 /resources/contacts
    资产管理 /resources/assets
```

---

## 四、实施记录

### P0: 领域 + 平衡轮合并 ✅
- **改动点**：
  - `Layout.tsx`: 移除"平衡轮"子菜单，"领域"改为"领域与平衡"
  - `Domains.tsx`: 增加 Tab 切换"领域管理" / "平衡轮"，集成 `BalanceWheelView`
  - `App.tsx`: `/direction/balance-wheel` 路由重定向到 `/direction/domains`
  - 新增 `components/BalanceWheelView.tsx`: 提取平衡轮核心逻辑为可复用组件
- **完成时间**：2026-05-13

### P0: 反思合并为复盘中心 ✅
- **改动点**：
  - `Layout.tsx`: 移除"每日反思"，将"周期复盘"改为"复盘中心"
  - `Review.tsx`: 顶部增加 Tab 切换"每日反思" / "周期复盘"，集成 `Daily` 组件
  - `App.tsx`: `/reflection/daily` 路由重定向到 `/reflection/review?view=daily`
- **完成时间**：2026-05-13

### P1: 新增「今日」页面 ✅
- **改动点**：
  - 新增 `pages/Today.tsx`：展示今日待办（快速添加/完成）、今日习惯打卡、反思快捷入口
  - `Layout.tsx`: 在仪表盘下方新增"今日"导航入口
  - `App.tsx`: 新增 `/today` 路由
- **完成时间**：2026-05-13

### P1: 健康数据迁入习惯追踪 ✅
- **改动点**：
  - 新增 `components/HealthTrackerView.tsx`：提取健康追踪核心逻辑为复用组件
  - `Habits.tsx`: 增加 Tab 切换"习惯打卡" / "健康数据"
  - `Health.tsx`: 改为使用 `HealthTrackerView` 组件的包装页面
  - `Layout.tsx`: 资源维度移除"健康"独立入口
- **完成时间**：2026-05-13

### P2: 愿景页内增加心态区块 ✅
- **改动点**：
  - 新增 `components/MindsetView.tsx`：提取心态管理核心逻辑为复用组件
  - `Vision.tsx`: 页面标题改为"愿景与价值观"，增加 Tab 切换"人生愿景" / "心态格言"
  - `Layout.tsx`: 方向维度移除"心态"独立入口，"愿景"改为"愿景与价值观"
  - `App.tsx`: `/direction/mindset` 路由重定向到 `/direction/vision`
- **完成时间**：2026-05-13

### P2: 订阅 + 开发环境合并为资产管理 ✅
- **改动点**：
  - 新增 `pages/resources/Assets.tsx`：资产管理页面，Tab 切换"订阅管理" / "开发环境"
  - `Layout.tsx`: 资源维度"订阅"和"开发环境"合并为"资产管理"
  - `App.tsx`: `/resources/subscriptions` 和 `/resources/dev-environment` 重定向到 `/resources/assets`
- **完成时间**：2026-05-13

### P3: 新增项目看板层 ✅
- **改动点**：
  - `Goals.tsx`: 增加视图切换（列表 / 看板），看板按状态分四列展示目标卡片及关键结果进度
  - 页面标题改为"目标与项目"
- **完成时间**：2026-05-13

### P3: 新增笔记与卡片层 ✅
- **改动点**：
  - 新增 `pages/cognition/Notes.tsx`：卡片墙布局，基于 insights API，支持快速添加彩色笔记卡片
  - `Layout.tsx`: 认知维度新增"笔记"入口
  - `App.tsx`: 新增 `/cognition/notes` 路由
- **完成时间**：2026-05-13

---

## 五、设计原则

1. **按用户场景分组**，而非按数据类型
2. **减少平级入口**，通过 Tab/子视图解决
3. **体现工作流**，让导航本身有先后逻辑
4. **每步可独立交付**，不影响其他模块

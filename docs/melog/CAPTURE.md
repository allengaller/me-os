# MeLog 口述打卡 — 手动文字快速录入

> 2026-09-12 落地。解决潮汐、Keep 等无公开 API 的 App 的数据接入：打开 App
> 看一眼最近打卡，用手机键盘听写念出来，提交到 MeOS，规则解析成结构化健康条目。

## 背景

潮汐（冥想）与 Keep（运动）都没有面向个人用户的官方开放 API。此前调研过两条路线：

1. **Apple 健康中枢**：两个 App 都可写入苹果健康，iPhone 导出 zip 后走
   `packages/connectors` 的 `apple-health` 连接器（注意：该连接器目前**不解析
   正念分钟** `HKCategoryTypeIdentifierMindfulSession`，潮汐冥想数据走不到，需要时补约 20 行）；
2. **手动文字录入（本功能）**：口述 + 听写 + 规则解析，零配置、离线可用，当天可用。

Keep 若要距离/配速/GPX 深度数据，可参考 [running_page](https://github.com/yihong0618/running_page)
的非官方 API 实现，后续可在 `packages/connectors` 加 `keep` 连接器。

## 使用流程

1. 打开潮汐 / Keep，看最近的打卡数据
2. MeOS → MeLog → 时间线页顶部「口述打卡」卡片，键盘听写念出来
3. 点「解析预览」，核对识别出的条目（可取消勾选）
4. 点「提交 N 条」→ 写入 MeLog 时间线 + 资源 → 健康记录

## 口述模板

每条打卡按 **时间 + 来源 + 动作 + 数量** 的句式念，多条之间用逗号 / 句号分开。

| 要素 | 可以这么说 | 不说会怎样 |
| --- | --- | --- |
| 时间 | 今天 / 昨天 / 前天，可加 早上 / 上午 / 中午 / 下午 / 晚上（如「昨天晚上」） | 默认今天中午 12:00 |
| 来源 | 潮汐 / Keep | 照样录入，不标来源 |
| 动作 + 量 | 见下表 | 识别不了的段落自动存为原文笔记，不丢 |

| 打卡 | 句式示例 | 解析结果 |
| --- | --- | --- |
| 冥想 | 「潮汐冥想10分钟」「正念15分钟」 | type `meditation`，健康记录 type `custom` |
| 跑步 | 「Keep跑步5公里」「跑步3公里配速5分30秒」（配速可省略，也支持 `5'30"`） | type `exercise`，健康记录 type `exercise`，单位 km |
| 其他运动 | 「健身40分钟」「力量训练1小时」「拉伸20分钟」「瑜伽30分钟」（走路/散步/骑行/游泳/跳绳等同款） | type `exercise`，单位 minutes |
| 睡眠 | 「睡眠7小时」「昨晚睡了6个半小时」 | type `sleep`，单位 hours |
| 体重 | 「体重68.5公斤」 | type `weight`，单位 kg |
| 步数 | 「今天走了8000步」 | type `exercise`，单位 steps |
| 待办 | 「待办：明天交周报」 | 直接创建 Todo，来源 `capture` |
| 笔记 | 「笔记：读到一句很受用的话」 | 笔记条目，正文去掉前缀 |

**一整段示例**：

> 今天早上潮汐冥想15分钟，昨晚Keep跑步5公里配速5分30秒，昨天睡眠7小时，今天体重68.5公斤

## 解析规则（capture.ts）

- 按 `[，。；,;！？!?\n]` 拆段，逐段匹配，一段一条；
- **显式路由前缀（优先）**：`待办：xxx` 直接创建 Todo（source=`capture`，不写时间线）；`笔记：xxx` 创建笔记条目（正文去掉前缀）；
- 健康词表优先级：冥想 → 跑步（公里+配速）→ 睡眠 → 体重 → 步数 → 通用运动（动词+时长）；
- 时长支持 `X分钟` / `半小时` / `X小时`；
- 时段词映射：凌晨→5 点，早上/早晨→8，上午→10，中午→12，下午→15，晚上/夜里→20，「昨晚」= 昨天晚上；
- **降级**：整段什么都匹配不上 → 存为 `category: note` 的原文条目（标题取前 20 字）；
- **幂等**：`externalId = capture-<日期>-<类型>-<片段哈希8位>`，同一段话重复提交只更新不重复。

## API

REST 前缀 `/api/melog`，均为 POST、需登录：

| 端点 | 说明 |
| --- | --- |
| `/capture/parse` | 只解析返回预览，不落库。入参 `{ text }` |
| `/capture` | 解析 + 双写。入参 `{ text, exclude?: number[] }`（exclude 为预览中取消勾选的条目下标），全部排除时 400 |

```bash
curl -X POST http://localhost:3001/api/melog/capture/parse \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"text":"今天早上潮汐冥想15分钟"}'
```

## 双写与幂等

- **MeLog 时间线**：挂到「手动记录」（adapter `manual`）数据源，按
  `(sourceId, externalId)` upsert；payload 内含数值、来源、配速与原文片段；
- **健康记录**（资源板块，`HealthRecord`）：冥想→`custom`、运动→`exercise`、
  睡眠→`sleep`、体重→`weight`；note 内嵌 `melog:<externalId>` 标记，已存在则跳过，
  防止重复提交产生重复记录。

## 测试与验证

- 单测：`capture.test.ts` 11 个（各模式 / 时间词 / 多段 / 降级 / externalId 稳定性）；
  路由测试 4 个（parse 不落库 / 双写与幂等 / exclude / 全排除 400）。
- 浏览器端到端验证（2026-09-12，agent-browser 驱动真实注册与提交）：**PASS** ——
  黄金路径 4 条全部正确解析落库；重复提交 0 新增；乱语降级为笔记；全取消提交禁用。

### 验证时发现的边界

- ⚠️ 反思板块的「自动汇总」当时仍是「开发中」（`Review.tsx`），所以录入卡片文案只承诺
  「写入时间线与健康记录」；反思汇总接通后可恢复话术；
- dev 模式 API 使用 mock 用户（`MEOS_DEV_AUTH`），注册登录后数据实际写入 mock 用户，
  属既有行为。

## 后续可扩展

- `apple-health` 连接器补 `HKCategoryTypeIdentifierMindfulSession`（正念分钟）解析；
- Keep 非官方 API 连接器（距离 / 配速 / GPX，参考 running_page，仅本地使用）；
- 词表扩展：喝水、情绪等更多健康类型；中文数字（「二十分钟」）目前不支持；
- 可选 LLM 解析：MeLog 已有 LLM 运行器配置，识别不了的说法可走模型兜底。

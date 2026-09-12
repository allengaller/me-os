# 品牌数据接入调研（Where does the data come from）

- 日期：2026-09-12 ｜ 状态：调研结论已定，连接器逐个落地
- 用途：回答「品牌板块的指标类数据（粉丝数、播放/点赞等）从哪来」——手动录入之外，哪些能自动拉取、走什么路径
- 关联：板块设计 [../superpowers/specs/2026-09-11-brand-console-design.md](../superpowers/specs/2026-09-11-brand-console-design.md)（一期决策：指标手动周期录入，不接平台 API）｜ 连接器包 [../../../packages/connectors/](../../../packages/connectors/)

## 0. 结论速览

**没有单一最佳实践，业界按平台分层组合**：官方 API 能用的走官方 API；封闭平台靠登录态读后台（多账号工具）或浏览器插件；看别人账号的数据靠大规模爬取 + 估算。「全手动」在 0→1 阶段是常态，自动化按平台逐个落地，与现有手动周期录入完全兼容（拉到的数据照旧写 MetricSnapshot）。

## 1. 业界四种模式

| 模式 | 代表 | 数据对象 | 优点 | 代价/风险 |
|---|---|---|---|---|
| ① 官方开放 API（OAuth 授权自己的账号） | Buffer / Metricool / Hootsuite（国际全线）；微信 datacube、抖音开放平台（国内部分） | 自己账号的精确数据 | 稳定、合规、精确 | 需申请应用/审核；各平台各写一套；部分收费（X） |
| ② 登录态/Cookie 模拟读创作者后台 | 蚁小二、易媒助手、融媒宝 | 自己账号（含封闭平台） | 覆盖无 API 的平台 | 服务端模拟登录，风控/封号风险，平台改版需跟修 |
| ③ 浏览器插件读已登录后台 | 壹伴、新榜插件、万媒易发 | 自己账号（含封闭平台） | 本机自己的登录态，不存密码，风控风险低 | 需要用户开着浏览器；仍受改版影响 |
| ④ 大规模爬取 + 建模估算 | 新榜、蝉妈妈、飞瓜 | **别人**的账号（估算值） | 竞对分析、行业大盘 | 估算口径非精确值；基础设施重；仅公开内容 |

对个人 local-first 工作台：**① 官方 API > ③ 插件读自己后台 > 手动兜底**；模式④只用于竞对调研（见 COMPETITOR_RESEARCH.md），不用于自己账号的精确复盘。

## 2. 平台逐个映射（2026-09 现状）

| 平台 | 路径 | 字段覆盖 | 状态 |
|---|---|---|---|
| B站 | 社区公开接口（[bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)）：`relation/stat` 粉丝数、Wbi 签名 `arc/search` 投稿列表、`view` 单视频数据 | followers、views/likes/comments/shares（按视频汇总做差） | ✅ **已落地连接器**（见 §3）；非官方接口，有 Wbi 签名等风控，需持续维护 |
| YouTube | 官方 [YouTube Data API v3](https://developers.google.com/youtube/v3)（免费额度）：`channels.list` 订阅数、`videos.list` 单视频统计 | followers、views/likes/comments | ⏳ 待做（需申请 API key） |
| 公众号 | 官方「数据统计接口」（datacube）：用户增减、图文群发数据，access_token 认证 | followers、views（图文阅读）、shares（分享） | ⏳ 待做；权限与公众号认证状态相关 |
| 抖音 | [抖音开放平台](https://developer.open-douyin.com/)「视频数据 / 视频互动数据」接口（OAuth 自己的账号） | 单视频播放/互动数据 | ⏳ 需申请应用过审，成本中等 |
| 小红书 | 无个人数据开放 API（[开放平台](https://ad-market.xiaohongshu.com/docs-center)为广告/电商侧）；公开页反爬强 | — | ❌ 保持手动；远期可走模式③插件 |
| 视频号 | 完全封闭，无 API | — | ❌ 保持手动 |
| X | [官方 API](https://docs.x.com/x-api/getting-started/about-x-api)：2026 年免费层基本只剩发帖，读数据要付费层（约 $200/月） | followers、帖文互动 | ❌ 手动更划算 |
| GitHub（作品库） | 官方公开 API：stars/forks/issues | Works 维度的社会证明 | ⏳ 可顺手做 |

## 3. MeOS 的落地设计

### 快照语义不变
无论来源是手动还是连接器，写入的都是 `POST /api/brand/snapshots`：`followers` 为**当前累计值**；`views/likes/comments/shares` 为**本周期增量**（与上次快照做差）。连接器自己维护上次累计值游标（`~/.melog/connectors/`，复用连接器包的 state 机制），首次运行只记基线。

### 连接器清单
| 连接器 | 命令 | 鉴权 | 状态 |
|---|---|---|---|
| B站 | `melog-connector brand-bilibili --mid <mid>` | 无需鉴权（公开数据；可选 Cookie 降低风控概率） | ✅ |
| YouTube | `brand-youtube --channel-id <id>` | YouTube Data API key | ⏳ |
| GitHub | `brand-github --repo <owner/name>` | 无需（公开仓库） | ⏳ |

用法示例：

```bash
pnpm --filter @meos/melog-connectors dev brand-bilibili --mid 123456 --dry-run   # 只看拉到的数据
pnpm --filter @meos/melog-connectors dev brand-bilibili --mid 123456             # 写入快照
```

渠道匹配规则：优先 `--channel-id` 指定；否则找该用户唯一的 `platform=bilibili` 渠道；不存在时自动创建。

### 远期：封闭平台走 Chrome 扩展
`apps/chrome-extension` 已有 MV3 底子。远期可加「创作者后台数据助手」：用户打开公众号/视频号/小红书创作者后台时，扩展在页面上下文里读取数据并回传本机 MeOS——即模式③，不碰密码、不在服务端模拟登录。

## 4. 参考链接

- [微信数据统计接口介绍（官方）](https://developers.weixin.qq.com/doc/subscription/guide/product/analysis_data/analysis_data.html)
- [抖音开放平台：视频数据](https://developer.open-douyin.com/capacity-center-page/capacity-detail/7180522194714230845)
- [X API 官方文档](https://docs.x.com/x-api/getting-started/about-x-api) ｜ [X API 2026 价格](https://postproxy.dev/blog/x-api-pricing-2026/)
- [多账号管理工具代码逻辑分析（腾讯云开发者社区）](https://developer.cloud.tencent.com/article/2692815)
- [蝉妈妈数据真实吗：准确性与局限](https://www.jiushuyun.com/blog/ds/35697.html)
- [B站 Wbi 签名风控分析](https://zhuanlan.zhihu.com/p/1961014749807513938)
- [Spider_XHS（小红书爬虫，仅作了解）](https://github.com/cv-cat/Spider_XHS)

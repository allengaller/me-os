# 可穿戴设备与健康数据接入调研（2026-09）

> 调研目的：为 me-os 的 MeLog 时间线寻找身体佩戴设备（手表 / 手环 / 戒指 / 体脂秤 / CGM）的**程序化数据接入路径**，
> 重点数据：睡眠、心率、HRV、血氧、步数、运动记录、压力 / 身体电量、体重、血糖。
> 调研方法：三线并行——① 国际厂商官方 API；② 国内市场与厂商通道；③ 手机端健康汇聚层（实测过的现有连接器见
> [CONNECTOR_DIDA365.md](./CONNECTOR_DIDA365.md)、apple-health 连接器）。

---

## 1. 结论速览

| 层级 | 含义 | 设备 / 平台 |
| --- | --- | --- |
| **A｜个人自助直连** | 免费注册开发者、OAuth2 即可读 | Oura 戒指、Whoop、Polar、Withings、Dexcom（受限层） |
| **B｜需合作 / 已收紧** | 企业审核制，或政策正在关门 | Garmin（2026 春暂停新申请）、Fitbit（Web API 2026-09 关闭）、Suunto、COROS、Ultrahuman、Samsung（经 Health Connect） |
| **C｜无 API** | 只能导出文件 / BLE 逆向 / 社区工具 | 华为、小米、Zepp、Keep、荣耀、vivo/OPPO、RingConn、Eight Sleep（Colmi 例外：BLE 逆向成熟） |
| **汇聚层** | 设备数据先进手机健康 App，再中转出自建服务器 | Apple HealthKit、Android Health Connect、Strava、Nightscout |

**一句话趋势（2025-2026）**：官方 API 全面收紧（Garmin 暂停开发者计划、Fitbit Web API 关闭迁往 Google Health API、
Strava 开发者 API 收费、Oura 个人 token 弃用）。对本地优先的个人系统，**「设备 → 手机健康 App → 自建 webhook」的汇聚层路线最抗政策变化**。

## 2. 国际厂商官方 API 现状

### A 级：个人自助直连（OAuth2）

| 平台 | 数据 | 入口 | 认证 / 门槛 |
| --- | --- | --- | --- |
| **Oura Ring** | 睡眠、准备度（readiness）、活动、心率、HRV、血氧 | [cloud.ouraring.com/v2/docs](https://cloud.ouraring.com/v2/docs) | OAuth2；开发者门户免费注册，无审核。注意：个人 access token 已弃用（deprecated），仅剩 OAuth2 |
| **Whoop** | 恢复（静息心率/HRV）、劳损（strain）、睡眠、周期、运动 | [developer.whoop.com](https://developer.whoop.com) | OAuth2（Client ID/Secret）；Dashboard 自助注册，免费无审核 |
| **Polar** | 夜间恢复、连续心率、HRV、训练记录、活动 | [AccessLink](https://www.polar.com/accesslink-api/)（[admin.polaraccesslink.com](https://admin.polaraccesslink.com)） | OAuth2；开放注册，免费，长期未收紧 |
| **Withings** | 体重/体脂/身体组成、血压、心率、睡眠、活动 | [developer.withings.com](https://developer.withings.com/api-reference/) | OAuth2；免费自助创建应用（医疗云数据除外，需额外申请） |
| **Dexcom** | CGM 血糖（EGV）、事件 | [developer.dexcom.com](https://developer.dexcom.com/) | OAuth2；沙箱即时开通；生产「Limited Access」层最多 5 个授权用户、免费，完整商业需数据授权协议 |

### B 级：需合作 / 已收紧

| 平台 | 现状 | 个人可行路径 |
| --- | --- | --- |
| **Garmin** | Garmin Health API / Connect Developer Program 仅企业审核制；**2026 春季起暂停接收新申请**，恢复时间未定 | 官方 CSV/FIT 手动导出；国际版社区 python-garminconnect 活跃；**国区 connect.garmin.cn 与全球账号/API 隔离**，另有 CN 独立申请通道与社区 MCP 工具（garmin-mcp-cn） |
| **Fitbit** | Fitbit Web API **2026-09 正式关闭**，迁移至 Google Health API；OAuth2 令牌不继承需重新授权；个人应用 2019 年起已停止审批 | Fitbit 数据双向同步至 Android Health Connect，本机经 Health Connect 读取 |
| **Suunto** | API Zone（Azure APIM）Partner Program 审批制 | 无自助通道 |
| **COROS** | 官方 API 需提交申请（审核制、面向企业/聚合商） | 官方支持**批量导出历史数据（FIT）**；或经 Strava 官方双向同步中转 |
| **Samsung** | Samsung Health Data SDK 为 Partner 申请制（原 Android SDK 已弃用） | **首选 Health Connect 本机路由**（任何 Android 开发者可读步数/心率/睡眠/血氧；HRV/压力等字段视厂商写入） |
| **Ultrahuman** | Partnership API（2025-09）+ UltraSignal 开发者平台，需申请/合作审批 | 无自助通道 |
| **Eight Sleep** | 无官方公开 API | 社区经登录 member 门户取 token 调内部 GraphQL（非官方、可能随时失效，Home Assistant 集成即此路径） |

### C 级：无官方 API（社区 / 逆向路线）

| 平台 | 现状 |
| --- | --- |
| **Colmi 智能戒指** | **BLE 协议被社区完整逆向**（`tahnok/colmi_r02_client`，Python，660+ stars，2026 仍活跃），本地服务器可直接 BLE 采集，无需云端 |
| **RingConn** | 无公开 API、无导出，仅同步 Apple Health / Health Connect |
| 体脂秤厂商（乐心 / iHealth / 云麦） | 无个人 API；iHealth 国际版有企业云 API；社区以 BLE 逆向（Home Assistant 集成）为主 |

## 3. 国内市场与厂商通道

| 厂商 | 官方通道 | 导出 / 社区 | 对个人服务器的建议 |
| --- | --- | --- | --- |
| **华为运动健康** | Health Kit（[developer.huawei.com](https://developer.huawei.com/consumer/cn/hms/huaweihealth/)）面向企业；睡眠/HRV/血氧等敏感数据需单独申请高权限，个人走通难 | App 无全量导出，仅部分数据（如血压）可导出；社区无活跃的后端解析项目 | 优先经 **iOS Apple Health 桥接**（App 支持同步部分数据至 iOS 健康）或 Keep/咕咚中转；直连 Health Kit 门槛最高 |
| **小米运动健康** | 无个人 API（dev.mi.com 仅 IoT/App 能力） | 官方导出：小米账号隐私中心 → 管理数据 → MI Fitness → 下载（非全量、频率受限）；社区 `mi_fitness_data_bridge`（2026-09 仍更新，本地导出 SQLite/JSON/CSV + **MCP 查询接口**，云端适配器可能失效）；`mi-fitness` 亲友数据 SDK 镜像可查心率/睡眠/步数 | 官方导出文件解析最稳（运行记录为 TCX）；日常健康明细走社区桥接或亲友 SDK |
| **Zepp / Amazfit** | Zepp OS 开发者平台仅面向手表端应用/表盘，云侧健康数据 API 不对个人开放 | 原小米运动已更名 Zepp Life 由华米独立运营；米动健康 App 停更 | 老设备数据仍在 Zepp 云；可迁数据到小米运动健康再利用小米通道；否则导出运行记录（TCX/FIT） |
| **荣耀运动健康** | developer.honor.com 运动健康服务面向企业合作方 | App 无全量导出；社区项目基本借华为系工具 | 暂不推荐直连；设备可绑华为/其他平台则绕行 |
| **Keep** | 开放平台 2021 年提出但只做内容生态，无运动数据开放 API | 官方支持华为运动健康同步数据**入** Keep；数据**出**原社区靠网页私有接口抓取 | **2026-09 实测结论：已不可行**。旧社区接口（v1/v1.2/keepapi）全部 404；新 Web 端（运动档案 KTS，`query/submit`)全链路加密（`enif` 加密查询参数 + `dataInfo` 加密响应）+ WAF 风控（x-waf-uuid/403）；社区头部项目 running_page 已移除 Keep 数据源 |
| **vivo / OPPO 欢太健康** | 均无个人健康数据 API（OPPO 仅 HeyThings IoT 企业平台；vivo BlueOS 健康接口仅手表应用内） | App 无导出，社区项目稀缺 | 跳过，除非设备强制绑定 |
| **Garmin 佳明中国** | [Garmin Connect 开发者计划申请表（中国大陆服务器）](https://www.garmin.cn/zh-CN/forms/GarminConnectDeveloperAccess-China/) | 网页端单条导出 GPX/TCX；社区有 garmin-mcp-cn（MCP 服务器，2026-03 更新）、国区→国际区同步工具 | 最稳是网页导出 + 社区 MCP/同步工具；能申请到 CN 开发者计划则走官方接口 |
| **COROS 高驰（国内）** | 无公开 REST API；官方合作与 Strava/TrainingPeaks 双向同步 | App 单条导出 + PC 端 Training Hub 另存活动 | 已用 Strava 则经 Strava API 顺带拿到数据；否则逐条导出解析 |

## 4. 手机端健康汇聚层（对自建系统最实用的通道）

评级格式：自动性 / 实时性 / 维护成本。

### iOS / Apple Watch（Apple HealthKit）

| 方案 | 说明 | 评级 |
| --- | --- | --- |
| **HealthSave** | iOS 本地读 HealthKit，向自建服务器 **POST /api/apple/batch**，每 1-5 分钟同步；后端 Apache-2.0 可自托管，单次上限 10 万行；免费层 + $24.99 买断 Pro。为自建者设计（Grafana/Home Assistant 案例） | 自动 / 近实时 / 低（**首选**） |
| **Health Auto Export** | 2026-08 官方帮助中心新增 REST API 自动化：HTTP POST + 自定义 header 鉴权，支持指标、训练、ECG，interactive/regular/background/realtime 四档导出；REST API 需付费版 | 自动 / 分钟-小时级 / 低 |
| iOS 快捷指令 | 可读取健康样本，但健康数据变化**不能作为自动化触发器**，时间类自动化需运行前询问、要求解锁手机 | 半自动 / 每次运行 / 中 |
| 官方全量导出 zip | 仅手动、仅全量无增量；存在导出冷却（无官方文档，社区实测受限） | 手动 / 手动 / 低（应急用；已有 apple-health 连接器解析） |

### Android（Health Connect）

| 方案 | 说明 | 评级 |
| --- | --- | --- |
| **汇入生态** | 官方适配：Samsung Health、Google Fit（迁移中）、Fitbit（迁向 Google Health API）、Oura 等；Garmin 2025-06 宣布加入并渐进推送。**小米/华为/荣耀国行 ROM 无 GMS → Health Connect 基本不可用**，只能走品牌 App + 账号授权互通（华为官方支持文档证实此路径）；海外版小米可用 | — |
| **HC Webhook** | [hcwebhook.com](https://hcwebhook.com/android) 开源 AGPL：支持 24-31 种指标，定时区间轮询 + 手动/按需触发，POST JSON/Protobuf 到自定义 URL（仅需 Android 8+ 与 HC 组件） | 自动 / 分钟-小时级 / 低 |
| Tasker 插件 | [TaskerHealthConnect](https://github.com/RafhaanShah/TaskerHealthConnect) 拉取步数/心率等再 HTTP POST | 自动 / 分钟级 / 中 |
| 官方导出 | 仅手动 zip 导出与云备份，无自动 API | — |

### 运动平台 / 血糖 / 标准

| 方案 | 说明 |
| --- | --- |
| **Strava** | 2026-06 起开发者 API 需付费（约 $11.99/月）；OAuth 读本人训练记录仍成熟，成本上升 |
| **Nightscout（血糖 DIY）** | 生态活跃：Dexcom（含 G7）与 Libre（LibreLinkUp 桥）可经上传器自动推送至自建/托管实例（~5 分钟级）；Libre 官方仅医疗与既有合作伙伴，个人靠社区 |
| **FHIR / Open mHealth** | FHIR R4 面向机构互操作，对个人自建属过重；Open mHealth 生态近乎停滞。**均不建议作为自建管道的硬依赖**，现有 REST/JSON 即可 |

## 5. 政策变动清单（2025-2026）

| 事件 | 影响 |
| --- | --- |
| Garmin Connect 开发者计划暂停接收新申请（2026 春） | 个人基本告别官方 API |
| Fitbit Web API 关闭（2026-09） | 存量 Fitbit 集成需迁 Google Health API + Health Connect |
| Strava 开发者 API 收费（2026-06） | 个人自读成本上升（约 $11.99/月） |
| Oura 个人 access token 弃用 | 本地连接器需改 OAuth2 流程 |
| Samsung Health SDK for Android 弃用（2025-10） | Samsung 数据出口统一到 Health Connect |
| COROS 新增历史数据批量导出（2025） | 个人数据可迁移性改善 |

## 6. 给 me-os 的落地路线图

按性价比排序：

1. **新增「健康 webhook 接收端点」**（一次投入、覆盖最广）：HealthSave / Health Auto Export / HC Webhook 均可 POST 到 me-os 新 REST 端点 → 转 `POST /api/melog/ingest`。Apple Watch、华为/小米手环（同步进 iOS 健康后）、Oura/Whoop 都能经此汇入。技术形态上与现有 MCP/Ingest 体系一致
2. **Apple Health 导出解析器已存在**（apple-health 连接器）：配合 Health Auto Export 的 REST 自动化可转全自动
3. **小米手环/手表用户**：做 `mi_fitness_data_bridge` 桥接（社区已维护本地导出与 MCP 查询接口）
4. **OAuth2 直连连接器**（Oura / Polar / Withings / Whoop）：模式现成（类似 dida365 连接器），按需逐个补齐

## 7. 来源

- [Oura Cloud API 文档](https://cloud.ouraring.com/v2/docs) / [Oura 认证文档](https://cloud.ouraring.com/docs/authentication)
- [WHOOP for Developers](https://developer.whoop.com/docs/developing/getting-started/)
- [Fitbit Web API 关闭公告（Google 官方）](https://support.google.com/googlehealth/thread/437070658/introducing-the-next-phase-of-the-fitbit-web-api?hl=en) / [迁移指南](https://openwearables.io/blog/fitbit-web-api-shutdown-2026-migration-guide)
- [Garmin 开发者计划 FAQ](https://developer.garmin.com/gc-developer-program/program-faq/) / [Garmin CN 申请通道](https://www.garmin.cn/zh-CN/forms/GarminConnectDeveloperAccess-China/)
- [Polar AccessLink](https://www.polar.com/accesslink-api/) / [Polar API v4](https://www.polar.com/polar-api-v4)
- [Withings 创建开发者账号](https://developer.withings.com/developer-guide/v3/integration-guide/public-health-data-api/developer-account/create-your-accesses-no-medical-cloud/)
- [Suunto API Zone](https://apizone.suunto.com/)
- [COROS API 申请](https://support.coros.com/hc/en-us/articles/17085887816340-Submit-an-API-Application) / [COROS 批量导出](https://support.coros.com/hc/en-us/articles/33125636125204-Bulk-Export-Historical-Activity-Data)
- [Samsung: 经 Health Connect 读取](https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect)
- [Ultrahuman Partnership API](https://www.ultrahuman.com/blog/accessing-the-ultrahuman-partnership-api/)
- [Dexcom 开发者门户](https://developer.dexcom.com/)
- [HealthSave 自托管指南](https://healthsave.app/for/self-hosters/) / [Health Auto Export REST API](https://help.healthyapps.dev/en/health-auto-export/automations/rest-api)
- [HC Webhook](https://hcwebhook.com/android) / [github: health-connect-webhook](https://github.com/mcnaveen/health-connect-webhook)
- [Colmi 逆向客户端](https://github.com/tahnok/colmi_r02_client)
- [小米社区桥接 mi_fitness_data_bridge](https://github.com/shkyyy18/mi_fitness_data_bridge)
- [Strava 2026 变更分析](https://appsforstrava.com/blog/strava-developer-program-changes-2026)
- [华为健康共享支持页](https://consumer.huawei.com/cn/support/content/zh-cn01057382/)
# @meos/melog-connectors — MeLog 官方连接器

把外部数据源按 [MeLog Standard](../../docs/melog/STANDARD.md) 推送到 MeOS 的统一时间线。
零运行时依赖（Node.js 18+ 的全局 fetch），CLI 入口为 `melog-connector`。

## 连接器

| 命令 | 数据源 | 说明 |
| --- | --- | --- |
| `apple-health` | 健康 | 解析 Apple Health 导出（export.xml / export.zip），按天聚合睡眠、步数、心率、体重、体能训练 |
| `chatlog` | IM（社区适配器） | 调用 chatlog 兼容服务的 HTTP API，把消息按信封转换后推送 |

> ⚠️ **chatlog 合规提示**：上游项目 sjzar/chatlog 已于 2025-10 被作者因合规风险移除。
> 本适配器只调用「用户本地已部署的兼容服务」（默认 `http://127.0.0.1:5030`），
> 不包含任何数据解密能力。使用前请自行确认本地数据来源合法，并仅处理属于自己的聊天记录。

## 使用

```bash
# 从 MeOS 仓库根目录
pnpm --filter @meos/melog-connectors build
node packages/connectors/dist/cli.js --help

# Apple 健康（从 iPhone「导出所有健康数据」得到的 zip）
node packages/connectors/dist/cli.js apple-health \
  --export ~/Downloads/export.zip --days 30

# chatlog 兼容服务
node packages/connectors/dist/cli.js chatlog \
  --chatlog-url http://127.0.0.1:5030 --days 3

# 指定 MeOS 地址与 Token（开发模式可省略 Token）
node packages/connectors/dist/cli.js chatlog \
  --meos-url http://localhost:3001 --token <token>
```

状态（最近一次运行摘要）保存在 `~/.melog/connectors/cli-<命令>.json`。

## 编程接口

```ts
import { MeLogIngestClient, aggregateDaily, parseAppleHealthExport } from '@meos/melog-connectors';

const client = new MeLogIngestClient({ apiUrl: 'http://localhost:3001', token: '…' });
const records = await parseAppleHealthExport(createReadStream('export.xml'));
await client.ingest('apple-health', 'Apple 健康', 'health', aggregateDaily(records, { days: 30 }));
```

## 设计约定

- **幂等**：所有条目带稳定 `externalId`（如 `ah-sleep-2026-09-03`、`chatlog-1001`），重复推送只更新。
- **天级聚合**：健康指标按天聚合为一条（细节保留在 `payload` 中，如 `sleepStages`）。
- **本地优先**：连接器在用户设备上运行，只与本地 chatlog 服务和本地 MeOS 通信。

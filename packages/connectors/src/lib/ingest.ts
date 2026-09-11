/**
 * MeLog Ingest 客户端：连接器侧的统一推送出口。
 *
 * 零运行时依赖（Node 18+ 全局 fetch），按 MeLog Standard
 * 批量幂等写入 POST /api/melog/ingest。
 */

export type MeLogEntryCategory = 'health' | 'note' | 'im' | 'media' | 'location' | 'custom';

export interface IngestEntryInput {
  externalId?: string;
  category: MeLogEntryCategory;
  type: string;
  title: string;
  content?: string;
  payload?: string;
  tags?: string;
  actor?: string;
  occurredAt: string | Date;
}

export interface IngestSummary {
  created: number;
  updated: number;
  skipped: number;
}

export interface MeLogIngestClientOptions {
  /** MeOS API 根地址，如 http://localhost:3001 */
  apiUrl: string;
  /** Bearer Token；开发模式下 MeOS 可豁免鉴权 */
  token?: string;
  batchSize?: number;
  fetchImpl?: typeof fetch;
}

export class MeLogIngestClient {
  private readonly base: string;
  private readonly token?: string;
  private readonly batchSize: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MeLogIngestClientOptions) {
    if (!/^https?:\/\//.test(options.apiUrl)) {
      throw new Error('apiUrl 仅支持 http/https 地址');
    }
    this.base = options.apiUrl.replace(/\/+$/, '');
    this.token = options.token;
    this.batchSize = options.batchSize ?? 200;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async ingest(
    adapter: string,
    name: string,
    category: MeLogEntryCategory,
    entries: IngestEntryInput[],
    endpoint?: string,
  ): Promise<IngestSummary> {
    const summary: IngestSummary = { created: 0, updated: 0, skipped: 0 };
    for (let i = 0; i < entries.length; i += this.batchSize) {
      const batch = entries.slice(i, i + this.batchSize).map(normalizeEntry);
      const result = await this.post(adapter, name, category, batch, endpoint);
      summary.created += result.created;
      summary.updated += result.updated;
      summary.skipped += result.skipped;
    }
    return summary;
  }

  private async post(
    adapter: string,
    name: string,
    category: MeLogEntryCategory,
    entries: IngestEntryInput[],
    endpoint?: string,
  ): Promise<IngestSummary> {
    const response = await this.fetchImpl(`${this.base}/api/melog/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({
        source: { adapter, name, category, ...(endpoint ? { endpoint } : {}) },
        entries,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`MeLog ingest 失败（HTTP ${response.status}）：${text.slice(0, 300)}`);
    }
    return (await response.json()) as IngestSummary;
  }
}

function normalizeEntry(entry: IngestEntryInput): IngestEntryInput {
  return {
    ...entry,
    occurredAt: entry.occurredAt instanceof Date ? entry.occurredAt.toISOString() : entry.occurredAt,
  };
}

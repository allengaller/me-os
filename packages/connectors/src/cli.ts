#!/usr/bin/env node
import { createReadStream, stat } from 'node:fs';
import { spawn } from 'node:child_process';
import { MeLogIngestClient, type MeLogEntryCategory } from './lib/ingest.js';
import { loadState, resolveStateDir, saveState } from './lib/state.js';
import { aggregateDaily, parseAppleHealthExport } from './connectors/apple-health.js';
import { runChatlogConnector } from './connectors/chatlog.js';

/**
 * melog-connector — MeLog 官方连接器 CLI。
 *
 * 用法：
 *   melog-connector chatlog       [--chatlog-url http://127.0.0.1:5030] [--talkers wxid_a,wxid_b]
 *                                 [--days 3] [--source-name 微信聊天记录]
 *   melog-connector apple-health  --export ~/Downloads/export.zip [--days 30] [--source-name Apple 健康]
 *
 * 通用选项：
 *   --meos-url http://localhost:3001   MeOS API 地址
 *   --token <token>                    Bearer Token（也可用环境变量 MEOS_API_TOKEN）
 *   --state-dir <dir>                  状态目录（默认 ~/.melog/connectors）
 */

interface Args {
  command: string;
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): Args {
  const [command = '', ...rest] = argv;
  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : 'true';
      flags[key] = value;
    }
  }
  return { command, flags };
}

function statFile(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    stat(path, (error, stats) => resolve(!error && stats.isFile()));
  });
}

async function resolveExportEntry(exportPath: string): Promise<string | null> {
  const lister = spawn('unzip', ['-Z1', '--', exportPath], { stdio: ['ignore', 'pipe', 'inherit'] });
  let listing = '';
  lister.stdout.on('data', (chunk: Buffer) => (listing += chunk.toString()));
  const code = await new Promise<number | null>((resolve) => lister.on('close', resolve));
  if (code !== 0) return null;
  return (
    listing
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.toLowerCase().endsWith('export.xml')) || null
  );
}

async function openExportStream(exportPath: string): Promise<NodeJS.ReadableStream> {
  if (!exportPath.toLowerCase().endsWith('.zip')) {
    return createReadStream(exportPath, { encoding: 'utf8' });
  }
  // Apple 健康导出 zip 里的 export.xml 位于语言相关的目录（如 “Apple Health Data/”）
  const entry = await resolveExportEntry(exportPath);
  if (!entry) {
    throw new Error('无法读取 zip 或其中没有 export.xml；可手动解压后用 --export 指向 export.xml');
  }
  const extractor = spawn('unzip', ['-p', '--', exportPath, entry], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return extractor.stdout;
}

async function main(): Promise<number> {
  const { command, flags } = parseArgs(process.argv.slice(2));

  if (!command || command === '--help' || command === 'help') {
    console.log(
      [
        'melog-connector — MeLog 官方连接器',
        '',
        '命令：',
        '  chatlog        同步 chatlog 兼容服务的聊天记录（⚠️ 使用前自行确认数据来源合法）',
        '  apple-health   解析 Apple Health 导出（export.xml / export.zip）',
        '',
        '通用选项：',
        '  --meos-url <url>      MeOS API 地址（默认 http://localhost:3001）',
        '  --token <token>       Bearer Token（默认环境变量 MEOS_API_TOKEN）',
        '  --source-name <name>  数据源显示名',
        '  --days <n>            回溯天数',
        'chatlog 选项：  --chatlog-url <url>  --talkers <id,id>',
        'health 选项：   --export <path>（export.xml 或 export.zip）',
      ].join('\n'),
    );
    return 0;
  }

  if (!['chatlog', 'apple-health'].includes(command)) {
    console.error(`未知命令：${command}（可用：chatlog / apple-health）`);
    return 1;
  }

  const client = new MeLogIngestClient({
    apiUrl: flags['meos-url'] || 'http://localhost:3001',
    token: flags.token || process.env.MEOS_API_TOKEN,
  });
  const stateDir = resolveStateDir(flags['state-dir']);
  const stateName = `cli-${command}`;

  if (command === 'apple-health') {
    const exportPath = flags.export;
    if (!exportPath || exportPath.startsWith('-')) {
      console.error('缺少 --export <export.xml|export.zip>（路径不能以 - 开头）');
      return 1;
    }
    if (!(await statFile(exportPath))) {
      console.error(`文件不存在：${exportPath}`);
      return 1;
    }

    console.log(`📦 解析 ${exportPath} …`);
    const records = await parseAppleHealthExport(await openExportStream(exportPath));
    const entries = aggregateDaily(records, { days: Number(flags.days || 30) });
    if (entries.length === 0) {
      console.log('窗口期内没有可导入的记录');
      return 0;
    }
    const result = await client.ingest(
      'apple-health',
      flags['source-name'] || 'Apple 健康',
      'health' as MeLogEntryCategory,
      entries,
    );
    await saveState(stateDir, stateName, { lastRunAt: new Date().toISOString(), ...result });
    console.log(`✅ Apple 健康：新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}`);
    return 0;
  }

  // chatlog
  console.log('⚠️  chatlog 项目已因合规原因被上游移除；请自行确认本地数据来源合法，仅处理属于自己的记录。');
  const talkers = flags.talkers
    ? flags.talkers
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;
  const state = await loadState<{ lastRunAt?: string }>(stateDir, stateName, {});
  if (state.lastRunAt && !flags.days) {
    console.log(`上次同步：${state.lastRunAt}`);
  }
  const result = await runChatlogConnector({
    chatlogUrl: flags['chatlog-url'] || 'http://127.0.0.1:5030',
    client,
    sourceName: flags['source-name'],
    talkers,
    backfillDays: Number(flags.days || 3),
  });
  await saveState(stateDir, stateName, { lastRunAt: new Date().toISOString(), ...result });
  console.log(
    `✅ chatlog：${result.from} ~ ${result.to}，${result.talkers} 个会话，新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}`,
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`❌ ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  });

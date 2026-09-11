import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

/**
 * 连接器游标状态：以 JSON 文件保存在 ~/.melog/connectors/<name>.json，
 * 让连接器可以增量同步而不是每次全量拉取。
 */

export function resolveStateDir(override?: string): string {
  return override || path.join(homedir(), '.melog', 'connectors');
}

export async function loadState<T extends Record<string, unknown>>(
  dir: string,
  name: string,
  fallback: T,
): Promise<T> {
  try {
    const raw = await readFile(path.join(dir, `${name}.json`), 'utf8');
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export async function saveState(dir: string, name: string, state: Record<string, unknown>): Promise<void> {
  await mkdir(dir, { recursive: true });
  const target = path.join(dir, `${name}.json`);
  await writeFile(`${target}.tmp`, JSON.stringify(state, null, 2), 'utf8');
  await writeFile(target, JSON.stringify(state, null, 2), 'utf8');
}

#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${MEOS_DB_PATH:-$REPO_ROOT/packages/api/src/prisma/meos.db}"
DEST="${MEOS_BACKUP_DIR:-$HOME/Backups/meos}"
KEEP="${MEOS_BACKUP_KEEP:-30}"

if [[ ! -f "$SRC" ]]; then
  echo "找不到数据库文件: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="$DEST/meos-$STAMP.sql"

sqlite3 "$SRC" ".dump" > "$DUMP"
cp "$SRC" "$DEST/meos-$STAMP.db"

gzip -kf "$DUMP"
SIZE_RAW=$(wc -c < "$DUMP" | tr -d ' ')
SIZE_GZ=$(wc -c < "$DUMP.gz" | tr -d ' ')
TABLES=$(sqlite3 "$SRC" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")

rm -f "$DEST"/meos-*.sql.gz.tmp
ls -1t "$DEST"/meos-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
ls -1t "$DEST"/meos-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "已备份 $TABLES 张表"
echo "  SQL  : $DUMP.gz  (${SIZE_GZ} B / 原文 ${SIZE_RAW} B)"
echo "  文件 : $DEST/meos-$STAMP.db"
echo "  保留 : 最近 $KEEP 份"
echo ""
echo "恢复用法: sqlite3 <目标.db> < $DUMP"

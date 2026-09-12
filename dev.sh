#!/bin/bash
# =================================================================
# MeOS Local Development Launcher
# Robust startup with process management & health checks
# =================================================================

set -euo pipefail

# --- Configuration ---
BACKEND_DIR="packages/api"
FRONTEND_DIR="apps/web"
BACKEND_PORT=3001
FRONTEND_PORT=3000
MAX_STARTUP_WAIT=45
LOG_FILE="${LOG_FILE:-/tmp/meos-dev.log}"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# --- Logging ---
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
info() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
error() { echo -e "${RED}✗${NC} $*"; }

# --- Global PIDs ---
declare -a PIDS=()
declare -a PORT_PIDS=()
ACTUAL_FRONTEND_URL=""

# --- Cleanup function ---
cleanup() {
  info "Shutting down..."
  # Kill processes by PIDs we started
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Kill any remaining children
  kill 0 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# --- Kill stale processes on specific ports ---
kill_stale_ports() {
  log "Checking for stale processes on ports..."
  local ports=("$BACKEND_PORT" "$FRONTEND_PORT" 5173 5174 5175)
  local killed=false
  for port in "${ports[@]}"; do
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      warn "Killing stale processes on port $port: $pids"
      echo "$pids" | xargs kill -9 2>/dev/null || true
      killed=true
    fi
  done
  if $killed; then sleep 2; fi
}

# --- Kill stale dev servers by pattern ---
kill_stale_dev_servers() {
  log "Checking for stale dev servers..."
  local patterns=("tsx" "vite" "next-dev")
  local killed=false
  for pattern in "${patterns[@]}"; do
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      warn "Killing stale '$pattern' processes: $pids"
      echo "$pids" | xargs kill -9 2>/dev/null || true
      killed=true
    fi
  done
  if $killed; then sleep 2; fi
}

# --- Check if port is free ---
is_port_free() {
  ! lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# --- Wait for port to be ready ---
wait_for_port() {
  local port=$1
  local max_attempts=${2:-30}
  for i in $(seq 1 $max_attempts); do
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1 || curl -sf "http://localhost:$port" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# --- Detect frontend URL from Vite output ---
detect_frontend_url() {
  # Wait a moment for Vite to output its URL
  sleep 2

  # Try common Vite ports
  for port in $FRONTEND_PORT 5173 5174 5175 5176; do
    if curl -sf "http://localhost:$port" >/dev/null 2>&1; then
      echo "http://localhost:$port"
      return 0
    fi
  done

  return 1
}

# =================================================================
# MAIN
# =================================================================

# Kill stale processes first
kill_stale_ports
kill_stale_dev_servers

# Verify ports are actually free
log "Verifying ports are free..."
if ! is_port_free $BACKEND_PORT; then
  error "Port $BACKEND_PORT still in use after cleanup"
  lsof -i :$BACKEND_PORT
  exit 1
fi
if ! is_port_free $FRONTEND_PORT; then
  warn "Port $FRONTEND_PORT in use, Vite will auto-select"
fi
info "Ports verified"

# Pre-flight checks
log "Running pre-flight checks..."
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [[ -z "$NODE_VERSION" ]] || [[ "$NODE_VERSION" -lt 18 ]]; then
  error "Node.js 18+ required. Current: $(node -v 2>/dev/null || 'not found')"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  error "pnpm not found. Install: npm install -g pnpm"
  exit 1
fi
info "Pre-flight checks passed"

# Install dependencies
log "Installing dependencies..."
if ! pnpm install --frozen-lockfile 2>/dev/null; then
  pnpm install || { error "Failed to install dependencies"; exit 1; }
fi
info "Dependencies ready"

# Environment setup
log "Setting up environment..."
ENV_FILE="$BACKEND_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" << 'EOF'
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-change-in-production
EOF
  info "Created .env"
fi

# Database setup
log "Setting up database..."
cd "$BACKEND_DIR"
pnpm db:generate --schema=src/prisma/schema.prisma >/dev/null 2>&1 || warn "Prisma generate had issues"
pnpm db:push --schema=src/prisma/schema.prisma >/dev/null 2>&1 || { error "Database push failed"; exit 1; }
# 品牌板块 mock 数据（幂等，数据源 packages/api/src/prisma/brand-seed-data.ts）
pnpm db:seed:brand >/dev/null 2>&1 || warn "Brand mock seed skipped"
cd - > /dev/null
info "Database ready"

# Clear log file
> "$LOG_FILE"

# Start backend
log "Starting backend (port $BACKEND_PORT)..."
cd "$BACKEND_DIR"
pnpm dev >> "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
PIDS+=("$BACKEND_PID")
cd - > /dev/null
info "Backend PID: $BACKEND_PID"

# Start frontend
log "Starting frontend..."
cd "$FRONTEND_DIR"
pnpm dev --port "$FRONTEND_PORT" >> "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!
PIDS+=("$FRONTEND_PID")
cd - > /dev/null
info "Frontend PID: $FRONTEND_PID"

# Wait for backend health
log "Waiting for backend to be ready..."
BACKEND_READY=false
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
    BACKEND_READY=true
    break
  fi
  # Check if process died
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    error "Backend process died unexpectedly"
    tail -30 "$LOG_FILE"
    exit 1
  fi
  sleep 1
done

if ! $BACKEND_READY; then
  error "Backend failed to start within 30s"
  tail -50 "$LOG_FILE"
  exit 1
fi
info "Backend ready at http://localhost:$BACKEND_PORT"

# Wait for frontend (give it a bit more time since Vite can be slow)
log "Waiting for frontend to be ready..."
FRONTEND_READY=false
for i in $(seq 1 20); do
  # Check if frontend process is still alive
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    warn "Frontend process died"
    tail -20 "$LOG_FILE"
    break
  fi

  ACTUAL_FRONTEND_URL=$(detect_frontend_url || true)
  if [[ -n "$ACTUAL_FRONTEND_URL" ]]; then
    FRONTEND_READY=true
    break
  fi
  sleep 1
done

echo ""
if $FRONTEND_READY && [[ -n "$ACTUAL_FRONTEND_URL" ]]; then
  info "Frontend ready at $ACTUAL_FRONTEND_URL"
  info "MeOS is running!"
  open "$ACTUAL_FRONTEND_URL" 2>/dev/null || true
else
  warn "Frontend may still be starting"
  info "Backend: http://localhost:$BACKEND_PORT"
  [[ -n "$ACTUAL_FRONTEND_URL" ]] && info "Frontend: $ACTUAL_FRONTEND_URL" || info "Frontend: check $LOG_FILE"
fi

echo ""
info "Press Ctrl+C to stop"

# Monitor processes
while true; do
  sleep 5
  # Check if any process died
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      error "Process $pid died"
      tail -30 "$LOG_FILE"
    fi
  done
done &
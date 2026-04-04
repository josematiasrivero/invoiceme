---
name: session-start
description: >
  Launch the full development environment (backend + frontend) in a single
  tmux session with a side-by-side split. Use when setting up, debugging, or
  adapting the start-all.sh startup script for this or a new project.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(tmux *), Bash(./start-all.sh)
argument-hint: [optional: task such as "restart", "adapt for new project", or "fix port"]
---

# Session Start — tmux Development Launcher

Handle the task described in `$ARGUMENTS` using the patterns documented below.

## What `start-all.sh` does

`start-all.sh` (project root) creates a **named tmux session** (`archetype`) with a
50 / 50 horizontal split:

| Pane | Process | URL |
|---|---|---|
| Left (0.0) | Spring Boot backend (`./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`) | `http://localhost:8080` |
| Right (0.1) | Next.js / Vite frontend (`npm install --prefer-offline && npm run dev`) | `http://localhost:5173` |

Additional endpoints available once both processes are up:

- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- H2 Console (dev only): `http://localhost:8080/h2-console`

## Script structure

```
start-all.sh
├── Dependency checks (tmux, java, node)
├── Kill any existing session with the same name
├── Proxy env-var propagation (http_proxy / https_proxy / …)
├── tmux new-session -d -s <SESSION>
├── Left pane: send backend command
├── split-window -h → right pane: send frontend command (sleep 3 first)
├── select-layout even-horizontal
└── tmux attach-session
```

### Key tmux commands used

```bash
tmux new-session  -d -s "$SESSION" -x "$(tput cols)" -y "$(tput lines)"
tmux rename-window -t "$SESSION:0" "<name>"
tmux send-keys    -t "$SESSION:0.0" "<cmd>" Enter
tmux split-window -t "$SESSION:0.0" -h          # vertical split (left/right panes)
tmux select-layout -t "$SESSION" even-horizontal
tmux select-pane  -t "$SESSION:0.0"
tmux attach-session -t "$SESSION"
```

To kill the session from outside:
```bash
tmux kill-session -t archetype
```

## Running the dev environment

```bash
# From the project root:
./start-all.sh

# Detach without stopping services:
Ctrl-b  d

# Re-attach later:
tmux attach-session -t archetype
```

## Adapting for a new project

When reusing this pattern in a different project, update these values:

| Variable | Where | What to change |
|---|---|---|
| `SESSION` | `start-all.sh` line 6 | Use the new project name (e.g. `myapp`) |
| `BACKEND_CMD` | line 28 | Point to the backend directory and start command |
| `FRONTEND_CMD` | line 29 | Point to the frontend directory and dev command |
| Port numbers | echo block | Reflect actual ports used |
| `sleep 3` | right pane | Increase if backend takes longer to start |

### Template for a generic project

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="<project-name>"

die() { echo "ERROR: $*" >&2; exit 1; }

command -v tmux >/dev/null 2>&1 || die "tmux is required"
command -v java >/dev/null 2>&1 || die "java is required"
command -v node >/dev/null 2>&1 || die "node is required"

tmux kill-session -t "$SESSION" 2>/dev/null || true

BACKEND_CMD="cd '$SCRIPT_DIR/backend' && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev"
FRONTEND_CMD="cd '$SCRIPT_DIR/frontend' && pnpm install --prefer-offline && pnpm dev"

tmux new-session  -d -s "$SESSION" -x "$(tput cols)" -y "$(tput lines)"
tmux rename-window -t "$SESSION:0" "$SESSION"

tmux send-keys -t "$SESSION:0.0" "$BACKEND_CMD" Enter
tmux split-window -t "$SESSION:0.0" -h
tmux send-keys -t "$SESSION:0.1" "sleep 5 && $FRONTEND_CMD" Enter

tmux select-layout -t "$SESSION" even-horizontal
tmux select-pane   -t "$SESSION:0.0"

echo "Session '$SESSION' started. Ctrl-b d to detach."
tmux attach-session -t "$SESSION"
```

## Proxy support

The script propagates `http_proxy`, `https_proxy`, `HTTP_PROXY`, `HTTPS_PROXY`,
`no_proxy`, and `NO_PROXY` into the backend pane so Maven can resolve dependencies
behind a corporate proxy. Do not remove this block if the dev environment is behind
a proxy.

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `tmux: command not found` | tmux not installed | `sudo apt install tmux` |
| Backend pane exits immediately | Maven/Java missing or port 8080 in use | Check `java -version`; kill the conflicting process |
| Frontend starts before backend is ready | `sleep 3` too short | Increase the sleep value in `FRONTEND_CMD` |
| Session already exists | Previous session not killed | `tmux kill-session -t archetype` |

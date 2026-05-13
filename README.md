# k6-performance

> A **k6 performance testing suite** with integrated observability — fully containerized, zero external dependencies.

[![k6](https://img.shields.io/badge/k6-2.0.0-7D64FF?logo=k6)](https://k6.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-3.11.3-E6522C?logo=prometheus)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-13.0.1-F46800?logo=grafana)](https://grafana.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

Five test scripts (smoke → soak) backed by a Prometheus + Grafana metrics stack. All services run locally via Docker Compose.

| Tool | Role |
|---|---|
| **k6** | Load testing engine — runs scripts that simulate virtual users sending HTTP requests |
| **Prometheus** | Time-series database — stores all metrics pushed by k6 via Remote Write |
| **Grafana** | Visualization layer — queries Prometheus and renders real-time performance dashboards |

---

## Quick Start

**Requires:** Docker with Compose v2+

```bash
git clone https://github.com/germanegomez/k6-performance.git
cd k6-performance

docker compose up -d
docker compose run --rm k6 run /scripts/01-smoke.js
```

| Service | URL |
|---|---|
| Grafana (dashboards) | http://localhost:3000 |
| Prometheus (raw metrics) | http://localhost:9090 |

**Tag each run** to filter results in the Grafana dashboard by test execution:

```bash
K6_PROMETHEUS_RW_TAGS=testid=smoke-01 MSYS_NO_PATHCONV=1 docker compose run --rm k6 run /scripts/01-smoke.js
```

Use the **Test Run** dropdown in Grafana to select a specific run.


> **Windows (Git Bash):** Git Bash converts Unix-style paths, causing k6 to fail finding the script.
> Prefix the run command with `MSYS_NO_PATHCONV=1`:
> ```bash
> MSYS_NO_PATHCONV=1 docker compose run --rm k6 run /scripts/01-smoke.js
> ```
> PowerShell and CMD are not affected.

For all commands, test scripts, and debugging: see [docs/development-workflow.md](docs/development-workflow.md).

---

## Documentation

| Document | Contents |
|---|---|
| [docs/project-overview.md](docs/project-overview.md) | Purpose, stack, test types, metrics pipeline |
| [docs/architecture.md](docs/architecture.md) | Component diagrams, data flow, technical decisions |
| [docs/conventions.md](docs/conventions.md) | Script structure, thresholds, naming, Docker rules |
| [docs/development-workflow.md](docs/development-workflow.md) | All commands, env vars, debugging, CI/CD |
| [docs/ai-context.md](docs/ai-context.md) | LLM-optimized context for AI agents |
| [docs/file-map.md](docs/file-map.md) | File and folder reference |

---

## Working with AI Assistants

Pre-configured instruction files for the most common AI tools:

| Tool | File |
|---|---|
| GitHub Copilot | [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Cursor | [.cursorrules](.cursorrules) |
| Claude Code | [CLAUDE.md](CLAUDE.md) |
| Devin / generic agents | [AGENTS.md](AGENTS.md) |
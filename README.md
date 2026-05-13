# k6-performance

> A production-grade **k6 performance testing suite** with integrated metrics collection and visualization — fully containerized, zero external dependencies.

[![k6](https://img.shields.io/badge/k6-2.0.0-7D64FF?logo=k6)](https://k6.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-3.11.3-E6522C?logo=prometheus)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-13.0.1-F46800?logo=grafana)](https://grafana.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

---

## What This Is

Five battle-tested load test scripts covering the full performance testing spectrum, backed by a self-contained observability stack that collects, stores, and visualizes metrics in real time.

| Test | Script | Peak VUs | Duration |
|---|---|---|---|
| Smoke | `scripts/01-smoke.js` | 1 | 30 s |
| Load | `scripts/02-load.js` | 10 | 5 min |
| Stress | `scripts/03-stress.js` | 300 | ~26 min |
| Spike | `scripts/04-spike.js` | 500 | ~5.5 min |
| Soak | `scripts/05-soak.js` | 50 | ~2 h |

---

## Stack

```
k6 ──► httpbin (SUT)
k6 ──► Prometheus (Remote Write)
           └──► Grafana (pre-provisioned dashboard)
```

All services run on an isolated Docker bridge network (`k6-net`).

---

## Quick Start

**Prerequisites:** Docker with Compose v2+

```bash
# 1. Clone
git clone https://github.com/germanegomez/k6-performance.git
cd k6-performance

# 2. Start observability stack
docker compose up -d

# 3. Open Grafana
#    http://localhost:3000  (no login required)

# 4. Run a test
docker compose run --rm k6 run /scripts/01-smoke.js
```

---

## Running Tests

```bash
# Smoke — verify basic functionality (30 s)
docker compose run --rm k6 run /scripts/01-smoke.js

# Load — normal expected traffic (5 min)
docker compose run --rm k6 run /scripts/02-load.js

# Stress — find breaking points (~26 min)
docker compose run --rm k6 run /scripts/03-stress.js

# Spike — sudden traffic burst (~5.5 min)
docker compose run --rm k6 run /scripts/04-spike.js

# Soak — sustained load, detect degradation (~2 h)
docker compose run --rm k6 run /scripts/05-soak.js
```

Results are pushed to Prometheus automatically. Open Grafana at `http://localhost:3000` to see the live dashboard.

---

## Service URLs

| Service | URL | Purpose |
|---|---|---|
| httpbin (SUT) | `http://localhost:8080` | HTTP testing target |
| Prometheus | `http://localhost:9090` | Metrics storage & query |
| Grafana | `http://localhost:3000` | Dashboard visualization |

---

## Project Structure

```
k6-performance/
├── scripts/                    # k6 test scripts
│   ├── 01-smoke.js
│   ├── 02-load.js
│   ├── 03-stress.js
│   ├── 04-spike.js
│   └── 05-soak.js
├── prometheus/
│   └── prometheus.yml          # Scrape config + remote write
├── grafana/
│   └── provisioning/
│       ├── datasources/        # Auto-provisioned Prometheus datasource
│       └── dashboards/         # Pre-built k6 dashboard (JSON)
├── docs/                       # Full project documentation
├── compose.yml                 # Full stack definition
├── CLAUDE.md                   # Claude Code instructions
├── AGENTS.md                   # Generic AI agent instructions
└── .cursorrules                # Cursor IDE rules
```

Full file responsibilities: [docs/file-map.md](docs/file-map.md)

---

## Stopping the Stack

```bash
# Stop containers, preserve metrics data
docker compose down

# Full reset — stop containers and wipe all data volumes
docker compose down -v
```

---

## Documentation

| Document | Contents |
|---|---|
| [docs/project-overview.md](docs/project-overview.md) | Purpose, stack, architecture summary |
| [docs/architecture.md](docs/architecture.md) | Component diagrams, data flow, decisions |
| [docs/conventions.md](docs/conventions.md) | Script patterns, thresholds, naming rules |
| [docs/development-workflow.md](docs/development-workflow.md) | Commands, debugging, CI/CD |
| [docs/ai-context.md](docs/ai-context.md) | LLM-optimized context for AI agents |
| [docs/file-map.md](docs/file-map.md) | Complete file and folder reference |

---

## Working with AI Assistants

This repository is configured for AI-assisted development:

| Tool | Config File |
|---|---|
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursorrules` |
| Claude Code | `CLAUDE.md` |
| Devin / generic agents | `AGENTS.md` |

For full AI context, point your assistant to [docs/ai-context.md](docs/ai-context.md).

---

## Troubleshooting

**k6 exits with no metrics in Grafana**
- Confirm the stack is up: `docker compose ps`
- Check remote write is reachable: `http://localhost:9090/targets`

**Grafana shows "No data"**
- Adjust the time range in Grafana to match when the test ran.
- Verify the Prometheus datasource: Grafana → Connections → Data Sources → Test.

**Port conflict on startup**
- Ensure ports 3000, 8080, and 9090 are free on your machine.

---

## Contributing

1. Add a new script as `scripts/NN-<type>.js` (next sequential number).
2. Follow the structure in [docs/conventions.md](docs/conventions.md).
3. Update [docs/file-map.md](docs/file-map.md).
4. Open a pull request with a description of the test type and threshold rationale.
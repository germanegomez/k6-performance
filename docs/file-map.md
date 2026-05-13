# File Map

## Root

| Path | Type | Description |
|---|---|---|
| `compose.yml` | Config | Docker Compose stack definition — all services, networks, volumes |
| `README.md` | Docs | Project introduction, quick start, commands |
| `LICENSE` | Legal | License file |

## `scripts/` — k6 Test Scripts

| File | Test Type | VUs | Duration | Target Endpoint |
|---|---|---|---|---|
| `01-smoke.js` | Smoke | 1 | 30 s | `/get` |
| `02-load.js` | Load | 0 → 10 → 0 | 5 min | `/get` |
| `03-stress.js` | Stress | 0 → 300 → 0 | ~26 min | `/delay/1` |
| `04-spike.js` | Spike | 10 → 500 → 10 | ~5.5 min | `/status/200` |
| `05-soak.js` | Soak | 0 → 50 → 0 | ~2 h 10 min | `/delay/1` |

## `prometheus/` — Prometheus Configuration

| File | Description |
|---|---|
| `prometheus.yml` | Scrape config (5 s interval), remote write receiver enabled, self-scrape |

## `grafana/provisioning/` — Grafana Auto-Provisioning

| File | Description |
|---|---|
| `datasources/prometheus.yml` | Declares Prometheus as the default datasource |
| `dashboards/dashboard.yml` | Registers the dashboards folder provider |
| `dashboards/k6-dashboard.json` | Pre-built k6 dashboard (JSON model — do not edit manually) |

## `docs/` — Project Documentation

| File | Description |
|---|---|
| `project-overview.md` | Purpose, stack, modules, data flow, roadmap |
| `architecture.md` | Components, diagrams, data flow, technical decisions |
| `conventions.md` | Naming, script structure, thresholds, Docker rules, code style |
| `development-workflow.md` | Setup, commands, debugging, CI/CD guidance |
| `ai-context.md` | LLM-optimized context, constraints, safe change rules |
| `file-map.md` | This file |

## `.github/` — GitHub & AI Tool Configurations

| File | Description |
|---|---|
| `copilot-instructions.md` | GitHub Copilot context and rules |

## Root AI Tool Files

| File | Description |
|---|---|
| `.cursorrules` | Cursor IDE rules |
| `CLAUDE.md` | Anthropic Claude Code instructions |
| `AGENTS.md` | Generic agent instructions (Devin, etc.) |

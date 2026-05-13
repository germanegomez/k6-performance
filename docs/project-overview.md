# Project Overview

## Purpose

`k6-performance` is a **performance testing portfolio project** that demonstrates a production-ready load testing setup using [Grafana k6](https://k6.io/). It covers the five canonical performance test types and provides a full observability stack for metrics collection and visualization — all running locally via Docker Compose.

## Problem It Solves

Manual, ad-hoc performance testing lacks repeatability and observability. This project provides:

- A **repeatable, version-controlled** test suite covering the full performance testing spectrum.
- An **automated observability pipeline**: k6 pushes metrics to Prometheus, visualized in real time via Grafana.
- A **self-contained local environment**: no external accounts or cloud dependencies required.

## Technology Stack

| Layer | Tool | Version |
|---|---|---|
| Test runner | [Grafana k6](https://k6.io/) | 2.0.0 |
| Target / SUT | [go-httpbin](https://github.com/mccutchen/go-httpbin) | 2.22.1 |
| Metrics storage | [Prometheus](https://prometheus.io/) | 3.11.3 |
| Visualization | [Grafana](https://grafana.com/) | 13.0.1 |
| Orchestration | Docker Compose | v2+ |

## General Structure

```
k6-performance/
├── scripts/              # k6 test scripts (one per test type)
├── prometheus/           # Prometheus configuration
├── grafana/              # Grafana provisioning (datasources + dashboards)
│   └── provisioning/
│       ├── dashboards/
│       └── datasources/
├── compose.yml           # Full stack definition
└── docs/                 # Project documentation
```

## Main Modules

| Module | Responsibility |
|---|---|
| `scripts/` | k6 JavaScript test scripts — load profiles, thresholds, scenarios |
| `prometheus/` | Scrape config, remote write receiver config |
| `grafana/provisioning/` | Auto-provisioned Prometheus datasource and k6 dashboard |
| `compose.yml` | Defines and links all services on an isolated Docker network |

## Test Coverage (Business Flow)

The five scripts implement a progressive performance testing strategy:

1. **Smoke** (`01-smoke.js`) — Verify the system works at minimal load (1 VU, 30 s).
2. **Load** (`02-load.js`) — Validate behaviour under normal expected traffic (10 VUs, 5 min).
3. **Stress** (`03-stress.js`) — Find breaking points by ramping up to 300 VUs with artificial latency.
4. **Spike** (`04-spike.js`) — Simulate sudden traffic bursts (0 → 500 VUs in 30 s).
5. **Soak** (`05-soak.js`) — Detect memory leaks and gradual degradation over 2+ hours at sustained load.

## Metrics Pipeline

```
k6 (test runner)
  └─► Prometheus Remote Write API (port 9090)
        └─► Prometheus TSDB (15-day retention)
              └─► Grafana (port 3000) — pre-provisioned dashboard
```

## Key Dependencies

- **Docker & Docker Compose v2+** — required to run the full stack.
- **k6** — can also be installed locally (optional; Dockerized version is the default).
- No external network dependencies; all services communicate on the `k6-net` bridge network.

## Runtime Environment

| Service | Port | Notes |
|---|---|---|
| httpbin (SUT) | 8080 | Target for all k6 requests |
| Prometheus | 9090 | Metrics store; remote write enabled |
| Grafana | 3000 | Dashboard UI; anonymous admin access |
| k6 | — | Run manually via `docker compose run` |

## Inferred Roadmap

- Add parameterized scenarios (data-driven tests).
- Add POST/PUT/DELETE endpoint coverage beyond GET.
- Add CI/CD pipeline integration (GitHub Actions).
- Add HTML/JSON report export from k6.
- Add alerting rules in Prometheus/Grafana.

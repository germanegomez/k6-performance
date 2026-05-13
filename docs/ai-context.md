# AI Context

> This file is optimized for LLM consumption. It provides the dense, structured context an AI agent needs to work safely and effectively in this codebase.

---

## Executive Summary

`k6-performance` is a **Dockerized k6 load testing suite** with an integrated observability stack (Prometheus + Grafana). It covers the five standard performance test types: smoke, load, stress, spike, and soak. All services run locally via Docker Compose on an isolated bridge network. No external services, cloud accounts, or API keys are required.

**Language:** JavaScript (ES modules, k6 runtime)
**Orchestration:** Docker Compose
**Entry point for tests:** `docker compose run --rm k6 run /scripts/<name>.js`

---

## Technical Objectives

1. Demonstrate all five canonical performance test types with realistic thresholds.
2. Provide zero-config local metrics collection and visualization.
3. Serve as a reference implementation for performance testing portfolios.

---

## Repository Map (Critical Files)

| File | Role | Modify? |
|---|---|---|
| `compose.yml` | Defines all services, networks, volumes | With caution |
| `scripts/01-smoke.js` | Smoke test — 1 VU, 30 s | Safe to edit thresholds |
| `scripts/02-load.js` | Load test — ramp to 10 VUs, 5 min | Safe to edit thresholds |
| `scripts/03-stress.js` | Stress test — ramp to 300 VUs | Safe to edit thresholds |
| `scripts/04-spike.js` | Spike test — burst to 500 VUs | Safe to edit thresholds |
| `scripts/05-soak.js` | Soak test — 50 VUs for 2+ hours | Safe to edit thresholds |
| `prometheus/prometheus.yml` | Prometheus scrape + remote write config | Rarely needs changes |
| `grafana/provisioning/datasources/prometheus.yml` | Auto-provisioned datasource | Do not modify |
| `grafana/provisioning/dashboards/dashboard.yml` | Dashboard provider config | Do not modify |
| `grafana/provisioning/dashboards/k6-dashboard.json` | k6 Grafana dashboard definition | Do not modify manually |

---

## Constraints

- **k6 runtime is not Node.js.** It supports ES module syntax and a subset of the Web API. `require()`, `fs`, `path`, `process`, and most Node.js built-ins are **not available**.
- **No package manager.** k6 scripts cannot import npm packages directly. Use k6 built-in modules (`k6/http`, `k6/metrics`, `k6/checks`, etc.).
- **Target URLs use Docker DNS names**, not `localhost`. All scripts must use `http://httpbin/...` — never `http://localhost:8080/...`.
- **No `.env` file** — environment variables are declared in `compose.yml`.
- **k6 profile is `manual`** — never remove or change this profile without understanding the side effects.

---

## Important Decisions

| Decision | Reason |
|---|---|
| `manual` Compose profile for k6 | Prevents accidental execution when running `docker compose up` |
| Native histograms (`K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true`) | Higher-resolution p95/p99 latency in Prometheus |
| go-httpbin as SUT | Deterministic, zero-config, supports `/delay/N` for latency simulation |
| Anonymous Grafana admin | Zero-friction local DX; not production-safe |
| Pinned image versions | Ensures reproducible environments |

---

## Sensitive Areas

| Area | Risk | Rule |
|---|---|---|
| `compose.yml` network config | Breaking `k6-net` severs all inter-service communication | Do not rename or remove `k6-net` |
| Prometheus Remote Write URL | If URL changes, k6 metrics will not reach Prometheus | Match `K6_PROMETHEUS_RW_SERVER_URL` to actual Prometheus address |
| Grafana provisioning files | Grafana will fail to start if YAML is malformed | Validate YAML before editing |
| `k6-dashboard.json` | Large generated file — manual edits will likely break it | Edit dashboards via Grafana UI, then export JSON |
| Soak test duration (2 h) | Running soak in CI without timeout gates will block pipelines | Add `--duration` override or CI timeout |

---

## What AI Should NOT Do

- **Do not add `npm install` steps** — this is not a Node.js project.
- **Do not use `require()` in k6 scripts** — use `import` only.
- **Do not use `localhost` in script URLs** — use Docker service names.
- **Do not remove `thresholds`** from any script — they are the pass/fail criteria.
- **Do not edit `k6-dashboard.json` manually** — it is a Grafana export file.
- **Do not add `latest` image tags** in `compose.yml` — always pin versions.
- **Do not add secrets or credentials** to scripts or `compose.yml` — use environment variables.
- **Do not change the `manual` profile** on the k6 service.

---

## How to Propose Safe Changes

### Adding a new test script
1. Create `scripts/NN-<type>.js` with the next sequential number.
2. Follow the structure in `docs/conventions.md`.
3. Define `thresholds` matching the test type table in `docs/conventions.md`.
4. Use `http://httpbin/<endpoint>` as target.
5. Update `docs/file-map.md`.

### Modifying an existing script
1. Only change `stages`, `vus`, `duration`, `thresholds`, or the target endpoint.
2. Do not restructure the `options` export shape.
3. Do not add external imports.

### Updating `compose.yml`
1. Do not remove the `k6-net` network from any service.
2. Keep k6 under the `manual` profile.
3. Keep all volume mounts read-only (`:ro`) for config files.
4. Pin new image versions explicitly.

---

## Code Generation Guidelines

When generating k6 scripts for this project:

```js
// CORRECT — template to follow
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: 'Xm', target: N },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.0X'],
    http_req_duration: ['p(95)<XXXX'],
  },
};

export default function () {
  const res = http.get('http://httpbin/<endpoint>');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(N);
}
```

- Import only from `k6/*` built-in modules.
- Always use `export const options` (named export).
- Always use `export default function` for the scenario.
- Target: `http://httpbin/` + valid httpbin endpoint.
- Threshold values must use string format: `'rate<0.05'`, `'p(95)<1000'`.

---

## Useful k6 Built-in Modules

| Module | Purpose |
|---|---|
| `k6/http` | HTTP client (`get`, `post`, `put`, `del`, `request`) |
| `k6` | `check`, `sleep`, `group` |
| `k6/metrics` | Custom metrics (`Counter`, `Gauge`, `Rate`, `Trend`) |
| `k6/execution` | Access VU/scenario info at runtime |

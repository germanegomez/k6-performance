# AGENTS.md — k6-performance

## Project Overview

This repository is a **k6 performance testing suite** with an integrated observability stack.

- **Test runner:** Grafana k6 v2.0.0 (Dockerized)
- **SUT (System Under Test):** go-httpbin (predictable HTTP target)
- **Metrics:** Prometheus v3 + Grafana v13 (pre-provisioned)
- **Orchestration:** Docker Compose v2

All work is local. No cloud services or external APIs are involved.

---

## For Automated Agents

### What this repo does

Runs 5 types of performance tests against httpbin and visualizes metrics in Grafana:

| Script | Type | Peak VUs | Duration |
|---|---|---|---|
| `scripts/01-smoke.js` | Smoke | 1 | 30 s |
| `scripts/02-load.js` | Load | 10 | 5 min |
| `scripts/03-stress.js` | Stress | 300 | ~26 min |
| `scripts/04-spike.js` | Spike | 500 | ~5.5 min |
| `scripts/05-soak.js` | Soak | 50 | ~2 h |

### How to run a test

```bash
docker compose up -d                                          # Start stack
docker compose run --rm k6 run /scripts/01-smoke.js          # Run test
docker compose down                                           # Stop stack
```

### Language

Test scripts are JavaScript (ES modules) for the **k6 runtime**. Not Node.js. No npm.

### Allowed imports

Only `k6/*` built-in modules:
- `k6/http` — HTTP client
- `k6` — `check`, `sleep`, `group`
- `k6/metrics` — custom metrics
- `k6/execution` — runtime info

### Required script structure

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [...],
  thresholds: {
    http_req_failed:   ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get('http://httpbin/<endpoint>');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Hard rules

| Rule | Reason |
|---|---|
| Use `http://httpbin/` not `http://localhost/` | Docker DNS routing |
| Do not use `require()` | k6 is not Node.js |
| Always define `thresholds` | Pass/fail gate |
| Always call `check()` | Response validation |
| Always call `sleep()` | Realistic user pacing |
| Keep k6 under `profiles: [manual]` | Prevents accidental runs |
| Do not edit `k6-dashboard.json` | Generated file |

### File naming for new scripts

`scripts/NN-<type>.js` — sequential two-digit prefix, lowercase type.

### After adding a script

Update `docs/file-map.md` with the new entry.

---

## Out of Scope for Agents

- Modifying Grafana provisioning files
- Changing the Docker network name (`k6-net`)
- Adding external npm dependencies
- Changing the k6 service profile
- Hardcoding credentials or tokens

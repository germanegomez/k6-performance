# GitHub Copilot Instructions

## Project Context

This is a **k6 performance testing project** using Docker Compose. The stack includes:
- **k6** (test runner, `grafana/k6:2.0.0`) — triggered manually
- **httpbin** (SUT, `mccutchen/go-httpbin`) — the HTTP target for all tests
- **Prometheus** (metrics storage, remote write receiver enabled)
- **Grafana** (visualization, pre-provisioned dashboard + datasource)

All services communicate on the `k6-net` Docker bridge network.

---

## Test Script Conventions

k6 scripts live in `scripts/` and follow the pattern `NN-type.js`.

**Always use this structure:**

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [...],
  thresholds: {
    http_req_failed:   ['rate<0.0X'],
    http_req_duration: ['p(95)<XXXX'],
  },
};

export default function () {
  const res = http.get('http://httpbin:8080/<endpoint>');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(N);
}
```

---

## Architecture Rules

- **Target URLs must use Docker service names**, not `localhost`. Always `http://httpbin:8080/...`.
- **k6 is not Node.js** — no `require()`, no npm, no `fs`/`path`/`process`.
- **Only import from `k6/*`** built-in modules.
- **Always define `thresholds`** — they are the pass/fail contract.
- **Always call `check()`** on HTTP responses.
- **Always include `sleep()`** to simulate user think time.

---

## Prohibited Patterns

```js
// NEVER — wrong runtime
const fs = require('fs');
import axios from 'axios';

// NEVER — wrong URL
http.get('http://localhost:8080/get');

// NEVER — missing thresholds
export const options = { vus: 10, duration: '1m' };  // no thresholds

// NEVER — no check
export default function() { http.get('http://httpbin:8080/get'); }
```

---

## Threshold Guidelines by Test Type

| Test | `http_req_failed` | `http_req_duration` |
|---|---|---|
| Smoke | `rate<0.01` | `p(95)<500` |
| Load | `rate<0.05` | `p(95)<1000`, `p(99)<2000` |
| Stress | `rate<0.10` | `p(95)<5000` |
| Spike | `rate<0.10` | `p(95)<2000` |
| Soak | `rate<0.01` | `p(95)<2000`, `p(99)<3000` |

---

## Files to Never Modify

- `grafana/provisioning/dashboards/k6-dashboard.json` — Grafana export, do not hand-edit.
- `grafana/provisioning/datasources/prometheus.yml` — auto-provisioned datasource.
- `grafana/provisioning/dashboards/dashboard.yml` — dashboard provider config.

---

## Adding New Scripts

1. Name: `0N-<type>.js` with next sequential number.
2. Follow the standard script structure above.
3. Use threshold values appropriate for the test type.
4. Use `http://httpbin:8080/<endpoint>` as target.
5. Update `docs/file-map.md`.

---

## Docker Compose Rules

- Never remove `k6-net` network from any service.
- Keep k6 under `profiles: [manual]`.
- Keep config mounts as `:ro` (read-only).
- Always pin image versions (no `latest`).

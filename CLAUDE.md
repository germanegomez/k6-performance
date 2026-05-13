# CLAUDE.md — k6-performance

## Project Summary

Dockerized k6 load testing portfolio with 5 test scripts (smoke → soak) and a full metrics stack (Prometheus + Grafana). All services run on an isolated Docker bridge network.

## Essential Commands

```bash
# Start observability stack
docker compose up -d

# Run a test (replace filename)
docker compose run --rm k6 run /scripts/01-smoke.js

# Stop stack
docker compose down

# Full reset (wipes data volumes)
docker compose down -v
```

## k6 Runtime Constraints

k6 uses a JavaScript runtime that is **NOT Node.js**:

| Allowed | Forbidden |
|---|---|
| `import http from 'k6/http'` | `const http = require('http')` |
| `import { check, sleep } from 'k6'` | `import axios from 'axios'` |
| ES module syntax | CommonJS / npm packages |

## Mandatory Script Pattern

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
  const res = http.get('http://httpbin:8080/<endpoint>');  // Docker DNS, not localhost
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

## Do Not Modify

- `grafana/provisioning/dashboards/k6-dashboard.json`
- `grafana/provisioning/datasources/prometheus.yml`
- `grafana/provisioning/dashboards/dashboard.yml`

## Threshold Reference

| Test | Error rate | Latency |
|---|---|---|
| Smoke | `rate<0.01` | `p(95)<500` |
| Load | `rate<0.05` | `p(95)<1000`, `p(99)<2000` |
| Stress | `rate<0.10` | `p(95)<5000` |
| Spike | `rate<0.10` | `p(95)<2000` |
| Soak | `rate<0.01` | `p(95)<2000`, `p(99)<3000` |

## Architecture

```
k6 → httpbin (HTTP requests)
k6 → Prometheus (Remote Write metrics)
Grafana → Prometheus (PromQL queries)
```

All services on `k6-net` Docker bridge. k6 is `profiles: [manual]`.

## Adding a New Script

1. `scripts/NN-<type>.js` (next sequential number)
2. Use the mandatory pattern above
3. Match thresholds to test type
4. Update `docs/file-map.md`

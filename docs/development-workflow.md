# Development Workflow

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Docker | 24+ | Required |
| Docker Compose | v2+ | Included with Docker Desktop |
| k6 (optional) | 2.0.0 | Only needed for local runs outside Docker |

No Node.js, npm, or other runtimes are required.

---

## 1. Start the Observability Stack

```bash
docker compose up -d
```

This starts three services:
- **httpbin** at `http://localhost:8080`
- **Prometheus** at `http://localhost:9090`
- **Grafana** at `http://localhost:3000`

The k6 service does **not** start automatically (it uses the `manual` Compose profile).

---

## 2. Run a Test Script

```bash
# Syntax
docker compose run --rm k6 run /scripts/<script-name>

# Examples
docker compose run --rm k6 run /scripts/01-smoke.js
docker compose run --rm k6 run /scripts/02-load.js
docker compose run --rm k6 run /scripts/03-stress.js
docker compose run --rm k6 run /scripts/04-spike.js
docker compose run --rm k6 run /scripts/05-soak.js
```

`--rm` removes the container after the run. Metrics are still persisted in Prometheus.

### Tagging runs for comparison

Pass a `testid` tag to identify each run in Grafana:

```bash
K6_PROMETHEUS_RW_TAGS=testid=smoke-01 MSYS_NO_PATHCONV=1 docker compose run --rm k6 run /scripts/01-smoke.js
K6_PROMETHEUS_RW_TAGS=testid=load-01  MSYS_NO_PATHCONV=1 docker compose run --rm k6 run /scripts/02-load.js
```

In Grafana, use the **Test Run** dropdown at the top of the dashboard to filter by a specific run or view all runs together.

---

## 3. View Results in Grafana

1. Open `http://localhost:3000` in your browser.
2. Navigate to **Dashboards → k6** folder.
3. The pre-provisioned k6 dashboard loads automatically.
4. Use Grafana's time range picker to zoom in on the test window.

No login is required — Grafana is configured for anonymous admin access.

---

## 4. Stop the Stack

```bash
# Stop containers, keep volumes (data preserved)
docker compose down

# Stop containers AND remove volumes (full reset)
docker compose down -v
```

---

## 5. Reference — All Commands

| Command | Purpose |
|---|---|
| `docker compose up -d` | Start stack in background |
| `docker compose down` | Stop stack, preserve data |
| `docker compose down -v` | Stop stack, wipe all data |
| `docker compose ps` | Check running service status |
| `docker compose logs prometheus` | View Prometheus logs |
| `docker compose logs grafana` | View Grafana logs |
| `docker compose run --rm k6 run /scripts/01-smoke.js` | Run smoke test |
| `docker compose run --rm k6 run /scripts/02-load.js` | Run load test |
| `docker compose run --rm k6 run /scripts/03-stress.js` | Run stress test |
| `docker compose run --rm k6 run /scripts/04-spike.js` | Run spike test |
| `docker compose run --rm k6 run /scripts/05-soak.js` | Run soak test (2+ hours) |

---

## Environment Variables

The k6 container reads these from `compose.yml` — no `.env` file is required:

| Variable | Value | Purpose |
|---|---|---|
| `K6_PROMETHEUS_RW_SERVER_URL` | `http://prometheus:9090/api/v1/write` | Prometheus Remote Write endpoint |
| `K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM` | `true` | Use native histograms for trend metrics |

To override at runtime (e.g., point to a real target):

```bash
docker compose run --rm \
  -e K6_PROMETHEUS_RW_SERVER_URL=http://my-prometheus:9090/api/v1/write \
  k6 run /scripts/02-load.js
```

---

## Accessing Services Directly

| Service | URL | Notes |
|---|---|---|
| httpbin | `http://localhost:8080/get` | Test the SUT manually |
| Prometheus | `http://localhost:9090` | Query metrics, check targets |
| Grafana | `http://localhost:3000` | View dashboards |
| Prometheus targets | `http://localhost:9090/targets` | Verify scrape health |

---

## Debugging

### k6 exits immediately / no metrics in Grafana
1. Check Prometheus is running: `docker compose ps`
2. Verify remote write receiver is enabled: `http://localhost:9090/targets`
3. Check k6 container logs: `docker compose logs k6`

### Grafana dashboard shows "No data"
1. Confirm Prometheus datasource is healthy: Grafana → Connections → Data Sources → Prometheus → Test.
2. Ensure the test ran **after** the stack was started.
3. Adjust the time range in Grafana to match when the test ran.

### Port conflicts
Stop any local instances of Prometheus (9090), Grafana (3000), or httpbin (8080) before starting the stack.

---

## CI/CD

*(No CI/CD pipeline detected in this repository — pending setup)*

Recommended integration: GitHub Actions workflow that runs the smoke test on each push to `main`:

```yaml
# Suggested future workflow
jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - run: docker compose run --rm k6 run /scripts/01-smoke.js
      - run: docker compose down -v
```

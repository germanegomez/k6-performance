# Conventions

## File Naming

| Artifact | Convention | Examples |
|---|---|---|
| k6 test scripts | `NN-type.js` (two-digit prefix + lowercase test type) | `01-smoke.js`, `04-spike.js` |
| Config files | lowercase with hyphens | `prometheus.yml`, `dashboard.yml` |
| Documentation | lowercase with hyphens, `.md` extension | `project-overview.md` |

The numeric prefix in script names enforces execution order and communicates severity/duration (smoke → soak).

## k6 Script Structure

Every script must follow this structure:

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Options block — always at the top, exported as named const
export const options = {
  stages: [...],      // or vus + duration for simple scripts
  thresholds: {
    http_req_failed:   ['rate<X.XX'],       // Always define an error rate threshold
    http_req_duration: ['p(95)<XXXX'],      // Always define a latency threshold
  },
};

// 2. Default function — the virtual user scenario
export default function () {
  const res = http.get('http://httpbin:8080/<endpoint>');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(N);   // Always include a sleep to avoid hammering
}
```

### Rules

- Always export `options` as a named `const` (not default export).
- Always define `thresholds` — scripts without thresholds will not fail the run on regressions.
- Always call `check()` on every response to track the pass/fail rate.
- Always include a `sleep()` to model realistic user think time.
- Target URLs must use internal Docker DNS names (e.g., `http://httpbin:8080/...`), not `localhost`.

## Thresholds by Test Type

| Test type | `http_req_failed` | `http_req_duration` |
|---|---|---|
| Smoke | `rate<0.01` | `p(95)<500` |
| Load | `rate<0.05` | `p(95)<1000`, `p(99)<2000` |
| Stress | `rate<0.10` | `p(95)<5000` |
| Spike | `rate<0.10` | `p(95)<2000` |
| Soak | `rate<0.01` | `p(95)<2000`, `p(99)<3000` |

Thresholds represent **SLO-style contracts** — loosen them only when justified and document the reason.

## Docker Compose Conventions

- All services must belong to the `k6-net` network.
- Services with persistent state must use named volumes, not anonymous volumes.
- Config files mounted into containers must use `:ro` (read-only) flag.
- The k6 service must remain under the `manual` profile to prevent accidental execution.
- Pin all image versions (no `latest` tags).

## Test Script Endpoints

| Scenario | Endpoint | Purpose |
|---|---|---|
| Fast response | `/get`, `/status/200` | No artificial delay |
| Latency simulation | `/delay/1` | Adds 1 s baseline; surfaces degradation in stress/soak |

Use `/delay/1` for stress and soak tests to reveal degradation patterns. Use fast endpoints for smoke, load, and spike tests.

## Code Style (k6 Scripts)

- Use ES module syntax (`import`/`export`) — k6 uses a Babel-transpiled JS runtime.
- No TypeScript (k6 supports it, but this project uses plain JS for simplicity).
- Keep scripts self-contained — no shared utilities unless explicitly added and documented.
- Comment non-obvious threshold values or stage rationale inline.

## Commit & Branch Conventions

*(pending: no CI/CD or `.github/` workflow files detected)*

Recommended conventions:
- Branch names: `feat/`, `fix/`, `docs/`, `chore/` prefixes.
- Commit messages: imperative present tense (`Add soak test`, `Fix spike threshold`).

## Error Handling

k6 does not use try/catch for HTTP errors. Errors are captured via:

1. `check()` assertions — failures are tracked in `checks` metric.
2. `thresholds` — if the error rate or latency threshold is breached, the run exits with a non-zero code.

Do not add `try/catch` around `http.*` calls unless testing failure-mode scenarios.

## Logging & Debugging

- Use `console.log()` sparingly in scripts — it appears in k6 stdout and can generate excessive output under high VU counts.
- Prefer `check()` with descriptive labels over `console.log()` for assertions.
- To inspect a single response interactively, use `console.log(res.body)` in smoke tests only.

## Security

- No secrets, credentials, or API keys exist in this project (httpbin requires none).
- If a real target API requiring auth is added, use k6 environment variables (`__ENV.VAR_NAME`) — never hardcode tokens in scripts.
- Grafana anonymous admin is **local development only** — disable before any shared deployment.

## Adding a New Test Script

1. Name it with the next sequential prefix (e.g., `06-breakpoint.js`).
2. Follow the standard script structure above.
3. Define meaningful thresholds appropriate to the test type.
4. Document the target endpoint and rationale in a comment block at the top.
5. Update `docs/file-map.md` with the new script entry.

# API Layer

## Overview

The API layer is built around a single file — `openapi.yml` — that serves as the source of
truth for both the mock server and the documentation UI:

```
openapi.yml
  ├── Prism (mock server)   — validates and serves all k6 HTTP requests
  └── Scalar (docs UI)      — renders interactive API reference at http://localhost:8090
```

k6 scripts target `http://prism:8080` (Docker DNS). Prism listens on port 8080 inside the
container, mapped to host port 8080. No k6 script changes are needed.

---

## Prism — Mock Server

[Stoplight Prism](https://stoplight.io/open-source/prism) replaces `go-httpbin` as the HTTP
target for all k6 tests. Rather than running a real service with live behaviour, Prism reads
`openapi.yml` at startup and serves spec-compliant responses for every documented path.

### Why Prism instead of go-httpbin?

| Concern | go-httpbin | Prism |
|---|---|---|
| Spec alignment | None — behaviour is implicit | All endpoints defined in `openapi.yml` |
| Request validation | None | Rejects requests that violate the spec |
| Extensibility | Fixed endpoints | Add any endpoint by editing the spec |
| Documentation | Separate concern | Same file drives both mock and docs |

### How Prism validates requests

When k6 sends a request, Prism checks it against the spec before responding:

- **Path match** — the path must exist in `openapi.yml`
- **Parameter types** — path and query parameters must match their declared types
- **Request body** — body schema is validated for POST/PUT/PATCH when a schema is defined

If a request does not match the spec, Prism returns a `422` or `404` instead of the expected
response. This surfaces spec drift early, before it reaches production.

### Port mapping

| Context | Address |
|---|---|
| k6 scripts (Docker DNS) | `http://prism:8080` |
| Browser / host access | `http://localhost:8080` |
| Prism internal port | `8080` |

---

## Scalar — API Documentation UI

[Scalar](https://scalar.com/) renders `openapi.yml` as an interactive API reference. It runs
as a separate container and has no dependency on Prism at the Docker level — both simply
read the same spec file from the shared bind mount.

### Accessing Scalar

Start the stack (if not already running):

```bash
docker compose up -d
```

Open the docs in your browser:

```
http://localhost:8090
```

Scalar reads `openapi.yml` from `/docs/openapi.yml` inside the container (mounted read-only
from the project root) and renders the reference automatically on startup.

### Health check

```
http://localhost:8090/health
```

A `200 OK` response confirms the Scalar container is serving traffic. Prism has no dedicated
health endpoint, but a request to any documented path (e.g. `GET http://localhost:8080/get`)
confirms it is running.

### Using "Try it out"

Scalar includes a built-in HTTP client that sends real requests from your browser:

1. Open `http://localhost:8090`.
2. Select any endpoint from the left-hand sidebar (e.g. **GET /get**).
3. Click **Send** in the right panel.
4. Scalar sends the request to `http://localhost:8080` (the host-exposed Prism port) and
   displays the live response inline.

> **Note:** "Try it out" targets `http://localhost:8080` directly. The full stack must be
> running (`docker compose up -d`) for requests to succeed.

---

## Updating the Spec

`openapi.yml` is the single source of truth. Edit it whenever:

- A new endpoint is added for a new or updated k6 script
- A path parameter constraint changes (e.g. extending the delay range)
- A new response code is introduced

### Workflow

1. Edit `openapi.yml` at the project root — add or modify path entries following the
   existing structure.
2. Restart both services to pick up the change:

   ```bash
   docker compose restart prism scalar
   ```

3. Verify Prism accepts requests to the new path:

   ```bash
   curl http://localhost:8080/<new-endpoint>
   ```

4. Refresh `http://localhost:8090` — the new endpoint appears in the Scalar sidebar.
5. Update `docs/file-map.md` if a new k6 script was added alongside the spec change.

### Path template for new endpoints

```yaml
  /new-endpoint:
    get:
      tags:
        - prism
      summary: Short description
      description: |
        Longer description.

        **Used by:** <test type> (`NN-<type>.js`)
      operationId: getNewEndpoint
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/RequestReflection"
```

---

## Endpoint Reference

| Endpoint | k6 Script(s) | Purpose |
|---|---|---|
| `GET /get` | smoke (01), load (02) | Basic GET reflection — minimal latency baseline |
| `POST /post` | — | POST body reflection — available for write-operation tests |
| `GET /status/{code}` | spike (04) | Return arbitrary HTTP status — high-throughput, near-zero latency |
| `GET /delay/{seconds}` | stress (03), soak (05) | Artificial delay — surfaces latency degradation and resource exhaustion |
| `GET /headers` | — | Header reflection — available for header propagation tests |
| `GET /anything` | — | Full request reflection — flexible multi-method scenarios |

---

## Troubleshooting

### Port conflict on 8080 or 8090

Another process is using the port. Find and stop it, or change the host-side port in
`compose.yml` (e.g. `"8081:4010"`) — but note that k6 scripts use Docker DNS
(`http://prism:8080`) and are unaffected by the host port mapping.

### Prism returns 422 or "not found" for a valid-looking path

The request does not match the spec. Common causes:

- **Path typo** — verify the path in `openapi.yml` exactly matches what k6 sends
- **Wrong parameter type** — e.g. sending a string where the spec declares `type: integer`
- **Missing required parameter** — Prism enforces `required: true` path parameters

Run with verbose Prism logs to diagnose:

```bash
docker compose logs prism
```

### "Try it out" in Scalar fails with a CORS error

Browsers enforce CORS on cross-origin fetch requests. Prism does not add CORS headers by
default. Options:

- Use a browser extension that disables CORS for localhost (development only)
- Use `curl` or a native HTTP client instead of the browser for direct API testing
- Add `--cors` to the Prism command in `compose.yml` to enable permissive CORS headers:

  ```yaml
  command: mock -h 0.0.0.0 --cors /tmp/openapi.yml
  ```

  Restart Prism after the change: `docker compose restart prism`

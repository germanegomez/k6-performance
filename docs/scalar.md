# Scalar API Reference

## What is Scalar?

[Scalar](https://scalar.com/) is an open-source API reference UI that renders OpenAPI specifications as interactive documentation. In this stack it serves as a live reference for the `go-httpbin` endpoints used by all k6 test scripts — giving you a browser-based view of every route, its parameters, and a built-in HTTP client to call them directly.

---

## Accessing Scalar

Start the stack (if not already running):

```bash
docker compose up -d
```

Open the docs in your browser:

```
http://localhost:8090
```

Scalar reads `openapi.yml` from the project root (mounted read-only at `/docs/openapi.yml` inside the container) and renders it automatically on startup.

---

## Health Check

Verify the Scalar container is serving traffic:

```
http://localhost:8090/health
```

A `200 OK` response confirms the service is up.

---

## Using "Try it Out"

Scalar includes a built-in HTTP client that sends real requests to httpbin from your browser:

1. Open `http://localhost:8090`.
2. Select any endpoint from the left-hand sidebar (e.g. **GET /get**).
3. Click **Send** (or the equivalent "Try it out" button in the right panel).
4. Scalar sends the request directly to `http://localhost:8080` and displays the live response.

> **Note:** "Try it out" targets `http://localhost:8080` (the host-exposed httpbin port). This requires the full stack to be running (`docker compose up -d`).

---

## Updating the Spec

`openapi.yml` is the single source of truth for httpbin documentation. Update it whenever a new k6 script introduces a new endpoint.

### Workflow

1. Edit `openapi.yml` in the project root — add a new path entry following the existing structure.
2. Restart Scalar to pick up the change:

   ```bash
   docker compose restart scalar
   ```

3. Refresh `http://localhost:8090` — the new endpoint appears in the sidebar immediately.
4. Update `docs/file-map.md` to document the new k6 script and its target endpoint.

### Path template

```yaml
  /new-endpoint:
    get:
      tags:
        - httpbin
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
| `GET /get` | smoke, load | Basic GET reflection — minimal latency baseline |
| `POST /post` | — | POST body reflection — available for write-operation tests |
| `GET /status/{code}` | spike | Return arbitrary HTTP status — high-throughput, near-zero latency |
| `GET /delay/{seconds}` | stress, soak | Artificial delay — surfaces latency degradation and resource exhaustion |
| `GET /headers` | — | Header reflection — available for header propagation tests |
| `GET /anything` | — | Full request reflection — flexible multi-method scenarios |

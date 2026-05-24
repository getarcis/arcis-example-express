# arcis-example-express

> Minimal Express + Arcis app. One install, one middleware line, the full Arcis sanitizer pipeline gated against your handler.

## What this is

The smallest possible demo of Arcis on Express. Two files:

- [`server.js`](./server.js): Express app with `app.use(arcis({ block: true }))` as the only security line.
- [`attack.js`](./attack.js): fires 8 attack payloads at the running server and reports which ones Arcis blocks.

Total dependencies: `@arcis/node` + `express`. Nothing else.

## What this adapter does and does not do

| Protection | `arcis({ block: true })` | Where to get it |
|---|---|---|
| Input sanitization (XSS, SQL, NoSQL, path, command, SSTI, XXE, prompt injection, prototype, LDAP, XPath, header injection) | yes | built in |
| Rate limiting (per-IP, in-memory; configurable to Redis) | yes | built in |
| Security headers (CSP, HSTS, X-Frame-Options, etc.) | yes | built in |
| Bot detection | no (opt-in) | `app.use(botDetection())` from `@arcis/node/middleware` |
| CSRF protection | no (opt-in) | `app.use(csrf())` from `@arcis/node/middleware` |
| CORS | no (opt-in) | `app.use(cors())` from `@arcis/node/middleware` |
| Secure cookies | no (opt-in) | `app.use(secureCookies())` from `@arcis/node/middleware` |
| URL / redirect / file-upload validation | no (opt-in) | `validateUrl`, `validateRedirect`, `validateFile` from `@arcis/node/validation` |
| Error-leakage scrubbing | no (opt-in) | `app.use(errorHandler())` from `@arcis/node/middleware` |

The 8-payload `attack.js` exercises only what `arcis({ block: true })` ships out of the box. CSRF / CORS / cookies / bot / validation / error-scrub are deliberate opt-ins because every project enables them on different paths.

## Run it

```bash
npm install
npm start          # listens on http://localhost:3000
npm run attack     # in another shell — fires the demo payloads
```

Expected output:

```
Arcis attack demo against http://localhost:3000
----------------------------------------------------------------
OK     safe     safe input: 200 (passed through, as expected)
BLOCK  xss      <script> in query: 403 (Arcis denied, as expected)
BLOCK  xss      event handler: 403 (Arcis denied, as expected)
BLOCK  sql      '; DROP TABLE users; --: 403 (Arcis denied, as expected)
BLOCK  nosql    { $gt: "" } operator: 403 (Arcis denied, as expected)
BLOCK  path     ../../etc/passwd: 403 (Arcis denied, as expected)
BLOCK  command  ; rm -rf /: 403 (Arcis denied, as expected)
BLOCK  ssti     Jinja2 {{7*7}}: 403 (Arcis denied, as expected)
BLOCK  xxe      DOCTYPE ENTITY: 403 (Arcis denied, as expected)
----------------------------------------------------------------
8 attacks blocked, 1 safe call passed, 0 unexpected
```

## How it works

1. `app.use(arcis({ block: true }))` registers the full Arcis middleware stack: sanitization, security headers, rate limiting, and the deny path that returns 403 on attack patterns.
2. Each request flows through Arcis before reaching your handler.
3. Safe input (the first test) passes through unchanged. Attack payloads (the rest) are detected, blocked at the boundary, and never see the handler.

## What this demo doesn't do

This example uses `block: true` so the demo is visible. In production, the safer rollout pattern is to start in the default sanitize-and-observe mode (`arcis()` with no options), watch the logs to confirm there are no false positives on real traffic, then flip `block: true`. See the [Arcis docs](https://gagancm.github.io/arcis/documentation/configuration.html) for the full configuration surface.

For multi-framework demos: see [arcis-example-nextjs](https://github.com/getarcis/arcis-example-nextjs), [arcis-example-fastapi](https://github.com/getarcis/arcis-example-fastapi), [arcis-example-gin](https://github.com/getarcis/arcis-example-gin), [arcis-example-bun](https://github.com/getarcis/arcis-example-bun).

## License

MIT.

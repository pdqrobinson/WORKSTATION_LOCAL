# AppEmbed Session Protocol (Reference)

## Purpose

Render a local application inside a Golden Layout tile via a localhost streaming session.

## Flow

1. User request → AI proposes `launch_app(app_id)`
2. PolicyGuard checks allowlist + confirmation
3. AppEmbedService launches the app and starts a local streaming session
4. Backend emits `app_session_started` with `session_id` and `viewport_url`
5. Frontend opens AppEmbedTile and loads `viewport_url`
6. User closes tile → `close_app_session(session_id)` → backend stops the session

## Guardrails

- Allowlist-only app IDs
- Localhost-only `viewport_url` with session token
- One session per app ID
- Confirmation required for every session launch
- Cloud AI cannot call `launch_app` by default

## Session Token

**Format**: `token = base64url(32 bytes random)`  
**Usage**: `viewport_url = http://127.0.0.1:<port>/?token=<token>`

**Validation**:
- Token generated per session.
- Token validated on each request to streaming endpoint.
- Token expires when session closes.

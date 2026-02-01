# AppEmbed Backend (Reference)

## Linux-First Options

### Option A: X11 + xpra (recommended for v1)

- Launch app under a dedicated xpra session.
- Stream session over localhost only (e.g., `http://127.0.0.1:<port>`).
- Kill session when tile closes.

**Pros**: Mature, stable, simple to wrap.  
**Cons**: X11 dependency.

### Option B: Wayland + wayvnc

- Launch app in a nested compositor or use wayvnc.
- Stream VNC over localhost only.

**Pros**: Wayland-native.  
**Cons**: More complexity; less consistent across distros.

## Selected Backend (v1)

**Choice**: X11 + xpra  
**Rationale**: Lowest integration risk; stable; supports localhost-only streaming.

**Dependencies** (Linux):
- `xpra`
- `xvfb` (optional for headless)
- `xauth` (if needed by distro)

## Security Constraints

- Bind all streams to `127.0.0.1` only.
- One app per session.
- Session token required in `viewport_url` to prevent guessing.
- Confirmation required before each launch.

## Session Lifecycle

1. `launch_app(app_id)` → PolicyGuard allowlist + confirmation
2. Start backend session, capture port + token
3. Emit `app_session_started(session_id, viewport_url)`
4. `close_app_session(session_id)` → terminate backend and child app

## Cleanup

- Ensure child app is terminated on session close.
- Ensure orphaned sessions are reaped on app exit.

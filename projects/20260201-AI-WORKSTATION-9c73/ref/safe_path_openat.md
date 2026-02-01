# TOCTOU-Resistant Path Strategy (Reference)

## Goal

Bind the validated path to the executed file handle to prevent symlink swaps or path replacement between validation and execution.

## Linux Strategy (Preferred)

1. **Open the safe root as a directory FD**:
   - Use `open()` or `openat()` on the canonical safe directory with `O_DIRECTORY | O_RDONLY`.
2. **Resolve user-relative paths inside the safe root**:
   - Use `openat()` with `O_NOFOLLOW` for each path segment if available.
   - Reject if any segment is a symlink.
3. **Operate on the final FD**:
   - Read/write/delete using the FD (not the original string path).

## Rules

- Never re-open by string path after validation.
- Deny symlink traversal by default for write and destructive operations.
- Allow explicit opt-in for symlink reads only if required and audited.

## Pseudocode

```rust
fn open_safe_path(root: &Path, rel: &Path) -> Result<RawFd, Error> {
    let root_fd = open(root, O_DIRECTORY | O_RDONLY)?;
    let mut fd = root_fd;
    for segment in rel.components() {
        fd = openat(fd, segment, O_NOFOLLOW | O_RDONLY)?;
    }
    Ok(fd)
}
```

## Non-Linux Notes

- macOS: use `openat()` + `O_NOFOLLOW` where supported; consider `fcntl` to check `F_GETPATH`.
- Windows: use `CreateFile` with `FILE_FLAG_OPEN_REPARSE_POINT` to avoid following symlinks.

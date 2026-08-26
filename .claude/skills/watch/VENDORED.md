# Vendored skill: `watch`

Source: https://github.com/bradautomates/claude-video (MIT, see `LICENSE`)
Upstream commit: `83da59fa78c3eee9e20f515fe75c438bb5166efd`
Skill version: `0.2.0`

Upstream ships this as a Claude Code *plugin* (`/plugin marketplace add
bradautomates/claude-video`). The plugin commands are not available in every
surface (e.g. Claude Code on the web), so the skill folder is vendored here
instead. `skills/watch/` upstream is self-contained — `SKILL.md` resolves its
own `scripts/` relative to wherever it was installed — so a plain copy into
`.claude/skills/` works identically.

## Updating

    git clone --depth 1 https://github.com/bradautomates/claude-video /tmp/claude-video
    rm -rf .claude/skills/watch/scripts .claude/skills/watch/SKILL.md
    cp -R /tmp/claude-video/skills/watch/. .claude/skills/watch/
    # then refresh the commit hash above

The upstream `hooks/` SessionStart status hook is intentionally not vendored:
it depends on `$CLAUDE_PLUGIN_ROOT`, which only exists for plugin installs.
`SKILL.md`'s own Step 0 preflight covers the same setup checks.

## Runtime requirements

- `ffmpeg`, `ffprobe`, `yt-dlp` on PATH (`python3 scripts/setup.py` installs
  them via Homebrew on macOS; prints the commands elsewhere)
- Python 3 standard library only — no pip packages
- Optional `GROQ_API_KEY` or `OPENAI_API_KEY` in `~/.config/watch/.env` for the
  Whisper transcript fallback; videos with native captions work without one

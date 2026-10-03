# AGENTS.md

<!-- cc-profile:agents:start (generated) -->
## Shared agent rules

Every rule here traces to a real incident. Add rules only with an incident behind them; delete rules that stop firing.

### Memory

- The memory plane is **agentmemory** (hub `http://localhost:3111`, MCP `agentmemory`, skills `/remember` `/recall` `/handoff` `/recap` `/scratchpad`). Durable knowledge — decisions, gotchas, how-things-work, cross-session state — goes there via `remember`; past-work questions go through `recall`/`smart-search` FIRST, before grep-archaeology or any per-tool memory. Do not create new per-agent or per-tool memory silos.
- Active multi-step work uses **scratchpad slots** (`memory_slot_*`, keyed by ticket or branch) so Cursor, Claude Code, and Codex share WIP state. Promote durable learnings with `memory_save`/`memory_lesson_save`, then delete the slot when done.
- **Scoping**: project-specific memory uses the `project` field (auto-derived from cwd); machine-wide knowledge uses no project plus concept tag `global`. Recall project-first, then global/unfiltered.
- When continuing implementation after a prior agent session, treat recent agentmemory observations for the same project/topic as the default source of truth unless the code has since diverged.

### Orchestration

- The main agent plans, scopes, integrates, and resolves decisions; subagents execute concrete edits. Use the smaller/cheaper model for execution, the strongest model for conflict-laden merges, cross-cutting refactors, and subtle debugging.
- **Route work by task type to the matching skill, not a bespoke per-agent file.** Skills are portable across coding agents (Claude Code, Cursor, Codex); per-harness subagent tool/MCP scoping is not. Use: `explorer` for investigating a bug, tracing code, or read-only impact analysis; `designer` for planning an approach or breaking work into tasks; `developer` for implementing a scoped change from a plan/brief; `code-reviewer` for reviewing a diff; `design-reviewer` for reviewing a design/plan before implementation. (2026-09-15, playr session: Cursor/Codex agent formats can't express tool restriction.)

### Working rules

- When a constraint has ambiguous units or type (length limit, field type, API shape), state the assumption explicitly before building — don't guess.
- Before any destructive or scope-expanding change (removing files from git, changing tracked configs, deleting branches), state the rationale and confirm there isn't a smaller fix.
- For tooling, library versions, or external APIs, verify instead of answering from memory — prefer context7 docs, else web search.
- Before speccing tests, confirm the test tooling actually exists in the project (check package.json / lockfile) — don't assume a library is installed.
- If you notice a security issue outside the task scope, flag it — don't silently fix it.
- When you don't know something, say "I'm not sure about X" and propose how to verify it — never guess an answer.
- Create worktrees under `.worktrees/<name>` inside the repo (gitignored), not an external directory.
- Put repo-related scratch files in `.tmp/` inside the repo (gitignored), not `/tmp`. Doesn't override a harness's own per-session scratchpad.
- This repo is self-sufficient: plugins, skills, MCP servers and these rules are declared here, not in user-global config. Need something new? Add it to this repo (`cc-profile`, `npx skills add`, `.mcp.json`).

### Communication

- Short responses by default; extremely concise when reporting — sacrifice grammar for concision. Conclusions first, reasoning after. Don't sugarcoat technical risks.
- No cheerleading, no filler, no "great question".
- Disagree when you have good reason; state your confidence.
- If something is unclear, ask one focused question — not five.
<!-- cc-profile:agents:end -->

<!-- cc-profile:claude:start (generated) -->
## Claude Code specifics

- **Fable is the architect, not the builder.** When the main session runs Fable (or any Mythos-class model), it plans, designs, reviews, orchestrates, and resolves decisions; it does not write or edit code itself beyond trivial one-line fixes and config nudges. Every implementation, refactor, test-writing, exploration, and mechanical-edit task goes to a subagent (Agent tool): `model: "sonnet"` by default; `model: "opus"` only for judgment-heavy work. Fable verifies the subagent's result (run the checks, read the diff) and commits. (2026-09-02, loop-design session burning Fable tokens; 2026-09-03, narada restructure confirming the split.)
- The harness's file memory (`memory/` + MEMORY.md) is for session-bootstrap pointers only. Full memory content belongs in agentmemory.
<!-- cc-profile:claude:end -->

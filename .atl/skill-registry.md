# Skill Registry — Luden

Generated: 2026-03-28
Stack: Laravel + Vue + Inertia.js + PWA

## User Skills

| Skill | Trigger | Source |
|-------|---------|--------|
| go-testing | Go tests, Bubbletea TUI testing | ~/.claude/skills/go-testing/ |
| skill-creator | Creating new AI skills, documenting patterns | ~/.claude/skills/skill-creator/ |
| branch-pr | Creating PRs, preparing changes for review | ~/.claude/skills/branch-pr/ |
| issue-creation | Creating GitHub issues, reporting bugs | ~/.claude/skills/issue-creation/ |
| judgment-day | Adversarial review, quality gates | ~/.claude/skills/judgment-day/ |

## Compact Rules

### branch-pr
- Follow issue-first enforcement: every PR must reference an issue
- Use `gh pr create` with structured body (Summary, Test Plan)

### issue-creation
- Use `gh issue create` with structured body
- Label and assign appropriately

### judgment-day
- Launch two blind judge sub-agents in parallel
- Synthesize findings, apply fixes, re-judge until pass

## Project Conventions

- No project-level CLAUDE.md yet (fresh repo)
- No linters, CI, or test frameworks configured yet
- Stack will be: Laravel + Vue + Inertia.js + PWA

## Notes

- `go-testing` skill not relevant for this project (PHP/JS stack)
- `skill-creator` available if project-specific skills are needed later

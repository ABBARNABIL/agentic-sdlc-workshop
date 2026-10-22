# Scripts

Utility scripts for running the Agentic SDLC Hackathon.

## `seed-backlog.sh` / `seed-backlog.ps1` — Seed the Challenge 3 backlog

These scripts create the [Challenge 3 backlog](../assets/backlog.md) as real **GitHub Issues** in a
repo, so teams pick from a real, prioritised, labelled list instead of inventing a backlog. The seeded
issues are also what an MCP server can pull as **real backlog context** in the Challenge 3 optional stretch.

Both scripts do the same thing — use the `.sh` on macOS/Linux and the `.ps1` on Windows.

### What they do

- Ensure the labels `backlog`, `priority:high`, `priority:medium`, and `priority:low` exist (created if
  missing; existing labels are tolerated).
- Create one issue per backlog item, with a title, a body derived from `assets/backlog.md`
  (description + acceptance criteria + affected layers), and the `backlog` + priority labels.
- Skip any item whose title already matches an **open** issue, so the scripts are safe to re-run.
- Print a summary of labels ensured, issues created, and issues skipped.

By default **8 issues** are seeded — one per item in `assets/backlog.md`. To change the set, edit the
backlog items in the script (and keep it in sync with `assets/backlog.md`).

### Prerequisites

- **GitHub CLI** installed — https://cli.github.com/
- **Authenticated with your own GitHub account** and `repo` scope — `gh auth login`. Run the scripts against your own fork; no workshop account or pre-seeded repository is supplied.

If `gh` is missing or unauthenticated, the scripts stop with a clear, actionable message before making
any changes.

### Usage

Run from your own fork's repository root. In the explicit-target examples, replace `YOUR-USERNAME/YOUR-FORK` with your actual GitHub owner and repository.

**Bash (macOS / Linux):**

```bash
# Seed the current repo (the one gh resolves for this directory)
./scripts/seed-backlog.sh

# Explicitly target your own fork
./scripts/seed-backlog.sh --repo YOUR-USERNAME/YOUR-FORK

# Preview only — prints what would be created, no API calls
./scripts/seed-backlog.sh --dry-run
```

**PowerShell (Windows):**

```powershell
# Seed the current repo
./scripts/seed-backlog.ps1

# Explicitly target your own fork
./scripts/seed-backlog.ps1 -Repo YOUR-USERNAME/YOUR-FORK

# Preview only — no API calls
./scripts/seed-backlog.ps1 -DryRun
```

> On macOS/Linux you may need to make the script executable first: `chmod +x scripts/seed-backlog.sh`.

### When to run it

- **Optionally before Challenge 3.** Seed your own fork if you want to work from GitHub Issues. You can instead choose directly from `assets/backlog.md`; no issue seeding is required.
- **Do a `--dry-run` first** to confirm the target repo and see the list before creating anything.
- It's safe to re-run if a repo was missed or you want to top up after manual edits — duplicates are
  skipped by title.

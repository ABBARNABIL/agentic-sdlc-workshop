# Agentic SDLC workshop

**[Open the workshop guide](https://abbarnabil.github.io/agentic-sdlc-workshop/)** · [Start here](SETUP.md) · [Full workshop overview](WORKSHOP.md)

A guided, self-paced community adaptation of Microsoft's **Agentic SDLC MicroHack**. Use GitHub Copilot to take the Octocat Supply app through seven complete challenges: environment setup, cart implementation, a backlog feature, tests and review, Azure deployment, SRE operations, and agentic maintenance.

The guide adds ordered navigation, a connected workshop route, on-page sections, copyable commands/prompts, browser-local success checklists and resume, light/dark/system appearance, static search, and explicit per-visit solution spoilers. Reading needs no account or backend. There is no site telemetry or cross-device progress service.

Use **Theme** in the header to choose **System**, **Light**, or **Dark**. System follows your device; an explicit choice is saved locally across pages and visits, separately from workshop progress. Colors are applied before the first paint, diagrams update with the theme, and blocked storage is reported instead of claiming a preference was saved. Without JavaScript, the guide still follows your device's color scheme.

## For participants

Use **your own GitHub account** with active GitHub Copilot access and fork this repository into your account or an organization you control. Use **your own Azure subscription** for the Azure challenges. No accounts, subscriptions, or preconfigured lab environments are supplied. Follow **[SETUP.md](SETUP.md)** before Challenge 1.

In your fork, create a Codespace using the single **Agentic SDLC** dev container, or open the root in VS Code Dev Containers. The container installs and builds the default TypeScript API and frontend. Run `cd src` and `make dev`, then open the **private** forwarded port 5137. Local PowerShell-friendly npm commands and alternate API tracks are in the setup guide.

| Location | Purpose |
| --- | --- |
| `challenges/`, `walkthrough/`, `WORKSHOP.md` | Complete challenge and solution Markdown |
| `src/` | Runnable React frontend, four API tracks, shared SQLite, app docs |
| `assets/` | Product backlog and fictional WorkIQ inputs |
| `infra/`, `scripts/` | Deliberately incomplete Azure scaffolding and reviewed opt-in helpers |
| `.devcontainer/`, `.vscode/`, `.github/` | Participant environment, instructions, and agents |
| `website/` | Independent Astro static guide, client enhancements, and site tests |
| `provenance/`, `LICENSE.upstream` | Immutable source manifest, adaptations, original Microsoft MIT notice |

Challenges 1–4 need no Azure resources. Challenges 5–6 use your own Azure subscription and require a budget and suitable permissions; charges are billed to your subscription. Create a dedicated workshop resource group and do not use production resources. Read the **[finish and cleanup checklist](challenges/finish.md#clean-up-your-workshop-resources)** before deploying.

The Azure exercise is **inactive** as `.github/workflows/deploy.yml.example`. Complete and review it before deliberately copying it to `deploy.yml` in your own fork. The only active workflow, `pages.yml`, publishes this static guide and does not provision Azure, create credentials, or complete any exercise.

## Author the guide locally

Use **Node.js 24**. Site dependencies and its lockfile are isolated from the exercise app:

```bash
cd website
npm ci
npm run dev
```

Open `http://localhost:4321/agentic-sdlc-workshop/`. All routes, scripts, fonts, and search requests use the real project base path. Set `ASTRO_TELEMETRY_DISABLED=1` in your shell if you do not want the Astro CLI's own opt-out usage reporting; the published site has no telemetry.

Edit the workshop Markdown in place; do not create a second copy under the website. Routes, headings, checklists, rewritten links, and the non-solution search index are derived at build time. Code and configuration links point to their actual GitHub paths rather than fake website routes. Linked Markdown is rendered as reference guides; embedded local images are emitted as site assets.

From `website/`:

```bash
npm run validate
```

This runs content/import coverage, progress and search unit tests, strict Astro/TypeScript checks, the static build, and an emitted HTML/CSS/search link-and-asset check. The build also includes complete third-party notices, including the self-hosted font license.

For the browser suite, use Python 3 with the pinned Playwright dependency and its Chromium browser:

```bash
python -m pip install -r requirements-test.txt
python -m playwright install chromium
npm run preview -- --port 4321
```

With the preview running, in a second terminal in `website/`:

```bash
python tests/browser.py --base-url http://localhost:4321/agentic-sdlc-workshop/
```

Screenshots are written to ignored `test-results/`. The suite checks every challenge and solution, explicit spoiler reveals, copy success/failure, persisted criteria and completion, resume/reset, storage failures, search and fetch failures, keyboard/mobile navigation, light/dark/system themes and first-paint preference, Mermaid, no-JavaScript reading, deep links, and horizontal overflow. `--base-url` can also target the deployed site. The exercise app has its own tests under `src/`; the site suite does not run Azure scripts.

Astro's preview command may run as a background server. Stop it after checking with `npx astro preview stop` from `website/`.

## Publish to GitHub Pages

The approved repository uses **Settings → Pages → Source: GitHub Actions**. A push to `main` or a manual run of **Publish workshop guide** restores `website/package-lock.json`, checks/builds the site, validates emitted links, uploads `website/dist`, and deploys to the `github-pages` environment.

Canonical site: **https://abbarnabil.github.io/agentic-sdlc-workshop/**. Forks must deliberately configure Pages and update `website/astro.config.mjs` and `website/src/lib/site.ts` for their owner, repository, base path, and repository links before publishing their own copy. If you only want to do the exercises, disable the Pages workflow in your fork; use the published guide alongside your code.

Do not copy the Azure exercise into an active workflow just to publish the guide. No Azure subscription, PAT, service principal, OIDC identity, or deployment secret is required for Pages.

## Attribution and updates

Original workshop: **microsoft/MicroHack**, by **Francesco Lana / Frank802**, imported from commit **`ee974780023dbc9670817a639e1d8e8fa840a6c6`**. This is a community adaptation and does not imply Microsoft endorsement.

The complete Microsoft MIT notice is preserved in **[LICENSE.upstream](LICENSE.upstream)**. Original site additions use the repository's **[MIT license](LICENSE)**. See **[provenance/README.md](provenance/README.md)** for the immutable source link, all 278 original blob identities, adaptation record, and bounded, review-first refresh process.

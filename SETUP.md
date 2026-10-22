# Start here

Get a working app and the right permissions before asking an agent to change it. Reading this guide needs no account. Doing the exercises needs your own tools and a repository you can write to.

## Choose your account and fork

**Self-paced or team setup:** use a GitHub account with an active Copilot seat and fork [ABBARNABIL/agentic-sdlc-workshop](https://github.com/ABBARNABIL/agentic-sdlc-workshop/fork) into an account or organization you control. Clone or open **your fork**, not the upstream MicroHack monorepo. Use a feature branch for the exercises.

**Facilitated event:** use the account, organization, repository name, and Azure scope your facilitator supplies. The original `labuser-0000_ms000000` and `MngEnvMCAP000000` values are event-specific placeholders, not credentials. Do not try to sign in with them or assume you have access to that organization.

Check the remote before creating issues, pushing code, or configuring OIDC:

```bash
git remote -v
git status
git switch -c workshop/my-session
```

The application intentionally has missing features. Building the cart, tests, and Azure pipeline is the workshop, not an installation step.

## Check prerequisites

* **GitHub Copilot:** an active seat with Chat and the agent capabilities you intend to use. Ask your administrator about CLI, MCP, coding-agent, code-review, and agentic-workflow policies; availability varies by plan and organization. A real response about an open source file is the check, not just an installed extension.
* **An editing environment:** GitHub Codespaces, VS Code with Docker and Dev Containers, or local VS Code and the runtimes below. Codespaces compute and storage can incur charges.
* **Runtime choices:** Node.js **24** and npm for the frontend and default TypeScript API. For another API, use Python **3.13**, .NET **10**, or Java **17** with Maven. Run only one API at a time; all variants use port **3000**.
* **For Challenges 5 and 6 only:** a budgeted Azure subscription, a dedicated team resource group, Contributor on the intended scope, the extra roles your SRE Agent requires, supported region/capacity, and a GitHub-to-Azure OIDC federated identity. If you cannot create federated credentials or role assignments, involve your administrator.

You can do Challenges 1–4 without Azure. Challenge 6 requires a working Challenge 5 deployment or an explicitly authorized shared reference deployment. Do not mark skipped exercises complete.

## Open the development environment

### Codespaces or Dev Containers

In **your fork**, choose **Code → Codespaces → Create codespace on main**. There is one root configuration, **Agentic SDLC**; you do not need the upstream monorepo's track picker. For local VS Code, open the repository root and choose **Dev Containers: Reopen in Container**.

The container installs Node 24, Python 3.13, .NET 10, Java 17, Maven, make, SQLite, GitHub CLI, and Azure CLI. Creation installs and builds the default TypeScript API and frontend. If creation fails, read the creation log and resolve the reported dependency or network problem before continuing.

Run app commands from `src/`:

```bash
cd src
make dev
```

Open the forwarded **5137** frontend port. Keep it and the API port private. Vite proxies `/api` to port 3000 inside the environment, so you do not have to publish an unauthenticated API. The guide itself is in `website/` and is a separate application.

### Local setup, including Windows

From the repository root, install and build the two packages:

```bash
npm --prefix src/api-ts ci
npm --prefix src/frontend ci
npm --prefix src/api-ts run build
npm --prefix src/frontend run build
```

Start the API in one terminal:

```bash
npm --prefix src/api-ts run dev
```

Start the frontend in a second terminal:

```bash
npm --prefix src/frontend run dev
```

Open [http://localhost:5137](http://localhost:5137). The API is at [http://localhost:3000/api/products](http://localhost:3000/api/products), with OpenAPI at [http://localhost:3000/api-docs](http://localhost:3000/api-docs). The SQLite database is initialized and seeded on API startup. Do not use real customer data or payment details in this demo.

These npm commands also work in PowerShell, without make. If you prefer make, use the container, WSL, or a suitable local toolchain. `better-sqlite3` may need native build tools if a prebuilt binary is unavailable.

### Choose another API

From `src/`, first run the matching install target (`make install-cs`, `make install-py`, or `make install-java`) and `make install-frontend`. Then use `make dev-cs`, `make dev-py`, or `make dev-java`. You do not need to install every language track to do the workshop locally. See [the application guide](src/README.md) and [build instructions](src/docs/build.md).

## Confirm the baseline

Load the product catalogue and confirm products come from the API. Stop and fix startup errors rather than asking an agent to build on a broken environment.

From the repository root:

```bash
npm --prefix src/api-ts run test -- --run
```

The frontend's existing tests use Playwright. In `src/frontend`, install its browser with `npx playwright install chromium`, then run `npm test`. The API tests cover the default track; other tracks have their own commands in `src/README.md`. Test additions during the workshop should use the existing app frameworks.

Review `.vscode/mcp.json` before enabling any MCP server. Servers may download tools, request authentication, or expose external data/actions; none is needed just to read this site or run the default app. Enable only what you intend to use.

## Before you deploy to Azure

Azure Container Apps, Container Registry, Log Analytics, storage, SRE Agent, and supporting services may incur charges. Set a spending budget and agree who will remove the resources. Use a dedicated, non-production resource group. The starter Bicep and workflow are **incomplete teaching scaffolds**, not production defaults.

The Azure workflow is stored as [`.github/workflows/deploy.yml.example`](.github/workflows/deploy.yml.example), so Actions will not run it. Only the separate Pages workflow is active. Finish and review the exercise workflow **in your own fork**, then copy it to `deploy.yml` when you deliberately opt in. Use your real fork and branch/environment in the OIDC subject; never commit credentials. No Azure provisioning or credential creation is performed by this guide.

Read the [finish and cleanup checklist](challenges/finish.md#clean-up-your-workshop-resources) now, before creating resources. For a shared environment, ask its owner before changing or deleting anything.

## How progress and solutions work

Check success criteria only after you have demonstrated them, then mark the challenge complete. Progress and the resume location stay in **this browser on this device**, using local storage; there is no account, backend, analytics, or cross-device sync. Private browsing, clearing site data, or blocked storage can erase progress. The interface reports storage failures instead of claiming it saved.

Solution pages require an explicit **Reveal solution** action on every visit and are excluded from search. This is a spoiler boundary, not access control: their source is public. The full learning material remains in Markdown in the repository.

Continue to [Challenge 1](challenges/challenge-01.md).

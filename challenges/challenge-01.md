# Challenge 1 - Dev environment, Copilot access & repo overview

**[Home](../WORKSHOP.md)** - [Next Challenge](challenge-02.md)

> **Before you start: use your own account and fork.** Sign in with **your own GitHub account** with active GitHub Copilot access and fork **ABBARNABIL/agentic-sdlc-workshop** into your account or an organization you control. No accounts or lab credentials are supplied. All later commits, issues, pull requests, Actions runs, and OIDC subjects must target **your actual fork**. For Challenges 5 and 6, you will use **your own Azure subscription** and create your own workshop resources. See [Start here](../SETUP.md).
>
> **Standalone Codespaces setup.** In your fork, use **Code → Codespaces → Create codespace on main**. This repository has one root dev container, named **Agentic SDLC**; the upstream monorepo's “Azure / AI / Agentic SDLC” picker is not needed here. The workspace opens at the repository root. Run app commands from `src/`; the `website/` directory builds this guide, not the exercise app.

## Goal

Configure your development environment, confirm GitHub Copilot access, and get familiar with the **Octocat Supply** application so the later challenges run without setup interruptions.

The Octocat team is behind schedule and adopting Agentic Development practices. Before you can help deliver features, you need a working environment, Copilot enabled, and a clear picture of the codebase.

## Actions

* **Get the code** — Open your own fork of this repository in **GitHub Codespaces** (recommended), a local **VS Code Dev Container** (`.devcontainer/`), or locally. Confirm you're on the intended working branch.
* **Verify runtimes** — Confirm the runtimes for your chosen API track are available (TypeScript, Python, .NET, or Java) plus Node.js for the frontend. In Codespaces / the Dev Container these are preinstalled.
* **Enable GitHub Copilot** — Sign in and confirm your Copilot entitlement is active in your IDE; install the GitHub Copilot / Copilot Chat extensions.
* **Explore the repo** — Review the structure: `src/` (the app, with `src/docs/` architecture guidance), `infra/` + `scripts/` (Azure setup and deployment), `assets/` (Challenge 3 backlog & WorkIQ inputs), and `.github/` (Copilot custom instructions & agents). Identify where the frontend, APIs, and database live. Read `src/README.md` for the code structure and build commands.
* **Run the app locally** — Start the frontend and one API to confirm the application builds and runs before you begin changing it.

## Success criteria

* Your own fork is open in your environment under your GitHub account, and Copilot is active and responding in your IDE.
* You can build and run the frontend and at least one API locally.
* You can describe, at a high level, how the frontend, APIs, and database fit together.

### Optional stretch — repo-wide agent context

Give Copilot persistent, repo-wide context so later challenges start with your conventions loaded.

* Create an `AGENTS.md` and/or `.github/copilot-instructions.md` recording coding conventions, naming, and preferred patterns.
* Record the exact **build and test commands** for your API track (and the frontend) so an agent can verify its own work.
* Add explicit **scope rules** (e.g. don't touch generated files, infra, unrelated services) to keep agent diffs minimal.
* In a fresh Copilot Chat, ask a question that relies on those conventions **without restating them** and confirm they're applied.

## Learning resources

* [Setting up GitHub Copilot](https://docs.github.com/en/copilot/quickstart)
* [GitHub Codespaces](https://docs.github.com/en/codespaces/overview)
* [Development Containers](https://containers.dev/)
* [Adding repository custom instructions for Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)

# Source, license, and adaptations

This is an independently maintained community adaptation, not an official Microsoft product or an endorsed Microsoft workshop website.

## Original workshop

* **Repository:** [microsoft/MicroHack](https://github.com/microsoft/MicroHack).
* **Pinned commit:** [`ee974780023dbc9670817a639e1d8e8fa840a6c6`](https://github.com/microsoft/MicroHack/commit/ee974780023dbc9670817a639e1d8e8fa840a6c6).
* **Subtree:** [`03-Azure/01-04-AI/01_Agentic_SDLC`](https://github.com/microsoft/MicroHack/tree/ee974780023dbc9670817a639e1d8e8fa840a6c6/03-Azure/01-04-AI/01_Agentic_SDLC).
* **Subtree tree SHA:** `8173c5a2ae5a396662a345e90e4013f5cadae0ac`.
* **Workshop contributor:** Francesco Lana ([Frank802](https://github.com/Frank802)), credited by the original workshop.
* **License:** MIT, Copyright (c) Microsoft Corporation. The complete original notice is preserved verbatim in [LICENSE.upstream](../LICENSE.upstream) and applies to the imported workshop material. The original root license is at [this immutable upstream URL](https://github.com/microsoft/MicroHack/blob/ee974780023dbc9670817a639e1d8e8fa840a6c6/LICENSE).

The site, standalone integration, and other original additions are covered by this repository's [MIT license](../LICENSE). Imported source and bundled images remain attributed to their upstream source; no ownership of Microsoft or GitHub trademarks is claimed.

The guide self-hosts Atkinson Hyperlegible by the Braille Institute of America under the SIL Open Font License. Build-time dependencies and bundled browser libraries retain their respective licenses; the published site's [third-party notices](https://abbarnabil.github.io/agentic-sdlc-workshop/third-party-notices.txt) include the original font notice.

## What was imported

All **278 files** from the pinned workshop subtree were downloaded from public, read-only GitHub endpoints and verified against their Git blob SHA-1 values. [upstream-tree.json](upstream-tree.json) records every original path, file size, mode, and blob SHA. This is the original import manifest, not a claim that adapted files remain byte-identical.

The application, four API tracks, shared SQL, assets, backlog, fictional WorkIQ inputs, infrastructure, scripts, configuration, seven complete challenges, seven walkthroughs, and finish page are included. These are teaching assets, not a security-hardened production application.

## Standalone adaptations

* The overview `Readme.md` is named `WORKSHOP.md` to avoid a case-insensitive collision with the new repository `README.md`. Internal links were updated.
* Site code lives only in `website/`; application code remains in `src/`. Markdown is rendered from these source files, not maintained as a divergent copy.
* The Azure exercise workflow is named `.github/workflows/deploy.yml.example`, outside Actions' recognized `.yml`/`.yaml` set. It remains deliberately incomplete and requires explicit participant activation. `pages.yml` is the separate site-only publishing pipeline.
* Setup, prerequisites, challenges, and walkthroughs require each participant's own GitHub account and Azure subscription. The upstream event-specific account instructions were removed; no accounts, subscriptions, or shared lab environment are supplied. `SETUP.md` documents explicit Azure subscription selection, runtime choices, permissions, costs, and honest local progress.
* Backlog seeding is an optional action against the participant's own fork, not pre-event provisioning of supplied repositories.
* The dev container now builds the supplied Dockerfile so make and SQLite are installed. It no longer makes ports public automatically. VS Code tasks/debug paths point to `src/` and the real TypeScript build target.
* Repository Copilot instructions distinguish guide maintenance from exercise work and name the correct default and per-language commands.
* The frontend uses Vite's same-origin API proxy during development and allows only the current Codespace's exact forwarded hostname. Make targets no longer force a separate public Codespaces API URL. Explicit deployment/runtime API settings remain supported.
* Default npm installs use the imported lockfiles. Documentation clarifies working directories, the default TypeScript-only install, Java 17, private port forwarding, and separate guide/app commands.
* LF checkout rules preserve the imported text blob identities on Windows as well as Linux.
* Cost and permission notices precede the Azure exercises; the finish page adds a resource, identity, automation, and Codespaces cleanup checklist.
* The website adds ordered navigation, section links, copy buttons, local progress/resume, static search that excludes solutions, and explicit per-visit solution reveals. The original instructional prose, success criteria, optional stretches, resources, tables, code, and diagrams are retained.

## Refresh safely

Use Node 24 and run the bounded importer from the repository root:

```bash
node tools/import-upstream.mjs --output .upstream-import
```

The importer is pinned to the commit and subtree above, refuses an existing output directory, checks the complete non-truncated manifest, and verifies every blob before writing it. It does not run imported code or Azure scripts, alter the working copy, or use a GitHub token.

Review a staged import before applying changes. Keep this manifest and license with the source, reapply the documented adaptations, and review new executable files/workflows before activation. For a deliberate version update, change the pin and expected tree SHA together, document the reason, and regenerate provenance. Never blindly copy an upstream `.github/workflows` folder over the active Pages workflow.

After content changes, run the site's content/unit checks, type check, build, emitted-link check, and browser flows. See the root [README](../README.md) for exact commands.

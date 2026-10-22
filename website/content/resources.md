# Workshop resources

The full starter is in this repository. Markdown guides open here; code, configuration, and folders open at their real location on GitHub. Download or fork the **whole repository** so shared SQL, scripts, and relative paths stay together.

## Run Octocat Supply

Start with [account and environment setup](../../SETUP.md), then use [the application guide](../../src/README.md). The [build and test guide](../../src/docs/build.md), [architecture](../../src/docs/architecture.md), and [SQLite integration notes](../../src/docs/sqlite-integration.md) provide the supporting context.

Choose one API track: [TypeScript](../../src/api-ts/README.md), [C#](../../src/api-cs/README.md), [Python](../../src/api-py/README.md), or [Java](../../src/api-java/README.md). They share the [React frontend](../../src/frontend/) and [SQL schema](../../src/database/). The frontend and API are an exercise app, not this static guide.

## Backlog and organizational signal

Choose a feature from [the complete product backlog](../../assets/backlog.md). The [mock WorkIQ guide](../../assets/workiq/README.md) links the fictional [Teams thread](../../assets/workiq/teams-thread-launch-promo.md), [support tickets](../../assets/workiq/support-tickets-digest.md), and [stakeholder email](../../assets/workiq/stakeholder-email-launch-priorities.md).

You do not need a live Microsoft 365 connection to use these files. They are fictional workshop inputs.

## Azure and automation

The [infrastructure guide](../../infra/README.md) explains the deliberately incomplete [Bicep scaffold](../../infra/). The [Azure workflow example](../../.github/workflows/deploy.yml.example) is inactive until you explicitly complete and activate it in your own fork.

The [script guide](../../scripts/README.md) describes backlog issue seeding; [setup-oidc.sh](../../scripts/setup-oidc.sh) is a helper that creates Azure identity configuration when deliberately run. Review the target, permissions, and costs before running any script that changes GitHub or Azure.

[Challenge 5](../../challenges/challenge-05.md) covers deploying the app, [Challenge 6](../../challenges/challenge-06.md) covers SRE operations, and [Finish](../../challenges/finish.md#clean-up-your-workshop-resources) covers cleanup. Publishing this guide does not perform any of those exercises.

## Editor and Copilot configuration

Inspect the [dev container](../../.devcontainer/), [VS Code configuration](../../.vscode/), [Copilot instructions](../../.github/copilot-instructions.md), [path-scoped instructions](../../.github/instructions/), and [Requirement Refiner agent](../../.github/agents/README.md). Enable only the MCP servers you intend to trust.

## Solutions

Each challenge links to its own solution page. Every solution asks you to opt in before showing the worked approach, even on a direct visit. Solutions are not in the search index. They are guidance rather than a pre-completed application.

## Source and licensing

Read [the immutable import provenance and adaptation record](../../provenance/README.md). The complete original [Microsoft MIT notice](../../LICENSE.upstream) accompanies the imported material. This is a community adaptation without Microsoft endorsement.

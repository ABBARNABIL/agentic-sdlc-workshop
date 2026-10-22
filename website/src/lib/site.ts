export const BASE = '/agentic-sdlc-workshop/';
export const SITE = 'https://abbarnabil.github.io';
export const REPO = 'https://github.com/ABBARNABIL/agentic-sdlc-workshop';
export const UPSTREAM_COMMIT = 'ee974780023dbc9670817a639e1d8e8fa840a6c6';

export function withBase(slug = ''): string {
  return `${BASE}${slug.replace(/^\/|\/$/g, '')}${slug ? '/' : ''}`;
}

export function repositoryUrl(source: string, directory = false): string {
  return `${REPO}/${directory ? 'tree' : 'blob'}/main/${source.split('/').map(encodeURIComponent).join('/')}`;
}

export const challengeLabels = [
  'Workspace & Copilot',
  'Build the cart',
  'Work the backlog',
  'Test & review',
  'Deploy to Azure',
  'Operate with SRE',
  'Maintain with agents',
] as const;

export const challengeSummaries = [
  'Run the app, check your tools, and understand the codebase.',
  'Deliver a working, API-backed shopping cart.',
  'Take one feature through plan, implement, test, and review.',
  'Exercise the edge cases and address real review findings.',
  'Build a repeatable pipeline with IaC and OIDC.',
  'Detect, diagnose, and remediate a controlled fault.',
  'Run a low-risk maintenance workflow with guardrails.',
] as const;

export const starterPrompts = [
  'Read src/README.md and the architecture docs. Explain the frontend, my chosen API track, and shared SQLite schema. Identify the exact existing build and test commands. Do not change files.',
  'Inspect the current cart in the frontend and my chosen API track. Propose a scoped plan for add, update quantity, remove, and accurate totals with API persistence. Follow the existing types and repository patterns. Wait for my review before implementing.',
  'Read assets/backlog.md. Help me select one testable feature, then propose a plan with files and layers in scope, acceptance criteria, existing test commands, and a review step. Keep secrets and unrelated files out of the change.',
  'Review the tests for the cart and the backlog feature we just changed. Identify missing edge cases and error paths. Extend only the existing test frameworks, run the focused suites, and rank review findings by security, correctness, and data integrity.',
  'Read infra/README.md and .github/workflows/deploy.yml.example. List the unfinished decisions and propose a build, test, provision, and deploy plan for my authorized workshop resource group. Use OIDC, explain costs and cleanup, and do not provision anything without my explicit approval.',
  'Help me plan a controlled reliability exercise for my authorized, non-production deployment. Confirm telemetry, SRE permissions, the fault, rollback, and spending limit before making any change. Capture what the agent diagnoses versus what I investigate manually.',
  'Propose one low-risk, real maintenance task for this repository. Design a GitHub Agentic Workflow with explicit triggers, least-privilege tools, scoped outputs, and human review. Explain how I can trigger it and verify that it did useful work before enabling a schedule.',
] as const;

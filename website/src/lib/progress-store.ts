export interface StepConfig { id: string; slug: string; criteria: string[] }
export interface StepProgress { checked: string[]; complete: boolean }
export interface Progress { version: 1; steps: Record<string, StepProgress>; lastStep: string | null }
export const STORAGE_KEY = 'agentic-sdlc-workshop:progress:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStepConfig(value: unknown): value is StepConfig[] {
  return Array.isArray(value) && value.every(item =>
    isRecord(item) && typeof item.id === 'string' && typeof item.slug === 'string' &&
    Array.isArray(item.criteria) && item.criteria.every(id => typeof id === 'string'));
}

export function emptyProgress(config: StepConfig[]): Progress {
  return { version: 1, steps: Object.fromEntries(config.map(step => [step.id, { checked: [], complete: false }])), lastStep: null };
}

export function decodeProgress(raw: string | null, config: StepConfig[]): Progress {
  const state = emptyProgress(config);
  if (raw === null) return state;
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.steps) ||
      (value.lastStep !== null && !config.some(step => step.id === value.lastStep))) {
    throw new Error('The saved progress has an unsupported format.');
  }
  for (const id of Object.keys(value.steps)) {
    const step = config.find(item => item.id === id);
    const saved = value.steps[id];
    if (!step || !isRecord(saved) || typeof saved.complete !== 'boolean' || !Array.isArray(saved.checked) ||
        !saved.checked.every((criterion): criterion is string => typeof criterion === 'string' && step.criteria.includes(criterion)) ||
        new Set(saved.checked).size !== saved.checked.length ||
        (saved.complete && saved.checked.length !== step.criteria.length)) {
      throw new Error('The saved checklist no longer matches this workshop.');
    }
    state.steps[id] = { checked: [...saved.checked], complete: saved.complete };
  }
  state.lastStep = typeof value.lastStep === 'string' ? value.lastStep : null;
  return state;
}

export function checkCriterion(state: Progress, step: StepConfig, criterion: string, checked: boolean): Progress {
  if (!step.criteria.includes(criterion)) throw new Error('Unknown success criterion.');
  const current = state.steps[step.id];
  if (!current) throw new Error('Unknown workshop step.');
  const selected = new Set(current.checked);
  if (checked) selected.add(criterion);
  else selected.delete(criterion);
  return {
    ...state,
    lastStep: step.id,
    steps: { ...state.steps, [step.id]: { checked: [...selected], complete: current.complete && selected.size === step.criteria.length } },
  };
}

export function toggleComplete(state: Progress, step: StepConfig): Progress {
  const current = state.steps[step.id];
  if (!current) throw new Error('Unknown workshop step.');
  if (!current.complete && (!step.criteria.length || current.checked.length !== step.criteria.length)) {
    throw new Error('Review every success criterion before marking this step complete.');
  }
  return { ...state, lastStep: step.id, steps: { ...state.steps, [step.id]: { ...current, complete: !current.complete } } };
}

export function resumeStep(state: Progress, config: StepConfig[]): StepConfig | undefined {
  const last = config.find(step => step.id === state.lastStep);
  if (!last) return undefined;
  if (!state.steps[last.id]?.complete) return last;
  const after = config.slice(config.indexOf(last) + 1).find(step => !state.steps[step.id]?.complete);
  return after ?? config.find(step => !state.steps[step.id]?.complete) ?? config.at(-1);
}

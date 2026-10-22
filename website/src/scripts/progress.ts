import { withBase } from '../lib/site.ts';
import { checkCriterion, decodeProgress, emptyProgress, isStepConfig, resumeStep, STORAGE_KEY, toggleComplete } from '../lib/progress-store.ts';
import type { Progress } from '../lib/progress-store.ts';

export function initProgress(): void {
  const configNode = document.querySelector('[data-workshop-config]');
  if (!configNode?.textContent) return;
  const parsed: unknown = JSON.parse(configNode.textContent);
  if (!isStepConfig(parsed)) throw new Error('Invalid workshop progress configuration');
  const config = parsed;
  let state: Progress = emptyProgress(config);
  let canStore = true;
  const notice = document.querySelector<HTMLElement>('[data-storage-notice]');
  const live = document.querySelector<HTMLElement>('[data-announcement]');
  const current = config.find(step => step.id === document.body.dataset.currentStep);

  function announce(message: string): void {
    if (live) live.textContent = message;
  }
  function storageFailure(message: string): void {
    canStore = false;
    if (notice) {
      notice.hidden = false;
      notice.textContent = `${message} Progress applies on this page only and will be lost when you leave. Use Reset progress to try again.`;
    }
  }
  try {
    state = decodeProgress(localStorage.getItem(STORAGE_KEY), config);
  } catch (error) {
    storageFailure(error instanceof SyntaxError
      ? 'Saved progress is not valid JSON.'
      : error instanceof Error && error.name === 'SecurityError'
        ? 'Browser storage is blocked.'
        : 'Saved progress could not be read.');
  }
  function persist(next: Progress): void {
    state = next;
    if (canStore) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        storageFailure('Your progress could not be saved in browser storage.');
      }
    }
    render();
  }
  function render(): void {
    const count = config.filter(step => state.steps[step.id]?.complete).length;
    document.querySelectorAll<HTMLElement>('[data-storage-explanation]').forEach(element => {
      element.textContent = canStore ? 'Saved only in this browser. Check the criteria, then mark complete.' : 'Not saved. Your changes apply on this page only.';
    });
    document.querySelectorAll<HTMLElement>('[data-progress-summary]').forEach(element => {
      element.textContent = `${count} of ${config.length} steps complete`;
    });
    document.querySelectorAll<HTMLProgressElement>('[data-progress-meter]').forEach(meter => { meter.value = count; });
    document.querySelectorAll<HTMLElement>('[data-step-link]').forEach(link => {
      const id = link.dataset.stepLink ?? '';
      const completed = state.steps[id]?.complete === true;
      link.classList.toggle('is-complete', completed);
      const status = link.querySelector('[data-step-status]');
      if (status) status.textContent = completed ? 'Complete' : 'Not complete';
    });
    document.querySelectorAll<HTMLInputElement>('[data-criterion]').forEach(input => {
      input.disabled = false;
      input.checked = Boolean(current && state.steps[current.id]?.checked.includes(input.dataset.criterion ?? ''));
    });
    if (current) {
      const saved = state.steps[current.id];
      const button = document.querySelector<HTMLButtonElement>('[data-complete]');
      if (button && saved) {
        button.hidden = false;
        button.disabled = !saved.complete && saved.checked.length !== current.criteria.length;
        button.textContent = saved.complete ? 'Mark as not complete' : current.id === 'finish' ? 'Mark workshop wrapped up' : 'Mark challenge complete';
      }
      const status = document.querySelector<HTMLElement>('[data-criteria-status]');
      if (status && saved) status.textContent = saved.complete
        ? `Complete${canStore ? ' · saved in this browser' : ' on this page only'}`
        : `${saved.checked.length} of ${current.criteria.length} success criteria checked${canStore ? ' · saved in this browser' : ' on this page only'}`;
    }
    const resume = canStore ? resumeStep(state, config) : undefined;
    document.querySelectorAll<HTMLAnchorElement>('[data-resume]').forEach(link => {
      link.hidden = !resume;
      if (resume) {
        link.href = withBase(resume.slug);
        link.textContent = resume.id === 'finish' ? 'Resume at Finish & cleanup' : `Resume at Challenge ${Number(resume.id)}`;
      }
    });
  }
  document.querySelectorAll<HTMLInputElement>('[data-criterion]').forEach(input => {
    input.addEventListener('change', () => {
      if (!current || !input.dataset.criterion) return;
      persist(checkCriterion(state, current, input.dataset.criterion, input.checked));
      announce(canStore ? 'Checklist saved in this browser.' : 'Checklist updated on this page only; it was not saved.');
    });
  });
  document.querySelector('[data-complete]')?.addEventListener('click', () => {
    if (!current) return;
    persist(toggleComplete(state, current));
    announce(state.steps[current.id]?.complete ? `Step complete${canStore ? ' and saved in this browser.' : ' on this page only; it was not saved.'}` : 'Step marked as not complete.');
  });
  const dialog = document.querySelector<HTMLDialogElement>('[data-reset-dialog]');
  document.querySelectorAll<HTMLButtonElement>('[data-reset]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => dialog?.showModal());
  });
  document.querySelector('[data-reset-cancel]')?.addEventListener('click', () => dialog?.close());
  document.querySelector('[data-reset-confirm]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      canStore = true;
      state = emptyProgress(config);
      if (notice) notice.hidden = true;
      render();
      announce('Progress reset in this browser.');
    } catch {
      storageFailure('Progress could not be reset because browser storage is unavailable.');
      announce('Progress was not reset.');
    }
    dialog?.close();
  });
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      state = decodeProgress(event.newValue, config);
      render();
      announce('Progress updated from another tab.');
    } catch {
      storageFailure('Progress from another tab could not be read.');
    }
  });
  if (current) persist({ ...state, lastStep: current.id });
  else render();
}

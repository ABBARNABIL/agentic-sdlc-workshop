import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCriterion, decodeProgress, emptyProgress, resumeStep, toggleComplete } from '../src/lib/progress-store.ts';

const config = [
  { id: '01', slug: 'challenges/01', criteria: ['01-1', '01-2'] },
  { id: '02', slug: 'challenges/02', criteria: ['02-1'] },
  { id: 'finish', slug: 'finish', criteria: ['finish-1'] },
];

test('a new browser starts without fabricated completion or a resume route', () => {
  const state = decodeProgress(null, config);
  assert.equal(state.lastStep, null);
  assert.equal(Object.values(state.steps).filter(step => step.complete).length, 0);
  assert.equal(resumeStep(state, config), undefined);
});

test('completion requires every actual criterion and unchecking reopens a step', () => {
  const original = emptyProgress(config);
  assert.throws(() => toggleComplete(original, config[0]), /every success criterion/);
  let state = checkCriterion(original, config[0], '01-1', true);
  state = checkCriterion(state, config[0], '01-2', true);
  state = toggleComplete(state, config[0]);
  assert.equal(state.steps['01'].complete, true);
  assert.equal(original.steps['01'].checked.length, 0);
  assert.equal(resumeStep(state, config)?.id, '02');
  state = checkCriterion(state, config[0], '01-1', false);
  assert.equal(state.steps['01'].complete, false);
  assert.equal(resumeStep(state, config)?.id, '01');
});

test('valid progress round trips without storing arbitrary URLs or data', () => {
  const state = checkCriterion(emptyProgress(config), config[0], '01-1', true);
  assert.deepEqual(decodeProgress(JSON.stringify(state), config), state);
  assert.throws(() => decodeProgress('{', config), SyntaxError);
  assert.throws(() => decodeProgress(JSON.stringify({ ...state, version: 2 }), config), /unsupported/);
  assert.throws(() => decodeProgress(JSON.stringify({ ...state, lastStep: 'javascript:alert(1)' }), config), /unsupported/);
});

test('corrupt, duplicate, unknown, or falsely complete checklists are rejected', () => {
  for (const checked of [['01-1', '01-1'], ['not-a-criterion'], []]) {
    const state = emptyProgress(config);
    state.steps['01'] = { checked, complete: true };
    assert.throws(() => decodeProgress(JSON.stringify(state), config), /no longer matches/);
  }
  assert.throws(() => checkCriterion(emptyProgress(config), config[0], 'unknown', true), /Unknown/);
});

test('finishing every step still resumes at cleanup rather than an invented next challenge', () => {
  let state = emptyProgress(config);
  for (const step of config) {
    for (const id of step.criteria) state = checkCriterion(state, step, id, true);
    state = toggleComplete(state, step);
  }
  assert.equal(resumeStep(state, config)?.id, 'finish');
  state = toggleComplete(state, config[0]);
  assert.equal(state.steps['01'].complete, false);
});

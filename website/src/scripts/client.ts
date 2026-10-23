import { initProgress } from './progress.ts';
import { initSearch } from './search.ts';
import { initTheme } from './theme.ts';
import { THEME_CHANGE_EVENT } from '../lib/theme.ts';
import { enhanceCode, enhanceDiagrams, initSolution, initResponsiveNavigation, observeHeadings } from './enhancements.ts';

initTheme();
initProgress();
initSearch();
initResponsiveNavigation();
initSolution();
enhanceCode();
void enhanceDiagrams();
observeHeadings();
window.addEventListener(THEME_CHANGE_EVENT, () => { void enhanceDiagrams(); });

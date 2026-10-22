import { initProgress } from './progress.ts';
import { initSearch } from './search.ts';
import { enhanceCode, enhanceDiagrams, initSolution, initResponsiveNavigation, observeHeadings } from './enhancements.ts';

initProgress();
initSearch();
initResponsiveNavigation();
initSolution();
enhanceCode();
void enhanceDiagrams();
observeHeadings();

import { parseStrategyHubNotationToHtml } from '../src/js/utils/combo-parser.js';

console.log('Result for "4 or 2":');
console.log(parseStrategyHubNotationToHtml('4 or 2', 'ggst'));

console.log('\nResult for "22":');
console.log(parseStrategyHubNotationToHtml('22', 'ggst'));

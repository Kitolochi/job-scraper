import { depopConfig } from '../sites/depop.config';
import { runContent } from '../lib/content-runner';

export default defineContentScript({
  matches: ['https://www.depop.com/products/create*'],
  main: () => runContent(depopConfig),
});

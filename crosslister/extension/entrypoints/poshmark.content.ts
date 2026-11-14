import { poshmarkConfig } from '../sites/poshmark.config';
import { runContent } from '../lib/content-runner';

export default defineContentScript({
  matches: ['https://poshmark.com/create-listing*'],
  main: () => runContent(poshmarkConfig),
});

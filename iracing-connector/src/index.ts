import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

const __dirname = dirname(fileURLToPath(import.meta.url));

const iRacingSDKWorker = new Worker(resolve(__dirname, './workers/iracing.js'))

iRacingSDKWorker.postMessage({ type: 'start' });


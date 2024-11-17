import { isMainThread, parentPort, MessagePort } from 'worker_threads';
import { Logger } from '../utilities/logger.js';

import { IRacingSDK } from 'irsdk-node';

const logger = new Logger('iRacingWorker');

async function main(channel: MessagePort) {
   
  channel.on('message', (message) => {
    logger.debug('Message Received: ' + JSON.stringify(message))
  })

  try {
    const isSimRunning = await IRacingSDK.IsSimRunning();
    
    logger.info('Worker Started');
    logger.info('iRacing Running: ' + isSimRunning)
  } catch (error) {
    process.exit()
  }
}

if (!isMainThread && parentPort !== null) {
  main(parentPort);
} else {
  console.warn('Invalid Worker Setup')
  console.log(JSON.stringify({ 
    errors: [
      isMainThread ? 'Must be run in a worker thread' : '', 
      !parentPort ? 'Missing parent port connection': ''
    ].filter(Boolean)
  }))
}
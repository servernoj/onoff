import { parentPort, workerData } from "worker_threads";
import bindings from 'bindings';
import { dn } from './dirname.js';
import { appendFileSync } from 'node:fs';

const DEBUG = process.env.ONOFF_DEBUG === '1';
let eventCount = 0;

const gpiod = bindings({ bindings: 'gpiod-wrap', module_root: `${dn}/../..` });

// function watchForEvent() {
//     let line = workerData;
//     while (true) {
//         setTimeout(() => { }, 0);
//         let status = gpiod.waitForEvent(line);
//         if (status < 0) {
//             throw ('Interrupt watcher failed');
//         } else if (status === 1) {
//             let value = gpiod.getLineValue(line);
//             parentPort?.postMessage(value);
//         }
//     }
// }

function watchForEvent() {
    const line = workerData;
    if (DEBUG) {
        console.warn('[onoff:worker] started', { line });
    }
    while (true) {
        setTimeout(() => { }, 0);
        const status = gpiod.waitForEvent(line);
        if (status < 0) {
            throw new Error('Interrupt watcher failed');
        }
        if (status === 1) {
            if (DEBUG) {
                try {
                    const mem = process.memoryUsage();
                    const log = `[onoff:worker] events=${eventCount}, heapMB=${Math.round(mem.heapUsed / 1024 / 1024)}, rssMB=${Math.round(mem.rss / 1024 / 1024)}, externalMB=${Math.round((mem.external || 0) / 1024 / 1024)}`;
                    appendFileSync(
                        '/tmp/onoff-worker-events.log',
                        `${Date.now()}: ${log}\n`
                    );
                } catch { }
            }
            eventCount += 1;
            const value = gpiod.getLineValue(line);
            parentPort?.postMessage(value);
        }
    }
}

watchForEvent();
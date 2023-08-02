import { NS } from '@ns'
import { Dashboard } from 'monitor/ui/dashboard';
import React from 'lib/react';
import UpdateHandler from 'monitor/update';


const updateFrequency = 200;

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();
  const port = ns.getPortHandle(ns.pid);
  const updateHandler = new UpdateHandler();
  ns.printRaw(<Dashboard ns={ns} updateHandler={updateHandler} port={port} />)
  let exit = false;
  while (!exit) {

    const ts = performance.now();

    for (const handler of updateHandler.handlers) {
      await handler(ns);
    }

    const remaining = updateFrequency - (performance.now() - ts);
    if (remaining > 0) await ns.sleep(remaining);
  }
}
import { NS } from "@ns";
import Target from "/batcher/models/target";
import Swarm from "/batcher/swarm";
import TargetManager from "batcher/targetManager";
import Job from "/batcher/models/job";
import { initialDelay } from "/batcher/config";
import { StatusReporter } from "/lib/status/reporter";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  const workers = [];
  const reporter = new StatusReporter(ns, "batcher", {dropped: 0, hackStart: 0, income: 0, prepDone:0, prepTarget: "", ramUsage: 0, target: ""});

  const swarm = new Swarm(ns);
  const targets = new TargetManager(ns);
  targets.setStrategy(swarm.getFree());

  let prepDone: number | null = null;
  while (true) {
    const target = targets.getHackingTarget();
    const prepTarget = targets.getPrepTarget();

    if (prepTarget !== undefined) {
      
      const hasTarget = target !== undefined
      const prepJobs = createPrepJobs(prepTarget);
      prepDone = performance.now() + prepTarget.times.weaken1 + initialDelay;
      workers.push(...swarm.deployPrep(prepJobs, hasTarget));
      reporter.update("prepTarget", prepTarget.hostname);
      reporter.update("prepDone", prepDone);

      // No hack targets yet, wait until server is prepped and start over.
      if(!hasTarget) {
        await ns.sleep(prepDone - performance.now());
        continue;
      }
    }
    if(target === undefined) throw Error("No target?");

    let lastUnsafe = 0;
    // Main loop
    while(true) {
      
    }



  }
}

function createBatch(target: Target): Job[] {
  return [];
}

function createPrepJobs(target: Target) {
  return [
    new Job("weaken1", target.hostname, target.prepThreads.weaken1),
    new Job("grow", target.hostname, target.prepThreads.grow),
    // Weaken1 intentional - this is not the "finishing" part of a hack loop.
    new Job("weaken1", target.hostname, target.prepThreads.weaken2),
  ];
}
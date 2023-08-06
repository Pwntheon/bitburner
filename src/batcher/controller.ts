import { NS } from "@ns";
import Target from "/batcher/models/target";
import Swarm from "/batcher/swarm";
import TargetManager from "batcher/targetManager";
import Job from "/batcher/models/job";
import { initialDelay, offsets } from "/batcher/config";
import { StatusReporter } from "/lib/status/reporter";
import { BatcherStateDefaults } from "/lib/status/models";
import { formatDuration } from "/lib/format";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  const workers = [];
  const reporter = new StatusReporter(ns, "batcher", { ...BatcherStateDefaults });

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
      console.log("Prepping: ", prepTarget.hostname);
      console.log("$$$: ", prepTarget.money);
      console.log("Max: ", prepTarget.maxMoney);
      console.log("Sec: ", prepTarget.security);
      console.log("Min: ", prepTarget.minSecurity);
      console.log(prepJobs);
      prepDone = prepJobs[prepJobs.length - 1].end + initialDelay;
      workers.push(...swarm.deployPrep(prepJobs, hasTarget));
      reporter.update("prepStarted", performance.now());
      reporter.update("prepTarget", prepTarget.hostname);
      reporter.update("prepDone", prepDone);
      console.log("Weaken expected to take ", prepDone - performance.now(), "ms");

      // No hack targets yet, wait until server is prepped and start over.
      if (!hasTarget && prepDone !== null) {
        reporter.update("target", "None");
        while (performance.now() < prepDone) {
          reporter.update("prepDone", prepDone);
          await ns.sleep(200);
        }
        continue;
      }
    }
    if (target === undefined) throw Error("No target?");
    reporter.update("target", target.hostname);

    // Main loop
    while (true) {
      await ns.sleep(10);
      if (prepDone !== null) {
        if (performance.now() > prepDone) {
          targets.setStrategy(swarm.getFree());
          break;
        }
        reporter.update("prepDone", prepDone);
      }
    }
  }
}

// function createBatch(target: Target): Job[] {
//   return [];
// }

function createPrepJobs(target: Target) {
  return [
    new Job("weaken1", target.hostname, target.prepThreads.weaken1, target.prepTimes.weaken1, performance.now() + target.prepTimes.weaken1 + initialDelay + offsets.weaken1),
    new Job("grow", target.hostname, target.prepThreads.grow, target.prepTimes.grow, performance.now() + target.prepTimes.weaken1 + initialDelay + offsets.grow),
    // Weaken1 intentional - this is not the "finishing" part of a hack loop.
    new Job("weaken1", target.hostname, target.prepThreads.weaken2, target.prepTimes.weaken2, performance.now() + target.prepTimes.weaken1 + initialDelay + offsets.weaken2)
  ];
}
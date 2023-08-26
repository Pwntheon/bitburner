import { NS } from "@ns";
import Target from "/batcher/models/target";
import Swarm from "/batcher/swarm";
import TargetManager from "batcher/targetManager";
import Job from "/batcher/models/job";
import { initialDelay, offsets, spacer } from "/batcher/config";
import { StatusReporter } from "/lib/status/reporter";
import { BatcherStateDefaults } from "/lib/status/models";
import { formatDuration } from "/lib/format";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  const workers = [];
  const hackPids = [];
  let spawned = 0;
  let killed = 0;
  const reporter = new StatusReporter(ns, "batcher", { ...BatcherStateDefaults });

  const swarm = new Swarm(ns);
  const targets = new TargetManager(ns);
  let maxRam = swarm.getMax();
  let hackSkill = ns.getPlayer().skills.hacking;
  targets.setStrategy(maxRam);

  let prepDone: number | null = null;
  while (true) {
    const target = targets.getHackingTarget();
    const prepTarget = targets.getPrepTarget();


    if (prepTarget !== undefined) {
      const hasTarget = target !== undefined
      const prepJobs = createPrepJobs(prepTarget);
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
    let lastHit = performance.now();
    // Main loop
    while (true) {
      await ns.sleep(spacer / 2);
      if (prepDone !== null) {
        if (performance.now() > prepDone) {
          targets.setStrategy(swarm.getFree());
          break;
        }
        reporter.update("prepDone", prepDone);
      }
      
      const currentMaxRam = swarm.getMax();
      const currentHackSkill = ns.getPlayer().skills.hacking;
      if (currentMaxRam > maxRam || currentHackSkill > hackSkill) {
        maxRam = currentMaxRam;
        hackSkill = currentHackSkill;
        target.setStrategy(maxRam);
      } else {
        target.refresh();
      }

      if(!target.isPrepped) {
        ++killed;
        killNextHackThread(ns, hackPids);
      }

      if (swarm.hasEnoughRam(target.batchCost)) {
        const batch = createBatch(target);
        if (batch[0].end >= spacer + lastHit) {
          lastHit = batch[0].end;
          const pids = swarm.deploy(batch)
          hackPids.push(pids[0]);
          workers.push(...pids);
          ++spawned;
        }
      }
      ns.tprint(killed, "/", spawned);
      reporter.update("dropped", killed/spawned);
    }
  }
}

function killNextHackThread(ns: NS, pids: number[]) {
  for(let i = pids.length; i--; i > 0) {
    if(ns.kill(pids[i])) return;
  }
}

function createBatch(target: Target): Job[] {
  return [
    new Job("hack", target.hostname, target.threads.hack, target.times.hack, performance.now() + target.times.hack + initialDelay + offsets.hack),
    new Job("weaken1", target.hostname, target.threads.weaken1, target.times.weaken1, performance.now() + target.times.weaken1 + initialDelay + offsets.weaken1),
    new Job("grow", target.hostname, target.threads.grow, target.times.grow, performance.now() + target.times.grow + initialDelay + offsets.grow),
    new Job("weaken2", target.hostname, target.threads.weaken2, target.times.weaken2, performance.now() + target.times.weaken2 + initialDelay + offsets.weaken2),
  ];
}

function createPrepJobs(target: Target) {
  return [
    new Job("weaken1", target.hostname, target.prepThreads.weaken1, target.prepTimes.weaken1, performance.now() + target.prepTimes.weaken1 + initialDelay + offsets.weaken1),
    new Job("grow", target.hostname, target.prepThreads.grow, target.prepTimes.grow, performance.now() + target.prepTimes.weaken1 + initialDelay + offsets.grow),
    // Weaken1 intentional - this is not the "finishing" part of a hack loop.
    new Job("weaken1", target.hostname, target.prepThreads.weaken2, target.prepTimes.weaken2, performance.now() + target.prepTimes.weaken1 + initialDelay + offsets.weaken2)
  ];
}